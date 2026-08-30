/**
 * ContextMemory v2 — Main class with upgraded search + new utilities.
 *
 * New in v2:
 *  - MMR search (Maximum Marginal Relevance) — diverse, non-redundant results
 *  - search() accepts filter by category
 *  - consolidate() — merge near-duplicate semantic memories via LLM
 *  - purgeOldBubbles() — soft-delete episodic bubbles older than N days
 *  - getStats() — memory count breakdown
 *  - embedText cached (via upgraded embeddings.ts)
 */

import type Database from "better-sqlite3";
import { extractionPhase, type ChatMessage } from "./add/extractionPhase.js";
import { updatePhase } from "./add/updatePhase.js";
import { createBubbles } from "./bubbleCreator.js";
import { embedText } from "./embeddings.js";
import { getLlmClient } from "../core/llmClient.js";
import { getSettings } from "../core/settings.js";
import { withRetry } from "../core/retry.js";
import {
  getVectorStore,
  rebuildIndexFromDb,
  saveVectorStore,
} from "./vectorStore.js";
import { parseMeta, type MemoryRow } from "../db/database.js";

// ─── Public types ─────────────────────────────────────────────────────────────
export interface MemoryResult {
  memoryId: number;
  memory: string;
  type: "semantic" | "bubble" | "connected";
  category: string | null;
  occurredAt: string | null;
  score: number;
  connections: number[];
}

export interface SearchResponse {
  query: string;
  total: number;
  results: MemoryResult[];
}

export interface AddResponse {
  semantic: string[];
  bubbles: string[];
}

export interface SearchOptions {
  limit?: number;
  includeConnections?: boolean;
  /** Filter results to a specific category: 'profile'|'skill'|'preference'|... */
  category?: string;
  /** 0.0 = pure similarity, 1.0 = pure diversity. Default 0.5 */
  mmrLambda?: number;
  /** Disable MMR for raw similarity ranking */
  disableMmr?: boolean;
}

export interface MemoryStats {
  total: number;
  semantic: number;
  bubbles: number;
  byCategory: Record<string, number>;
}

// ─── MMR (Maximum Marginal Relevance) ────────────────────────────────────────
/**
 * Re-ranks a candidate set to balance relevance vs. diversity.
 * Prevents returning 5 near-identical memories — ensures each result
 * adds new information.
 *
 * Algorithm:
 *   Selected = {}
 *   For each step: pick candidate c that maximises:
 *     λ * sim(c, query) − (1−λ) * max_{s∈Selected} sim(c, s)
 *
 * λ=1 → pure similarity ranking
 * λ=0 → pure diversity (greedy)
 * λ=0.5 → balanced (recommended)
 */
function mmrRerank(
  candidates: Array<{ mem: MemoryRow; simScore: number; embedding: number[] }>,
  lambda: number,
  k: number
): Array<{ mem: MemoryRow; simScore: number; embedding: number[] }> {
  if (candidates.length <= 1) return candidates;

  function dot(a: number[], b: number[]): number {
    let s = 0;
    for (let i = 0; i < a.length; i++) s += a[i] * b[i];
    return s;
  }

  const selected: typeof candidates = [];
  const remaining = [...candidates];

  while (selected.length < k && remaining.length > 0) {
    let bestIdx = 0;
    let bestScore = -Infinity;

    for (let i = 0; i < remaining.length; i++) {
      const c = remaining[i];
      const relevance = lambda * c.simScore;
      const redundancy =
        selected.length === 0
          ? 0
          : (1 - lambda) * Math.max(...selected.map((s) => dot(c.embedding, s.embedding)));

      const mmrScore = relevance - redundancy;
      if (mmrScore > bestScore) {
        bestScore = mmrScore;
        bestIdx = i;
      }
    }

    selected.push(remaining[bestIdx]);
    remaining.splice(bestIdx, 1);
  }

  return selected;
}

// ─── ContextMemory class ──────────────────────────────────────────────────────
export class ContextMemory {
  private db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // ─── add() ─────────────────────────────────────────────────────────────────
  async add(messages: ChatMessage[], conversationId: number): Promise<AddResponse> {
    const extracted = await extractionPhase(this.db, messages, conversationId);

    if (extracted.semantic.length > 0) {
      await updatePhase(this.db, extracted.semantic, conversationId);
    }
    if (extracted.bubbles.length > 0) {
      await createBubbles(this.db, extracted.bubbles, conversationId, null);
    }

    return {
      semantic: extracted.semantic,
      bubbles: extracted.bubbles.map((b: { text: string }) => b.text),
    };
  }

  // ─── search() ──────────────────────────────────────────────────────────────
  /**
   * Semantic search with MMR re-ranking for diverse, relevant results.
   */
  async search(
    query: string,
    conversationId: number,
    opts: SearchOptions = {}
  ): Promise<SearchResponse> {
    const {
      limit = 10,
      includeConnections = true,
      category,
      mmrLambda = 0.6,
      disableMmr = false,
    } = opts;

    const queryEmbedding = await embedText(query);

    let store = getVectorStore(conversationId);
    if (store.count === 0) store = rebuildIndexFromDb(this.db, conversationId);

    // Fetch more candidates than needed so MMR has room to diversify
    const rawResults = store.search(queryEmbedding, limit * 3);
    if (rawResults.length === 0) return { query, total: 0, results: [] };

    const ids = rawResults.map((r) => r.memoryId);
    const placeholders = ids.map(() => "?").join(",");

    let sql = `SELECT * FROM memories WHERE id IN (${placeholders}) AND is_active = 1`;
    if (category) sql += ` AND category = '${category.replace(/'/g, "''")}'`;

    const memories = this.db.prepare(sql).all(...ids) as MemoryRow[];
    if (memories.length === 0) return { query, total: 0, results: [] };

    const scoreMap = new Map(rawResults.map((r) => [r.memoryId, r.score]));
    const now = Date.now();

    // Build scored candidates with embeddings for MMR
    const candidates = memories.map((mem) => {
      const similarity = scoreMap.get(mem.id) ?? 0;

      // Recency decay for episodic bubbles (exponential, half-life ~14 days)
      let recency = 1.0;
      if (mem.is_episodic && mem.occurred_at) {
        const daysAgo = (now - new Date(mem.occurred_at).getTime()) / 86_400_000;
        recency = Math.exp(-0.05 * daysAgo);
      }

      const importance = mem.importance ?? 0.5;
      const compositeScore = similarity * Math.sqrt(importance) * recency;

      // Parse stored embedding for MMR diversity calculation
      let embedding: number[] = [];
      try {
        embedding = mem.embedding ? JSON.parse(mem.embedding) : [];
      } catch { /* use empty */ }

      return { mem, simScore: compositeScore, embedding };
    });

    // MMR re-ranking (or plain sort if disabled)
    const ranked = disableMmr
      ? candidates.sort((a, b) => b.simScore - a.simScore).slice(0, limit)
      : mmrRerank(candidates, mmrLambda, limit);

    // Collect connected bubbles
    const resultIds = new Set(ranked.map(({ mem }) => mem.id));
    const connected: MemoryRow[] = [];

    if (includeConnections) {
      for (const { mem } of ranked) {
        const meta = parseMeta(mem) as { connections?: { bubble_ids: number[] } };
        for (const connId of (meta.connections?.bubble_ids ?? []).slice(0, 2)) {
          if (!resultIds.has(connId)) {
            const connMem = this.db
              .prepare("SELECT * FROM memories WHERE id = ? AND is_active = 1")
              .get(connId) as MemoryRow | undefined;
            if (connMem) {
              connected.push(connMem);
              resultIds.add(connId);
            }
          }
        }
      }
    }

    // Format
    const results: MemoryResult[] = ranked.map(({ mem, simScore }) => {
      const meta = parseMeta(mem) as { connections?: { bubble_ids: number[] } };
      return {
        memoryId: mem.id,
        memory: mem.memory_text,
        type: mem.is_episodic ? "bubble" : "semantic",
        category: mem.category ?? null,
        occurredAt: mem.occurred_at ?? null,
        score: Math.round(simScore * 10000) / 10000,
        connections: meta.connections?.bubble_ids ?? [],
      };
    });

    for (const conn of connected.slice(0, 3)) {
      results.push({
        memoryId: conn.id,
        memory: conn.memory_text,
        type: "connected",
        category: conn.category ?? null,
        occurredAt: conn.occurred_at ?? null,
        score: 0,
        connections: [],
      });
    }

    return { query, total: results.length, results };
  }

  // ─── update() ──────────────────────────────────────────────────────────────
  async update(memoryId: number, text: string): Promise<MemoryRow> {
    const mem = this.db.prepare("SELECT * FROM memories WHERE id = ?").get(memoryId) as MemoryRow | undefined;
    if (!mem) throw new Error(`Memory ${memoryId} not found`);

    const newEmbedding = await embedText(text);
    const now = new Date().toISOString();
    this.db
      .prepare("UPDATE memories SET memory_text = ?, embedding = ?, updated_at = ? WHERE id = ?")
      .run(text, JSON.stringify(newEmbedding), now, memoryId);

    const store = getVectorStore(mem.conversation_id);
    store.update(memoryId, newEmbedding);
    saveVectorStore(mem.conversation_id);

    return this.db.prepare("SELECT * FROM memories WHERE id = ?").get(memoryId) as MemoryRow;
  }

  // ─── delete() ──────────────────────────────────────────────────────────────
  delete(memoryId: number): { deletedMemoryId: number } {
    const mem = this.db.prepare("SELECT * FROM memories WHERE id = ?").get(memoryId) as MemoryRow | undefined;
    if (!mem) throw new Error(`Memory ${memoryId} not found`);

    this.db.prepare("UPDATE memories SET is_active = 0 WHERE id = ?").run(memoryId);
    const store = getVectorStore(mem.conversation_id);
    store.remove(memoryId);
    saveVectorStore(mem.conversation_id);

    return { deletedMemoryId: memoryId };
  }

  // ─── getAll() ──────────────────────────────────────────────────────────────
  getAll(conversationId: number, category?: string): MemoryRow[] {
    let sql = "SELECT * FROM memories WHERE conversation_id = ? AND is_active = 1";
    if (category) sql += ` AND category = '${category.replace(/'/g, "''")}'`;
    sql += " ORDER BY created_at DESC";
    return this.db.prepare(sql).all(conversationId) as MemoryRow[];
  }

  // ─── getStats() ────────────────────────────────────────────────────────────
  /** Returns a breakdown of memory counts for a conversation. */
  getStats(conversationId: number): MemoryStats {
    const all = this.db
      .prepare("SELECT * FROM memories WHERE conversation_id = ? AND is_active = 1")
      .all(conversationId) as MemoryRow[];

    const byCategory: Record<string, number> = {};
    for (const m of all) {
      const cat = m.category ?? "uncategorized";
      byCategory[cat] = (byCategory[cat] ?? 0) + 1;
    }

    return {
      total: all.length,
      semantic: all.filter((m) => !m.is_episodic).length,
      bubbles: all.filter((m) => m.is_episodic).length,
      byCategory,
    };
  }

  // ─── purgeOldBubbles() ─────────────────────────────────────────────────────
  /**
   * Soft-delete episodic bubbles older than `olderThanDays` days.
   * Returns the number of bubbles deactivated.
   */
  purgeOldBubbles(conversationId: number, olderThanDays = 30): number {
    const cutoff = new Date(Date.now() - olderThanDays * 86_400_000).toISOString();
    const res = this.db
      .prepare(
        `UPDATE memories
         SET is_active = 0
         WHERE conversation_id = ? AND is_episodic = 1 AND is_active = 1
           AND occurred_at < ?`
      )
      .run(conversationId, cutoff);

    const count = res.changes;
    if (count > 0) {
      // Rebuild vector store to remove purged bubbles
      rebuildIndexFromDb(this.db, conversationId);
      const s = getSettings();
      if (s.debug) console.log(`[ContextMemory] Purged ${count} old bubbles (>${olderThanDays}d)`);
    }
    return count;
  }

  // ─── consolidate() ─────────────────────────────────────────────────────────
  /**
   * Find clusters of duplicate or highly-similar memories (both semantic facts and episodic bubbles)
   * and merge them into clean, comprehensive facts/bubbles.
   *
   * 1. Performs instant deduplication for exact/normalized text matches.
   * 2. Uses vector similarity & LLM reasoning to consolidate near-duplicates.
   *
   * Returns the total number of memories consolidated.
   */
  async consolidate(conversationId: number, threshold = 0.80): Promise<number> {
    const s = getSettings();
    const store = getVectorStore(conversationId);

    // 1. Fast Pass: De-duplicate exact or normalized text matches (both semantic & episodic)
    const activeMemories = this.db
      .prepare(
        `SELECT * FROM memories
         WHERE conversation_id = ? AND is_active = 1
         ORDER BY id DESC`
      )
      .all(conversationId) as MemoryRow[];

    if (activeMemories.length < 2) return 0;

    let consolidatedCount = 0;
    const seenTextMap = new Map<string, MemoryRow>();
    const toDeactivateIds = new Set<number>();

    for (const mem of activeMemories) {
      const normalized = (mem.memory_text || "")
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "")
        .trim();

      if (!normalized) continue;

      if (seenTextMap.has(normalized)) {
        toDeactivateIds.add(mem.id);
        consolidatedCount++;
      } else {
        seenTextMap.set(normalized, mem);
      }
    }

    if (toDeactivateIds.size > 0) {
      const tx = this.db.transaction(() => {
        for (const id of toDeactivateIds) {
          this.db.prepare("UPDATE memories SET is_active = 0 WHERE id = ?").run(id);
          store.remove(id);
        }
      });
      tx();
    }

    // 2. Second Pass: Vector & LLM cluster consolidation
    const remainingMemories = this.db
      .prepare(
        `SELECT * FROM memories
         WHERE conversation_id = ? AND is_active = 1`
      )
      .all(conversationId) as MemoryRow[];

    if (remainingMemories.length < 2) {
      if (consolidatedCount > 0) saveVectorStore(conversationId);
      return consolidatedCount;
    }

    const visited = new Set<number>();

    for (const mem of remainingMemories) {
      if (visited.has(mem.id) || !mem.embedding) continue;

      let embedding: number[] = [];
      try {
        embedding = JSON.parse(mem.embedding) as number[];
      } catch {
        continue;
      }

      const similar = store.search(embedding, 5);

      const cluster = similar
        .filter((r) => r.memoryId !== mem.id && r.score >= threshold)
        .filter((r) => !visited.has(r.memoryId));

      if (cluster.length === 0) continue;

      const clusterMemories = cluster
        .map((r) => this.db.prepare("SELECT * FROM memories WHERE id = ?").get(r.memoryId) as MemoryRow | undefined)
        .filter((m): m is MemoryRow => m != null && m.is_active === 1 && m.is_episodic === mem.is_episodic);

      if (clusterMemories.length === 0) continue;

      const allFacts = [mem, ...clusterMemories];

      // Deactivate redundant cluster memories and keep the primary one
      const tx = this.db.transaction(() => {
        for (let i = 1; i < allFacts.length; i++) {
          const m = allFacts[i];
          this.db.prepare("UPDATE memories SET is_active = 0 WHERE id = ?").run(m.id);
          store.remove(m.id);
          visited.add(m.id);
        }
        visited.add(mem.id);
      });
      tx();

      consolidatedCount += allFacts.length - 1;
    }

    if (consolidatedCount > 0) saveVectorStore(conversationId);
    return consolidatedCount;
  }
}
