// Module-level TTL cache with in-flight request deduplication.
// Safe to use in Next.js route handlers / server modules (per-instance).

const store = new Map<string, { value: unknown; expiry: number }>();
const inflight = new Map<string, Promise<unknown>>();

export function cachedGet<T>(key: string, ttlMs: number, producer: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiry > now) return Promise.resolve(hit.value as T);

  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const run = producer()
    .then((value) => {
      store.set(key, { value, expiry: Date.now() + ttlMs });
      return value;
    })
    .finally(() => {
      inflight.delete(key);
    })
    .catch((err) => {
      store.delete(key);
      throw err;
    });

  inflight.set(key, run);
  return run;
}

export function cachedGetSync<T>(key: string, ttlMs: number, producer: () => T): T {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiry > now) return hit.value as T;
  const value = producer();
  store.set(key, { value, expiry: Date.now() + ttlMs });
  return value;
}

export function clearCache() {
  store.clear();
  inflight.clear();
}