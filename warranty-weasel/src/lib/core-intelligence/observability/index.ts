import type { ObservabilityEvent, DegradedStateContext } from '../types'

type LogLevel = 'info' | 'warn' | 'error' | 'debug'

interface LogEntry {
  level: LogLevel
  event: string
  data: Record<string, unknown>
  timestamp: number
}

class ObservabilityLayer {
  private events: ObservabilityEvent[] = []
  private logs: LogEntry[] = []
  private maxEvents = 10000
  private maxLogs = 5000
  private degradedCount = 0
  private unknownCount = 0
  private totalRequests = 0

  recordEvent(event: ObservabilityEvent): void {
    this.events.push(event)
    this.totalRequests++
    if (event.degraded) this.degradedCount++

    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }
  }

  log(level: LogLevel, event: string, data: Record<string, unknown> = {}): void {
    const sanitizedData = this.sanitizeData(data)
    this.logs.push({ level, event, data: sanitizedData, timestamp: Date.now() })

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  trackLatency(operation: string, durationMs: number, success: boolean): void {
    const level = success ? 'debug' : 'warn'
    this.log(level, 'latency', { operation, durationMs, success })
  }

  trackDegraded(context: DegradedStateContext): void {
    this.degradedCount++
    this.log('warn', 'degraded_state', {
      reason: context.reason,
      failureId: context.failureId,
      confidenceImpact: context.confidenceImpact,
    })
  }

  trackUnknown(url: string, reason: string): void {
    this.unknownCount++
    this.log('warn', 'unknown_verdict', { url: this.hashUrl(url), reason })
  }

  getDegradedRate(): number {
    if (this.totalRequests === 0) return 0
    return this.degradedCount / this.totalRequests
  }

  getUnknownRate(): number {
    if (this.totalRequests === 0) return 0
    return this.unknownCount / this.totalRequests
  }

  getRecentEvents(count = 100): ObservabilityEvent[] {
    return this.events.slice(-count)
  }

  getRecentLogs(count = 100): LogEntry[] {
    return this.logs.slice(-count)
  }

  getStats() {
    return {
      totalRequests: this.totalRequests,
      degradedCount: this.degradedCount,
      unknownCount: this.unknownCount,
      degradedRate: this.getDegradedRate(),
      unknownRate: this.getUnknownRate(),
      eventCount: this.events.length,
      logCount: this.logs.length,
    }
  }

  clear(): void {
    this.events = []
    this.logs = []
    this.degradedCount = 0
    this.unknownCount = 0
    this.totalRequests = 0
  }

  private sanitizeData(data: Record<string, unknown>): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {}
    const sensitiveKeys = ['cookie', 'authorization', 'token', 'password', 'email', 'phone', 'name', 'address']

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'string' && value.length > 500) {
        sanitized[key] = value.slice(0, 500) + '...'
      } else {
        sanitized[key] = value
      }
    }
    return sanitized
  }

  private hashUrl(url: string): string {
    let hash = 0
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }
    return hash.toString(16)
  }
}

export const observability = new ObservabilityLayer()

export function createObservabilityLayer(): ObservabilityLayer {
  return new ObservabilityLayer()
}

export function recordEvent(event: ObservabilityEvent): void {
  observability.recordEvent(event)
}

export function logInfo(event: string, data: Record<string, unknown> = {}): void {
  observability.log('info', event, data)
}

export function logWarn(event: string, data: Record<string, unknown> = {}): void {
  observability.log('warn', event, data)
}

export function logError(event: string, data: Record<string, unknown> = {}): void {
  observability.log('error', event, data)
}

export function logDebug(event: string, data: Record<string, unknown> = {}): void {
  observability.log('debug', event, data)
}

export function trackLatency(operation: string, durationMs: number, success: boolean): void {
  observability.trackLatency(operation, durationMs, success)
}

export function trackDegraded(context: DegradedStateContext): void {
  observability.trackDegraded(context)
}

export function trackUnknown(url: string, reason: string): void {
  observability.trackUnknown(url, reason)
}

export function getStats(): ReturnType<ObservabilityLayer['getStats']> {
  return observability.getStats()
}
