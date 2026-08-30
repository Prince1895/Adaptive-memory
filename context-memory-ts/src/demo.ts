/**
 * ContextMemory TypeScript Demo
 * ═══════════════════════════════════════════════════════════════
 *
 * Interactive CLI demo showing all ContextMemory features:
 *   - add()    → extracts semantic facts + episodic bubbles
 *   - search() → cosine similarity + recency/importance scoring
 *   - getAll() → list all stored memories
 *   - update() → re-embed and update a memory
 *   - delete() → soft-delete from DB + vector store
 *
 * Run: npx ts-node src/demo.ts
 * ═══════════════════════════════════════════════════════════════
 */

import * as readline from "readline";
import { configure, createTables, getDb, ContextMemory, getEmbeddingCacheStats } from "./index.js";
import type { MemoryRow } from "./db/database.js";

// ─── Config ─────────────────────────────────────────────────────────────────
configure({
  openrouterApiKey: process.env.OPENROUTER_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,
  llmProvider: process.env.OPENROUTER_API_KEY ? "openrouter" : "openai",
  llmModel: process.env.LLM_MODEL ?? "openai/gpt-4o-mini",
  embeddingModel: process.env.EMBEDDING_MODEL ?? "text-embedding-3-small",
  debug: process.env.DEBUG === "true",
});

createTables();
const db = getDb();
const mem = new ContextMemory(db);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const CYAN = "\x1b[36m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const RED = "\x1b[31m";

function log(msg: string) {
  console.log(msg);
}
function hr(char = "─") {
  log(DIM + char.repeat(60) + RESET);
}
function header(title: string) {
  hr("═");
  log(BOLD + CYAN + `  ${title}` + RESET);
  hr("═");
}

/** Ensure a conversation row exists and return its ID */
function ensureConversation(id?: number): number {
  if (id != null) {
    const exists = db.prepare("SELECT id FROM conversations WHERE id = ?").get(id);
    if (exists) return id;
  }
  const res = db.prepare("INSERT INTO conversations DEFAULT VALUES").run();
  const newId = res.lastInsertRowid as number;
  log(`${GREEN}✓ New conversation created — ID ${newId}${RESET}`);
  return newId;
}

// ─── Demo conversation state ─────────────────────────────────────────────────
let conversationId: number = ensureConversation();
let chatHistory: Array<{ role: "user" | "assistant"; content: string }> = [];
let lastAssistantReply = "";

// ─── Simulate a chat turn ────────────────────────────────────────────────────
async function simulateChatTurn(userInput: string) {
  // Build a minimal assistant reply for demo purposes
  const assistantReply = `[Assistant] Got it: "${userInput}"`;
  lastAssistantReply = assistantReply;

  chatHistory.push({ role: "user", content: userInput });
  chatHistory.push({ role: "assistant", content: assistantReply });

  log(`\n${YELLOW}📥 Processing conversation turn...${RESET}`);
  const result = await mem.add(chatHistory, conversationId);

  log(GREEN + "✓ Memory extraction complete:" + RESET);
  if (result.semantic.length > 0) {
    log(`  ${CYAN}Semantic facts (${result.semantic.length}):${RESET}`);
    result.semantic.forEach((f) => log(`    • ${f}`));
  }
  if (result.bubbles.length > 0) {
    log(`  ${YELLOW}Episodic bubbles (${result.bubbles.length}):${RESET}`);
    result.bubbles.forEach((b) => log(`    ◉ ${b}`));
  }
  if (result.semantic.length === 0 && result.bubbles.length === 0) {
    log(`  ${DIM}(Nothing extractable in this turn)${RESET}`);
  }
}

// ─── Commands ────────────────────────────────────────────────────────────────
async function handleSearch(query: string) {
  log(`\n${YELLOW}🔍 Searching for: "${query}"...${RESET}`);
  const res = await mem.search(query, conversationId, { limit: 10, mmrLambda: 0.6 });
  log(`${GREEN}Found ${res.total} result(s) [MMR-ranked]:${RESET}`);

  if (res.results.length === 0) {
    log(`  ${DIM}(no results)${RESET}`);
    return;
  }

  for (const r of res.results) {
    const typeColor =
      r.type === "semantic" ? CYAN : r.type === "bubble" ? YELLOW : DIM;
    log(`  ${typeColor}[${r.type}]${RESET} ${BOLD}${r.memory}${RESET}`);
    log(`      ID: ${r.memoryId} | score: ${r.score.toFixed(4)} | category: ${r.category ?? "—"}${r.occurredAt ? ` | at: ${r.occurredAt}` : ""}`);
  }
}

function handleList() {
  const memories = mem.getAll(conversationId);
  log(`\n${GREEN}All memories for conversation ${conversationId} (${memories.length} total):${RESET}`);
  if (memories.length === 0) {
    log(`  ${DIM}(none yet)${RESET}`);
    return;
  }
  for (const m of memories) {
    const typeColor = m.is_episodic ? YELLOW : CYAN;
    const typeLabel = m.is_episodic ? "bubble" : "semantic";
    log(`  ${typeColor}[${typeLabel}]${RESET} ${BOLD}ID ${m.id}${RESET} [${m.category ?? "?"}]: ${m.memory_text}`);
  }
}

async function handleUpdate(memoryId: number, newText: string) {
  log(`\n${YELLOW}✏️  Updating memory ${memoryId}...${RESET}`);
  await mem.update(memoryId, newText);
  log(`${GREEN}✓ Memory ${memoryId} updated.${RESET}`);
}

function handleStats() {
  const stats = mem.getStats(conversationId);
  log(`\n${GREEN}Memory stats for conversation ${conversationId}:${RESET}`);
  log(`  Total: ${BOLD}${stats.total}${RESET} | Semantic: ${CYAN}${stats.semantic}${RESET} | Bubbles: ${YELLOW}${stats.bubbles}${RESET}`);
  if (Object.keys(stats.byCategory).length > 0) {
    log(`  By category:`);
    for (const [cat, count] of Object.entries(stats.byCategory)) {
      log(`    ${CYAN}${cat}${RESET}: ${count}`);
    }
  }
  const cacheStats = getEmbeddingCacheStats();
  log(`  Embedding cache: ${cacheStats.size} entries | Hit rate: ${cacheStats.hitRate}`);
}

async function handleConsolidate() {
  log(`\n${YELLOW}🔧 Consolidating near-duplicate memories...${RESET}`);
  const count = await mem.consolidate(conversationId);
  if (count > 0) log(`${GREEN}✓ Merged ${count} redundant memories.${RESET}`);
  else log(`${DIM}(nothing to consolidate)${RESET}`);
}

function handlePurge(days: number) {
  const count = mem.purgeOldBubbles(conversationId, days);
  log(`${GREEN}✓ Purged ${count} bubble(s) older than ${days} days.${RESET}`);
}

function handleDelete(memoryId: number) {
  log(`\n${RED}🗑  Deleting memory ${memoryId}...${RESET}`);
  mem.delete(memoryId);
  log(`${GREEN}✓ Memory ${memoryId} deleted.${RESET}`);
}

function handleNewConversation() {
  conversationId = ensureConversation();
  chatHistory = [];
  log(`${GREEN}✓ Switched to conversation ${conversationId}${RESET}`);
}

function printHelp() {
  header("ContextMemory TypeScript v2 — Interactive Demo");
  log(`${CYAN}Commands:${RESET}`);
  log(`  ${BOLD}chat <message>${RESET}          — Extract memories from a user message`);
  log(`  ${BOLD}search <query>${RESET}          — MMR-ranked semantic search`);
  log(`  ${BOLD}list${RESET}                    — List all memories (with categories)`);
  log(`  ${BOLD}stats${RESET}                   — Show memory counts + cache hit rate`);
  log(`  ${BOLD}update <id> <text>${RESET}      — Update a memory by ID`);
  log(`  ${BOLD}delete <id>${RESET}             — Delete a memory by ID`);
  log(`  ${BOLD}consolidate${RESET}             — Merge near-duplicate memories via LLM`);
  log(`  ${BOLD}purge [days]${RESET}            — Purge episodic bubbles older than N days (default 30)`);
  log(`  ${BOLD}newconv${RESET}                 — Start a new conversation`);
  log(`  ${BOLD}help${RESET}                    — Show this help`);
  log(`  ${BOLD}exit${RESET}                    — Quit`);
  hr();
  log(`${DIM}Conversation ID: ${conversationId} | DB: ${getDb().name}${RESET}`);
  hr();
}

// ─── REPL ─────────────────────────────────────────────────────────────────────
async function main() {
  printHelp();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${BOLD}${CYAN}context-memory>${RESET} `,
  });

  rl.prompt();

  rl.on("line", async (line) => {
    rl.pause();
    const trimmed = line.trim();
    if (!trimmed) {
      rl.resume();
      rl.prompt();
      return;
    }

    const [cmd, ...rest] = trimmed.split(" ");
    const arg = rest.join(" ").trim();

    try {
      switch (cmd.toLowerCase()) {
        case "chat":
          if (!arg) { log(`${RED}Usage: chat <message>${RESET}`); break; }
          await simulateChatTurn(arg);
          break;

        case "search":
          if (!arg) { log(`${RED}Usage: search <query>${RESET}`); break; }
          await handleSearch(arg);
          break;

        case "list":
          handleList();
          break;

        case "update": {
          const parts = arg.split(" ");
          const id = parseInt(parts[0], 10);
          const newText = parts.slice(1).join(" ");
          if (isNaN(id) || !newText) {
            log(`${RED}Usage: update <id> <new text>${RESET}`);
            break;
          }
          await handleUpdate(id, newText);
          break;
        }

        case "delete": {
          const id = parseInt(arg, 10);
          if (isNaN(id)) { log(`${RED}Usage: delete <id>${RESET}`); break; }
          handleDelete(id);
          break;
        }

        case "stats":
          handleStats();
          break;

        case "consolidate":
          await handleConsolidate();
          break;

        case "purge": {
          const days = arg ? parseInt(arg, 10) : 30;
          handlePurge(isNaN(days) ? 30 : days);
          break;
        }

        case "newconv":
          handleNewConversation();
          break;

        case "help":
          printHelp();
          break;

        case "exit":
        case "quit":
          log(GREEN + "Bye! 👋" + RESET);
          rl.close();
          process.exit(0);
          break;

        default:
          log(`${RED}Unknown command: ${cmd}. Type 'help' for available commands.${RESET}`);
      }
    } catch (err) {
      log(`${RED}Error: ${(err as Error).message}${RESET}`);
    } finally {
      rl.resume();
      rl.prompt();
    }
  });
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
