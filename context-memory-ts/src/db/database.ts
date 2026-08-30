/**
 * SQLite Database — TypeScript port using better-sqlite3 + Drizzle ORM schema.
 *
 * Tables:
 *   conversations         — one row per conversation
 *   messages              — chat turns (user / assistant)
 *   conversation_summary  — rolling LLM-generated summary
 *   memories              — semantic & episodic memory facts
 */

import Database from "better-sqlite3";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";
import { getSettings } from "../core/settings.js";

// ─── Singleton DB handle ────────────────────────────────────────────────────
let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    const s = getSettings();
    const dbPath = s.getDatabaseUrl(); // returns an absolute file path
    const dir = path.dirname(dbPath);
    fs.mkdirSync(dir, { recursive: true });
    _db = new Database(dbPath);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    if (s.debug) console.log(`[ContextMemory] DB connected: ${dbPath}`);
  }
  return _db;
}

/** Close and reset the DB connection (useful for testing) */
export function resetDb(): void {
  if (_db) {
    _db.close();
    _db = null;
  }
}

// ─── Schema bootstrap ───────────────────────────────────────────────────────
export function createTables(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      sender          TEXT    NOT NULL CHECK(sender IN ('user', 'assistant')),
      message_text    TEXT    NOT NULL,
      timestamp       TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS conversation_summary (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      summary_text    TEXT,
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS memories (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      memory_text     TEXT    NOT NULL,
      category        TEXT,
      embedding       TEXT,
      memory_metadata TEXT    DEFAULT '{}',
      is_episodic     INTEGER NOT NULL DEFAULT 0,
      occurred_at     TEXT,
      session_id      INTEGER,
      importance      REAL    NOT NULL DEFAULT 0.5,
      is_active       INTEGER NOT NULL DEFAULT 1,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_memories_conv     ON memories(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
    CREATE INDEX IF NOT EXISTS idx_memories_active   ON memories(is_active);
    CREATE INDEX IF NOT EXISTS idx_messages_conv     ON messages(conversation_id);
  `);

  // Migration: add category column to existing DBs that don't have it
  try {
    db.exec(`ALTER TABLE memories ADD COLUMN category TEXT`);
  } catch {
    // Column already exists — ignore
  }

  if (getSettings().debug) console.log("[ContextMemory] Tables ready.");
}

// ─── Typed row interfaces ────────────────────────────────────────────────────
export interface ConversationRow {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface MessageRow {
  id: number;
  conversation_id: number;
  sender: "user" | "assistant";
  message_text: string;
  timestamp: string;
}

export interface SummaryRow {
  id: number;
  conversation_id: number;
  summary_text: string | null;
  updated_at: string;
}

export interface MemoryRow {
  id: number;
  conversation_id: number;
  memory_text: string;
  category: string | null;          // e.g. 'profile'|'skill'|'preference'|...
  embedding: string | null;         // JSON stringified number[]
  memory_metadata: string | null;   // JSON stringified object
  is_episodic: number;              // 0 or 1
  occurred_at: string | null;
  session_id: number | null;
  importance: number;
  is_active: number;                // 0 or 1
  created_at: string;
  updated_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
export function parseEmbedding(row: MemoryRow): number[] | null {
  if (!row.embedding) return null;
  try { return JSON.parse(row.embedding) as number[]; } catch { return null; }
}

export function parseMeta(row: MemoryRow): Record<string, unknown> {
  if (!row.memory_metadata) return {};
  try { return JSON.parse(row.memory_metadata) as Record<string, unknown>; } catch { return {}; }
}
