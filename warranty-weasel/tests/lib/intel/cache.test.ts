import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  getUrlHash,
  getCachedResult,
  setCachedResult,
  withCoalescing,
} from '@/lib/intel/cache'
import type { AnalysisResult } from '@/types'

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

describe('intel caching layer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()

    // Clear cache by retrieving something expired (not easily doable without access to map,
    // but the test context should ideally be isolated. We can use a different hash for each test).
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
    it('stores and retrieves results within TTL', () => {
      const url = 'https://example.com/test-store'
      const result = makeResult(url)
      const hash = getUrlHash(url)

      setCachedResult(hash, result)
      const cached = getCachedResult(hash)

      expect(cached).not.toBeNull()
      expect(cached?.url).toBe(url)
    })

    it('returns null for missing key', () => {
      expect(getCachedResult('nonexistent-hash')).toBeNull()
    })

    it('returns null for expired entry', () => {
      const url = 'https://example.com/test-expire'
      const result = makeResult(url)
      const hash = getUrlHash(url)

      // Store with 1000ms TTL
      setCachedResult(hash, result, 1000)

      // Advance time by 500ms - should still be valid
      vi.advanceTimersByTime(500)
      expect(getCachedResult(hash)).not.toBeNull()

      // Advance time by another 501ms - should now be expired (total 1001ms)
      vi.advanceTimersByTime(501)
      expect(getCachedResult(hash)).toBeNull()

      // Calling getCachedResult again should also return null since it was deleted
      expect(getCachedResult(hash)).toBeNull()
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

      // Start both requests concurrently
      const [r1, r2] = await Promise.all([
        withCoalescing(hash, fetcher),
        withCoalescing(hash, fetcher),
      ])

      expect(callCount).toBe(1)
      expect(r1).toBe(r2)
    })

    it('executes fetcher again if not coalesced concurrently', async () => {
      let callCount = 0
      const fetcher = async () => {
        callCount++
        return makeResult('https://example.com/sequential')
      }

      const hash = getUrlHash('https://example.com/sequential')

      const r1 = await withCoalescing(hash, fetcher)
      const r2 = await withCoalescing(hash, fetcher)

      // Since they are not concurrent, it should fetch twice
      expect(callCount).toBe(2)
      expect(r1).not.toBe(r2) // They are different objects because of makeResult
    })
  })
})
