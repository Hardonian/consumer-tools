import type { SignalResult, ConfidenceResult } from '../types'

interface ConfidenceConfig {
  minReviewsThreshold: number
  lowDataReviewCount: number
  strongSignalBase: number
  weakSignalBase: number
  baseConfidence: number
  maxConfidence: number
  minConfidence: number
}

const DEFAULT_CONFIG: ConfidenceConfig = {
  minReviewsThreshold: 5,
  lowDataReviewCount: 20,
  strongSignalBase: 20,
  weakSignalBase: 10,
  baseConfidence: 30,
  maxConfidence: 100,
  minConfidence: 0,
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function computeConfidence(
  signals: SignalResult[],
  reviewCount: number,
  failurePenalty: number,
  hasData: boolean,
  config: Partial<ConfidenceConfig> = {},
): ConfidenceResult {
  const cfg = { ...DEFAULT_CONFIG, ...config }

  if (!hasData) {
    return {
      confidence: 0,
      explanation: 'No review data available to analyze.',
      capped: false,
      capReason: null,
    }
  }

  const strongSignals = signals.filter((s) => s.strength === 'strong').length
  const weakSignals = signals.filter((s) => s.strength === 'weak').length
  const conflictingSignals = signals.filter((s) => s.strength === 'conflicting').length

  let confidence = Math.min(
    cfg.maxConfidence,
    strongSignals * cfg.strongSignalBase + weakSignals * cfg.weakSignalBase + cfg.baseConfidence,
  )

  confidence -= failurePenalty

  let capReason: string | null = null
  let capped = false

  if (reviewCount < cfg.minReviewsThreshold) {
    confidence = Math.min(confidence, 30)
    capReason = `Only ${reviewCount} review(s) available`
    capped = true
  } else if (reviewCount < cfg.lowDataReviewCount) {
    confidence = Math.min(confidence, 60)
    if (!capReason) capReason = `Limited review sample (${reviewCount})`
    capped = true
  }

  if (failurePenalty >= 50) {
    confidence = Math.min(confidence, 30)
    capReason = 'Blocked or no data accessible'
    capped = true
  } else if (failurePenalty >= 25) {
    confidence = Math.min(confidence, 60)
    capReason = capReason || 'Partial data access'
    capped = true
  } else if (strongSignals === 0 && weakSignals <= 2) {
    confidence = Math.min(confidence, 75)
    capReason = capReason || 'Weak evidence base'
    capped = true
  }

  if (strongSignals >= 3 && failurePenalty < 25) {
    confidence = Math.max(confidence, 80)
  }

  confidence = clamp(confidence, cfg.minConfidence, cfg.maxConfidence)

  const parts: string[] = []
  parts.push(`${strongSignals} strong signal(s), ${weakSignals} weak signal(s)`)
  if (conflictingSignals > 0) parts.push(`${conflictingSignals} conflicting signal(s)`)
  if (failurePenalty > 0) parts.push(`-${failurePenalty}% from fetch issues`)
  if (reviewCount < cfg.minReviewsThreshold) parts.push(`only ${reviewCount} review(s)`)

  return {
    confidence,
    explanation: parts.join('. ') + '.',
    capped,
    capReason,
  }
}

export function applyConfidenceCaps(
  confidence: number,
  failurePenalty: number,
  reviewCount: number,
  minReviewsThreshold: number = 5,
  lowDataReviewCount: number = 20,
): { confidence: number; capReason: string | null } {
  let capReason: string | null = null

  if (failurePenalty >= 50) {
    confidence = Math.min(confidence, 30)
    capReason = 'Blocked or no data accessible'
  } else if (failurePenalty >= 25) {
    confidence = Math.min(confidence, 60)
    capReason = capReason || 'Partial data access'
  }

  if (reviewCount < minReviewsThreshold) {
    confidence = Math.min(confidence, 30)
    capReason = capReason || `Only ${reviewCount} review(s) available`
  } else if (reviewCount < lowDataReviewCount) {
    confidence = Math.min(confidence, 60)
    capReason = capReason || `Limited review sample (${reviewCount})`
  }

  confidence = clamp(confidence, 0, 100)

  return { confidence, capReason }
}

export function computeMissingDataPenalty(
  fields: { name: string; present: boolean }[],
): { penalty: number; missingFields: string[] } {
  const missingFields = fields.filter((f) => !f.present).map((f) => f.name)
  const penalty = missingFields.length * 5
  return { penalty: clamp(penalty, 0, 50), missingFields }
}
