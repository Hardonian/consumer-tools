import type { DegradedStateContext, Verdict } from './types'
import { trackDegraded } from './observability'

interface DegradedStateResult {
  verdict: Verdict
  confidenceImpact: number
  userMessage: string
  shouldReturnUnknown: boolean
}

const DEGRADED_STATE_HISTORY: DegradedStateContext[] = []
const MAX_HISTORY = 100

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function handleDegradedState(context: {
  reason: string
  failureId: string | null
  fallback: string
  userMessage: string
  confidenceImpact: number
}): DegradedStateResult {
  const fullContext: DegradedStateContext = {
    ...context,
    timestamp: Date.now(),
  }

  DEGRADED_STATE_HISTORY.push(fullContext)
  if (DEGRADED_STATE_HISTORY.length > MAX_HISTORY) {
    DEGRADED_STATE_HISTORY.shift()
  }

  trackDegraded(fullContext)

  const shouldReturnUnknown = context.confidenceImpact >= 50
  const verdict: Verdict = shouldReturnUnknown ? 'UNKNOWN' : 'CAUTION'

  return {
    verdict,
    confidenceImpact: clamp(context.confidenceImpact, 0, 100),
    userMessage: context.userMessage || 'Some review data could not be accessed.',
    shouldReturnUnknown,
  }
}

export function getDegradedHistory(): ReadonlyArray<DegradedStateContext> {
  return [...DEGRADED_STATE_HISTORY]
}

export function getRecentDegradedStates(count = 10): DegradedStateContext[] {
  return DEGRADED_STATE_HISTORY.slice(-count)
}

export function clearDegradedHistory(): void {
  DEGRADED_STATE_HISTORY.length = 0
}

export function getDegradedStats(): {
  total: number
  averageConfidenceImpact: number
  mostCommonReason: string | null
} {
  if (DEGRADED_STATE_HISTORY.length === 0) {
    return { total: 0, averageConfidenceImpact: 0, mostCommonReason: null }
  }

  const totalImpact = DEGRADED_STATE_HISTORY.reduce(
    (sum, ctx) => sum + ctx.confidenceImpact,
    0,
  )

  const reasonCounts: Record<string, number> = {}
  for (const ctx of DEGRADED_STATE_HISTORY) {
    reasonCounts[ctx.reason] = (reasonCounts[ctx.reason] || 0) + 1
  }

  const mostCommonReason = Object.entries(reasonCounts).sort(
    (a, b) => b[1] - a[1],
  )[0]?.[0] ?? null

  return {
    total: DEGRADED_STATE_HISTORY.length,
    averageConfidenceImpact: totalImpact / DEGRADED_STATE_HISTORY.length,
    mostCommonReason,
  }
}
