/**
 * lib/rate-limit.ts
 * サーバーサイド・インメモリ レート制限
 * - ユーザーIDまたはIPアドレスで識別
 * - スライディングウィンドウ方式
 * - Vercelサーバーレス対応（インスタンスごとに独立動作）
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// ルートごとの制限設定
export const RATE_LIMITS = {
  survey:          { max: 20, windowMs: 60_000 },  // 1分20回（OTA API消費大）
  analyze:         { max: 10, windowMs: 60_000 },  // 1分10回（Gemini消費）
  'hotel-ranking': { max: 30, windowMs: 60_000 },  // 1分30回
  'adr-report':    { max: 30, windowMs: 60_000 },
  'land-price':    { max: 30, windowMs: 60_000 },
  register:        { max: 5,  windowMs: 60_000 },  // 1分5回（不正登録防止・厳しめ）
  default:         { max: 60, windowMs: 60_000 },  // その他
} as const;

// インメモリストア（インスタンス内でのみ有効）
const store = new Map<string, RateLimitEntry>();

// 古いエントリを定期清掃（メモリリーク防止）
setInterval(() => {
  const now = Date.now();
  Array.from(store.keys()).forEach(key => {
    const entry = store.get(key);
    if (entry && now - entry.windowStart > 120_000) store.delete(key);
  });
}, 60_000);

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // epoch ms
}

export function checkRateLimit(
  identifier: string,
  route: keyof typeof RATE_LIMITS = 'default'
): RateLimitResult {
  const limit = RATE_LIMITS[route] ?? RATE_LIMITS.default;
  const now = Date.now();
  const key = `${route}:${identifier}`;
  const entry = store.get(key);

  if (!entry || now - entry.windowStart > limit.windowMs) {
    // 新しいウィンドウ開始
    store.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: limit.max - 1, resetAt: now + limit.windowMs };
  }

  if (entry.count >= limit.max) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.windowStart + limit.windowMs,
    };
  }

  entry.count++;
  return {
    allowed: true,
    remaining: limit.max - entry.count,
    resetAt: entry.windowStart + limit.windowMs,
  };
}

/** NextRequest からユーザー識別子を取得（UserID優先、IPフォールバック） */
export function getIdentifier(userId?: string | number, ip?: string): string {
  if (userId) return `user:${userId}`;
  return `ip:${ip ?? 'unknown'}`;
}
