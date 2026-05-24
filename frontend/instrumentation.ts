export async function register() {
  // Node.js ランタイムでのみ実行（Edge Runtime では better-sqlite3 が動作しない）
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  try {
    const { initSchema } = await import('./lib/db');
    await initSchema();
  } catch (e) {
    // 初回起動時のエラーはログのみ。実リクエスト時に各 API ルートが再試行する。
    console.warn('[instrumentation] DB schema init failed:', e);
  }
}
