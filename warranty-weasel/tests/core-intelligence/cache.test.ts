import { describe, it, expect, beforeEach } from 'vitest'
import {
  cache,
  createCache,
  getUrlHash,
  getCachedResult,
  setCachedResult,
  withCoalescing,
} from '@/lib/core-intelligence/cache'
import type { AnalysisResult } from '@/lib/core-intelligence'

function makeResult(url: string): AnalysisResult {
  return {
    schemaVersion: '1.0.0',
    ok: true,
    resultId: 'test-id',
    url,
    verdict: 'BUY',
    confidence: 80,
    confidenceExplanation: 'Test',
    reasons: [],
    signals: [],
    evidence: [],
    limitations: [],
    reviewCount: 10,
  }
}

describe('caching layer', () => {
  beforeEach(() => {
    cache.clear()
  })

  describe('getUrlHash', () => {
    it('produces deterministic hashes', () => {
      const hash1 = getUrlHash('https://example.com/product')
      const hash2 = getUrlHash('https://example.com/product')
      expect(hash1).toBe(hash2)
    })

    it('produces different hashes for different URLs', () => {
      const hash1 = getUrlHash('https://example.com/product1')
      const hash2 = getUrlHash('https://example.com/product2')
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('getCachedResult / setCachedResult', () => {
    it('stores and retrieves results', () => {
      const result = makeResult('https://example.com/test')
      const hash = getUrlHash('https://example.com/test')
      setCachedResult(hash, result)
      const cached = getCachedResult(hash)
      expect(cached).not.toBeNull()
      expect(cached?.url).toBe('https://example.com/test')
    })

    it('returns null for missing key', () => {
      expect(getCachedResult('nonexistent')).toBeNull()
    })

    it('returns null for expired entry', () => {
      const result = makeResult('https://example.com/expired')
      const hash = getUrlHash('https://example.com/expired')
      setCachedResult(hash, result, 1) // 1ms TTL
      // Wait for expiration
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          expect(getCachedResult(hash)).toBeNull()
          resolve()
        }, 10)
      })
    })
  })

  describe('withCoalescing', () => {
    it('deduplicates in-flight requests', async () => {
      let callCount = 0
      const fetcher = async () => {
        callCount++
        return makeResult('https://example.com/coalesce')
      }

      const hash = getUrlHash('https://example.com/coalesce')
      const [r1, r2] = await Promise.all([
        withCoalescing(hash, fetcher),
        withCoalescing(hash, fetcher),
      ])

      expect(callCount).toBe(1)
      expect(r1).toBe(r2)
    })

    it('cleans up in-flight map after completion', async () => {
      const fetcher = async () => makeResult('https://example.com/cleanup')
      const hash = getUrlHash('https://example.com/cleanup')

      await withCoalescing(hash, fetcher)
      expect(cache.getInFlightCount()).toBe(0)
    })
  })

  describe('createCache', () => {
    it('creates independent cache instance', () => {
      const c1 = createCache()
      const c2 = createCache()

      const hash = c1.getUrlHash('https://example.com/independent')
      c1.set(hash, makeResult('https://example.com/independent'))

      expect(c1.get(hash)).not.toBeNull()
      expect(c2.get(hash)).toBeNull()
    })

    it('respects custom TTL', () => {
      const c = createCache({ defaultTTL: 100 })
      const hash = c.getUrlHash('https://example.com/ttl')
      c.set(hash, makeResult('https://example.com/ttl'))
      expect(c.get(hash)).not.toBeNull()
    })

    it('respects max size', () => {
      const c = createCache({ maxSize: 2 })
      c.set(c.getUrlHash('url1'), makeResult('url1'))
      c.set(c.getUrlHash('url2'), makeResult('url2'))
      c.set(c.getUrlHash('url3'), makeResult('url3'))
      expect(c.getSize()).toBeLessThanOrEqual(2)
    })
  })
})
