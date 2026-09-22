import { describe, it, expect } from 'vitest'
import { computeScore } from '@/lib/scoring/scoreCalculator'
import type { SignalResult } from '@/types'

function makeSignal(overrides: Partial<SignalResult> = {}): SignalResult {
  return {
    name: 'test_signal',
    weight: 10,
    evidence: [{ source: 'test', snippet: 'test snippet' }],
    explanation: 'Test signal explanation',
    strength: 'weak',
    ...overrides,
  }
}

describe('scoreCalculator', () => {
  it('returns BUY verdict for low score', () => {
    const result = computeScore([], 20, 0, 'Test Product', {})
    expect(result.verdict).toBe('BUY')
  })

  it('returns CAUTION verdict for moderate score', () => {
    const signals: SignalResult[] = [
      makeSignal({ name: 'temporal_sync', weight: 15, strength: 'strong' }),
      makeSignal({ name: 'linguistic_mirror', weight: 18, strength: 'strong' }),
    ]
    const result = computeScore(signals, 20, 0, 'Test Product', {})
    expect(result.verdict).toBe('CAUTION')
  })

  it('returns AVOID verdict for high score', () => {
    const signals: SignalResult[] = [
      makeSignal({ name: 'safety_concern', weight: 25, strength: 'strong' }),
      makeSignal({ name: 'counterfeit_signal', weight: 20, strength: 'strong' }),
      makeSignal({ name: 'review_hijacking', weight: 22, strength: 'strong' }),
      makeSignal({ name: 'temporal_sync', weight: 15, strength: 'strong' }),
    ]
    const result = computeScore(signals, 20, 0, 'Test Product', {})
    expect(result.verdict).toBe('AVOID')
  })

  it('returns UNKNOWN when no data and high failure penalty', () => {
    const result = computeScore([], 0, 50, null, {})
    expect(result.verdict).toBe('UNKNOWN')
  })

  it('applies category adjustments for electronics', () => {
    const signals: SignalResult[] = [
      makeSignal({ name: 'safety_concern', weight: 25, strength: 'strong' }),
    ]
    const result = computeScore(signals, 20, 0, 'Wireless Headphones', {})
    // Electronics has 1.5x safety_concern adjustment
    const safetySignal = result.signals.find((s) => s.name === 'safety_concern')
    expect(safetySignal?.weight).toBe(38) // 25 * 1.5 = 37.5, rounded
  })

  it('caps confidence for blocked/no data', () => {
    const result = computeScore([], 0, 50, null, {})
    expect(result.confidence).toBeLessThanOrEqual(30)
  })

  it('caps confidence for partial data', () => {
    const result = computeScore([], 5, 25, 'Test Product', {})
    expect(result.confidence).toBeLessThanOrEqual(60)
  })

  it('caps confidence for weak evidence', () => {
    const signals: SignalResult[] = [
      makeSignal({ weight: 5, strength: 'weak' }),
    ]
    const result = computeScore(signals, 10, 0, 'Test Product', {})
    expect(result.confidence).toBeLessThanOrEqual(75)
  })

  it('boosts confidence for strong multi-signal', () => {
    const signals: SignalResult[] = [
      makeSignal({ name: 'safety_concern', weight: 25, strength: 'strong' }),
      makeSignal({ name: 'counterfeit_signal', weight: 20, strength: 'strong' }),
      makeSignal({ name: 'review_hijacking', weight: 22, strength: 'strong' }),
    ]
    const result = computeScore(signals, 20, 0, 'Test Product', {})
    expect(result.confidence).toBeGreaterThanOrEqual(80)
  })

  it('limits confidence for few reviews', () => {
    const result = computeScore([], 3, 0, 'Test Product', {})
    expect(result.confidence).toBeLessThanOrEqual(30)
  })

  it('provides confidence explanation', () => {
    const result = computeScore([], 20, 10, 'Test Product', {})
    expect(result.confidenceExplanation.length).toBeGreaterThan(0)
  })

  it('returns top 3 reasons', () => {
    const signals: SignalResult[] = [
      makeSignal({ name: 'signal_a', weight: 20, strength: 'strong' }),
      makeSignal({ name: 'signal_b', weight: 15, strength: 'strong' }),
      makeSignal({ name: 'signal_c', weight: 10, strength: 'weak' }),
      makeSignal({ name: 'signal_d', weight: 5, strength: 'weak' }),
    ]
    const result = computeScore(signals, 20, 0, 'Test Product', {})
    expect(result.reasons.length).toBeLessThanOrEqual(3)
  })

  it('includes limitations for low review count', () => {
    const result = computeScore([], 2, 0, 'Test Product', {})
    expect(result.limitations.some((l) => l.includes('review'))).toBe(true)
  })

  it('includes limitations for failure penalty', () => {
    const result = computeScore([], 20, 15, 'Test Product', {})
    expect(result.limitations.some((l) => l.includes('access'))).toBe(true)
  })

  it('includes safety limitation when safety signal present', () => {
    const signals: SignalResult[] = [
      makeSignal({ name: 'safety_concern', weight: 25, strength: 'strong' }),
    ]
    const result = computeScore(signals, 20, 0, 'Test Product', {})
    expect(result.limitations.some((l) => l.includes('Safety'))).toBe(true)
  })

  it('score is bounded 0-100', () => {
    const signals: SignalResult[] = Array.from({ length: 20 }, (_, i) =>
      makeSignal({ name: `signal_${i}`, weight: 10, strength: 'weak' }),
    )
    const result = computeScore(signals, 20, 0, 'Test Product', {})
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })
})
