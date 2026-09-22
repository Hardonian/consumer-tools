import { describe, it, expect } from 'vitest'
import {
  computeConfidence,
  applyConfidenceCaps,
  computeMissingDataPenalty,
} from '@/lib/core-intelligence/confidence'
import type { SignalResult } from '@/lib/core-intelligence'

describe('confidence engine', () => {
  function makeSignal(name: string, weight: number, strength: 'strong' | 'weak' | 'conflicting'): SignalResult {
    return { name, weight, explanation: '', strength }
  }

  describe('computeConfidence', () => {
    it('returns 0 confidence when no data', () => {
      const result = computeConfidence([], 0, 0, false)
      expect(result.confidence).toBe(0)
      expect(result.capped).toBe(false)
    })

    it('calculates base confidence from signals', () => {
      const signals = [
        makeSignal('safety', 25, 'strong'),
        makeSignal('detailed', -12, 'strong'),
      ]
      const result = computeConfidence(signals, 50, 0, true)
      expect(result.confidence).toBeGreaterThan(30)
    })

    it('applies failure penalty', () => {
      const signals = [makeSignal('test', 10, 'strong')]
      const resultNoPenalty = computeConfidence(signals, 50, 0, true)
      const resultWithPenalty = computeConfidence(signals, 50, 20, true)
      expect(resultWithPenalty.confidence).toBeLessThan(resultNoPenalty.confidence)
    })

    it('caps confidence for low review count', () => {
      const signals = [makeSignal('test', 10, 'strong')]
      const result = computeConfidence(signals, 2, 0, true)
      expect(result.confidence).toBeLessThanOrEqual(30)
      expect(result.capped).toBe(true)
    })

    it('caps confidence for high failure penalty', () => {
      const signals = [makeSignal('test', 10, 'strong'), makeSignal('test2', 10, 'strong'), makeSignal('test3', 10, 'strong')]
      const result = computeConfidence(signals, 50, 50, true)
      expect(result.confidence).toBeLessThanOrEqual(30)
      expect(result.capped).toBe(true)
    })

    it('boosts confidence for 3+ strong signals', () => {
      const signals = [
        makeSignal('a', 10, 'strong'),
        makeSignal('b', 10, 'strong'),
        makeSignal('c', 10, 'strong'),
      ]
      const result = computeConfidence(signals, 50, 0, true)
      expect(result.confidence).toBeGreaterThanOrEqual(80)
    })

    it('provides explanation', () => {
      const result = computeConfidence([makeSignal('test', 10, 'strong')], 50, 10, true)
      expect(result.explanation).toContain('strong signal')
    })
  })

  describe('applyConfidenceCaps', () => {
    it('caps at 30 for high failure penalty', () => {
      const result = applyConfidenceCaps(90, 50, 50)
      expect(result.confidence).toBeLessThanOrEqual(30)
    })

    it('caps at 60 for medium failure penalty', () => {
      const result = applyConfidenceCaps(90, 30, 50)
      expect(result.confidence).toBeLessThanOrEqual(60)
    })

    it('caps at 30 for low review count', () => {
      const result = applyConfidenceCaps(90, 0, 2)
      expect(result.confidence).toBeLessThanOrEqual(30)
    })

    it('returns cap reason', () => {
      const result = applyConfidenceCaps(90, 50, 50)
      expect(result.capReason).toBeDefined()
    })
  })

  describe('computeMissingDataPenalty', () => {
    it('calculates penalty for missing fields', () => {
      const fields = [
        { name: 'rating', present: true },
        { name: 'reviewCount', present: false },
        { name: 'productName', present: false },
      ]
      const result = computeMissingDataPenalty(fields)
      expect(result.penalty).toBe(10)
      expect(result.missingFields).toHaveLength(2)
    })

    it('returns zero penalty when all present', () => {
      const fields = [{ name: 'rating', present: true }]
      const result = computeMissingDataPenalty(fields)
      expect(result.penalty).toBe(0)
    })

    it('caps penalty at 50', () => {
      const fields = Array(15).fill(null).map((_, i) => ({ name: `field${i}`, present: false }))
      const result = computeMissingDataPenalty(fields)
      expect(result.penalty).toBeLessThanOrEqual(50)
    })
  })
})
