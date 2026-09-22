import type { SignalResult, ScoreResult, Verdict, CategoryRule } from './types'
import { clamp } from './utils'

const CATEGORY_RULES: Record<string, CategoryRule> = {
  electronics: {
    category: 'electronics',
    adjustments: {
      safety_concern: 1.5,
      warranty_complaint: 1.3,
      counterfeit_signal: 1.4,
      verified_inconsistency: 1.2,
      ai_generated_pattern: 1.1,
      detailed_reviews: 1.2,
    },
    description: 'Electronics carry higher risk for counterfeits, safety issues, and warranty problems.',
  },
  tools: {
    category: 'tools',
    adjustments: {
      safety_concern: 1.6,
      warranty_complaint: 1.4,
      verified_consistent: 1.1,
      detailed_reviews: 1.2,
    },
    description: 'Tools carry significant safety risk. Safety concerns weighted heavily.',
  },
  apparel: {
    category: 'apparel',
    adjustments: {
      category_drift: 1.3,
      review_hijacking: 1.2,
      linguistic_mirror: 1.2,
      mixed_sentiment: 1.1,
    },
    description: 'Apparel has high variant confusion and review hijacking risk.',
  },
  home_goods: {
    category: 'home_goods',
    adjustments: {
      safety_concern: 1.3,
      detailed_reviews: 1.1,
      temporal_natural: 1.1,
    },
    description: 'Home goods have moderate safety risk. Detailed reviews are more reliable.',
  },
  digital: {
    category: 'digital',
    adjustments: {
      subscription_trap: 1.5,
      review_gap: 1.2,
      verified_inconsistency: 1.3,
      anonymity_ratio: 1.2,
    },
    description: 'Digital products have high subscription trap and verification risks.',
  },
  food_supplement: {
    category: 'food_supplement',
    adjustments: {
      safety_concern: 1.6,
      counterfeit_signal: 1.4,
      incentive_disclosure: 1.3,
      regulatory_concern: 1.5,
    },
    description: 'Food and supplements carry high safety and regulatory risk.',
  },
  automotive: {
    category: 'automotive',
    adjustments: {
      safety_concern: 1.7,
      warranty_complaint: 1.5,
      verified_consistent: 1.2,
      detailed_reviews: 1.3,
    },
    description: 'Automotive products have the highest safety weighting. Verified reviews carry more weight.',
  },
  general: {
    category: 'general',
    adjustments: {},
    description: 'Default category with no adjustments applied.',
  },
}

const MIN_REVIEWS_FOR_ANALYSIS = 5

export function detectCategory(productName: string, metadata: Record<string, unknown> = {}): string {
  const name = productName.toLowerCase()
  const description = String(metadata.description || '').toLowerCase()
  const combined = `${name} ${description}`

  if (/\b(phone|laptop|tablet|headphones?|speakers?|cameras?|tv|monitor|charger|cables?|batter(?:y|ies)|usb|bluetooth|wireless|electronics?)\b/i.test(combined)) return 'electronics'
  if (/\b(drill|saw|hammer|wrench|tools?|sander|grinder|driver|pliers|socket)\b/i.test(combined)) return 'tools'
  if (/\b(shirts?|pants?|dress|shoes?|jackets?|coats?|hats?|socks?|apparel|clothing|fashion|wear)\b/i.test(combined)) return 'apparel'
  if (/\b(furniture|lamps?|curtains?|rugs?|pillows?|blankets?|decor|kitchen|cookware|appliances?)\b/i.test(combined)) return 'home_goods'
  if (/\b(software|apps?|subscription|games?|downloads?|digital|ebooks?|courses?|streaming)\b/i.test(combined)) return 'digital'
  if (/\b(vitamins?|supplements?|protein|pills?|capsules?|powders?|herbs?|organic|health)\b/i.test(combined)) return 'food_supplement'
  if (/\b(car|auto|vehicles?|tires?|oil|brakes?|filters?|motors?|engines?|automotive)\b/i.test(combined)) return 'automotive'
  return 'general'
}

export function getCategoryRule(category: string): CategoryRule | undefined {
  return CATEGORY_RULES[category.toLowerCase()]
}

function applyCategoryAdjustments(signals: SignalResult[], category: string): SignalResult[] {
  const rule = getCategoryRule(category)
  if (!rule || Object.keys(rule.adjustments).length === 0) return signals

  return signals.map((signal) => {
    const adjustment = rule.adjustments[signal.name]
    if (adjustment) {
      return { ...signal, weight: Math.round(signal.weight * adjustment) }
    }
    return signal
  })
}

function computeRawScore(signals: SignalResult[]): number {
  let total = 0
  for (const signal of signals) {
    total += Math.max(0, signal.weight)
  }
  return clamp(total, 0, 100)
}

function determineVerdict(score: number, reviewCount: number, failurePenalty: number): Verdict {
  if (reviewCount === 0 && failurePenalty >= 50) return 'UNKNOWN'
  if (score <= 30) return 'BUY'
  if (score <= 60) return 'CAUTION'
  return 'AVOID'
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
  metadata: Record<string, unknown> = {},
  confidence: number,
  confidenceExplanation: string,
): ScoreResult {
  const category = productName ? detectCategory(productName, metadata) : 'general'
  const adjustedSignals = applyCategoryAdjustments(signals, category)
  const score = computeRawScore(adjustedSignals)
  const verdict = determineVerdict(score, reviewCount, failurePenalty)
  const reasons = buildReasons(adjustedSignals)
  const limitations = buildLimitations(adjustedSignals, reviewCount, failurePenalty)

  return {
    score,
    verdict,
    confidence,
    confidenceExplanation,
    signals: adjustedSignals,
    reasons,
    limitations,
  }
}

export { MIN_REVIEWS_FOR_ANALYSIS, CATEGORY_RULES }
