import type { SignalResult, ScoreResult, Verdict } from '@/types'
import { getCategoryRule, detectCategory, MIN_REVIEWS_FOR_ANALYSIS } from '@/lib/intel'
import { clamp } from '@/lib/security/urlValidator'

function applyCategoryAdjustments(
  signals: SignalResult[],
  category: string,
): SignalResult[] {
  const rule = getCategoryRule(category)
  if (!rule || Object.keys(rule.adjustments).length === 0) return signals

  return signals.map((signal) => {
    const adjustment = rule.adjustments[signal.name]
    if (adjustment) {
      return {
        ...signal,
        weight: Math.round(signal.weight * adjustment),
      }
    }
    return signal
  })
}

function computeRawScore(signals: SignalResult[]): number {
  let total = 0
  for (const signal of signals) {
    total += Math.max(0, signal.weight) // Only positive weights contribute to risk score
  }
  return clamp(total, 0, 100)
}

function determineVerdict(score: number): Verdict {
  if (score <= 30) return 'BUY'
  if (score <= 60) return 'CAUTION'
  return 'AVOID'
}

function computeConfidence(
  signals: SignalResult[],
  reviewCount: number,
  failurePenalty: number,
  hasData: boolean,
): { confidence: number; explanation: string } {
  if (!hasData) {
    return {
      confidence: 0,
      explanation: 'No review data available to analyze.',
    }
  }

  const strongSignals = signals.filter((s) => s.strength === 'strong').length
  const weakSignals = signals.filter((s) => s.strength === 'weak').length
  const conflictingSignals = signals.filter((s) => s.strength === 'conflicting').length

  // Base confidence from signal strength
  let confidence = Math.min(100, (strongSignals * 20) + (weakSignals * 10) + 30)

  // Apply failure penalty
  confidence -= failurePenalty

  // Apply data scarcity penalty
  if (reviewCount < MIN_REVIEWS_FOR_ANALYSIS) {
    confidence = Math.min(confidence, 30)
  } else if (reviewCount < 20) {
    confidence = Math.min(confidence, 60)
  }

  // Apply caps
  if (failurePenalty >= 50) {
    confidence = Math.min(confidence, 30) // Blocked/no data
  } else if (failurePenalty >= 25) {
    confidence = Math.min(confidence, 60) // Partial data
  } else if (strongSignals === 0 && weakSignals <= 2) {
    confidence = Math.min(confidence, 75) // Weak evidence
  }

  if (strongSignals >= 3) {
    confidence = Math.max(confidence, 80) // Strong multi-signal
  }

  confidence = clamp(confidence, 0, 100)

  const parts: string[] = []
  parts.push(`${strongSignals} strong signal(s), ${weakSignals} weak signal(s)`)
  if (conflictingSignals > 0) parts.push(`${conflictingSignals} conflicting signal(s)`)
  if (failurePenalty > 0) parts.push(`-${failurePenalty}% from fetch issues`)
  if (reviewCount < MIN_REVIEWS_FOR_ANALYSIS) parts.push(`only ${reviewCount} review(s)`)

  return {
    confidence,
    explanation: parts.join('. ') + '.',
  }
}

function buildReasons(signals: SignalResult[]): string[] {
  const sorted = [...signals].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))
  return sorted.slice(0, 3).map((s) => s.explanation)
}

function buildLimitations(
  signals: SignalResult[],
  reviewCount: number,
  failurePenalty: number,
): string[] {
  const limitations: string[] = []

  if (reviewCount < MIN_REVIEWS_FOR_ANALYSIS) {
    limitations.push(`Only ${reviewCount} review(s) found. Analysis requires at least ${MIN_REVIEWS_FOR_ANALYSIS} for reliable results.`)
  }

  if (failurePenalty > 0) {
    limitations.push('Some review data could not be accessed. Results may not reflect the full picture.')
  }

  const safetySignals = signals.filter((s) => s.name === 'safety_concern')
  if (safetySignals.length > 0) {
    limitations.push('Safety concerns were raised in reviews. Verify with official sources before purchasing.')
  }

  if (reviewCount === 0) {
    limitations.push('No reviews were accessible. This could mean the product is new, delisted, or the review page is protected.')
  }

  return limitations
}

export function computeScore(
  signals: SignalResult[],
  reviewCount: number,
  failurePenalty: number,
  productName: string | null,
  metadata: Record<string, unknown>,
): ScoreResult {
  const category = productName ? detectCategory(productName, metadata) : 'general'
  const adjustedSignals = applyCategoryAdjustments(signals, category)
  const score = computeRawScore(adjustedSignals)
  const verdict = reviewCount === 0 && failurePenalty >= 50 ? 'UNKNOWN' : determineVerdict(score)
  const confidenceData = computeConfidence(adjustedSignals, reviewCount, failurePenalty, reviewCount > 0)
  const reasons = buildReasons(adjustedSignals)
  const limitations = buildLimitations(adjustedSignals, reviewCount, failurePenalty)

  return {
    score,
    verdict,
    confidence: confidenceData.confidence,
    confidenceExplanation: confidenceData.explanation,
    signals: adjustedSignals,
    reasons,
    limitations,
  }
}
