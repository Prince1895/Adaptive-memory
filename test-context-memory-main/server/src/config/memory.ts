import { configure, createTables, getDb, ContextMemory } from "adaptive-context-memory";
import { OPENROUTER_API_KEY, OPENAI_API_KEY, LLM_PROVIDER, LLM_MODEL, EMBEDDING_MODEL } from "./env";

configure({
  openrouterApiKey: OPENROUTER_API_KEY,
  openaiApiKey: OPENAI_API_KEY,
  llmProvider: LLM_PROVIDER as any,
  llmModel: LLM_MODEL,
  embeddingModel: EMBEDDING_MODEL
});

createTables();

export const memoryDb = getDb();
export const memoryStore = new ContextMemory(memoryDb);
