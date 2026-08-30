/**
 * Retry utility with exponential backoff.
 *
 * Wraps any async function and retries on transient errors (rate limits, 5xx).
 * Default: 3 attempts, 500ms initial delay, 2x backoff, jitter.
 */

export interface RetryOptions {
  attempts?: number;      // max total attempts (default 3)
  initialDelayMs?: number; // first retry delay in ms (default 500)
  maxDelayMs?: number;    // cap delay (default 10_000)
  factor?: number;        // backoff multiplier (default 2)
  jitter?: boolean;       // add ±20% randomness (default true)
}

/** Error codes that should NOT be retried (bad request, auth failure, etc.) */
const FATAL_CODES = new Set([400, 401, 403, 404, 422]);

function isRetryable(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    // Rate limit or server error
    if (msg.includes("rate limit") || msg.includes("429")) return true;
    if (msg.includes("5") && msg.includes("0")) return true; // 500, 503 etc.
    if (msg.includes("timeout") || msg.includes("econnreset")) return true;
  }
  // Check status codes on OpenAI-style errors
  const e = err as { status?: number; statusCode?: number };
  const code = e.status ?? e.statusCode;
  if (code != null) {
    if (FATAL_CODES.has(code)) return false;
    if (code === 429 || code >= 500) return true;
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry `fn` up to `attempts` times with exponential backoff.
 *
 * @example
 *   const result = await withRetry(() => openai.chat.completions.create(...));
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions = {}
): Promise<T> {
  const attempts = opts.attempts ?? 3;
  const initialDelay = opts.initialDelayMs ?? 500;
  const maxDelay = opts.maxDelayMs ?? 10_000;
  const factor = opts.factor ?? 2;
  const jitter = opts.jitter ?? true;

  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;

      if (attempt === attempts || !isRetryable(err)) {
        throw err;
      }

      let delay = Math.min(initialDelay * Math.pow(factor, attempt - 1), maxDelay);
      if (jitter) delay *= 0.8 + Math.random() * 0.4; // ±20% jitter

      console.warn(
        `[ContextMemory] API error (attempt ${attempt}/${attempts}), retrying in ${Math.round(delay)}ms...`,
        err instanceof Error ? err.message : err
      );
      await sleep(delay);
    }
  }

  throw lastError;
}
