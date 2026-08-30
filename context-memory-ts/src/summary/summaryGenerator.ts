/**
 * Summary Generator — TypeScript port of Python summary_generator.py
 *
 * Periodically compresses conversation history into a rolling summary.
 * Triggered every SUMMARY_TRIGGER_COUNT messages.
 */

import type Database from "better-sqlite3";
import { getLlmClient } from "../core/llmClient.js";
import { getSettings } from "../core/settings.js";
import { SUMMARY_GENERATOR_PROMPT } from "../utils/prompts.js";
import type { MessageRow, SummaryRow } from "../db/database.js";

const MAX_MESSAGES_FROM_SUMMARY = 200;
const SUMMARY_TRIGGER_COUNT = 20;

/**
 * Generate (or update) the rolling summary for a conversation.
 * Only runs when message count is a multiple of SUMMARY_TRIGGER_COUNT.
 * Returns empty string if not triggered.
 */
export async function generateConversationSummary(
  db: Database.Database,
  conversationId: number
): Promise<string> {
  const s = getSettings();
  const client = getLlmClient();

  const total = (
    db
      .prepare("SELECT COUNT(*) as cnt FROM messages WHERE conversation_id = ?")
      .get(conversationId) as { cnt: number }
  ).cnt;

  if (total === 0 || total % SUMMARY_TRIGGER_COUNT !== 0) return "";

  const rows = db
    .prepare(
      `SELECT * FROM messages
       WHERE conversation_id = ?
       ORDER BY timestamp ASC
       LIMIT ?`
    )
    .all(conversationId, MAX_MESSAGES_FROM_SUMMARY) as MessageRow[];

  if (rows.length === 0) return "";

  const conversationText = rows
    .map((r) => `${r.sender.toUpperCase()}: ${r.message_text}`)
    .join("\n");

  const response = await client.chat.completions.create({
    model: s.llmModel,
    messages: [
      { role: "system", content: SUMMARY_GENERATOR_PROMPT },
      {
        role: "user",
        content: `Summarize the following conversation.\n\nConversation:\n${conversationText}\n\nReturn only the summary text.`,
      },
    ],
    temperature: 0.2,
  });

  const summaryText = (response.choices[0].message.content ?? "").trim();

  // Upsert summary row
  const existing = db
    .prepare(
      "SELECT * FROM conversation_summary WHERE conversation_id = ?"
    )
    .get(conversationId) as SummaryRow | undefined;

  const now = new Date().toISOString();

  if (existing) {
    db.prepare(
      "UPDATE conversation_summary SET summary_text = ?, updated_at = ? WHERE conversation_id = ?"
    ).run(summaryText, now, conversationId);
  } else {
    db.prepare(
      "INSERT INTO conversation_summary (conversation_id, summary_text, updated_at) VALUES (?, ?, ?)"
    ).run(conversationId, summaryText, now);
  }

  if (s.debug) console.log("[ContextMemory] Summary updated.");
  return summaryText;
}
