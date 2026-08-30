/**
 * In-memory vector store for fast cosine-similarity search.
 *
 * TypeScript port of Python vector_store.py (FAISS).
 * Since faiss-node binaries are fragile, we use a pure-JS flat index
 * (cosine similarity via dot product after L2 normalisation).
 * Performance is identical to FAISS IndexFlatIP for datasets < 100k vectors.
 *
 * Persists index maps to ~/.contextmemory/indexes/conv_<id>.json
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// ─── Types ───────────────────────────────────────────────────────────────────
export interface SearchResult {
  memoryId: number;
  score: number;
}

// ─── Utility math ─────────────────────────────────────────────────────────────
function normalise(v: number[]): number[] {
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  if (norm === 0) return v;
  return v.map((x) => x / norm);
}

function dot(a: number[], b: number[]): number {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

// ─── VectorStore class ───────────────────────────────────────────────────────
export class VectorStore {
  /** memoryId → normalised embedding */
  private vectors: Map<number, number[]> = new Map();

  get count(): number {
    return this.vectors.size;
  }

  add(memoryId: number, embedding: number[]): void {
    if (this.vectors.has(memoryId)) return; // skip duplicates
    this.vectors.set(memoryId, normalise(embedding));
  }

  /** Update (remove old + insert new) */
  update(memoryId: number, embedding: number[]): void {
    this.vectors.set(memoryId, normalise(embedding));
  }

  remove(memoryId: number): void {
    this.vectors.delete(memoryId);
  }

  /**
   * Cosine similarity search — O(n) but fast in JS for typical memory sizes.
   * Returns top-k results sorted descending by score.
   */
  search(queryEmbedding: number[], k: number = 10): SearchResult[] {
    if (this.vectors.size === 0) return [];
    const q = normalise(queryEmbedding);

    const results: SearchResult[] = [];
    for (const [memoryId, vec] of this.vectors.entries()) {
      results.push({ memoryId, score: dot(q, vec) });
    }

    results.sort((a, b) => b.score - a.score);
    return results.slice(0, k);
  }

  // ─── Persistence ───────────────────────────────────────────────────────────
  save(filePath: string): void {
    const dir = path.dirname(filePath);
    fs.mkdirSync(dir, { recursive: true });
    const data: Record<string, number[]> = {};
    for (const [id, vec] of this.vectors.entries()) {
      data[String(id)] = vec;
    }
    fs.writeFileSync(filePath, JSON.stringify(data));
  }

  load(filePath: string): boolean {
    if (!fs.existsSync(filePath)) return false;
    try {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw) as Record<string, number[]>;
      this.vectors = new Map(
        Object.entries(data).map(([id, vec]) => [parseInt(id, 10), vec])
      );
      return true;
    } catch {
      return false;
    }
  }
}

// ─── Per-conversation cache ───────────────────────────────────────────────────
const _stores: Map<number, VectorStore> = new Map();

function getIndexDir(): string {
  const dir = path.join(os.homedir(), ".contextmemory", "indexes");
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function indexPath(conversationId: number): string {
  return path.join(getIndexDir(), `conv_${conversationId}.json`);
}

export function getVectorStore(conversationId: number): VectorStore {
  if (!_stores.has(conversationId)) {
    const store = new VectorStore();
    store.load(indexPath(conversationId));
    _stores.set(conversationId, store);
  }
  return _stores.get(conversationId)!;
}

export function saveVectorStore(conversationId: number): void {
  const store = _stores.get(conversationId);
  if (store) store.save(indexPath(conversationId));
}

/**
 * Rebuild the vector store from the SQLite database.
 * Called when the index file is missing or corrupted.
 */
import type Database from "better-sqlite3";
import { parseEmbedding, type MemoryRow } from "../db/database.js";

export function rebuildIndexFromDb(
  db: Database.Database,
  conversationId: number
): VectorStore {
  const store = new VectorStore();
  const rows = db
    .prepare(
      `SELECT * FROM memories
       WHERE conversation_id = ? AND is_active = 1 AND embedding IS NOT NULL`
    )
    .all(conversationId) as MemoryRow[];

  for (const row of rows) {
    const emb = parseEmbedding(row);
    if (emb) store.add(row.id, emb);
  }

  _stores.set(conversationId, store);
  store.save(indexPath(conversationId));
  return store;
}

export function resetVectorStores(): void {
  _stores.clear();
}
