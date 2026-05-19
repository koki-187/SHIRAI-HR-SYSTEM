export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.DATABASE_URL) {
    const { initSchema } = await import('./lib/db');
    await initSchema();
  }
}
