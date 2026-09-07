// Module-level TTL cache with in-flight request deduplication.
// Safe to use in Next.js route handlers / server modules (per-instance).

const MAX_ENTRIES = 2000;

const store = new Map<string, { value: unknown; expiry: number }>();
const inflight = new Map<string, Promise<unknown>>();

function sweepExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.expiry <= now) store.delete(key);
  }
}

function trim(map: Map<string, unknown>): void {
  while (map.size > MAX_ENTRIES) {
    const oldestKey = map.keys().next().value;
    if (oldestKey === undefined) return;
    map.delete(oldestKey);
  }
}

function touch(key: string, value: unknown, expiry: number): void {
  store.delete(key);
  store.set(key, { value, expiry });
  trim(store);
}

export function cachedGet<T>(key: string, ttlMs: number, producer: () => Promise<T>): Promise<T> {
  sweepExpired();

  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiry > now) {
    store.delete(key);
    store.set(key, hit);
    return Promise.resolve(hit.value as T);
  }
  if (hit) store.delete(key);

  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const run = producer()
    .then((value) => {
      touch(key, value, Date.now() + ttlMs);
      return value;
    })
    .catch((err) => {
      store.delete(key);
      inflight.delete(key);
      throw err;
    })
    .finally(() => {
      inflight.delete(key);
    });

  inflight.set(key, run);
  trim(inflight);
  return run;
}

export function cachedGetSync<T>(key: string, ttlMs: number, producer: () => T): T {
  sweepExpired();

  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expiry > now) {
    store.delete(key);
    store.set(key, hit);
    return hit.value as T;
  }
  const value = producer();
  touch(key, value, Date.now() + ttlMs);
  return value;
}

export function clearCache() {
  store.clear();
  inflight.clear();
}