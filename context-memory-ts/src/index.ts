/**
 * context-memory v2 — Public API
 */

// Core config
export { configure, getSettings, resetSettings } from "./core/settings.js";
export type { ContextMemoryConfig, LLMProvider } from "./core/settings.js";

// Database
export { getDb, createTables, resetDb } from "./db/database.js";
export type { MemoryRow, MessageRow, ConversationRow, SummaryRow } from "./db/database.js";

// Main class + types
export { ContextMemory } from "./memory/memory.js";
export type {
  AddResponse,
  SearchResponse,
  SearchOptions,
  MemoryResult,
  MemoryStats,
} from "./memory/memory.js";

// Lower-level utilities
export { embedText, batchEmbedTexts, getEmbeddingCacheStats } from "./memory/embeddings.js";
export { getVectorStore, saveVectorStore, rebuildIndexFromDb } from "./memory/vectorStore.js";
export type { SearchResult } from "./memory/vectorStore.js";
export { generateConversationSummary } from "./summary/summaryGenerator.js";
export { withRetry } from "./core/retry.js";
export type { RetryOptions } from "./core/retry.js";
