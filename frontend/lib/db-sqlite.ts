/**
 * db-sqlite.ts — JSON ファイルストア実装
 * DATABASE_URL が未設定の場合に使用するローカル永続化アダプター。
 * データは <project-root>/data/hotelscope.json に保存される。
 */

import fs from 'fs';
import path from 'path';

// ── 型定義 ──

interface UserRow {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  role: string;
  active: boolean;
  gemini_api_key_enc: string | null;
  created_at: string;
}

interface HistoryRow {
  id: string;
  user_id: number;
  location: string;
  search_address: string;
  params: object;
  result: object;
  created_at: string;
}

interface PriceSnapshotRow {
  id: number;
  area_key: string;
  area_name: string;
  survey_date: string;
  avg_adr: number;
  min_adr: number;
  max_adr: number;
  weekday_avg: number;
  weekend_avg: number;
  peak_avg: number | null;
  hotel_count: number;
  data_source: string;
  checkin_date: string | null;
  ota_source: string | null;
  created_at: string;
}

interface HotelPriceRow {
  id: number;
  hotel_name: string;
  area_key: string;
  ota_source: string;
  checkin_date: string;
  query_date: string;
  price: number;
  rating: number | null;
  lat: number | null;
  lng: number | null;
  created_at: string;
}

interface DbData {
  users: UserRow[];
  history: HistoryRow[];
  price_snapshots: PriceSnapshotRow[];
  hotel_prices: HotelPriceRow[];
}

// ── ファイル I/O ──

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'hotelscope.json');

function readDb(): DbData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    const initial: DbData = { users: [], history: [], price_snapshots: [], hotel_prices: [] };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
    return initial;
  }
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as DbData;
}

function writeDb(data: DbData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function nowIso(): string {
  return new Date().toISOString();
}

// ── スキーマ初期化（JSON ストアはファイル作成のみ） ──

export async function initSchema(): Promise<void> {
  readDb();
}

// ── Area key helper ──

export function toAreaKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

// ── ユーザー関連 ──

export async function getUserByEmail(email: string): Promise<UserRow | null> {
  const db = readDb();
  return db.users.find((u) => u.email === email) ?? null;
}

export async function createUser(
  email: string,
  passwordHash: string,
  name: string,
): Promise<{ lastInsertRowid: number }> {
  const db = readDb();
  const id = db.users.length > 0 ? Math.max(...db.users.map((u) => u.id)) + 1 : 1;
  const newUser: UserRow = {
    id,
    email,
    password_hash: passwordHash,
    name,
    role: 'user',
    active: true,
    gemini_api_key_enc: null,
    created_at: nowIso(),
  };
  db.users.push(newUser);
  writeDb(db);
  return { lastInsertRowid: id };
}

export async function getAllUsers(): Promise<Array<UserRow & { history_count: number }>> {
  const db = readDb();
  return db.users
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .map((u) => ({
      ...u,
      history_count: db.history.filter((h) => h.user_id === u.id).length,
    }));
}

export async function setUserActive(userId: number, active: boolean): Promise<void> {
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (user) {
    user.active = active;
    writeDb(db);
  }
}

export async function deleteUser(userId: number): Promise<void> {
  const db = readDb();
  db.users = db.users.filter((u) => u.id !== userId);
  db.history = db.history.filter((h) => h.user_id !== userId);
  writeDb(db);
}

export async function updateGeminiKey(userId: number, encryptedKey: string | null): Promise<void> {
  const db = readDb();
  const user = db.users.find((u) => u.id === userId);
  if (user) {
    user.gemini_api_key_enc = encryptedKey;
    writeDb(db);
  }
}

export async function getGeminiKey(userId: number): Promise<string | null> {
  const db = readDb();
  return db.users.find((u) => u.id === userId)?.gemini_api_key_enc ?? null;
}

// ── 履歴関連 ──

export async function saveHistory(
  userId: number,
  id: string,
  location: string,
  searchAddress: string,
  params: object,
  result: object,
): Promise<void> {
  const db = readDb();
  const idx = db.history.findIndex((h) => h.id === id);
  const now = nowIso();

  if (idx >= 0) {
    db.history[idx] = { id, user_id: userId, location, search_address: searchAddress, params, result, created_at: now };
  } else {
    db.history.push({ id, user_id: userId, location, search_address: searchAddress, params, result, created_at: now });
  }

  // ユーザーごと 50 件制限
  const userHistory = db.history
    .filter((h) => h.user_id === userId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

  if (userHistory.length > 50) {
    const toDelete = new Set(userHistory.slice(50).map((h) => h.id));
    db.history = db.history.filter((h) => !toDelete.has(h.id));
  }

  writeDb(db);
}

export async function getHistory(userId: number): Promise<HistoryRow[]> {
  const db = readDb();
  return db.history
    .filter((h) => h.user_id === userId)
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
    .slice(0, 50);
}

export async function deleteHistory(id: string, userId: number): Promise<void> {
  const db = readDb();
  db.history = db.history.filter((h) => !(h.id === id && h.user_id === userId));
  writeDb(db);
}

// ── 価格スナップショット関連 ──

export async function saveSnapshot(params: {
  areaKey: string;
  areaName: string;
  surveyDate: string;
  avgAdr: number;
  minAdr: number;
  maxAdr: number;
  weekdayAvg: number;
  weekendAvg: number;
  peakAvg: number | null;
  hotelCount: number;
  dataSource: string;
  checkinDate?: string | null;
  otaSource?: string | null;
}): Promise<void> {
  const db = readDb();
  const idx = db.price_snapshots.findIndex(
    (s) => s.area_key === params.areaKey && s.survey_date === params.surveyDate,
  );
  const now = nowIso();
  const row: PriceSnapshotRow = {
    id: idx >= 0
      ? db.price_snapshots[idx].id
      : (db.price_snapshots.length > 0 ? Math.max(...db.price_snapshots.map((s) => s.id)) + 1 : 1),
    area_key: params.areaKey,
    area_name: params.areaName,
    survey_date: params.surveyDate,
    avg_adr: params.avgAdr,
    min_adr: params.minAdr,
    max_adr: params.maxAdr,
    weekday_avg: params.weekdayAvg,
    weekend_avg: params.weekendAvg,
    peak_avg: params.peakAvg ?? null,
    hotel_count: params.hotelCount,
    data_source: params.dataSource,
    checkin_date: params.checkinDate ?? null,
    ota_source: params.otaSource ?? params.dataSource,
    created_at: now,
  };

  if (idx >= 0) {
    db.price_snapshots[idx] = row;
  } else {
    db.price_snapshots.push(row);
  }
  writeDb(db);
}

export async function bulkInsertSnapshots(rows: Array<{
  area_key: string; area_name: string; survey_date: string;
  avg_adr: number; min_adr: number; max_adr: number;
  weekday_avg: number; weekend_avg: number; peak_avg: number | null;
  hotel_count: number; data_source: string;
  checkin_date?: string | null;
  ota_source?: string | null;
}>): Promise<void> {
  if (rows.length === 0) return;
  const db = readDb();
  const now = nowIso();
  let nextId = db.price_snapshots.length > 0
    ? Math.max(...db.price_snapshots.map((s) => s.id)) + 1
    : 1;

  for (const r of rows) {
    const exists = db.price_snapshots.some(
      (s) => s.area_key === r.area_key && s.survey_date === r.survey_date,
    );
    if (!exists) {
      db.price_snapshots.push({
        id: nextId++,
        area_key: r.area_key,
        area_name: r.area_name,
        survey_date: r.survey_date,
        avg_adr: r.avg_adr,
        min_adr: r.min_adr,
        max_adr: r.max_adr,
        weekday_avg: r.weekday_avg,
        weekend_avg: r.weekend_avg,
        peak_avg: r.peak_avg ?? null,
        hotel_count: r.hotel_count,
        data_source: r.data_source,
        checkin_date: r.checkin_date ?? null,
        ota_source: r.ota_source ?? r.data_source,
        created_at: now,
      });
    }
  }
  writeDb(db);
}

export async function getSnapshots(areaKey: string, months = 13): Promise<PriceSnapshotRow[]> {
  const db = readDb();
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - months);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  return db.price_snapshots
    .filter((s) => s.area_key === areaKey && s.survey_date >= cutoffStr)
    .sort((a, b) => (a.survey_date < b.survey_date ? -1 : 1));
}

export async function getSnapshotCount(areaKey: string): Promise<number> {
  const db = readDb();
  return db.price_snapshots.filter((s) => s.area_key === areaKey).length;
}

// ── ホテル価格関連 ──

export async function saveHotelPrice(params: {
  hotelName: string;
  areaKey: string;
  otaSource: string;
  checkinDate: string;
  queryDate: string;
  price: number;
  rating?: number | null;
  lat?: number | null;
  lng?: number | null;
}): Promise<void> {
  const db = readDb();
  const idx = db.hotel_prices.findIndex(
    (p) =>
      p.hotel_name === params.hotelName &&
      p.area_key === params.areaKey &&
      p.ota_source === params.otaSource &&
      p.checkin_date === params.checkinDate &&
      p.query_date === params.queryDate,
  );
  const now = nowIso();
  const row: HotelPriceRow = {
    id: idx >= 0
      ? db.hotel_prices[idx].id
      : (db.hotel_prices.length > 0 ? Math.max(...db.hotel_prices.map((p) => p.id)) + 1 : 1),
    hotel_name: params.hotelName,
    area_key: params.areaKey,
    ota_source: params.otaSource,
    checkin_date: params.checkinDate,
    query_date: params.queryDate,
    price: params.price,
    rating: params.rating ?? null,
    lat: params.lat ?? null,
    lng: params.lng ?? null,
    created_at: now,
  };

  if (idx >= 0) {
    db.hotel_prices[idx] = row;
  } else {
    db.hotel_prices.push(row);
  }
  writeDb(db);
}

export async function getHotelPriceCalendar(
  areaKey: string,
  weeksAhead = 12,
): Promise<Array<{
  checkin_date: string;
  ota_source: string;
  hotel_count: number;
  avg_price: number;
  min_price: number;
  max_price: number;
  last_updated: string;
}>> {
  const db = readDb();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const limitDate = new Date(today);
  limitDate.setDate(limitDate.getDate() + weeksAhead * 7);
  const limitStr = limitDate.toISOString().slice(0, 10);

  const filtered = db.hotel_prices.filter(
    (p) => p.area_key === areaKey && p.checkin_date >= todayStr && p.checkin_date <= limitStr,
  );

  const groups = new Map<string, HotelPriceRow[]>();
  for (const p of filtered) {
    const key = `${p.checkin_date}|${p.ota_source}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  return Array.from(groups.entries())
    .map(([key, rows]) => {
      const [checkin_date, ota_source] = key.split('|');
      const hotelNames = new Set(rows.map((r) => r.hotel_name));
      const prices = rows.map((r) => r.price);
      const avgPrice = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
      const lastUpdated = rows.map((r) => r.query_date).sort().reverse()[0];
      return {
        checkin_date,
        ota_source,
        hotel_count: hotelNames.size,
        avg_price: avgPrice,
        min_price: Math.min(...prices),
        max_price: Math.max(...prices),
        last_updated: lastUpdated,
      };
    })
    .sort((a, b) => (a.checkin_date < b.checkin_date ? -1 : 1));
}

// ── 年間ADRレポート ──

export async function getAnnualADRReport(areaKey: string): Promise<{
  area_key: string;
  snapshot_months: object[];
  hotel_prices_monthly: object[];
  annual: {
    avg_adr: number;
    weekday_adr: number;
    weekend_adr: number;
    min_adr: number;
    max_adr: number;
    revpar_est: number;
    occ_weekday: number;
    occ_weekend: number;
  };
  data_quality: {
    total_months: number;
    observed_months: number;
    has_real_data: boolean;
    confidence: string;
  };
  seasonal_concentration_pct: number;
}> {
  const db = readDb();

  // ── 1. price_snapshots から13ヶ月分 ──
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 13);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const filtered = db.price_snapshots
    .filter((s) => s.area_key === areaKey && s.survey_date >= cutoffStr)
    .sort((a, b) => (a.survey_date < b.survey_date ? -1 : 1));

  const snapshotGroupMap = new Map<string, PriceSnapshotRow[]>();
  for (const s of filtered) {
    const ym = s.survey_date.slice(0, 7);
    if (!snapshotGroupMap.has(ym)) snapshotGroupMap.set(ym, []);
    snapshotGroupMap.get(ym)!.push(s);
  }

  const snapshots = Array.from(snapshotGroupMap.entries()).map(([ym, rows]) => {
    const avg = (arr: number[]) =>
      arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
    const [year, month] = ym.split('-').map(Number);
    return {
      ym,
      month,
      year,
      avg_adr: avg(rows.map((r) => r.avg_adr)),
      weekday_avg: avg(rows.map((r) => r.weekday_avg)),
      weekend_avg: avg(rows.map((r) => r.weekend_avg)),
      peak_avg: avg(rows.filter((r) => r.peak_avg != null).map((r) => r.peak_avg as number)),
      min_adr: rows.length > 0 ? Math.min(...rows.map((r) => r.min_adr)) : 0,
      max_adr: rows.length > 0 ? Math.max(...rows.map((r) => r.max_adr)) : 0,
      hotel_count: avg(rows.map((r) => r.hotel_count)),
      data_source: rows.map((r) => r.data_source).sort().reverse()[0] ?? 'estimated',
      row_count: rows.length,
    };
  });

  // ── 2. hotel_prices から実測月次集計 ──
  const hpCutoff = new Date();
  hpCutoff.setMonth(hpCutoff.getMonth() - 13);
  const hpCutoffStr = hpCutoff.toISOString().slice(0, 10);
  const hpLimit = new Date();
  hpLimit.setMonth(hpLimit.getMonth() + 3);
  const hpLimitStr = hpLimit.toISOString().slice(0, 10);

  const hpFiltered = db.hotel_prices.filter(
    (p) => p.area_key === areaKey && p.checkin_date >= hpCutoffStr && p.checkin_date <= hpLimitStr,
  );

  const hpGroupMap = new Map<string, HotelPriceRow[]>();
  for (const p of hpFiltered) {
    const ym = p.checkin_date.slice(0, 7);
    if (!hpGroupMap.has(ym)) hpGroupMap.set(ym, []);
    hpGroupMap.get(ym)!.push(p);
  }

  const hotelPricesMonthly = Array.from(hpGroupMap.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([ym, rows]) => {
      const [year, month] = ym.split('-').map(Number);
      const prices = rows.map((r) => r.price);
      const hotelNames = new Set(rows.map((r) => r.hotel_name));
      return {
        month,
        year,
        avg_price: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        min_price: Math.min(...prices),
        max_price: Math.max(...prices),
        hotel_count: hotelNames.size,
        sample_size: rows.length,
      };
    });

  // ── 3. 年次集計 ──
  const allWeekdays = snapshots.filter((r) => r.weekday_avg > 0).map((r) => r.weekday_avg);
  const allWeekends = snapshots.filter((r) => r.weekend_avg > 0).map((r) => r.weekend_avg);
  const allAvg      = snapshots.filter((r) => r.avg_adr > 0).map((r) => r.avg_adr);

  const avg = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

  const annualAvgADR     = avg(allAvg);
  const annualWeekdayADR = avg(allWeekdays);
  const annualWeekendADR = avg(allWeekends);
  const annualMinADR     = snapshots.length > 0 ? Math.min(...snapshots.map((r) => r.min_adr || r.avg_adr)) : 0;
  const annualMaxADR     = snapshots.length > 0 ? Math.max(...snapshots.map((r) => r.max_adr || r.avg_adr)) : 0;

  // ── 4. RevPAR推計（OCC推定: 平日73%・休日85%） ──
  const OCC_WEEKDAY = 0.73;
  const OCC_WEEKEND = 0.85;
  const annualRevPAR = Math.round(annualWeekdayADR * OCC_WEEKDAY * 5 / 7 + annualWeekendADR * OCC_WEEKEND * 2 / 7);

  const observedMonths = snapshots.filter((r) => r.data_source !== 'estimated').length;
  const totalMonths    = snapshots.length;
  const hasRealData    = hotelPricesMonthly.length > 0;

  const peakThreshold = annualAvgADR * 1.2;
  const peakMonthsData = snapshots.filter((r) => r.avg_adr >= peakThreshold);
  const seasonalConcentration = totalMonths > 0
    ? Math.round(peakMonthsData.length / totalMonths * 100)
    : 0;

  return {
    area_key: areaKey,
    snapshot_months: snapshots,
    hotel_prices_monthly: hotelPricesMonthly,
    annual: {
      avg_adr:     annualAvgADR,
      weekday_adr: annualWeekdayADR,
      weekend_adr: annualWeekendADR,
      min_adr:     annualMinADR,
      max_adr:     annualMaxADR,
      revpar_est:  annualRevPAR,
      occ_weekday: OCC_WEEKDAY,
      occ_weekend: OCC_WEEKEND,
    },
    data_quality: {
      total_months:    totalMonths,
      observed_months: observedMonths,
      has_real_data:   hasRealData,
      confidence:      observedMonths >= 9 ? 'high' : observedMonths >= 4 ? 'medium' : 'low',
    },
    seasonal_concentration_pct: seasonalConcentration,
  };
}
