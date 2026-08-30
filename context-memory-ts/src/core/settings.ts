/**
 * ContextMemory Settings — TypeScript port of Python settings.py
 *
 * Supports two config methods:
 *  1. Programmatic: configure({ openaiApiKey: "..." })
 *  2. Environment variables: OPENAI_API_KEY, OPENROUTER_API_KEY, DATABASE_URL, ...
 */

import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

dotenv.config();

export type LLMProvider = "openai" | "openrouter";

export interface ContextMemoryConfig {
  openaiApiKey?: string;
  openrouterApiKey?: string;
  databaseUrl?: string;
  llmProvider?: LLMProvider;
  llmModel?: string;
  embeddingModel?: string;
  debug?: boolean;
}

export class ContextMemorySettings {
  openaiApiKey?: string;
  openrouterApiKey?: string;
  databaseUrl?: string;
  llmProvider: LLMProvider;
  llmModel: string;
  embeddingModel: string;
  debug: boolean;

  constructor(cfg: ContextMemoryConfig = {}) {
    this.openaiApiKey = cfg.openaiApiKey;
    this.openrouterApiKey = cfg.openrouterApiKey;
    this.databaseUrl = cfg.databaseUrl;
    this.llmProvider = cfg.llmProvider ?? "openai";
    this.llmModel = cfg.llmModel ?? "gpt-4o-mini";
    this.embeddingModel = cfg.embeddingModel ?? "text-embedding-3-small";
    this.debug = cfg.debug ?? false;
  }

  /** Return DB path — defaults to ~/.contextmemory/memory.db (SQLite) */
  getDatabaseUrl(): string {
    if (this.databaseUrl) return this.databaseUrl;
    const dir = path.join(os.homedir(), ".contextmemory");
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, "memory.db");
  }

  /** Get the correct API key for the active provider */
  getApiKey(): string {
    if (this.llmProvider === "openrouter") {
      if (!this.openrouterApiKey)
        throw new Error(
          "OpenRouter API key is required. Call configure({ openrouterApiKey: '...' }) or set OPENROUTER_API_KEY."
        );
      return this.openrouterApiKey;
    }
    if (!this.openaiApiKey)
      throw new Error(
        "OpenAI API key is required. Call configure({ openaiApiKey: '...' }) or set OPENAI_API_KEY."
      );
    return this.openaiApiKey;
  }

  /** Base URL for the LLM provider */
  getBaseUrl(): string | undefined {
    return this.llmProvider === "openrouter"
      ? "https://openrouter.ai/api/v1"
      : undefined;
  }

  validate(): void {
    this.getApiKey(); // throws if missing
  }
}

// ─── Global singleton ──────────────────────────────────────────────────────
let _settings: ContextMemorySettings | null = null;

/** Load settings from environment variables */
function fromEnv(): ContextMemorySettings {
  const provider =
    process.env.LLM_PROVIDER === "openrouter" ? "openrouter" : "openai";
  return new ContextMemorySettings({
    openaiApiKey: process.env.OPENAI_API_KEY,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    databaseUrl: process.env.DATABASE_URL,
    llmProvider: provider,
    llmModel: process.env.LLM_MODEL ?? "gpt-4o-mini",
    embeddingModel: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
    debug: ["true", "1", "yes"].includes(
      (process.env.DEBUG ?? "").toLowerCase()
    ),
  });
}

/**
 * Configure ContextMemory programmatically.
 * Call this once at app startup before using any Memory instances.
 */
export function configure(cfg: ContextMemoryConfig): void {
  _settings = new ContextMemorySettings(cfg);
}

/**
 * Get current settings. Auto-loads from env vars if configure() not called.
 */
export function getSettings(): ContextMemorySettings {
  if (!_settings) _settings = fromEnv();
  return _settings;
}

/** Reset settings (useful for testing) */
export function resetSettings(): void {
  _settings = null;
}
