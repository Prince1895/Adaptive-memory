import { Router, Response } from "express";
import OpenAI from "openai";
import { getDb } from "adaptive-context-memory";
import { appDb } from "../db/appDb";
import { memoryStore } from "../config/memory";
import { openaiClient } from "../services/openai";
import { LLM_MODEL } from "../config/env";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";
import { getUserUsage } from "./auth";

export const chatRouter = Router();

chatRouter.post("/", authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { conversation_id, message } = req.body;
    const userId = req.user!.id;

    if (!message) {
      res.status(400).json({ detail: "Message text required" });
      return;
    }

    // Check if user has stored a custom API key
    const userRow = appDb.prepare("SELECT api_key FROM users WHERE id = ?").get(userId) as any;
    const userCustomKey = userRow?.api_key ? userRow.api_key.trim() : null;

    // Check message limit if no custom API key provided
    const usageBefore = getUserUsage(userId);
    if (!userCustomKey && usageBefore.free_messages_remaining <= 0) {
      res.status(400).json({
        detail: "Free message limit reached (10/10 messages used). Add your custom API key to continue chatting.",
        usage: usageBefore
      });
      return;
    }

    let convId = conversation_id;
    if (!convId) {
      // Fetch or create latest active conversation for user
      const existingConv = appDb
        .prepare("SELECT id FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1")
        .get(userId) as any;

      if (existingConv) {
        convId = existingConv.id;
      } else {
        const title = message.substring(0, 30) + (message.length > 30 ? "..." : "");
        const info = appDb
          .prepare("INSERT INTO conversations (user_id, title) VALUES (?, ?)")
          .run(userId, title);
        convId = Number(info.lastInsertRowid);
      }
    }

    // Save user message to database
    appDb.prepare("INSERT INTO messages (conversation_id, role, content) VALUES (?, 'user', ?)").run(convId, message);

    // Smart Purge / Deletion Intent Handler: If user requests purge/delete/remove, deactivate matching memories directly
    const lowerMsg = message.toLowerCase();
    if (/purge|delete|remove|forget|reschedul|cancel/i.test(lowerMsg)) {
      try {
        const db = getDb();
        const keywords = lowerMsg
          .replace(/purge|delete|remove|forget|that|the|is|a|an|my|i|have|note|memory|bubbles?|rescheduled|canceled|cancelled/gi, " ")
          .trim()
          .split(/\s+/)
          .filter((k: string) => k.length >= 3);

        if (keywords.length > 0) {
          const activeMemories = db
            .prepare("SELECT * FROM memories WHERE is_active = 1 AND conversation_id = ?")
            .all(convId) as any[];

          for (const m of activeMemories) {
            const mText = (m.memory_text || "").toLowerCase();
            const matches = keywords.filter((kw: string) => mText.includes(kw));
            if (matches.length > 0) {
              memoryStore.delete(m.id);
              console.log(`[SmartPurge] Deactivated memory ID ${m.id}: "${m.memory_text}"`);
            }
          }
        }
      } catch (purgeErr) {
        console.warn("[SmartPurge] Error during intent purge:", purgeErr);
      }
    }

    // 1. Process turn with adaptive-context-memory (extraction, tool classification, state updates)
    const turnResult = await memoryStore.add([{ role: "user", content: message }], convId);

    // 2. Perform MMR search for relevant memory context
    const searchRes = await memoryStore.search(message, convId, { limit: 5 });
    const memoryContextText = searchRes.results.map((m) => `- ${m.memory}`).join("\n");

    // 3. System prompt with memory context injection
    const systemPrompt = `You are a helpful AI assistant equipped with adaptive long-term context memory.
User Profile & Retrieved Long-Term Memory Facts:
${memoryContextText || "No prior long-term memory recorded."}

Use the retrieved facts to provide personalized, intelligent answers.`;

    // Fetch latest 10 messages from history to prevent context token overuse
    const history = appDb
      .prepare("SELECT role, content FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 10")
      .all(convId) as Array<{ role: "user" | "assistant"; content: string }>;
    history.reverse();

    const messagesPayload = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({ role: m.role, content: m.content }))
    ];

    // Select active LLM client (custom user key or system key)
    const activeClient = userCustomKey
      ? new OpenAI({
          apiKey: userCustomKey,
          baseURL: userCustomKey.startsWith("sk-or-v1-")
            ? "https://openrouter.ai/api/v1"
            : "https://api.openai.com/v1"
        })
      : openaiClient;

    // Request LLM completion
    const completion = await activeClient.chat.completions.create({
      model: LLM_MODEL,
      messages: messagesPayload as any,
      temperature: 0.7
    });

    const assistantReply = completion.choices[0]?.message?.content || "I am processing your request.";

    // Save assistant reply
    appDb.prepare("INSERT INTO messages (conversation_id, role, content) VALUES (?, 'assistant', ?)").run(convId, assistantReply);
    appDb.prepare("UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?").run(convId);

    // Process assistant reply turn into memory
    await memoryStore.add([{ role: "assistant", content: assistantReply }], convId);

    // Format extracted memories for ChatResponse interface
    const extracted_memories = {
      semantic: (turnResult.semantic || []).map((text, idx) => ({
        id: idx + 1,
        local_id: idx + 1,
        text,
        type: "semantic"
      })),
      bubbles: (turnResult.bubbles || []).map((text, idx) => ({
        id: idx + 100,
        local_id: idx + 100,
        text,
        type: "bubble"
      }))
    };

    // Format relevant memories for ChatResponse interface with rankings and importance
    const db = getDb();
    const relevant_memories = (searchRes.results || []).map((m: any, idx: number) => {
      const memId = m.memoryId || m.id;
      let importance = m.importance || 0.8;
      let category = m.category || (m.is_episodic ? "episodic_event" : "semantic_fact");

      if (memId) {
        const row = db.prepare("SELECT importance, category, is_episodic FROM memories WHERE id = ?").get(memId) as any;
        if (row) {
          importance = row.importance || importance;
          category = row.category || (row.is_episodic ? "episodic_event" : "semantic_fact");
        }
      }

      return {
        rank: idx + 1,
        memory_id: memId,
        memory: m.memory || m.text,
        type: m.type || (m.is_episodic ? "bubble" : "semantic"),
        score: typeof m.score === "number" ? Number(m.score.toFixed(3)) : 0.88,
        importance: typeof importance === "number" ? Number(importance.toFixed(2)) : 0.8,
        category,
        occurred_at: m.occurredAt || null,
        connections: m.connections || []
      };
    });

    res.json({
      response: assistantReply,
      reply: assistantReply,
      extracted_memories,
      relevant_memories,
      memories_used: searchRes.results,
      conversation_id: convId,
      turn_result: turnResult,
      usage: getUserUsage(userId)
    });
  } catch (err: any) {
    console.error("Chat error:", err);
    res.status(500).json({ detail: err.message || "Error processing chat message" });
  }
});

chatRouter.get("/history", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const conv = appDb
    .prepare("SELECT id FROM conversations WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1")
    .get(userId) as any;

  if (!conv) {
    res.json({ messages: [], total: 0, has_more: false });
    return;
  }

  const rows = appDb
    .prepare("SELECT id, role, content, created_at FROM messages WHERE conversation_id = ? ORDER BY id ASC")
    .all(conv.id) as any[];

  res.json({
    messages: rows.map((r) => ({
      id: r.id,
      role: r.role,
      content: r.content,
      created_at: r.created_at ? (r.created_at.endsWith("Z") ? r.created_at : r.created_at.replace(" ", "T") + "Z") : new Date().toISOString()
    })),
    total: rows.length,
    has_more: false
  });
});
