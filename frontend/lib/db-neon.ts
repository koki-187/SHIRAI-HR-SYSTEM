import { neon } from '@neondatabase/serverless';

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not configured');
  return neon(url);
}

export async function initSchema() {
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id               SERIAL PRIMARY KEY,
      email            TEXT UNIQUE NOT NULL,
      password_hash    TEXT NOT NULL,
      name             TEXT NOT NULL,
      role             TEXT NOT NULL DEFAULT 'user',
      active           BOOLEAN NOT NULL DEFAULT TRUE,
      gemini_api_key_enc TEXT,
      created_at       TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // 既存テーブルへの列追加（べき等）
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user'`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE`;
  await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS gemini_api_key_enc TEXT`;
  await sql`
    CREATE TABLE IF NOT EXISTS history (
      id             TEXT PRIMARY KEY,
      user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
      location       TEXT,
      search_address TEXT,
      params         JSONB DEFAULT '{}',
      result         JSONB DEFAULT '{}',
      created_at     TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  // ── 価格スナップショット（時系列ADR蓄積）──
  await sql`
    CREATE TABLE IF NOT EXISTS price_snapshots (
      id           SERIAL PRIMARY KEY,
      area_key     TEXT NOT NULL,
      area_name    TEXT,
      survey_date  DATE NOT NULL,
      avg_adr      INTEGER NOT NULL,
      min_adr      INTEGER,
      max_adr      INTEGER,
      weekday_avg  INTEGER,
      weekend_avg  INTEGER,
      peak_avg     INTEGER,
      hotel_count  INTEGER,
      data_source  TEXT NOT NULL DEFAULT 'estimated',
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_price_snapshots_area_date
    ON price_snapshots(area_key, survey_date)
  `;
  // チェックイン日・OTAソース列追加（べき等）
  await sql`ALTER TABLE price_snapshots ADD COLUMN IF NOT EXISTS checkin_date DATE`;
  await sql`ALTER TABLE price_snapshots ADD COLUMN IF NOT EXISTS ota_source TEXT DEFAULT 'estimated'`;

  // ホテル別時系列価格テーブル（実データ収集用）
  await sql`
    CREATE TABLE IF NOT EXISTS hotel_prices (
      id           SERIAL PRIMARY KEY,
      hotel_name   TEXT NOT NULL,
      area_key     TEXT NOT NULL,
      ota_source   TEXT NOT NULL DEFAULT 'rakuten',
      checkin_date DATE NOT NULL,
      query_date   DATE NOT NULL,
      price        INTEGER NOT NULL,
      rating       NUMERIC(3,1),
      lat          NUMERIC(9,6),
      lng          NUMERIC(9,6),
      created_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_hotel_prices_unique
    ON hotel_prices(hotel_name, area_key, ota_source, checkin_date, query_date)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_hotel_prices_area_checkin
    ON hotel_prices(area_key, checkin_date)
  `;
}

// ── Area key helper ──
export function toAreaKey(lat: number, lng: number): string {
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

// ── Price snapshot functions ──
export async function saveSnapshot(params: {
  areaKey: string;
  areaName: string;
  surveyDate: string; // 'YYYY-MM-DD'
  avgAdr: number;
  minAdr: number;
  maxAdr: number;
  weekdayAvg: number;
  weekendAvg: number;
  peakAvg: number | null;
  hotelCount: number;
  dataSource: string;
  checkinDate?: string | null;  // NEW: 'YYYY-MM-DD' or null
  otaSource?: string | null;    // NEW: 'rakuten' | 'jalan' | 'seed' | 'mock' | null
}) {
  const sql = getSql();
  await sql`
    INSERT INTO price_snapshots
      (area_key, area_name, survey_date, avg_adr, min_adr, max_adr,
       weekday_avg, weekend_avg, peak_avg, hotel_count, data_source,
       checkin_date, ota_source)
    VALUES (
      ${params.areaKey}, ${params.areaName}, ${params.surveyDate}::date,
      ${params.avgAdr}, ${params.minAdr}, ${params.maxAdr},
      ${params.weekdayAvg}, ${params.weekendAvg}, ${params.peakAvg ?? null},
      ${params.hotelCount}, ${params.dataSource},
      ${params.checkinDate ?? null}, ${params.otaSource ?? params.dataSource}
    )
    ON CONFLICT (area_key, survey_date) DO UPDATE SET
      avg_adr     = EXCLUDED.avg_adr,
      min_adr     = EXCLUDED.min_adr,
      max_adr     = EXCLUDED.max_adr,
      weekday_avg = EXCLUDED.weekday_avg,
      weekend_avg = EXCLUDED.weekend_avg,
      peak_avg    = EXCLUDED.peak_avg,
      hotel_count = EXCLUDED.hotel_count,
      data_source = EXCLUDED.data_source,
      checkin_date = EXCLUDED.checkin_date,
      ota_source  = EXCLUDED.ota_source,
      created_at  = NOW()
  `;
}

export async function saveHotelPrice(params: {
  hotelName: string;
  areaKey: string;
  otaSource: string;
  checkinDate: string; // 'YYYY-MM-DD'
  queryDate: string;   // 'YYYY-MM-DD'
  price: number;
  rating?: number | null;
  lat?: number | null;
  lng?: number | null;
}) {
  const sql = getSql();
  await sql`
    INSERT INTO hotel_prices
      (hotel_name, area_key, ota_source, checkin_date, query_date, price, rating, lat, lng)
    VALUES (
      ${params.hotelName}, ${params.areaKey}, ${params.otaSource},
      ${params.checkinDate}::date, ${params.queryDate}::date,
      ${params.price},
      ${params.rating ?? null}, ${params.lat ?? null}, ${params.lng ?? null}
    )
    ON CONFLICT (hotel_name, area_key, ota_source, checkin_date, query_date) DO UPDATE SET
      price      = EXCLUDED.price,
      rating     = EXCLUDED.rating,
      created_at = NOW()
  `;
}

export async function getHotelPriceCalendar(areaKey: string, weeksAhead = 12) {
  const sql = getSql();
  return await sql`
    SELECT
      checkin_date,
      ota_source,
      COUNT(DISTINCT hotel_name) AS hotel_count,
      ROUND(AVG(price))::int      AS avg_price,
      MIN(price)                  AS min_price,
      MAX(price)                  AS max_price,
      MAX(query_date)             AS last_updated
    FROM hotel_prices
    WHERE area_key = ${areaKey}
      AND checkin_date BETWEEN CURRENT_DATE AND (CURRENT_DATE + (${weeksAhead} || ' weeks')::interval)
    GROUP BY checkin_date, ota_source
    ORDER BY checkin_date ASC
  `;
}

export async function getSnapshots(areaKey: string, months = 13) {
  const sql = getSql();
  return await sql`
    SELECT survey_date, avg_adr, min_adr, max_adr,
           weekday_avg, weekend_avg, peak_avg, hotel_count, data_source
    FROM   price_snapshots
    WHERE  area_key = ${areaKey}
      AND  survey_date >= (CURRENT_DATE - (${months} || ' months')::interval)
    ORDER BY survey_date ASC
  `;
}

export async function getSnapshotCount(areaKey: string): Promise<number> {
  const sql = getSql();
  const rows = await sql`
    SELECT COUNT(*) as cnt FROM price_snapshots WHERE area_key = ${areaKey}
  `;
  return parseInt(rows[0]?.cnt ?? '0');
}

export async function bulkInsertSnapshots(rows: Array<{
  area_key: string; area_name: string; survey_date: string;
  avg_adr: number; min_adr: number; max_adr: number;
  weekday_avg: number; weekend_avg: number; peak_avg: number | null;
  hotel_count: number; data_source: string;
  checkin_date?: string | null;
  ota_source?: string | null;
}>) {
  if (rows.length === 0) return;
  const sql = getSql();
  for (const r of rows) {
    await sql`
      INSERT INTO price_snapshots
        (area_key, area_name, survey_date, avg_adr, min_adr, max_adr,
         weekday_avg, weekend_avg, peak_avg, hotel_count, data_source,
         checkin_date, ota_source)
      VALUES (
        ${r.area_key}, ${r.area_name}, ${r.survey_date}::date,
        ${r.avg_adr}, ${r.min_adr}, ${r.max_adr},
        ${r.weekday_avg}, ${r.weekend_avg}, ${r.peak_avg ?? null},
        ${r.hotel_count}, ${r.data_source},
        ${r.checkin_date ?? null}, ${r.ota_source ?? r.data_source}
      )
      ON CONFLICT (area_key, survey_date) DO NOTHING
    `;
  }
}

export async function getUserByEmail(email: string) {
  const sql = getSql();
  const rows = await sql`SELECT * FROM users WHERE email = ${email} LIMIT 1`;
  return rows[0] ?? null;
}

export async function createUser(email: string, passwordHash: string, name: string) {
  const sql = getSql();
  const rows = await sql`
    INSERT INTO users (email, password_hash, name)
    VALUES (${email}, ${passwordHash}, ${name})
    RETURNING id
  `;
  return { lastInsertRowid: rows[0].id };
}

export async function saveHistory(
  userId: number,
  id: string,
  location: string,
  searchAddress: string,
  params: object,
  result: object,
) {
  const sql = getSql();
  await sql`
    INSERT INTO history (id, user_id, location, search_address, params, result)
    VALUES (
      ${id}, ${userId}, ${location}, ${searchAddress},
      ${JSON.stringify(params)}::jsonb, ${JSON.stringify(result)}::jsonb
    )
    ON CONFLICT (id) DO UPDATE SET
      location       = EXCLUDED.location,
      search_address = EXCLUDED.search_address,
      params         = EXCLUDED.params,
      result         = EXCLUDED.result,
      created_at     = NOW()
  `;
  await sql`
    DELETE FROM history
    WHERE user_id = ${userId}
      AND id NOT IN (
        SELECT id FROM history
        WHERE user_id = ${userId}
        ORDER BY created_at DESC
        LIMIT 50
      )
  `;
}

export async function getHistory(userId: number) {
  const sql = getSql();
  return await sql`
    SELECT * FROM history
    WHERE user_id = ${userId}
    ORDER BY created_at DESC
    LIMIT 50
  `;
}

export async function deleteHistory(id: string, userId: number) {
  const sql = getSql();
  await sql`DELETE FROM history WHERE id = ${id} AND user_id = ${userId}`;
}

// --- Admin functions ---
export async function getAllUsers() {
  const sql = getSql();
  return await sql`
    SELECT id, email, name, role, active, created_at,
           (SELECT COUNT(*) FROM history WHERE user_id = users.id) AS history_count
    FROM users
    ORDER BY created_at DESC
  `;
}

export async function setUserActive(userId: number, active: boolean) {
  const sql = getSql();
  await sql`UPDATE users SET active = ${active} WHERE id = ${userId}`;
}

export async function deleteUser(userId: number) {
  const sql = getSql();
  await sql`DELETE FROM users WHERE id = ${userId}`;
}

// --- User profile / API key ---
export async function updateGeminiKey(userId: number, encryptedKey: string | null) {
  const sql = getSql();
  await sql`UPDATE users SET gemini_api_key_enc = ${encryptedKey} WHERE id = ${userId}`;
}

export async function getGeminiKey(userId: number): Promise<string | null> {
  const sql = getSql();
  const rows = await sql`SELECT gemini_api_key_enc FROM users WHERE id = ${userId} LIMIT 1`;
  return rows[0]?.gemini_api_key_enc ?? null;
}

/**
 * 年間ADRレポート — 仕入れ判断用
 * price_snapshots から12ヶ月分を集計し、月次・年次サマリーを返す。
 * hotel_prices テーブルが充実している場合はそちらの実データも含む。
 */
export async function getAnnualADRReport(areaKey: string) {
  const sql = getSql();

  // ── 1. price_snapshots から13ヶ月分 ──
  const snapshots = await sql`
    SELECT
      to_char(survey_date, 'YYYY-MM') AS ym,
      EXTRACT(MONTH FROM survey_date)::int AS month,
      EXTRACT(YEAR  FROM survey_date)::int AS year,
      ROUND(AVG(avg_adr))::int      AS avg_adr,
      ROUND(AVG(weekday_avg))::int  AS weekday_avg,
      ROUND(AVG(weekend_avg))::int  AS weekend_avg,
      ROUND(AVG(peak_avg))::int     AS peak_avg,
      MIN(min_adr)                  AS min_adr,
      MAX(max_adr)                  AS max_adr,
      ROUND(AVG(hotel_count))::int  AS hotel_count,
      MAX(data_source)              AS data_source,
      COUNT(*)::int                 AS row_count
    FROM   price_snapshots
    WHERE  area_key = ${areaKey}
      AND  survey_date >= (CURRENT_DATE - INTERVAL '13 months')
    GROUP BY ym, month, year
    ORDER BY ym ASC
  `;

  // ── 2. hotel_prices から実測月次集計（あれば優先） ──
  const hotelPricesMonthly = await sql`
    SELECT
      EXTRACT(MONTH FROM checkin_date)::int AS month,
      EXTRACT(YEAR  FROM checkin_date)::int AS year,
      ROUND(AVG(price))::int   AS avg_price,
      MIN(price)               AS min_price,
      MAX(price)               AS max_price,
      COUNT(DISTINCT hotel_name)::int AS hotel_count,
      COUNT(*)::int            AS sample_size
    FROM   hotel_prices
    WHERE  area_key = ${areaKey}
      AND  checkin_date BETWEEN CURRENT_DATE - INTERVAL '13 months' AND CURRENT_DATE + INTERVAL '3 months'
    GROUP BY month, year
    ORDER BY year ASC, month ASC
  `;

  // ── 3. 年次集計 ──
  const allWeekdays = snapshots.filter((r: any) => r.weekday_avg > 0).map((r: any) => Number(r.weekday_avg));
  const allWeekends = snapshots.filter((r: any) => r.weekend_avg > 0).map((r: any) => Number(r.weekend_avg));
  const allAvg      = snapshots.filter((r: any) => r.avg_adr > 0).map((r: any) => Number(r.avg_adr));

  const annualAvgADR     = allAvg.length > 0 ? Math.round(allAvg.reduce((a: number, b: number) => a + b, 0) / allAvg.length) : 0;
  const annualWeekdayADR = allWeekdays.length > 0 ? Math.round(allWeekdays.reduce((a: number, b: number) => a + b, 0) / allWeekdays.length) : 0;
  const annualWeekendADR = allWeekends.length > 0 ? Math.round(allWeekends.reduce((a: number, b: number) => a + b, 0) / allWeekends.length) : 0;
  const annualMinADR     = snapshots.length > 0 ? Math.min(...snapshots.map((r: any) => Number(r.min_adr || r.avg_adr))) : 0;
  const annualMaxADR     = snapshots.length > 0 ? Math.max(...snapshots.map((r: any) => Number(r.max_adr || r.avg_adr))) : 0;

  // ── 4. RevPAR推計（月次OCC係数は都市デフォルト） ──
  // OCC推定: 平日73%・休日85%・繁忙期88%（日本ホテル業界平均）
  const OCC_WEEKDAY = 0.73;
  const OCC_WEEKEND = 0.85;
  const annualRevPAR = Math.round(annualWeekdayADR * OCC_WEEKDAY * 5/7 + annualWeekendADR * OCC_WEEKEND * 2/7);

  // ── 5. 実測データ有無の判定 ──
  const observedMonths = snapshots.filter((r: any) => r.data_source !== 'estimated').length;
  const totalMonths    = snapshots.length;
  const hasRealData    = hotelPricesMonthly.length > 0;

  // ── 6. 季節集中リスク ──
  const peakThreshold = annualAvgADR * 1.2;
  const peakMonthsData = snapshots.filter((r: any) => Number(r.avg_adr) >= peakThreshold);
  const seasonalConcentration = totalMonths > 0
    ? Math.round(peakMonthsData.length / totalMonths * 100)
    : 0;

  return {
    area_key:    areaKey,
    snapshot_months: snapshots,
    hotel_prices_monthly: hotelPricesMonthly,
    annual: {
      avg_adr:      annualAvgADR,
      weekday_adr:  annualWeekdayADR,
      weekend_adr:  annualWeekendADR,
      min_adr:      annualMinADR,
      max_adr:      annualMaxADR,
      revpar_est:   annualRevPAR,
      occ_weekday:  OCC_WEEKDAY,
      occ_weekend:  OCC_WEEKEND,
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
