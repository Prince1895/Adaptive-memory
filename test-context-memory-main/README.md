# adaptive-context-memory & Full-Stack AI App

A production-ready, pure **TypeScript/Node.js** long-term memory system for AI agents and full-stack web applications.

`adaptive-context-memory` extracts, stores, and retrieves important context from conversations, enabling AI Agents to remember user preferences, context, and history across sessions. It supports both **semantic facts** (long-term truths) and **episodic bubbles** (time-bound moments), with built-in **MMR (Maximal Marginal Relevance)** vector search and automated state-change resolution.

---

## 📦 Package Installation (NPM)

```bash
npm install adaptive-context-memory
```

---

## ⚡ Quick Start (TypeScript / Node.js)

```typescript
import { configure, createTables, getDb, ContextMemory } from "adaptive-context-memory";

// 1. Configure the package
configure({
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  llmProvider: "openrouter",
  llmModel: "openai/gpt-4o-mini",
  embeddingModel: "text-embedding-3-small"
});

// 2. Initialize database & store
createTables();
const db = getDb();
const memory = new ContextMemory(db);

// 3. Extract & Add Memories from a conversation turn
const result = await memory.add(
  [
    { role: "user", content: "Hi! I am Prince and I develop TypeScript apps with SQLite." }
  ],
  1 // conversationId
);

console.log(result);
// { semantic: ['User is named Prince', 'User develops TypeScript apps with SQLite'], bubbles: [] }

// 4. Perform MMR Vector Search
const searchResponse = await memory.search("What tech stack does the user use?", 1, { limit: 5 });
console.log(searchResponse.results);
```

---

## 🚀 Running the Full-Stack Web Application

The project includes an **Express REST API Backend** and a **Next.js 15 Web Dashboard** with real-time D3 memory graph visualization and interactive system flow animations.

### 1. Start Express Server (Port 8000)

```bash
cd server
npm install
npm run dev
```

### 2. Start Next.js Frontend (Port 3000)

```bash
cd web
npm install
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 🌟 Key Features

- **Zero Heavy Dependencies**: Uses pure JS vector engine & `better-sqlite3` storage.
- **Dual Memory Architecture**: Semantic Facts vs. Episodic Bubbles.
- **MMR Vector Search**: Balances similarity with information diversity ($\lambda=0.5$).
- **State-Change Resolution**: Automatically detects negations (e.g. *"stopped using X"*) and updates/deletes stale facts.
- **D3 Interactive Memory Graph**: Visualizes memory nodes and connection webs in real-time.

---

## 📜 License

MIT
