/**
 * Extraction Phase — TypeScript port of Python add_extraction_phase.py
 *
 * Step 1 of add():
 *   - Gets the latest 10 messages + rolling summary from DB
 *   - Calls extractMemories() to get semantic facts + episodic bubbles
 *   - Persists the new message pair
 *   - Triggers summary generation if needed
 */

import type Database from "better-sqlite3";
import { extractMemories, type ExtractionResult } from "../extractor.js";
import { generateConversationSummary } from "../../summary/summaryGenerator.js";
import type { MessageRow, SummaryRow } from "../../db/database.js";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export async function extractionPhase(
  db: Database.Database,
  messages: ChatMessage[],
  conversationId: number
): Promise<ExtractionResult> {
  if (messages.length === 0) return { semantic: [], bubbles: [] };

  let userMsg: ChatMessage;
  let assistantMsg: ChatMessage | null = null;

  if (messages.length >= 2) {
    userMsg = messages[messages.length - 2];
    assistantMsg = messages[messages.length - 1];
  } else {
    userMsg = messages[0];
  }

  // Format latest pair/message as "ROLE: content"
  const latestPair = [
    `${userMsg.role.toUpperCase()}: ${userMsg.content}`,
    ...(assistantMsg ? [`${assistantMsg.role.toUpperCase()}: ${assistantMsg.content}`] : []),
  ];

  // Get current rolling summary
  const summaryRow = db
    .prepare(
      "SELECT * FROM conversation_summary WHERE conversation_id = ?"
    )
    .get(conversationId) as SummaryRow | undefined;
  const summaryText = summaryRow?.summary_text ?? "";

  // Get last 10 messages for context
  const recentRows = db
    .prepare(
      `SELECT * FROM messages WHERE conversation_id = ?
       ORDER BY timestamp DESC LIMIT 10`
    )
    .all(conversationId) as MessageRow[];

  const recentMessages = recentRows
    .reverse()
    .map((r) => `${r.sender.toUpperCase()}: ${r.message_text}`);

  // Extract facts via LLM
  const result = await extractMemories(latestPair, summaryText, recentMessages);

  // Persist the message pair
  const now = new Date().toISOString();
  if (userMsg.role === "user") {
    db.prepare(
      "INSERT INTO messages (conversation_id, sender, message_text, timestamp) VALUES (?, ?, ?, ?)"
    ).run(conversationId, "user", userMsg.content, now);
  }
  if (assistantMsg) {
    db.prepare(
      "INSERT INTO messages (conversation_id, sender, message_text, timestamp) VALUES (?, ?, ?, ?)"
    ).run(conversationId, "assistant", assistantMsg.content, now);
  }

  // Possibly update rolling summary
  await generateConversationSummary(db, conversationId);

  return result;
}
