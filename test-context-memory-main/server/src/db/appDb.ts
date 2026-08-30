import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import os from "os";

const appDbDir = path.join(os.homedir(), ".contextmemory");
if (!fs.existsSync(appDbDir)) {
  fs.mkdirSync(appDbDir, { recursive: true });
}

export const appDb = new Database(path.join(appDbDir, "app_users.db"));

// Inspect users table schema and recreate if old INTEGER id exists
try {
  const columns = appDb.pragma("table_info(users)") as Array<{ name: string; type: string }>;
  const idCol = columns.find((c) => c.name === "id");
  if (idCol && idCol.type.toUpperCase() === "INTEGER") {
    appDb.exec("DROP TABLE IF EXISTS messages");
    appDb.exec("DROP TABLE IF EXISTS conversations");
    appDb.exec("DROP TABLE IF EXISTS users");
  }
} catch (e) {
  // Table doesn't exist yet
}

appDb.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  );
`);

try {
  appDb.exec("ALTER TABLE users ADD COLUMN api_key TEXT;");
} catch (e) {
  // Column already exists
}
