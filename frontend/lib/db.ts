import fs from 'fs';
import path from 'path';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const HISTORY_FILE = path.join(DATA_DIR, 'history.json');

interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  created_at: string;
}

interface HistoryEntry {
  id: string;
  user_id: number;
  location: string;
  search_address: string;
  params: object;
  result: object;
  created_at: string;
}

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readUsers(): User[] {
  ensureDir();
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
}

function writeUsers(users: User[]) {
  ensureDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function readHistory(): HistoryEntry[] {
  ensureDir();
  if (!fs.existsSync(HISTORY_FILE)) return [];
  return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf-8'));
}

function writeHistory(history: HistoryEntry[]) {
  ensureDir();
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
}

export function getUserByEmail(email: string) {
  return readUsers().find(u => u.email === email) ?? null;
}

export function createUser(email: string, passwordHash: string, name: string) {
  const users = readUsers();
  const id = users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1;
  users.push({ id, email, password_hash: passwordHash, name, created_at: new Date().toISOString() });
  writeUsers(users);
  return { lastInsertRowid: id };
}

export function saveHistory(userId: number, id: string, location: string, searchAddress: string, params: object, result: object) {
  const history = readHistory();
  history.unshift({ id, user_id: userId, location, search_address: searchAddress, params, result, created_at: new Date().toISOString() });
  writeHistory(history.slice(0, 200));
}

export function getHistory(userId: number) {
  return readHistory()
    .filter(h => h.user_id === userId)
    .slice(0, 50);
}

export function deleteHistory(id: string, userId: number) {
  const history = readHistory().filter(h => !(h.id === id && h.user_id === userId));
  writeHistory(history);
}
