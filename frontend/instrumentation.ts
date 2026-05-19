export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs' && process.env.DATABASE_URL) {
    try {
      const { initSchema } = await import('./lib/db');
      await initSchema();
    } catch (e) {
      // Neon cold-start may fail; app continues and retries on first real request
      console.warn('[instrumentation] DB schema init failed:', e);
    }
  }
}
