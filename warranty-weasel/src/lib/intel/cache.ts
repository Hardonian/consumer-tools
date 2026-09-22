import { AnalysisResult } from '@/types';
import { createHash } from 'crypto';

interface CacheEntry {
  result: AnalysisResult;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<AnalysisResult>>();

const DEFAULT_TTL = 3600 * 1000; // 1 hour

/**
 * Generates a deterministic hash for a normalized URL.
 */
export function getUrlHash(url: string): string {
  return createHash('sha256').update(url).digest('hex');
}

/**
 * Retrieves a cached result if valid.
 */
export function getCachedResult(urlHash: string): AnalysisResult | null {
  const entry = cache.get(urlHash);
  if (entry && entry.expiresAt > Date.now()) {
    return entry.result;
  }
  if (entry) cache.delete(urlHash);
  return null;
}

/**
 * Stores a result in the cache.
 */
export function setCachedResult(urlHash: string, result: AnalysisResult, ttl = DEFAULT_TTL): void {
  cache.set(urlHash, {
    result,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * Manages in-flight request coalescing.
 */
export async function withCoalescing(
  urlHash: string,
  fetcher: () => Promise<AnalysisResult>
): Promise<AnalysisResult> {
  const existing = inFlight.get(urlHash);
  if (existing) return existing;

  const promise = fetcher().finally(() => inFlight.delete(urlHash));
  inFlight.set(urlHash, promise);
  return promise;
}
