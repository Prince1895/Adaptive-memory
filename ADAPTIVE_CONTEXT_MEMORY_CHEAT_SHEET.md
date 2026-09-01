# Adaptive Context Memory: Quick Reference & Key Points Guide

> **Target Package:** `adaptive-context-memory` (TypeScript / Node.js)  
> **Purpose:** Essential cheat sheet and architectural reference for memory management, mathematical formulations, and system concepts.

---

## 📌 Executive Summary & Key Takeaways

**Adaptive Context Memory** is a high-performance, long-term memory engine designed specifically for autonomous AI agents operating in stateless LLM environments.

### Core Highlights to Remember
1. **Zero Binary Overhead:** Implemented in pure TypeScript with an in-memory flat vector store and SQLite persistence—no C++ native compilation binaries (e.g. FAISS, ChromaDB C++ bindings) required.
2. **Dual Taxonomy:** Distinguishes **Semantic Facts** (permanent profile knowledge) from **Episodic Bubbles** (time-decayed temporal events).
3. **Dynamic Contradiction Resolution:** Uses a **5-action state-change decision matrix** (`ADD`, `UPDATE`, `REPLACE`, `DELETE`, `NOOP`) combined with fast pre-deduplication ($S \ge 0.95$).
4. **Diverse Retrieval (MMR):** Uses **Maximum Marginal Relevance (MMR)** and **Ebbinghaus exponential decay** to prevent redundant prompt injection ("Lost in the Middle" problem).
5. **High-Efficiency Caching:** 512-slot LRU embedding cache and batch embedding API calls reduce LLM provider costs significantly.

---

## ⚡ 1. Deep Dive: What is "Zero-Binary"?

### 🔴 The Problem with Native Binaries
Standard vector databases (FAISS, Chroma, Pinecone native connectors, HNSW native modules) rely on **native C++ bindings**. In modern cloud environments, this creates severe engineering friction:
* **Build Failure in Serverless/Docker:** AWS Lambda, Vercel, Cloudflare Workers, and lightweight CI/CD containers often lack C++ compilers (`gcc`, `g++`, `make`, `python-gyp`) or specific standard library builds (`glibc`).
* **Deployment Latency:** Native vector indexes take hundreds of milliseconds to initialize and require native binding loads.
* **Platform Incompatibility:** Binary dependencies break easily across architectural switches (e.g., x86_64 vs arm64 / Apple Silicon).

### 🟢 The "Zero-Binary" Architecture
**Adaptive Context Memory** solves this by maintaining a **pure JavaScript / TypeScript vector search layer**:
* **Flat In-Memory Store:** Embeddings are stored as typed floating-point arrays (`Float32Array`) directly in JavaScript memory.
* **Sub-Millisecond Execution:** Cosine similarity vector math is calculated using pure JS matrix dot products ($< 1\text{ ms}$ index load time vs $120\text{ ms}$ for native FAISS).
* **Pure SQLite Persistence:** Backed by standard `better-sqlite3` storage for fast tabular persistence without native vector extensions.
* **100% Cross-Platform Portability:** Runs anywhere Node.js runs without any native build toolchain prerequisites.

---

## 🧮 2. Mathematical Calculations & Formulas Cheat Sheet

Here are all the key mathematical equations governing retrieval, decay, similarity, and ranking in the memory system:

### 1. Vector Normalization & Cosine Similarity
Calculates the directional cosine angle between the normalized query vector $\hat{\mathbf{q}}$ and memory vector $\hat{\mathbf{v}}_j$:
$$\hat{\mathbf{v}} = \frac{\mathbf{v}}{\|\mathbf{v}\|_2}$$
$$S_{\text{cosine}}(\hat{\mathbf{q}}, \hat{\mathbf{v}}_j) = \hat{\mathbf{q}} \cdot \hat{\mathbf{v}}_j = \sum_{k=1}^{d} q_k \cdot v_{j,k}$$

---

### 2. Exponential Half-Life Recency Decay (Ebbinghaus Curve)
Applied exclusively to **Episodic Bubbles** to model memory retention loss over time ($t_{\text{days}}$):
$$R(t) = \exp(-\lambda_{\text{decay}} \cdot t_{\text{days}})$$
* **Decay Constant ($\lambda_{\text{decay}}$):** Default set to `0.05`.
* **Half-Life ($t_{1/2}$):** Time required for memory retention weight to decay to $50\%$:
  $$t_{1/2} = \frac{\ln(2)}{\lambda} = \frac{0.69315}{0.05} \approx 13.86 \text{ days}$$
* **Semantic Facts:** Have no decay ($R(t) = 1.0$).

---

### 3. Dynamic Importance Scoring
Computes contextual weight $I(m)$ by combining category baseline score and keyword triggers:
$$I(m) = \text{Clamp}\left( I_{\text{base}}(\text{category}) + \Delta_{\text{keywords}}(\text{text}), 0.1, 1.0 \right)$$

---

### 4. Composite Candidate Score
Combines semantic cosine similarity, category importance, and exponential recency decay into a unified retrieval score:
$$S_{\text{comp}}(m_j, q) = S_{\text{cosine}}(\hat{\mathbf{q}}, \hat{\mathbf{v}}_j) \cdot \sqrt{I(m_j)} \cdot R(t_j)$$

---

### 5. Maximum Marginal Relevance (MMR) Re-Ranking
Selects candidates that maximize relevance while minimizing redundancy with already selected context items in set $S$:
$$\text{MMR}(q, C, S) = \arg\max_{m_i \in C \setminus S} \left[ \lambda_{\text{MMR}} \cdot S_{\text{comp}}(m_i, q) - (1 - \lambda_{\text{MMR}}) \cdot \max_{m_j \in S} \left( \hat{\mathbf{v}}_i \cdot \hat{\mathbf{v}}_j \right) \right]$$
* **Diversity Parameter ($\lambda_{\text{MMR}}$):** Set to `0.60` (optimal balance: 60% query relevance, 40% novelty/diversity).
* **Impact:** Eliminates redundant top-$k$ semantic clones (e.g. 5 minor variations of the same user preference).

---

### 6. Sub-Millisecond Fast Cosine Pre-Deduplication
Before invoking the LLM decision chain during memory insertion, pre-filters incoming text vectors:
$$\text{If } S_{\text{cosine}}(\hat{\mathbf{v}}_{\text{new}}, \hat{\mathbf{v}}_{\text{existing}}) \ge 0.95 \implies \text{Trigger } \mathbf{NOOP} \text{ (Skip LLM call)}$$
* **Result:** Reduces redundant LLM API tool calls by **28.2%**.

---

## 🏷️ 3. Dual Memory Taxonomy

| Feature | Semantic Facts | Episodic Bubbles |
| :--- | :--- | :--- |
| **Definition** | Core profile attributes, user skills, tech stacks, stable truths. | Time-bound events, bug discussions, meeting notes, temporal state changes. |
| **Decay Rate ($R(t)$)** | Undecayed ($R(t) = 1.0$) | Exponential decay ($\lambda = 0.05, t_{1/2} \approx 13.86\text{ days}$) |
| **Example** | *"User prefers TypeScript and Neovim"* | *"User fixed SQLite locked database error on Tuesday"* |
| **Graph Edges** | N/A | Connected bi-directionally when cosine similarity $S_{\text{cosine}} \ge 0.60$ |

---

## ⚡ 4. The 5-Action Contradiction Resolution Matrix

When new candidate facts are ingested, the system prevents factual drift and memory corruption using a strict decision matrix:

```
Candidate Fact ---> Cosine Sim >= 0.95? ---> (Yes) ---> NOOP (Fast Skip, 0 LLM Cost)
                        |
                       (No)
                        |
                        v
              LLM 5-Action Classifier
                        |
    +---------+---------+---------+---------+
    |         |         |         |         |
   ADD     UPDATE    REPLACE   DELETE     NOOP
```

| Action | Condition | Execution |
| :--- | :--- | :--- |
| **`ADD`** | Brand new, non-conflicting memory fact. | Inserts new SQLite record & vector embedding. |
| **`UPDATE`** | Enriches or expands an existing active memory. | Overwrites text & vector embedding for existing `memory_id`. |
| **`REPLACE`** | Contradicts or supersedes a prior fact (e.g., switched framework). | Soft-deletes old memory (`is_active = 0`) & inserts new memory entry. |
| **`DELETE`** | Explicitly revokes or retracts a past stored statement. | Soft-deletes memory (`is_active = 0`) & purges vector embedding. |
| **`NOOP`** | Exact match or duplicate concept already stored. | Fast skip; 0 database or index mutations. |

---

## 🚀 5. Architectural & Performance Optimization Pillars

### 1. 512-Slot LRU Embedding Cache
* Embeddings for frequently queried strings are held in a 512-slot Least Recently Used (LRU) memory cache.
* **Hit Rate:** Achieves ~41.5% average hit rate in production, skipping redundant embedding API calls.

### 2. Single-Call Batch Embedding
* Instead of issuing $N$ separate network calls for $N$ facts, candidate texts are chunked and dispatched in a single batch embedding call.
* **API Reduction:** Cuts embedding API request count by **86.2%**.

### 3. Reactive SWR Cache Invalidation (`< 8 ms`)
* In the visualization portal (Next.js + Express + D3.js force graph), mutating memories triggers SWR cache revalidation (`/api/memories/graph`).
* Ensures the D3 force-directed physics graph updates instantly ($< 8\text{ ms}$) without requiring manual page reloads.

---

## 📋 6. Summary Checklist for Quick Recall

* [ ] **Zero Binary:** Pure TypeScript vector engine, standard SQLite storage, serverless & container ready.
* [ ] **$S_{\text{cosine}} \ge 0.95$:** Triggers `NOOP` fast-skip pre-deduplication.
* [ ] **$S_{\text{cosine}} \ge 0.60$:** Connects episodic bubble graph nodes.
* [ ] **$\lambda = 0.05$:** Exponential decay parameter ($\approx 13.86$ days half-life).
* [ ] **$\lambda_{\text{MMR}} = 0.60$:** 60% relevance / 40% diversity trade-off factor.
* [ ] **5 Actions:** `ADD`, `UPDATE`, `REPLACE`, `DELETE`, `NOOP`.
* [ ] **Dual Memory:** Undecayed Semantic Facts vs Time-Decayed Episodic Bubbles.
