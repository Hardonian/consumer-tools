import { describe, it, expect } from 'vitest'
import {
  clamp,
  sleep,
  truncateString,
  normalizeUrl,
  generateId,
  safeJsonParse,
  deduplicateArray,
  textSimilarity,
} from '@/lib/core-intelligence/utils'

describe('utils', () => {
  describe('clamp', () => {
    it('clamps value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5)
      expect(clamp(-5, 0, 10)).toBe(0)
      expect(clamp(15, 0, 10)).toBe(10)
    })
  })

  describe('sleep', () => {
    it('waits for specified time', async () => {
      const start = Date.now()
      await sleep(50)
      const elapsed = Date.now() - start
      expect(elapsed).toBeGreaterThanOrEqual(45)
    })
  })

  describe('truncateString', () => {
    it('truncates long strings', () => {
      expect(truncateString('hello world', 5)).toBe('hello...')
    })

    it('does not truncate short strings', () => {
      expect(truncateString('hi', 10)).toBe('hi')
    })
  })

  describe('normalizeUrl', () => {
    it('removes tracking params', () => {
      const normalized = normalizeUrl('https://example.com/product?utm_source=google&ref=123')
      expect(normalized).not.toContain('utm_source')
      expect(normalized).not.toContain('ref=')
    })

    it('lowercases hostname', () => {
      const normalized = normalizeUrl('https://EXAMPLE.COM/product')
      expect(normalized).toContain('example.com')
    })

    it('removes trailing slash', () => {
      const normalized = normalizeUrl('https://example.com/product/')
      expect(normalized).not.toMatch(/\/$/)
    })

    it('returns original on invalid URL', () => {
      expect(normalizeUrl('not-a-url')).toBe('not-a-url')
    })
  })

  describe('generateId', () => {
    it('generates unique ids', () => {
      const id1 = generateId()
      const id2 = generateId()
      expect(id1).not.toBe(id2)
    })

    it('generates a valid UUID', () => {
      const id = generateId()
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
    })
  })

  describe('safeJsonParse', () => {
    it('parses valid JSON', () => {
      expect(safeJsonParse('{"a": 1}', {})).toEqual({ a: 1 })
    })

    it('returns fallback for invalid JSON', () => {
      expect(safeJsonParse('not json', { fallback: true })).toEqual({ fallback: true })
    })
  })

  describe('deduplicateArray', () => {
    it('removes duplicates', () => {
      expect(deduplicateArray([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3])
    })
  })

  describe('textSimilarity', () => {
    it('returns 1.0 for identical strings', () => {
      expect(textSimilarity('hello', 'hello')).toBe(1.0)
    })

    it('returns 1.0 for empty strings', () => {
      expect(textSimilarity('', '')).toBe(1.0)
    })

    it('returns lower score for different strings', () => {
      const sim = textSimilarity('hello world', 'hello there')
      expect(sim).toBeLessThan(1.0)
      expect(sim).toBeGreaterThan(0)
    })
  })
})
