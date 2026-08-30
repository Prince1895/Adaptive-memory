/**
 * LLM & Embedding client factory — TypeScript port of Python openai_client.py
 *
 * Uses lazy initialization so clients are created only on first use.
 * Supports OpenAI and OpenRouter (OpenAI-compatible interface).
 */

import OpenAI from "openai";
import { getSettings } from "./settings.js";

let _llmClient: OpenAI | null = null;
let _embeddingClient: OpenAI | null = null;

/** Get (or lazily create) the LLM client */
export function getLlmClient(): OpenAI {
  if (!_llmClient) {
    const s = getSettings();
    s.validate();

    if (s.llmProvider === "openrouter") {
      _llmClient = new OpenAI({
        apiKey: s.openrouterApiKey!,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://github.com/contextmemory",
          "X-Title": "ContextMemory",
        },
      });
    } else {
      _llmClient = new OpenAI({ apiKey: s.openaiApiKey! });
    }
  }
  return _llmClient;
}

/** Get (or lazily create) the embedding client */
export function getEmbeddingClient(): OpenAI {
  if (!_embeddingClient) {
    const s = getSettings();

    if (s.llmProvider === "openrouter" && s.openrouterApiKey) {
      _embeddingClient = new OpenAI({
        apiKey: s.openrouterApiKey,
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://github.com/contextmemory",
          "X-Title": "ContextMemory",
        },
      });
    } else if (s.openaiApiKey) {
      _embeddingClient = new OpenAI({ apiKey: s.openaiApiKey });
    } else {
      throw new Error(
        "API key required for embeddings. Set OPENAI_API_KEY or OPENROUTER_API_KEY."
      );
    }
  }
  return _embeddingClient;
}

/** Reset clients (useful for testing or after reconfigure) */
export function resetClients(): void {
  _llmClient = null;
  _embeddingClient = null;
}
