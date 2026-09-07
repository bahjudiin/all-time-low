// Resilient JSON fetch: retries 429/5xx and network errors with small
// exponential backoff + jitter, then throws on final failure.

export interface FetchJsonOptions extends RequestInit {
  timeoutMs?: number;
  next?: { revalidate?: number };
}

const DEFAULT_TIMEOUT_MS = 15_000;

export class FetchError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "FetchError";
    this.status = status;
  }
}

function isRetryable(status: number): boolean {
  return status === 429 || status >= 500;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function fetchJson<T = unknown>(
  url: string,
  options: FetchJsonOptions = {},
  retries = 2,
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: outerSignal, ...init } = options;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    const onOuterAbort = () => controller.abort();
    if (outerSignal?.aborted) controller.abort();
    else outerSignal?.addEventListener("abort", onOuterAbort, { once: true });

    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (!res.ok) {
        const err = new FetchError(`HTTP ${res.status} for ${url}`, res.status);
        if (attempt < retries && isRetryable(res.status)) {
          lastError = err;
          await delay(500 * 2 ** attempt + Math.random() * 250);
          continue;
        }
        throw err;
      }
      return (await res.json()) as T;
    } catch (err) {
      const outerAborted = outerSignal?.aborted ?? false;
      const timedOut = controller.signal.aborted && !outerAborted;
      if (attempt < retries && (timedOut || err instanceof TypeError)) {
        lastError = err;
        await delay(500 * 2 ** attempt + Math.random() * 250);
        continue;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
      outerSignal?.removeEventListener("abort", onOuterAbort);
    }
  }

  throw lastError instanceof Error ? lastError : new Error(`fetch failed: ${url}`);
}

export const fetchWithRetry = fetchJson;