/**
 * Embedding generation — v2 with LRU cache + batch support + retry.
 *
 * Upgrades over v1:
 *  1. LRU cache — repeated text → zero API calls
 *  2. batchEmbedTexts() — N texts in 1 API call instead of N calls
 *  3. Exponential backoff retry on all calls
 */

import { getEmbeddingClient } from "../core/llmClient.js";
import { getSettings } from "../core/settings.js";
import { withRetry } from "../core/retry.js";

// ─── LRU Cache ────────────────────────────────────────────────────────────────
const MAX_CACHE_SIZE = 512;

/** Simple LRU map: evicts oldest entry when at capacity */
class LRUCache<K, V> {
  private map = new Map<K, V>();
  private capacity: number;

  constructor(capacity: number) {
    this.capacity = capacity;
  }

  get(key: K): V | undefined {
    if (!this.map.has(key)) return undefined;
    // Move to end (most recently used)
    const val = this.map.get(key)!;
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }

  set(key: K, val: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, val);
    // Evict oldest if over capacity
    if (this.map.size > this.capacity) {
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) this.map.delete(oldest);
    }
  }

  get size() { return this.map.size; }
}

const _cache = new LRUCache<string, number[]>(MAX_CACHE_SIZE);
let _cacheHits = 0;
let _cacheMisses = 0;

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getModelName(): string {
  const s = getSettings();
  let model = s.embeddingModel;
  if (s.llmProvider === "openrouter" && !model.startsWith("openai/")) {
    model = `openai/${model}`;
  }
  return model;
}

// ─── Single embedding (with cache + retry) ───────────────────────────────────
/**
 * Embed a single text. Cached — identical text never calls the API twice.
 */
export async function embedText(text: string): Promise<number[]> {
  const cached = _cache.get(text);
  if (cached) {
    _cacheHits++;
    if (getSettings().debug) {
      console.log(`[ContextMemory] Embedding cache hit (${_cacheHits} hits / ${_cacheMisses} misses)`);
    }
    return cached;
  }

  _cacheMisses++;
  const embedding = await batchEmbedTexts([text]);
  return embedding[0];
}

// ─── Batch embedding (core — 1 API call for N texts) ─────────────────────────
/**
 * Embed multiple texts in a single API call. Much faster than N sequential calls.
 * Results are cached individually for future reuse.
 */
export async function batchEmbedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const s = getSettings();
  const model = getModelName();

  // Check cache first — only call API for uncached texts
  const uncachedIndices: number[] = [];
  const uncachedTexts: string[] = [];
  const result: (number[] | null)[] = texts.map((text, i) => {
    const cached = _cache.get(text);
    if (cached) {
      _cacheHits++;
      return cached;
    }
    _cacheMisses++;
    uncachedIndices.push(i);
    uncachedTexts.push(text);
    return null;
  });

  if (uncachedTexts.length > 0) {
    const client = getEmbeddingClient();

    // OpenAI batch limit is 2048 inputs; chunk if needed
    const BATCH_SIZE = 100;
    const apiEmbeddings: number[][] = [];

    for (let i = 0; i < uncachedTexts.length; i += BATCH_SIZE) {
      const chunk = uncachedTexts.slice(i, i + BATCH_SIZE);
      const response = await withRetry(() =>
        client.embeddings.create({ model, input: chunk })
      );
      // API returns embeddings sorted by index
      for (const item of response.data) {
        apiEmbeddings.push(item.embedding);
      }
    }

    // Fill results + update cache
    for (let i = 0; i < uncachedIndices.length; i++) {
      const originalIdx = uncachedIndices[i];
      const embedding = apiEmbeddings[i];
      result[originalIdx] = embedding;
      _cache.set(texts[originalIdx], embedding);
    }

    if (s.debug) {
      console.log(
        `[ContextMemory] Batch embed: ${uncachedTexts.length} API calls saved by batching. Cache: ${_cacheHits}H/${_cacheMisses}M`
      );
    }
  }

  return result as number[][];
}

/** Clear the embedding cache (useful for testing) */
export function clearEmbeddingCache(): void {
  _cacheHits = 0;
  _cacheMisses = 0;
  // Re-create cache (no clear method on Map-based LRU)
  Object.assign(_cache, new LRUCache<string, number[]>(MAX_CACHE_SIZE));
}

/** Cache stats for monitoring */
export function getEmbeddingCacheStats(): { hits: number; misses: number; size: number; hitRate: string } {
  const total = _cacheHits + _cacheMisses;
  return {
    hits: _cacheHits,
    misses: _cacheMisses,
    size: _cache.size,
    hitRate: total > 0 ? `${Math.round((_cacheHits / total) * 100)}%` : "0%",
  };
}
