const SCAN_IN_FLIGHT = new Map<string, Promise<unknown>>();
const SENDER_CACHE = new Map<string, { data: unknown; expiresAt: number }>();

const SENDER_CACHE_TTL_MS = 5 * 60 * 1000;

export function getInFlightScan(userId: string): Promise<unknown> | null {
  const existing = SCAN_IN_FLIGHT.get(userId);
  if (existing) {
    return existing;
  }
  return null;
}

export function registerInFlightScan<T>(userId: string, promise: Promise<T>): Promise<T> {
  SCAN_IN_FLIGHT.set(userId, promise);
  promise.finally(() => {
    SCAN_IN_FLIGHT.delete(userId);
  });
  return promise;
}

export function hasInFlightScan(userId: string): boolean {
  return SCAN_IN_FLIGHT.has(userId);
}

export function getSenderFromCache(key: string): unknown | null {
  const entry = SENDER_CACHE.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    SENDER_CACHE.delete(key);
    return null;
  }
  return entry.data;
}

export function cacheSender(key: string, data: unknown) {
  SENDER_CACHE.set(key, {
    data,
    expiresAt: Date.now() + SENDER_CACHE_TTL_MS,
  });
}

export function clearSenderCache(userId?: string) {
  if (userId) {
    for (const key of SENDER_CACHE.keys()) {
      if (key.startsWith(`${userId}:`)) {
        SENDER_CACHE.delete(key);
      }
    }
  } else {
    SENDER_CACHE.clear();
  }
}

export function resetAllCaches() {
  SCAN_IN_FLIGHT.clear();
  SENDER_CACHE.clear();
}
