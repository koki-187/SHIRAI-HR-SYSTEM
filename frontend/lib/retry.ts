/**
 * lib/retry.ts
 * 指数バックオフ付きリトライユーティリティ
 */

export interface RetryOptions {
  maxAttempts?: number;   // デフォルト: 3
  baseDelayMs?: number;   // デフォルト: 1000
  maxDelayMs?: number;    // デフォルト: 10000
  shouldRetry?: (error: Error, attempt: number) => boolean;
  onRetry?: (error: Error, attempt: number) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 1000,
    maxDelayMs = 10000,
    shouldRetry = (e, attempt) => {
      // ネットワークエラー・タイムアウト・5xx はリトライ
      const msg = e.message.toLowerCase();
      const isRetryable =
        msg.includes('network') ||
        msg.includes('fetch') ||
        msg.includes('timeout') ||
        msg.includes('503') ||
        msg.includes('502') ||
        msg.includes('500') ||
        msg.includes('failed to fetch') ||
        msg.includes('load failed');
      return isRetryable && attempt < maxAttempts;
    },
    onRetry,
  } = options;

  let lastError: Error = new Error('Unknown error');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (e) {
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < maxAttempts && shouldRetry(lastError, attempt)) {
        const delay = Math.min(baseDelayMs * Math.pow(2, attempt - 1), maxDelayMs);
        onRetry?.(lastError, attempt);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw lastError;
      }
    }
  }

  throw lastError;
}

/** fetch with timeout wrapper */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  const { timeoutMs = 30_000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...fetchOptions, signal: controller.signal });
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      throw new Error(`リクエストがタイムアウトしました (${timeoutMs / 1000}秒)`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
