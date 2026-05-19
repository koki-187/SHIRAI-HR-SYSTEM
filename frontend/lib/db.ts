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
