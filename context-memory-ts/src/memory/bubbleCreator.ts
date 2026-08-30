/**
 * Bubble Creator — TypeScript port of Python bubble_creator.py
 *
 * Creates episodic memory "bubbles" with embeddings and bidirectional connections.
 */

import type Database from "better-sqlite3";
import { embedText } from "./embeddings.js";
import { getVectorStore, saveVectorStore } from "./vectorStore.js";
import { findConnections } from "./connectionFinder.js";
import type { BubbleData } from "./extractor.js";
import type { MemoryRow } from "../db/database.js";

export async function createBubbles(
  db: Database.Database,
  bubbles: BubbleData[],
  conversationId: number,
  sessionId: number | null = null
): Promise<MemoryRow[]> {
  const store = getVectorStore(conversationId);
  const created: MemoryRow[] = [];
  const now = new Date().toISOString();

  for (const bubbleData of bubbles) {
    const text = bubbleData.text?.trim();
    if (!text) continue;

    let importance =
      typeof bubbleData.importance === "number" ? bubbleData.importance : 0.5;
    importance = Math.max(0, Math.min(1, importance)); // clamp to [0, 1]

    // Generate embedding
    const embedding = await embedText(text);

    // Insert bubble into DB
    const res = db
      .prepare(
        `INSERT INTO memories
         (conversation_id, memory_text, embedding, memory_metadata, is_episodic,
          occurred_at, session_id, importance, is_active, created_at, updated_at)
         VALUES (?, ?, ?, '{}', 1, ?, ?, ?, 1, ?, ?)`
      )
      .run(
        conversationId,
        text,
        JSON.stringify(embedding),
        now, // occurred_at
        sessionId,
        importance,
        now,
        now
      );

    const bubbleId = res.lastInsertRowid as number;

    // Add to vector store
    store.add(bubbleId, embedding);

    // Fetch the row we just inserted
    const bubble = db
      .prepare("SELECT * FROM memories WHERE id = ?")
      .get(bubbleId) as MemoryRow;

    // Find + write connections
    findConnections(db, bubble, embedding, conversationId);

    created.push(bubble);
  }

  saveVectorStore(conversationId);
  return created;
}
