import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 8000;
export const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey123456789";
export const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const LLM_PROVIDER = process.env.LLM_PROVIDER || "openrouter";
export const LLM_MODEL = process.env.LLM_MODEL || "openai/gpt-4o-mini";
export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL || "text-embedding-3-small";
