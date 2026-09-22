import { describe, it, expect, beforeEach } from 'vitest'
import {
  handleDegradedState,
  getDegradedHistory,
  getRecentDegradedStates,
  clearDegradedHistory,
  getDegradedStats,
} from '@/lib/core-intelligence/degradedState'

describe('degraded state handler', () => {
  beforeEach(() => {
    clearDegradedHistory()
  })

  describe('handleDegradedState', () => {
    it('returns UNKNOWN for high confidence impact', () => {
      const result = handleDegradedState({
        reason: 'captcha_block',
        failureId: 'FS-02',
        fallback: 'return-unknown',
        userMessage: 'CAPTCHA detected',
        confidenceImpact: 50,
      })
      expect(result.verdict).toBe('UNKNOWN')
      expect(result.shouldReturnUnknown).toBe(true)
    })

    it('returns CAUTION for medium confidence impact', () => {
      const result = handleDegradedState({
        reason: 'partial_data',
        failureId: 'FS-12',
        fallback: 'partial-parse',
        userMessage: 'Partial data',
        confidenceImpact: 25,
      })
      expect(result.verdict).toBe('CAUTION')
      expect(result.shouldReturnUnknown).toBe(false)
    })

    it('clamps confidence impact', () => {
      const result = handleDegradedState({
        reason: 'test',
        failureId: null,
        fallback: 'none',
        userMessage: 'Test',
        confidenceImpact: 200,
      })
      expect(result.confidenceImpact).toBeLessThanOrEqual(100)
    })

    it('records to history', () => {
      handleDegradedState({
        reason: 'test',
        failureId: 'FS-01',
        fallback: 'retry',
        userMessage: 'Test',
        confidenceImpact: 20,
      })
      const history = getDegradedHistory()
      expect(history.length).toBe(1)
      expect(history[0].reason).toBe('test')
    })
  })

  describe('getDegradedHistory', () => {
    it('returns copy of history', () => {
      handleDegradedState({
        reason: 'test',
        failureId: null,
        fallback: 'none',
        userMessage: 'Test',
        confidenceImpact: 10,
      })
      const history1 = getDegradedHistory()
      const history2 = getDegradedHistory()
      expect(history1).not.toBe(history2)
    })
  })

  describe('getRecentDegradedStates', () => {
    it('returns last N states', () => {
      for (let i = 0; i < 5; i++) {
        handleDegradedState({
          reason: `test-${i}`,
          failureId: null,
          fallback: 'none',
          userMessage: `Test ${i}`,
          confidenceImpact: 10,
        })
      }
      const recent = getRecentDegradedStates(2)
      expect(recent.length).toBe(2)
      expect(recent[0].reason).toBe('test-3')
    })
  })

  describe('getDegradedStats', () => {
    it('returns zero stats when empty', () => {
      const stats = getDegradedStats()
      expect(stats.total).toBe(0)
      expect(stats.mostCommonReason).toBeNull()
    })

    it('calculates average confidence impact', () => {
      handleDegradedState({
        reason: 'a',
        failureId: null,
        fallback: 'none',
        userMessage: '',
        confidenceImpact: 20,
      })
      handleDegradedState({
        reason: 'a',
        failureId: null,
        fallback: 'none',
        userMessage: '',
        confidenceImpact: 40,
      })
      const stats = getDegradedStats()
      expect(stats.total).toBe(2)
      expect(stats.averageConfidenceImpact).toBe(30)
      expect(stats.mostCommonReason).toBe('a')
    })
  })
})
