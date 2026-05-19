import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'hotelscope.db');

let db: Database.Database;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema(db);
  }
  return db;
}

function initSchema(database: Database.Database) {
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS survey_history (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      location TEXT NOT NULL,
      search_address TEXT,
      params TEXT NOT NULL,
      result TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);
}

export function getUserByEmail(email: string) {
  return getDb().prepare('SELECT * FROM users WHERE email = ?').get(email) as any;
}

export function createUser(email: string, passwordHash: string, name: string) {
  return getDb().prepare(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
  ).run(email, passwordHash, name);
}

export function saveHistory(userId: number, id: string, location: string, searchAddress: string, params: object, result: object) {
  return getDb().prepare(
    'INSERT INTO survey_history (id, user_id, location, search_address, params, result) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, userId, location, searchAddress, JSON.stringify(params), JSON.stringify(result));
}

export function getHistory(userId: number) {
  const rows = getDb().prepare(
    'SELECT * FROM survey_history WHERE user_id = ? ORDER BY created_at DESC LIMIT 50'
  ).all(userId) as any[];
  return rows.map(r => ({
    ...r,
    params: JSON.parse(r.params),
    result: JSON.parse(r.result),
  }));
}

export function deleteHistory(id: string, userId: number) {
  return getDb().prepare('DELETE FROM survey_history WHERE id = ? AND user_id = ?').run(id, userId);
}
