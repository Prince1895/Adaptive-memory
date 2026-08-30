# adaptive-context-memory

High-performance, standalone, zero-binary long-term adaptive memory system for AI agents and LLM applications in TypeScript & Node.js.

---

## Features

- **Zero Binary Vector Search:** Flat cosine similarity search in pure TypeScript. No C++ compilation or heavy FAISS binaries needed.
- **High Performance Local Database:** Fast SQLite persistence via `better-sqlite3`.
- **Dual Memory Engine:** Automatically classifies information into:
- **Semantic Facts:** Long-term durable user knowledge (profile, skills, preferences).
- **Episodic Bubbles:** Time-sensitive events, tasks, and deadlines with importance scoring.
- **Smart Contradiction Resolution:** LLM agent dynamically decides whether to `ADD`, `UPDATE`, `REPLACE`, `DELETE`, or `NOOP` incoming facts.
- **MMR (Maximum Marginal Relevance) Search:** Re-ranks query results for optimal relevance and diversity.
- **Batch & Cached Embeddings:** Built-in LRU cache and single-call batch embedding to minimize API latency and cost.
- **Resilient Auto-Retry:** Exponential backoff retry wrapper handles rate limits (429) and transient errors automatically.
- **Multi-Provider Support:** Plug-and-play support for **OpenAI** and **OpenRouter**.

---

## Installation

```bash
npm install adaptive-context-memory
```

---

## Quick Start

```typescript
import { configure, createTables, getDb, ContextMemory } from 'adaptive-context-memory';

// 1. Configure provider and model
configure({
  openrouterApiKey: process.env.OPENROUTER_API_KEY, // or openaiApiKey
  llmProvider: 'openrouter',
  llmModel: 'openai/gpt-4o-mini',
});

// 2. Initialize database schema
createTables();

// 3. Instantiate memory manager
const db = getDb();
const memory = new ContextMemory(db);

const CONVERSATION_ID = 1;

// 4. Extract and store memories from chat turns
await memory.add([
  { role: 'user', content: "My name is Prince and I'm a TypeScript developer." },
  { role: 'assistant', content: "Nice to meet you, Prince!" }
], CONVERSATION_ID);

// 5. Semantic MMR Search
const searchResult = await memory.search("what is the user's primary programming language?", CONVERSATION_ID);
console.log(searchResult.results);
```

---

## API Reference

### `configure(options: ContextMemoryConfig)`
Configures the global LLM provider, API keys, and embedding models.

### `createTables()`
Initializes SQLite database tables and index migrations.

### `memory.add(messages, conversationId)`
Extracts semantic facts and episodic bubbles from recent conversation turns, resolves contradictions, and saves to database & vector store.

### `memory.search(query, conversationId, options)`
Performs MMR-ranked semantic search. Options include:
- `limit?: number` (default 10)
- `mmrLambda?: number` (default 0.6; 0.0 = max diversity, 1.0 = max similarity)
- `category?: string` (filter by category: `'profile' | 'skill' | 'preference' | ...`)

### `memory.getAll(conversationId, category?)`
Lists all active memories for a conversation.

### `memory.getStats(conversationId)`
Returns total count, breakdown by type/category, and embedding cache hit rates.

### `memory.consolidate(conversationId)`
Scans for near-duplicate semantic facts and merges them into clean, concise facts via LLM.

### `memory.purgeOldBubbles(conversationId, olderThanDays)`
Soft-deletes episodic bubbles older than $N$ days (default 30 days).

---

## License

MIT
