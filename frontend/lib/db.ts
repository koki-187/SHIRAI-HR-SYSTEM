/**
 * lib/db.ts — DB アダプター
 * DATABASE_URL が設定されていれば Neon (PostgreSQL)、
 * 設定されていなければ SQLite (better-sqlite3) によるローカル永続化を使用する。
 *
 * 動的 import により、使用しないアダプターのネイティブモジュールは
 * バンドルにも require にも含まれない（Vercel/Edge 環境との共存が可能）。
 */

import type * as SqliteAdapter from './db-sqlite';

type Adapter = typeof SqliteAdapter;

let _adapter: Adapter | null = null;

async function adapter(): Promise<Adapter> {
  if (_adapter) return _adapter;
  _adapter = process.env.DATABASE_URL
    ? ((await import('./db-neon')) as unknown as Adapter)
    : await import('./db-sqlite');
  return _adapter;
}

// toAreaKey は純粋関数で両アダプター同一実装 — 直接エクスポート
export function toAreaKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

export async function initSchema()            { return (await adapter()).initSchema(); }
export async function getUserByEmail(email: string)  { return (await adapter()).getUserByEmail(email); }
export async function createUser(email: string, passwordHash: string, name: string) { return (await adapter()).createUser(email, passwordHash, name); }
export async function getAllUsers()           { return (await adapter()).getAllUsers(); }
export async function setUserActive(userId: number, active: boolean) { return (await adapter()).setUserActive(userId, active); }
export async function deleteUser(userId: number) { return (await adapter()).deleteUser(userId); }
export async function updateGeminiKey(userId: number, encryptedKey: string | null) { return (await adapter()).updateGeminiKey(userId, encryptedKey); }
export async function getGeminiKey(userId: number) { return (await adapter()).getGeminiKey(userId); }
export async function saveHistory(userId: number, id: string, location: string, searchAddress: string, params: object, result: object) { return (await adapter()).saveHistory(userId, id, location, searchAddress, params, result); }
export async function getHistory(userId: number) { return (await adapter()).getHistory(userId); }
export async function deleteHistory(id: string, userId: number) { return (await adapter()).deleteHistory(id, userId); }
export async function saveSnapshot(params: Parameters<Adapter['saveSnapshot']>[0]) { return (await adapter()).saveSnapshot(params); }
export async function bulkInsertSnapshots(rows: Parameters<Adapter['bulkInsertSnapshots']>[0]) { return (await adapter()).bulkInsertSnapshots(rows); }
export async function getSnapshots(areaKey: string, months?: number) { return (await adapter()).getSnapshots(areaKey, months); }
export async function getSnapshotCount(areaKey: string) { return (await adapter()).getSnapshotCount(areaKey); }
export async function saveHotelPrice(params: Parameters<Adapter['saveHotelPrice']>[0]) { return (await adapter()).saveHotelPrice(params); }
export async function getHotelPriceCalendar(areaKey: string, weeksAhead?: number) { return (await adapter()).getHotelPriceCalendar(areaKey, weeksAhead); }
export async function getAnnualADRReport(areaKey: string) { return (await adapter()).getAnnualADRReport(areaKey); }
