import { describe, it, expect } from 'vitest'
import {
  suspiciousSignals,
  safeSignals,
  getSuspiciousSignal,
  getSafeSignal,
  getMaxSuspiciousWeight,
  runSignalDetection,
  aggregateSignals,
} from '@/lib/core-intelligence/signals'
import type { ParsedReview } from '@/lib/core-intelligence'

describe('signal engine', () => {
  describe('signal registries', () => {
    it('has suspicious signals defined', () => {
      expect(Object.keys(suspiciousSignals).length).toBeGreaterThan(10)
    })

    it('has safe signals defined', () => {
      expect(Object.keys(safeSignals).length).toBeGreaterThan(3)
    })

    it('each suspicious signal has required fields', () => {
      for (const [name, signal] of Object.entries(suspiciousSignals)) {
        expect(signal.name).toBe(name)
        expect(signal.weight).toBeGreaterThan(0)
        expect(signal.description).toBeDefined()
        expect(signal.explanation).toBeDefined()
      }
    })

    it('each safe signal has negative weight', () => {
      for (const signal of Object.values(safeSignals)) {
        expect(signal.weight).toBeLessThan(0)
      }
    })
  })

  describe('getSuspiciousSignal', () => {
    it('returns signal by name', () => {
      const signal = getSuspiciousSignal('safety_concern')
      expect(signal?.name).toBe('safety_concern')
      expect(signal?.weight).toBe(25)
    })

    it('returns undefined for unknown signal', () => {
      expect(getSuspiciousSignal('nonexistent')).toBeUndefined()
    })
  })

  describe('getSafeSignal', () => {
    it('returns signal by name', () => {
      const signal = getSafeSignal('detailed_reviews')
      expect(signal?.name).toBe('detailed_reviews')
    })

    it('returns undefined for unknown signal', () => {
      expect(getSafeSignal('nonexistent')).toBeUndefined()
    })
  })

  describe('getMaxSuspiciousWeight', () => {
    it('returns the highest suspicious signal weight', () => {
      const max = getMaxSuspiciousWeight()
      expect(max).toBe(25) // safety_concern
    })
  })

  describe('runSignalDetection', () => {
    function makeReview(snippet: string, rating: number, date?: string, verified = false): ParsedReview {
      return {
        id: 'r1',
        title: 'Test Review',
        rating,
        date: date || '2024-01-01',
        author: 'TestUser',
        verified,
        snippet,
        helpfulVotes: 0,
        rawHtml: '',
      }
    }

    it('detects temporal sync when reviews share same date', () => {
      const reviews = Array(5).fill(null).map((_, i) =>
        makeReview(`Review ${i}`, 5, '2024-01-15')
      )
      const results = runSignalDetection(reviews)
      const temporal = results.find((r) => r.name === 'temporal_sync')
      expect(temporal).toBeDefined()
      expect(temporal?.strength).toBe('strong')
    })

    it('detects linguistic mirror with identical text', () => {
      const reviews = [
        makeReview('This product is absolutely amazing and I love it', 5),
        makeReview('This product is absolutely amazing and I love it', 5),
        makeReview('Different review text here', 4),
      ]
      const results = runSignalDetection(reviews)
      const mirror = results.find((r) => r.name === 'linguistic_mirror')
      expect(mirror).toBeDefined()
    })

    it('detects safety concerns', () => {
      const reviews = [
        makeReview('This caught fire and burned my hand', 1),
      ]
      const results = runSignalDetection(reviews)
      const safety = results.find((r) => r.name === 'safety_concern')
      expect(safety).toBeDefined()
    })

    it('detects warranty complaints', () => {
      const reviews = [
        makeReview('Warranty claim denied because of fine print', 1),
      ]
      const results = runSignalDetection(reviews)
      const warranty = results.find((r) => r.name === 'warranty_complaint')
      expect(warranty).toBeDefined()
    })

    it('detects counterfeit signals', () => {
      const reviews = [
        makeReview('This is a fake product, not genuine at all', 1),
        makeReview('Counterfeit item, cheap quality knockoff', 1),
      ]
      const results = runSignalDetection(reviews)
      const counterfeit = results.find((r) => r.name === 'counterfeit_signal')
      expect(counterfeit).toBeDefined()
    })

    it('detects subscription traps', () => {
      const reviews = [
        makeReview('Was charged monthly after free trial, hard to cancel', 1),
      ]
      const results = runSignalDetection(reviews)
      const sub = results.find((r) => r.name === 'subscription_trap')
      expect(sub).toBeDefined()
    })

    it('detects detailed reviews as safe signal', () => {
      const reviews = Array(6).fill(null).map((_, i) =>
        makeReview('This is a very detailed review that contains lots of specific information about the product and its features and how it performs in real world usage scenarios across different environments and conditions over an extended period of time with thorough analysis', 4, `2024-01-0${i + 1}`)
      )
      const results = runSignalDetection(reviews)
      const detailed = results.find((r) => r.name === 'detailed_reviews')
      expect(detailed).toBeDefined()
      expect(detailed?.weight).toBeLessThan(0)
    })

    it('returns empty array for insufficient data', () => {
      const reviews = [makeReview('Good', 5)]
      const results = runSignalDetection(reviews)
      expect(results.length).toBe(0)
    })

    it('does not crash on malformed reviews', () => {
      const reviews: ParsedReview[] = [
        { id: 'bad', title: '', rating: 0, date: null, author: '', verified: false, snippet: '', helpfulVotes: 0, rawHtml: '' },
      ]
      expect(() => runSignalDetection(reviews)).not.toThrow()
    })
  })

  describe('aggregateSignals', () => {
    it('aggregates signal weights correctly', () => {
      const signals = [
        { name: 'safety_concern', weight: 25, explanation: '', strength: 'strong' as const },
        { name: 'detailed_reviews', weight: -12, explanation: '', strength: 'strong' as const },
        { name: 'keyword_spam', weight: 14, explanation: '', strength: 'weak' as const },
      ]
      const agg = aggregateSignals(signals)
      expect(agg.suspiciousWeight).toBe(39) // 25 + 14
      expect(agg.safeWeight).toBe(12)
      expect(agg.strongCount).toBe(2)
      expect(agg.weakCount).toBe(1)
    })

    it('handles empty signals', () => {
      const agg = aggregateSignals([])
      expect(agg.totalWeight).toBe(0)
      expect(agg.strongCount).toBe(0)
    })
  })
})
