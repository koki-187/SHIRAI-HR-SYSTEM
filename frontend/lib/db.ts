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
      id        SERIAL PRIMARY KEY,
      email     TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name      TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
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
