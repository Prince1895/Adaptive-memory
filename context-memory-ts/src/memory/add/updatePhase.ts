/**
 * Upgraded Update Phase — v2 with:
 *  1. Batch embeddings — embed ALL facts in 1 API call instead of N sequential calls
 *  2. Parallel LLM calls — run all tool classifier decisions concurrently
 *  3. Fast pre-dedup — cosine similarity > 0.95 → NOOP without any LLM call
 *  4. Retry on all LLM calls (via withRetry in toolClassifier)
 *  5. Atomic DB transaction — all updates committed together
 */

import type Database from "better-sqlite3";
import { batchEmbedTexts } from "../embeddings.js";
import { llmToolCall } from "../toolClassifier.js";
import {
  getVectorStore,
  saveVectorStore,
  rebuildIndexFromDb,
} from "../vectorStore.js";
import { getSettings } from "../../core/settings.js";
import type { MemoryRow } from "../../db/database.js";

const FAST_DEDUP_THRESHOLD = 0.95; // cosine score above this → definitely duplicate

/** Search similar memories via vector store */
function searchSimilarMemories(
  db: Database.Database,
  conversationId: number,
  queryEmbedding: number[],
  limit = 10
): MemoryRow[] {
  let store = getVectorStore(conversationId);
  if (store.count === 0) store = rebuildIndexFromDb(db, conversationId);

  const results = store.search(queryEmbedding, limit);
  if (results.length === 0) return [];

  const ids = results.map((r) => r.memoryId);
  const placeholders = ids.map(() => "?").join(",");
  const rows = db
    .prepare(
      `SELECT * FROM memories WHERE id IN (${placeholders}) AND is_active = 1`
    )
    .all(...ids) as MemoryRow[];

  const byId = new Map(rows.map((r) => [r.id, r]));
  return ids.filter((id) => byId.has(id)).map((id) => byId.get(id)!);
}

import { calculateDynamicImportance } from "../../utils/importance.js";

// ─── Apply a single decision to DB + vector store ───────────────────────────
function applyDecision(
  db: Database.Database,
  conversationId: number,
  fact: string,
  embedding: number[],
  decision: Awaited<ReturnType<typeof llmToolCall>>,
  s: ReturnType<typeof getSettings>
): void {
  const store = getVectorStore(conversationId);
  const now = new Date().toISOString();

  if (decision.action === "ADD") {
    const text = decision.text ?? fact;
    const cat = decision.category ?? null;
    const importance = calculateDynamicImportance(text, cat);
    const res = db
      .prepare(
        `INSERT INTO memories
         (conversation_id, memory_text, embedding, category, is_episodic, importance, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, 1, ?, ?)`
      )
      .run(conversationId, text, JSON.stringify(embedding), cat, importance, now, now);

    const newId = res.lastInsertRowid as number;
    store.add(newId, embedding);
    if (s.debug) console.log(`[ContextMemory] ✅ ADD memory ID ${newId} (importance ${importance}): "${text.slice(0, 60)}"`);
  }

  else if (decision.action === "UPDATE" && decision.memoryId != null) {
    const old = db.prepare("SELECT * FROM memories WHERE id = ?").get(decision.memoryId) as MemoryRow | undefined;
    if (old) {
      const text = decision.text ?? fact;
      const cat = decision.category ?? old.category;
      const importance = calculateDynamicImportance(text, cat);
      db.prepare(
        "UPDATE memories SET memory_text = ?, embedding = ?, category = ?, importance = ?, updated_at = ? WHERE id = ?"
      ).run(text, JSON.stringify(embedding), cat, importance, now, old.id);
      store.update(old.id, embedding);
      if (s.debug) console.log(`[ContextMemory] ✏️  UPDATE memory ID ${old.id}`);
    }
  }

  else if (decision.action === "DELETE" && decision.memoryId != null) {
    const old = db.prepare("SELECT * FROM memories WHERE id = ?").get(decision.memoryId) as MemoryRow | undefined;
    if (old) {
      store.remove(old.id);
      db.prepare("UPDATE memories SET is_active = 0 WHERE id = ?").run(old.id);
      if (s.debug) console.log(`[ContextMemory] 🗑  DELETE memory ID ${old.id}`);
    }
  }

  else if (decision.action === "REPLACE" && decision.memoryId != null) {
    const old = db.prepare("SELECT * FROM memories WHERE id = ?").get(decision.memoryId) as MemoryRow | undefined;
    if (old) {
      store.remove(old.id);
      db.prepare("UPDATE memories SET is_active = 0 WHERE id = ?").run(old.id);
      if (s.debug) console.log(`[ContextMemory] 🔄 REPLACE — deactivated ID ${old.id}`);
    }
    const text = decision.text ?? fact;
    const cat = decision.category ?? null;
    const importance = calculateDynamicImportance(text, cat);
    const res = db
      .prepare(
        `INSERT INTO memories
         (conversation_id, memory_text, embedding, category, is_episodic, importance, is_active, created_at, updated_at)
         VALUES (?, ?, ?, ?, 0, ?, 1, ?, ?)`
      )
      .run(conversationId, text, JSON.stringify(embedding), cat, importance, now, now);

    const newId = res.lastInsertRowid as number;
    store.add(newId, embedding);
    if (s.debug) console.log(`[ContextMemory] ✅ REPLACE — added new ID ${newId}: "${text.slice(0, 60)}"`);
  }

  else if (decision.action === "NOOP") {
    if (s.debug) console.log(`[ContextMemory] ⏭  NOOP for: "${fact.slice(0, 60)}"`);
  }
}


export async function updatePhase(
  db: Database.Database,
  candidateFacts: string[],
  conversationId: number
): Promise<void> {
  if (candidateFacts.length === 0) return;

  const s = getSettings();

  // ── Step 1: Batch embed ALL facts in 1 API call ───────────────────────────
  if (s.debug) console.log(`[ContextMemory] Batch embedding ${candidateFacts.length} facts...`);
  const embeddings = await batchEmbedTexts(candidateFacts);

  // ── Step 2: For each fact, search similar + fast dedup check ─────────────
  type FactWork = {
    fact: string;
    embedding: number[];
    similar: MemoryRow[];
    fastNoop: boolean;
  };

  const workItems: FactWork[] = candidateFacts.map((fact, i) => {
    const embedding = embeddings[i];
    const similar = searchSimilarMemories(db, conversationId, embedding, 10);

    // Fast dedup: if top match cosine > threshold, skip LLM call
    let fastNoop = false;
    if (similar.length > 0) {
      const store = getVectorStore(conversationId);
      const topResults = store.search(embedding, 1);
      if (topResults.length > 0 && topResults[0].score >= FAST_DEDUP_THRESHOLD) {
        fastNoop = true;
        if (s.debug) {
          console.log(
            `[ContextMemory] ⚡ Fast-dedup NOOP (score=${topResults[0].score.toFixed(3)}): "${fact.slice(0, 60)}"`
          );
        }
      }
    }

    return { fact, embedding, similar, fastNoop };
  });

  // ── Step 3: Parallel LLM calls for non-deduped facts ─────────────────────
  const llmWork = workItems.filter((w) => !w.fastNoop);

  if (s.debug)
    console.log(
      `[ContextMemory] ${workItems.length - llmWork.length} fast-deduped, ${llmWork.length} sent to LLM (parallel)`
    );

  const decisions = await Promise.all(
    llmWork.map((w) => llmToolCall(w.fact, w.similar))
  );

  // ── Step 4: Apply all decisions in a single DB transaction ───────────────
  const applyAll = db.transaction(() => {
    for (let i = 0; i < llmWork.length; i++) {
      const { fact, embedding } = llmWork[i];
      const decision = decisions[i];
      applyDecision(db, conversationId, fact, embedding, decision, s);
    }
  });
  applyAll();

  saveVectorStore(conversationId);
}
