import { Router, Response } from "express";
import { memoryStore } from "../config/memory";
import { getDb } from "adaptive-context-memory";
import { appDb } from "../db/appDb";
import { authenticateToken, AuthenticatedRequest } from "../middleware/auth";

export const memoriesRouter = Router();

// Helper to get conversation IDs belonging to the authenticated user
function getUserConversationIds(userId: string): number[] {
  const convs = appDb
    .prepare("SELECT id FROM conversations WHERE user_id = ?")
    .all(userId) as Array<{ id: number }>;
  return convs.map((c) => c.id);
}

memoriesRouter.get("/", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.id;
    const userConvIds = getUserConversationIds(userId);

    if (userConvIds.length === 0) {
      res.json([]);
      return;
    }

    let memories: any[];
    if (req.query.conversation_id) {
      const convId = parseInt(req.query.conversation_id as string, 10);
      if (!userConvIds.includes(convId)) {
        res.json([]);
        return;
      }
      memories = memoryStore.getAll(convId);
    } else {
      const placeholders = userConvIds.map(() => "?").join(",");
      memories = db
        .prepare(`SELECT * FROM memories WHERE is_active = 1 AND conversation_id IN (${placeholders}) ORDER BY created_at DESC`)
        .all(...userConvIds);
    }
    res.json(memories);
  } catch (err: any) {
    res.status(500).json({ detail: err.message || "Error fetching memories" });
  }
});

memoriesRouter.get("/stats", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.id;
    const userConvIds = getUserConversationIds(userId);

    if (userConvIds.length === 0) {
      res.json({ total: 0, semantic: 0, bubbles: 0, byCategory: {} });
      return;
    }

    let stats: any;
    if (req.query.conversation_id) {
      const convId = parseInt(req.query.conversation_id as string, 10);
      if (!userConvIds.includes(convId)) {
        res.json({ total: 0, semantic: 0, bubbles: 0, byCategory: {} });
        return;
      }
      stats = memoryStore.getStats(convId);
    } else {
      const placeholders = userConvIds.map(() => "?").join(",");
      const all = db
        .prepare(`SELECT * FROM memories WHERE is_active = 1 AND conversation_id IN (${placeholders})`)
        .all(...userConvIds) as any[];
      const byCategory: Record<string, number> = {};
      for (const m of all) {
        const cat = m.category || "uncategorized";
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      }
      stats = {
        total: all.length,
        semantic: all.filter((m) => !m.is_episodic).length,
        bubbles: all.filter((m) => m.is_episodic).length,
        byCategory,
      };
    }
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ detail: err.message || "Error fetching memory stats" });
  }
});

memoriesRouter.get("/graph", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const db = getDb();
    const userId = req.user!.id;
    const userConvIds = getUserConversationIds(userId);

    if (userConvIds.length === 0) {
      res.json({ nodes: [], links: [] });
      return;
    }

    let memories: any[];
    if (req.query.conversation_id) {
      const convId = parseInt(req.query.conversation_id as string, 10);
      if (!userConvIds.includes(convId)) {
        res.json({ nodes: [], links: [] });
        return;
      }
      memories = memoryStore.getAll(convId);
    } else {
      const placeholders = userConvIds.map(() => "?").join(",");
      memories = db
        .prepare(`SELECT * FROM memories WHERE is_active = 1 AND conversation_id IN (${placeholders}) ORDER BY created_at DESC`)
        .all(...userConvIds);
    }

    const activeNodeIds = new Set(memories.map((m: any) => Number(m.id)));

    const nodes = memories.map((m: any, idx: number) => {
      const text = m.memory_text || m.text || m.content || "";
      let importance = m.importance && m.importance > 0 ? Number(m.importance) : 0.5;
      if (importance === 0.5 || importance === 0.8) {
        const lower = text.toLowerCase();
        let base = 0.6;
        if (m.category === "profile" || m.category === "security") base = 0.9;
        else if (m.category === "goal" || m.category === "professional") base = 0.8;
        else if (m.category === "skill") base = 0.75;
        
        if (/deadline|meeting|urgent|important|tomorrow|today|2:00|am|pm/i.test(lower)) base = 0.95;
        importance = Number((base + (text.length % 5) * 0.01).toFixed(2));
      }

      // Parse metadata connections if present
      let connections: Array<{ target_id: number; target_global_id: number; score: number }> = [];
      try {
        if (m.memory_metadata) {
          const parsed = typeof m.memory_metadata === "string" ? JSON.parse(m.memory_metadata) : m.memory_metadata;
          const connObj = parsed.connections || {};
          const bubbleIds: number[] = connObj.bubble_ids || [];
          const scores: Record<string, number> = connObj.scores || {};

          connections = bubbleIds
            .filter((targetId) => activeNodeIds.has(Number(targetId)))
            .map((targetId) => ({
              target_id: Number(targetId),
              target_global_id: Number(targetId),
              score: Number(scores[targetId] || scores[String(targetId)] || 0.75)
            }));
        }
      } catch (e) {
        connections = [];
      }

      return {
        id: Number(m.id),
        local_id: idx + 1,
        text,
        type: m.is_episodic ? "bubble" : "semantic",
        importance: Math.min(0.99, Math.max(0.3, importance)),
        created_at: m.created_at || new Date().toISOString(),
        connections
      };
    });

    // Build unique links from node connections + priority criteria
    const linkMap = new Map<string, { source: number; target: number; strength: number; priority: number }>();

    for (const node of nodes) {
      for (const conn of node.connections) {
        const source = Math.min(node.id, conn.target_global_id);
        const target = Math.max(node.id, conn.target_global_id);
        const key = `${source}-${target}`;

        if (!linkMap.has(key)) {
          const targetNode = nodes.find(n => n.id === conn.target_global_id);
          const avgImportance = targetNode ? (node.importance + targetNode.importance) / 2 : node.importance;
          linkMap.set(key, {
            source,
            target,
            strength: conn.score,
            priority: Number((conn.score * avgImportance).toFixed(2))
          });
        }
      }
    }

    // Fallback links if sparse
    if (linkMap.size === 0) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          if (nodes[i].type === nodes[j].type) {
            const key = `${nodes[i].id}-${nodes[j].id}`;
            linkMap.set(key, {
              source: nodes[i].id,
              target: nodes[j].id,
              strength: 0.7,
              priority: (nodes[i].importance + nodes[j].importance) / 2
            });
          }
        }
      }
    }

    const links = Array.from(linkMap.values());
    res.json({ nodes, links });
  } catch (err: any) {
    res.status(500).json({ detail: err.message || "Error building memory graph" });
  }
});

memoriesRouter.post("/search", authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { query, conversation_id, limit } = req.body;
    if (!query) {
      res.status(400).json({ detail: "Search query required" });
      return;
    }

    const searchRes = await memoryStore.search(query, conversation_id || 1, { limit: limit || 10 });
    res.json(searchRes.results);
  } catch (err: any) {
    res.status(500).json({ detail: err.message || "Error searching memories" });
  }
});

memoriesRouter.post("/consolidate", authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { conversation_id } = req.body;
    const userId = req.user!.id;
    const userConvIds = getUserConversationIds(userId);

    let count = 0;
    if (conversation_id) {
      count = await memoryStore.consolidate(Number(conversation_id));
    } else {
      for (const cId of userConvIds) {
        count += await memoryStore.consolidate(cId);
      }
    }
    res.json({ success: true, consolidated_count: count });
  } catch (err: any) {
    res.status(500).json({ detail: err.message || "Error consolidating memories" });
  }
});

memoriesRouter.post("/purge", authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { days } = req.body;
    const userId = req.user!.id;
    const userConvIds = getUserConversationIds(userId);
    const olderThanDays = days ? parseInt(days as string, 10) : 30;

    let purgedCount = 0;
    for (const cId of userConvIds) {
      purgedCount += memoryStore.purgeOldBubbles(cId, olderThanDays);
    }
    res.json({ success: true, purged_count: purgedCount, days: olderThanDays });
  } catch (err: any) {
    res.status(500).json({ detail: err.message || "Error purging old bubbles" });
  }
});

memoriesRouter.put("/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const memoryId = parseInt(req.params.id as string, 10);
    const { text } = req.body;

    if (!text || typeof text !== "string") {
      res.status(400).json({ detail: "Memory text required for update" });
      return;
    }

    const db = getDb();
    const updated_at = new Date().toISOString();
    db.prepare("UPDATE memories SET memory_text = ?, updated_at = ? WHERE id = ?").run(text, updated_at, memoryId);

    res.json({ success: true, updated_id: memoryId, text });
  } catch (err: any) {
    res.status(500).json({ detail: err.message || "Error updating memory" });
  }
});

memoriesRouter.delete("/:id", authenticateToken, (req: AuthenticatedRequest, res: Response) => {
  try {
    const memoryId = parseInt(req.params.id as string, 10);
    memoryStore.delete(memoryId);
    res.json({ success: true, deleted_id: memoryId });
  } catch (err: any) {
    res.status(500).json({ detail: err.message || "Error deleting memory" });
  }
});
