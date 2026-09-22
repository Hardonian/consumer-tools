import { AnalysisResult } from '@/types'

interface CacheEntry {
  result: AnalysisResult
  expiresAt: number
}

// Simple in-memory cache for production-bound idempotency
// In a real multi-instance prod env, this would be Redis
const resultCache = new Map<string, CacheEntry>()

const DEFAULT_TTL = 1000 * 60 * 60 // 1 hour

export function getCachedResult(urlHash: string): AnalysisResult | null {
  const entry = resultCache.get(urlHash)
  if (!entry) return null

  if (Date.now() > entry.expiresAt) {
    resultCache.delete(urlHash)
    return null
  }

  return entry.result
}

export function setCachedResult(urlHash: string, result: AnalysisResult, ttlMs: number = DEFAULT_TTL): void {
  resultCache.set(urlHash, {
    result,
    expiresAt: Date.now() + ttlMs,
  })
}

export function generateUrlHash(normalizedUrl: string): string {
  // Simple deterministic hash for cache keying
  let hash = 0
  for (let i = 0; i < normalizedUrl.length; i++) {
    const char = normalizedUrl.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Buffer.from(hash.toString()).toString('hex')
}
