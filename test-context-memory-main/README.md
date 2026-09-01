# adaptive-context-memory & Full-Stack AI Testing Portal

[![npm version](https://img.shields.io/npm/v/adaptive-context-memory.svg?color=amber)](https://www.npmjs.com/package/adaptive-context-memory)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0%2B-blue)](https://www.typescriptlang.org/)

A production-ready, high-performance, **zero-binary pure TypeScript/Node.js** long-term adaptive memory system for autonomous AI agents and full-stack web applications.

`adaptive-context-memory` extracts, maintains, and retrieves contextual memory from multi-turn agent conversations. It manages **Semantic Facts** (permanent user attributes) and **Episodic Bubbles** (time-sensitive events with exponential decay), featuring **Maximal Marginal Relevance (MMR)** vector re-ranking, sub-millisecond fast pre-deduplication, and an automated **5-action state-change decision matrix**.

---

## ⚡ Key Technical Innovations

1. **Zero Native C++ Binaries:** Operates entirely in pure JavaScript with typed `Float32Array` in-memory vector indexing and standard SQLite (`better-sqlite3`) persistence—zero `cmake`, `gcc`, or native binding dependencies required for serverless/Docker environments.
2. **Dual Memory Taxonomy:**
   - **Semantic Facts:** Permanent user knowledge ($R(t) = 1.0$).
   - **Episodic Bubbles:** Transient events with exponential half-life decay ($R(t) = e^{-\lambda t}, \lambda = 0.05 \implies t_{1/2} \approx 13.86\text{ days}$).
3. **5-Action Contradiction Resolution:** Employs an LLM decision matrix (`ADD`, `UPDATE`, `REPLACE`, `DELETE`, `NOOP`) paired with fast cosine pre-deduplication ($S_{\text{cosine}} \ge 0.95$) to prevent factual drift and hallucinations.
4. **MMR Retrieval Engine:** Maximal Marginal Relevance ($\lambda_{\text{MMR}} = 0.60$) balances cosine similarity with candidate diversity to solve the "Lost in the Middle" attention degradation issue.
5. **High-Performance Caching:** Built-in 512-slot LRU embedding cache and automatic batch embedding dispatch reduce LLM API network overhead by up to $86.2\%$.

---

## 🏗️ End-to-End System Workflow

```
+-----------------------------------------------------------------------------------+
|                              SYSTEM EXECUTION FLOW                                |
+-----------------------------------------------------------------------------------+
  User & Agent Turn
        │
        ▼
  [ Extraction Engine ]  ──►  Extract Atomic Candidates & Identify Temporal Events
        │
        ▼
  [ Fast Cosine Pre-Dedup ] ──(S >= 0.95)──► NOOP (Skip LLM call & DB Mutation)
        │ (S < 0.95)
        ▼
  [ 5-Action Directive Classifier ] ──► ADD | UPDATE | REPLACE | DELETE | NOOP
        │
        ▼
  [ Vector Store & SQLite Mutation ] ──► Update Typed Vector Arrays & Database Rows
        │
        ▼
  [ MMR Vector Search Engine ] ──► Normalized Cosine * Recency Decay * Importance
        │                           Re-ranked via Maximal Marginal Relevance (lambda=0.60)
        ▼
  [ Prompt Context Injection ] ──► Diverse, Compact Context Injected into Agent Prompt
```

---

## 🧮 Mathematical Formulas & Calculations

### 1. Vector Normalization & Cosine Similarity
$$\hat{\mathbf{v}} = \frac{\mathbf{v}}{\|\mathbf{v}\|_2}, \quad S_{\text{cosine}}(\hat{\mathbf{q}}, \hat{\mathbf{v}}_j) = \hat{\mathbf{q}} \cdot \hat{\mathbf{v}}_j = \sum_{k=1}^{d} q_k \cdot v_{j,k}$$

### 2. Exponential Half-Life Recency Decay (Episodic Memory)
$$R(t) = \exp(-\lambda_{\text{decay}} \cdot t_{\text{days}}) \quad (\lambda = 0.05 \implies t_{1/2} \approx 13.86\text{ days})$$

### 3. Dynamic Importance & Composite Candidate Score
$$I(m) = \text{Clamp}\left( I_{\text{base}}(\text{category}) + \Delta_{\text{keywords}}(\text{text}), 0.1, 1.0 \right)$$
$$S_{\text{comp}}(m_j, q) = S_{\text{cosine}}(\hat{\mathbf{q}}, \hat{\mathbf{v}}_j) \cdot \sqrt{I(m_j)} \cdot R(t_j)$$

### 4. Maximum Marginal Relevance (MMR) Re-Ranking
$$\text{MMR}(q, C, S) = \arg\max_{m_i \in C \setminus S} \left[ \lambda_{\text{MMR}} \cdot S_{\text{comp}}(m_i, q) - (1 - \lambda_{\text{MMR}}) \cdot \max_{m_j \in S} \left( \hat{\mathbf{v}}_i \cdot \hat{\mathbf{v}}_j \right) \right]$$

---

## 📦 Package Installation

```bash
npm install adaptive-context-memory
```

---

## ⚡ Quick Start (TypeScript / Node.js)

```typescript
import { configure, createTables, getDb, ContextMemory } from "adaptive-context-memory";

// 1. Configure the LLM provider and models
configure({
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  llmProvider: "openrouter",
  llmModel: "openai/gpt-4o-mini",
  embeddingModel: "text-embedding-3-small",
});

// 2. Initialize database schema
createTables();
const db = getDb();
const memory = new ContextMemory(db);

// 3. Extract & ingest conversation turn
const result = await memory.add(
  [
    { role: "user", content: "Hi! My name is Prince and I build TypeScript memory tools with SQLite." },
    { role: "assistant", content: "Great to meet you Prince! AI memory engines are crucial for agent systems." }
  ],
  1 // conversationId
);

console.log("Ingested Memories:", result);
// { semantic: ["User's name is Prince", "User builds TypeScript memory tools with SQLite"], bubbles: [] }

// 4. Perform MMR Vector Search
const searchResponse = await memory.search("What tech stack does the user use?", 1, { limit: 5 });
console.log("Retrieved Context:", searchResponse.results);
```

---

## 🚀 Running the Full-Stack Application

The repository includes a complete testing portal with an **Express REST API Backend** and a **Next.js 15 Web Visualizer** with interactive D3 force-directed physics graphs.

### 1. Start Express API Backend (Port 8000)

```bash
cd server
npm install
npm run dev
```

### 2. Start Next.js Frontend Dashboard (Port 3000)

```bash
cd web
npm install
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser!

---

## 📜 License

MIT © [Prince Kumar](https://github.com/Prince1895)

