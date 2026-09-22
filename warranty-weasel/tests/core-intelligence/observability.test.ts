import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  observability,
  createObservabilityLayer,
  recordEvent,
  logInfo,
  logWarn,
  logError,
  logDebug,
  trackLatency,
  trackDegraded,
  trackUnknown,
  getStats
} from '@/lib/core-intelligence/observability/index'
import { ObservabilityEvent } from '@/lib/core-intelligence/types'

describe('ObservabilityLayer', () => {
  let obs: ReturnType<typeof createObservabilityLayer>

  beforeEach(() => {
    obs = createObservabilityLayer()
  })

  describe('recordEvent', () => {
    it('records an event and updates stats', () => {
      const event: ObservabilityEvent = {
        type: 'fetch',
        url: 'https://example.com',
        durationMs: 100,
        success: true,
        degraded: false,
        errorCode: null,
        confidencePenalty: 0,
        timestamp: Date.now(),
      }
      obs.recordEvent(event)

      const stats = obs.getStats()
      expect(stats.totalRequests).toBe(1)
      expect(stats.eventCount).toBe(1)
      expect(obs.getRecentEvents(1)).toEqual([event])
    })

    it('increments degradedCount when event is degraded', () => {
      const event: ObservabilityEvent = {
        type: 'fetch',
        url: 'https://example.com',
        durationMs: 100,
        success: true,
        degraded: true,
        errorCode: null,
        confidencePenalty: 10,
        timestamp: Date.now(),
      }
      obs.recordEvent(event)
      expect(obs.getStats().degradedCount).toBe(1)
    })

    it('enforces maxEvents limit', () => {
      const maxEvents = 10000
      const event: ObservabilityEvent = {
        type: 'fetch',
        url: '',
        durationMs: 0,
        success: true,
        degraded: false,
        errorCode: null,
        confidencePenalty: 0,
        timestamp: 0,
      }

      // To avoid pushing 10001 events, we can use casting to set the events array near the limit
      const anyObs = obs as any
      anyObs.events = new Array(maxEvents).fill(event)

      const newEvent = { ...event, url: 'new-event' }
      obs.recordEvent(newEvent)

      expect(obs.getStats().eventCount).toBe(maxEvents)
      const recent = obs.getRecentEvents(1)
      expect(recent[0].url).toBe('new-event')
    })
  })

  describe('log and sanitization', () => {
    it('enforces maxLogs limit', () => {
      const maxLogs = 5000
      const anyObs = obs as any
      anyObs.logs = new Array(maxLogs).fill({ level: 'info', event: 'old', data: {}, timestamp: 0 })

      obs.log('info', 'new-log')

      expect(obs.getStats().logCount).toBe(maxLogs)
      const recent = obs.getRecentLogs(1)
      expect(recent[0].event).toBe('new-log')
    })

    it('records logs with timestamps', () => {
      obs.log('info', 'test_event', { foo: 'bar' })
      const logs = obs.getRecentLogs(1)
      expect(logs[0].event).toBe('test_event')
      expect(logs[0].level).toBe('info')
      expect(logs[0].data).toEqual({ foo: 'bar' })
      expect(logs[0].timestamp).toBeGreaterThan(0)
    })

    it('redacts sensitive information', () => {
      obs.log('info', 'security_event', {
        password: 'secret123',
        api_token: 'abc-123',
        userEmail: 'test@example.com',
        normalData: 'safe'
      })
      const log = obs.getRecentLogs(1)[0]
      expect(log.data.password).toBe('[REDACTED]')
      expect(log.data.api_token).toBe('[REDACTED]')
      expect(log.data.userEmail).toBe('[REDACTED]')
      expect(log.data.normalData).toBe('safe')
    })

    it('truncates long string values', () => {
      const longString = 'a'.repeat(600)
      obs.log('info', 'long_event', { detail: longString })
      const log = obs.getRecentLogs(1)[0]
      const recordedDetail = log.data.detail as string
      expect(recordedDetail.length).toBe(503) // 500 + '...'
      expect(recordedDetail.endsWith('...')).toBe(true)
    })
  })

  describe('trackLatency', () => {
    it('logs debug level on success', () => {
      obs.trackLatency('op1', 150, true)
      const log = obs.getRecentLogs(1)[0]
      expect(log.level).toBe('debug')
      expect(log.data).toEqual({ operation: 'op1', durationMs: 150, success: true })
    })

    it('logs warn level on failure', () => {
      obs.trackLatency('op2', 500, false)
      const log = obs.getRecentLogs(1)[0]
      expect(log.level).toBe('warn')
      expect(log.data).toEqual({ operation: 'op2', durationMs: 500, success: false })
    })
  })

  describe('trackDegraded', () => {
    it('increments degradedCount and logs the event', () => {
      obs.trackDegraded({
        reason: 'timeout',
        failureId: 'F1',
        fallback: 'cache',
        userMessage: 'Slow',
        confidenceImpact: 5,
        timestamp: Date.now()
      })
      expect(obs.getStats().degradedCount).toBe(1)
      const log = obs.getRecentLogs(1)[0]
      expect(log.event).toBe('degraded_state')
      expect(log.data.reason).toBe('timeout')
    })
  })

  describe('trackUnknown', () => {
    it('increments unknownCount and logs hashed URL', () => {
      const url = 'https://example.com/secret'
      obs.trackUnknown(url, 'no_data')
      expect(obs.getStats().unknownCount).toBe(1)
      const log = obs.getRecentLogs(1)[0]
      expect(log.event).toBe('unknown_verdict')
      expect(log.data.url).not.toBe(url)
      expect(typeof log.data.url).toBe('string')
    })
  })

  describe('Rate calculations', () => {
    it('calculates rates correctly', () => {
      obs.recordEvent({ type: 'fetch', url: '', durationMs: 0, success: true, degraded: true, errorCode: null, confidencePenalty: 0, timestamp: 0 })
      obs.recordEvent({ type: 'fetch', url: '', durationMs: 0, success: true, degraded: false, errorCode: null, confidencePenalty: 0, timestamp: 0 })

      obs.trackUnknown('url1', 'reason')
      // Note: recordEvent increments totalRequests.
      // trackUnknown increments unknownCount but NOT totalRequests in the current implementation.
      // Wait, let's check trackUnknown implementation.
      /*
      trackUnknown(url: string, reason: string): void {
        this.unknownCount++
        this.log('warn', 'unknown_verdict', { url: this.hashUrl(url), reason })
      }
      */
      // And getUnknownRate:
      /*
      getUnknownRate(): number {
        if (this.totalRequests === 0) return 0
        return this.unknownCount / this.totalRequests
      }
      */
      // So it depends on totalRequests from recordEvent.

      expect(obs.getStats().degradedRate).toBe(0.5)
      expect(obs.getStats().unknownRate).toBe(0.5)
    })

    it('returns 0 for rates when no requests', () => {
      expect(obs.getDegradedRate()).toBe(0)
      expect(obs.getUnknownRate()).toBe(0)
    })
  })

  describe('clear', () => {
    it('resets all state', () => {
      obs.recordEvent({ type: 'fetch', url: '', durationMs: 0, success: true, degraded: true, errorCode: null, confidencePenalty: 0, timestamp: 0 })
      obs.log('info', 'test')
      obs.trackUnknown('url', 'reason')

      obs.clear()
      const stats = obs.getStats()
      expect(stats.totalRequests).toBe(0)
      expect(stats.degradedCount).toBe(0)
      expect(stats.unknownCount).toBe(0)
      expect(stats.eventCount).toBe(0)
      expect(stats.logCount).toBe(0)
    })
  })
})

describe('Exported singleton functions', () => {
  beforeEach(() => {
    observability.clear()
  })

  it('works with singleton recordEvent', () => {
    recordEvent({ type: 'signal', url: '', durationMs: 0, success: true, degraded: false, errorCode: null, confidencePenalty: 0, timestamp: 0 })
    expect(getStats().totalRequests).toBe(1)
  })

  it('works with singleton logging functions', () => {
    logInfo('info_ev')
    logWarn('warn_ev')
    logError('error_ev')
    logDebug('debug_ev')

    const stats = getStats()
    expect(stats.logCount).toBe(4)
  })

  it('works with singleton trackLatency', () => {
    trackLatency('singleton_op', 100, true)
    const stats = getStats()
    expect(stats.logCount).toBe(1)
  })

  it('works with singleton trackDegraded and trackUnknown', () => {
    trackDegraded({ reason: 'r', failureId: null, fallback: 'f', userMessage: 'm', confidenceImpact: 0, timestamp: 0 })
    trackUnknown('u', 'r')
    const stats = getStats()
    expect(stats.degradedCount).toBe(1)
    expect(stats.unknownCount).toBe(1)
  })
})
