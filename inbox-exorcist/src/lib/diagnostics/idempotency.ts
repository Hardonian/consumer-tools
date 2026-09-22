const IDEMPOTENCY_KEYS = new Map<string, Promise<unknown>>();
const IDEMPOTENCY_TTL_MS = 60_000;

type IdempotencyEntry = {
  result: unknown;
  expiresAt: number;
};

const IDEMPOTENCY_RESULTS = new Map<string, IdempotencyEntry>();

export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  const inFlight = IDEMPOTENCY_KEYS.get(key);
  if (inFlight) {
    return inFlight as Promise<T>;
  }

  const cached = IDEMPOTENCY_RESULTS.get(key);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.result as T;
  }

  const promise = fn();
  IDEMPOTENCY_KEYS.set(key, promise);

  try {
    const result = await promise;
    IDEMPOTENCY_RESULTS.set(key, {
      result,
      expiresAt: Date.now() + IDEMPOTENCY_TTL_MS,
    });
    return result;
  } finally {
    IDEMPOTENCY_KEYS.delete(key);
  }
}

export function clearIdempotencyKeys(prefix?: string) {
  if (prefix) {
    for (const key of IDEMPOTENCY_KEYS.keys()) {
      if (key.startsWith(prefix)) {
        IDEMPOTENCY_KEYS.delete(key);
      }
    }
    for (const key of IDEMPOTENCY_RESULTS.keys()) {
      if (key.startsWith(prefix)) {
        IDEMPOTENCY_RESULTS.delete(key);
      }
    }
  } else {
    IDEMPOTENCY_KEYS.clear();
    IDEMPOTENCY_RESULTS.clear();
  }
}

export function resetIdempotency() {
  clearIdempotencyKeys();
}
