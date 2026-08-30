/**
 * Connection Finder — TypeScript port of Python connection_finder.py
 *
 * Finds bidirectional connections between episodic bubbles
 * using cosine similarity from the vector store.
 */

import type Database from "better-sqlite3";
import { getVectorStore } from "./vectorStore.js";
import type { MemoryRow } from "../db/database.js";
import { parseMeta } from "../db/database.js";

const CONNECTION_THRESHOLD = 0.6;
const MAX_CONNECTIONS = 5;

/**
 * Find similar bubbles and write bidirectional connection metadata.
 * Returns an array of connected memory IDs.
 */
export function findConnections(
  db: Database.Database,
  newBubble: MemoryRow,
  embedding: number[],
  conversationId: number
): number[] {
  const store = getVectorStore(conversationId);
  const results = store.search(embedding, MAX_CONNECTIONS * 2);

  const connections: Array<{ id: number; score: number }> = [];

  for (const r of results) {
    if (r.memoryId !== newBubble.id && r.score >= CONNECTION_THRESHOLD) {
      connections.push({ id: r.memoryId, score: Math.round(r.score * 1000) / 1000 });
    }
  }

  const topConns = connections.slice(0, MAX_CONNECTIONS);
  if (topConns.length === 0) return [];

  const connectionIds = topConns.map((c) => c.id);
  const connectionScores: Record<string, number> = {};
  for (const c of topConns) connectionScores[String(c.id)] = c.score;

  // Write to new bubble's metadata
  const newMeta = parseMeta(newBubble);
  newMeta.connections = { bubble_ids: connectionIds, scores: connectionScores };
  db.prepare("UPDATE memories SET memory_metadata = ? WHERE id = ?").run(
    JSON.stringify(newMeta),
    newBubble.id
  );

  // Write reverse connections (bidirectional)
  for (const conn of topConns) {
    const connRow = db
      .prepare("SELECT * FROM memories WHERE id = ?")
      .get(conn.id) as MemoryRow | undefined;

    if (connRow) {
      const cm = parseMeta(connRow) as {
        connections?: { bubble_ids: number[]; scores: Record<string, number> };
      };
      const cmc = cm.connections ?? { bubble_ids: [], scores: {} };

      if (!cmc.bubble_ids.includes(newBubble.id)) {
        cmc.bubble_ids.push(newBubble.id);
        cmc.scores[String(newBubble.id)] = conn.score;
        cm.connections = cmc;
        db.prepare("UPDATE memories SET memory_metadata = ? WHERE id = ?").run(
          JSON.stringify(cm),
          conn.id
        );
      }
    }
  }

  return connectionIds;
}
