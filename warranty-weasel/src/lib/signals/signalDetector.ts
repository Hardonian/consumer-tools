import type { ParsedReview, SignalResult, SignalEvidence } from '@/types'
import { getSuspiciousSignal, getSafeSignal } from '@/lib/intel'

interface SignalDetector {
  name: string
  detect: (reviews: ParsedReview[], metadata: Record<string, unknown>) => SignalResult | null
}

function makeEvidence(signal: string, snippet: string, source: string): SignalEvidence {
  return { source, snippet: snippet.slice(0, 200) }
}

// Detect temporal clustering - many reviews in short time window
function detectTemporalSync(reviews: ParsedReview[]): SignalResult | null {
  const datedReviews = reviews.filter((r) => r.date)
  if (datedReviews.length < 3) return null

  const dates = datedReviews.map((r) => new Date(r.date!).getTime()).sort((a, b) => a - b)
  const timeSpan = dates[dates.length - 1] - dates[0]
  const daysSpan = timeSpan / (1000 * 60 * 60 * 24)

  if (daysSpan === 0 && datedReviews.length >= 5) {
    const signal = getSuspiciousSignal('temporal_sync')
    if (!signal) return null
    return {
      name: 'temporal_sync',
      weight: signal.weight,
      evidence: [makeEvidence('temporal_sync', `${datedReviews.length} reviews on the same date`, 'date analysis')],
      explanation: `${datedReviews.length} reviews share the same date, suggesting coordinated posting.`,
      strength: 'strong',
    }
  }

  if (daysSpan <= 7 && datedReviews.length >= 10) {
    const signal = getSuspiciousSignal('burst_pattern')
    if (!signal) return null
    return {
      name: 'burst_pattern',
      weight: signal.weight,
      evidence: [makeEvidence('burst_pattern', `${datedReviews.length} reviews within ${Math.ceil(daysSpan)} days`, 'date analysis')],
      explanation: `${datedReviews.length} reviews posted within ${Math.ceil(daysSpan)} days, indicating a possible review campaign.`,
      strength: 'strong',
    }
  }

  return null
}

// Detect duplicate or near-duplicate review text
function detectLinguisticMirror(reviews: ParsedReview[]): SignalResult | null {
  const snippetCounts = new Map<string, number>()
  const duplicates: string[] = []
  const seen = new Set<string>()

  for (const review of reviews) {
    const snippet = review.snippet.toLowerCase().trim()
    if (snippet.length <= 20) continue

    const count = snippetCounts.get(snippet) || 0
    if (count > 0) {
      duplicates.push(snippet.slice(0, 100))
    }
    snippetCounts.set(snippet, count + 1)
  }

  if (duplicates.length > 0) {
    const signal = getSuspiciousSignal('linguistic_mirror')
    if (!signal) return null
    return {
      name: 'linguistic_mirror',
      weight: signal.weight,
      evidence: duplicates.slice(0, 3).map((d) =>
        makeEvidence('linguistic_mirror', d, 'text comparison'),
      ),
      explanation: `${duplicates.length} pair(s) of reviews share identical text.`,
      strength: 'strong',
    }
  }

  return null
}

// Detect sentiment mismatch (rating vs text)
const NEGATIVE_WORDS_REGEX = new RegExp(['terrible', 'awful', 'worst', 'hate', 'broke', 'defective', 'waste', 'disappointing', 'garbage', 'useless'].join('|'), 'g')
const POSITIVE_WORDS_REGEX = new RegExp(['excellent', 'amazing', 'love', 'great', 'perfect', 'best', 'wonderful', 'fantastic', 'outstanding'].join('|'), 'g')

function detectSentimentMismatch(reviews: ParsedReview[]): SignalResult | null {
  const mismatches: { rating: number; snippet: string }[] = []

  for (const review of reviews) {
    const text = review.snippet.toLowerCase()

    if (review.rating >= 4) {
      const negMatch = text.match(NEGATIVE_WORDS_REGEX)
      if (negMatch && new Set(negMatch).size >= 2) {
        mismatches.push({ rating: review.rating, snippet: review.snippet })
      }
    } else if (review.rating <= 2) {
      const posMatch = text.match(POSITIVE_WORDS_REGEX)
      if (posMatch && new Set(posMatch).size >= 2) {
        mismatches.push({ rating: review.rating, snippet: review.snippet })
      }
    }
  }

  if (mismatches.length >= 2) {
    const signal = getSuspiciousSignal('sentiment_mismatch')
    if (!signal) return null
    return {
      name: 'sentiment_mismatch',
      weight: signal.weight,
      evidence: mismatches.slice(0, 3).map((m) =>
        makeEvidence('sentiment_mismatch', `${m.rating}-star review: "${m.snippet.slice(0, 100)}"`, 'sentiment analysis'),
      ),
      explanation: `${mismatches.length} reviews have ratings that conflict with their text content.`,
      strength: 'weak',
    }
  }

  return null
}

// Detect keyword stuffing
function detectKeywordSpam(reviews: ParsedReview[]): SignalResult | null {
  const stuffed: string[] = []

  for (const review of reviews) {
    const text = review.snippet.toLowerCase()
    const words = text.split(/\s+/).filter((w) => w.length > 3)
    if (words.length < 10) continue

    const wordFreq: Record<string, number> = {}
    for (const word of words) {
      wordFreq[word] = (wordFreq[word] || 0) + 1
    }

    const maxFreq = Math.max(...Object.values(wordFreq))
    const density = maxFreq / words.length

    if (density > 0.15 && maxFreq >= 3) {
      stuffed.push(review.snippet.slice(0, 150))
    }
  }

  if (stuffed.length > 0) {
    const signal = getSuspiciousSignal('keyword_spam')
    if (!signal) return null
    return {
      name: 'keyword_spam',
      weight: signal.weight,
      evidence: stuffed.slice(0, 3).map((s) =>
        makeEvidence('keyword_spam', s, 'keyword analysis'),
      ),
      explanation: `${stuffed.length} review(s) show unusually high keyword repetition.`,
      strength: 'weak',
    }
  }

  return null
}

// Detect anonymity ratio
function detectAnonymityRatio(reviews: ParsedReview[]): SignalResult | null {
  if (reviews.length < 5) return null

  const anonymousCount = reviews.filter((r) =>
    r.author === 'Anonymous' || r.author === 'A customer' || r.author === '',
  ).length

  const ratio = anonymousCount / reviews.length

  if (ratio > 0.5) {
    const signal = getSuspiciousSignal('anonymity_ratio')
    if (!signal) return null
    return {
      name: 'anonymity_ratio',
      weight: signal.weight,
      evidence: [makeEvidence('anonymity_ratio', `${anonymousCount}/${reviews.length} reviewers are anonymous`, 'author analysis')],
      explanation: `${Math.round(ratio * 100)}% of reviewers are anonymous.`,
      strength: 'weak',
    }
  }

  return null
}

// Detect rating polarization (bimodal distribution)
function detectRatingPolarization(reviews: ParsedReview[]): SignalResult | null {
  const ratedReviews = reviews.filter((r) => r.rating > 0)
  if (ratedReviews.length < 10) return null

  const fiveStar = ratedReviews.filter((r) => r.rating >= 5).length
  const oneStar = ratedReviews.filter((r) => r.rating <= 1).length
  const total = ratedReviews.length

  const extremeRatio = (fiveStar + oneStar) / total

  if (extremeRatio > 0.8 && fiveStar / total > 0.3 && oneStar / total > 0.15) {
    const signal = getSuspiciousSignal('rating_polarization')
    if (!signal) return null
    return {
      name: 'rating_polarization',
      weight: signal.weight,
      evidence: [makeEvidence('rating_polarization', `${fiveStar} 5-star, ${oneStar} 1-star out of ${total} total`, 'rating distribution')],
      explanation: `Reviews are heavily polarized: ${Math.round((fiveStar / total) * 100)}% 5-star and ${Math.round((oneStar / total) * 100)}% 1-star.`,
      strength: 'strong',
    }
  }

  return null
}

// Detect incentive disclosures
function detectIncentiveDisclosure(reviews: ParsedReview[]): SignalResult | null {
  const incentiveKeywords = [
    'free product', 'free sample', 'discount', 'in exchange for',
    'honest review', 'unbiased review', 'compensated', 'provided by',
    'sent to me', 'received for', 'vine program', 'early reviewer',
  ]

  const incentivized: string[] = []

  for (const review of reviews) {
    const text = review.snippet.toLowerCase() + ' ' + review.title.toLowerCase()
    if (incentiveKeywords.some((kw) => text.includes(kw))) {
      incentivized.push(review.snippet.slice(0, 150))
    }
  }

  if (incentivized.length >= 2) {
    const signal = getSuspiciousSignal('incentive_disclosure')
    if (!signal) return null
    return {
      name: 'incentive_disclosure',
      weight: signal.weight,
      evidence: incentivized.slice(0, 3).map((s) =>
        makeEvidence('incentive_disclosure', s, 'keyword scan'),
      ),
      explanation: `${incentivized.length} review(s) mention receiving the product at a discount or for free.`,
      strength: 'strong',
    }
  }

  return null
}

// Detect safety concerns
function detectSafetyConcerns(reviews: ParsedReview[]): SignalResult | null {
  const safetyKeywords = [
    'fire', 'burn', 'shock', 'injury', 'hurt', 'danger', 'hazard',
    'recall', 'unsafe', 'exploded', 'smoke', 'melt', 'overheat',
    'electric shock', 'cut', 'bleeding', 'poison', 'toxic', 'choking',
  ]

  const safetyReviews: { snippet: string }[] = []

  for (const review of reviews) {
    const text = review.snippet.toLowerCase() + ' ' + review.title.toLowerCase()
    const found = safetyKeywords.filter((kw) => text.includes(kw))
    if (found.length > 0) {
      safetyReviews.push({ snippet: review.snippet.slice(0, 200) })
    }
  }

  if (safetyReviews.length > 0) {
    const signal = getSuspiciousSignal('safety_concern')
    if (!signal) return null
    return {
      name: 'safety_concern',
      weight: signal.weight,
      evidence: safetyReviews.slice(0, 3).map((s) =>
        makeEvidence('safety_concern', s.snippet, 'safety keyword scan'),
      ),
      explanation: `${safetyReviews.length} review(s) mention safety concerns.`,
      strength: 'strong',
    }
  }

  return null
}

// Detect warranty complaints
function detectWarrantyComplaints(reviews: ParsedReview[]): SignalResult | null {
  const warrantyKeywords = [
    'warranty denied', 'warranty void', 'warranty claim', 'guarantee denied',
    'return denied', 'refund denied', 'customer service refused',
    'would not honor', 'warranty does not cover',
  ]

  const warrantyReviews: { snippet: string }[] = []

  for (const review of reviews) {
    const text = review.snippet.toLowerCase() + ' ' + review.title.toLowerCase()
    if (warrantyKeywords.some((kw) => text.includes(kw))) {
      warrantyReviews.push({ snippet: review.snippet.slice(0, 200) })
    }
  }

  if (warrantyReviews.length > 0) {
    const signal = getSuspiciousSignal('warranty_complaint')
    if (!signal) return null
    return {
      name: 'warranty_complaint',
      weight: signal.weight,
      evidence: warrantyReviews.slice(0, 3).map((s) =>
        makeEvidence('warranty_complaint', s.snippet, 'warranty keyword scan'),
      ),
      explanation: `${warrantyReviews.length} review(s) mention warranty or guarantee issues.`,
      strength: 'strong',
    }
  }

  return null
}

// Detect counterfeit signals
function detectCounterfeitSignals(reviews: ParsedReview[]): SignalResult | null {
  const counterfeitKeywords = [
    'fake', 'counterfeit', 'knockoff', 'knock-off', 'replica',
    'not genuine', 'not authentic', 'different from picture',
    'not as described', 'packaging different', 'cheap quality',
  ]

  const counterfeitReviews: { snippet: string }[] = []

  for (const review of reviews) {
    const text = review.snippet.toLowerCase() + ' ' + review.title.toLowerCase()
    if (counterfeitKeywords.some((kw) => text.includes(kw))) {
      counterfeitReviews.push({ snippet: review.snippet.slice(0, 200) })
    }
  }

  if (counterfeitReviews.length >= 2) {
    const signal = getSuspiciousSignal('counterfeit_signal')
    if (!signal) return null
    return {
      name: 'counterfeit_signal',
      weight: signal.weight,
      evidence: counterfeitReviews.slice(0, 3).map((s) =>
        makeEvidence('counterfeit_signal', s.snippet, 'counterfeit keyword scan'),
      ),
      explanation: `${counterfeitReviews.length} review(s) suggest the product may not be genuine.`,
      strength: 'strong',
    }
  }

  return null
}

// Detect subscription trap mentions
function detectSubscriptionTrap(reviews: ParsedReview[]): SignalResult | null {
  const subscriptionKeywords = [
    'subscription', 'recurring charge', 'monthly charge', 'auto renew',
    'auto-renew', 'hard to cancel', 'charged again', 'free trial',
    'continues to charge', 'cannot cancel',
  ]

  const subscriptionReviews: { snippet: string }[] = []

  for (const review of reviews) {
    const text = review.snippet.toLowerCase() + ' ' + review.title.toLowerCase()
    if (subscriptionKeywords.some((kw) => text.includes(kw))) {
      subscriptionReviews.push({ snippet: review.snippet.slice(0, 200) })
    }
  }

  if (subscriptionReviews.length > 0) {
    const signal = getSuspiciousSignal('subscription_trap')
    if (!signal) return null
    return {
      name: 'subscription_trap',
      weight: signal.weight,
      evidence: subscriptionReviews.slice(0, 3).map((s) =>
        makeEvidence('subscription_trap', s.snippet, 'subscription keyword scan'),
      ),
      explanation: `${subscriptionReviews.length} review(s) mention unexpected recurring charges or subscription issues.`,
      strength: 'strong',
    }
  }

  return null
}

// Detect verified purchase ratio
function detectVerifiedRatio(reviews: ParsedReview[]): SignalResult | null {
  if (reviews.length < 5) return null

  const verifiedCount = reviews.filter((r) => r.verified).length
  const ratio = verifiedCount / reviews.length

  if (ratio < 0.2) {
    const signal = getSuspiciousSignal('anonymity_ratio')
    if (!signal) return null
    return {
      name: 'anonymity_ratio',
      weight: signal.weight,
      evidence: [makeEvidence('anonymity_ratio', `Only ${verifiedCount}/${reviews.length} reviews are verified`, 'verification analysis')],
      explanation: `Only ${Math.round(ratio * 100)}% of reviews show verified purchase status.`,
      strength: 'weak',
    }
  }

  return null
}

// Detect AI-generated patterns
function detectAIGeneratedPattern(reviews: ParsedReview[]): SignalResult | null {
  const aiIndicators = [
    /\b(in conclusion|overall|i would recommend|to summarize|all in all)\b/i,
    /\b(this product is (a must-have|a game changer|worth every penny))\b/i,
    /^(great product|excellent product|good product|nice product|perfect product)[.!]$/i,
    /\b(five stars|highly recommend|would buy again)\b.{0,50}\b(five stars|highly recommend|would buy again)\b/i,
  ]

  const aiReviews: { snippet: string }[] = []

  for (const review of reviews) {
    const text = review.snippet.trim()
    if (text.length < 30 || text.length > 500) continue

    const matchCount = aiIndicators.filter((pattern) => pattern.test(text)).length
    if (matchCount >= 2) {
      aiReviews.push({ snippet: review.snippet.slice(0, 200) })
    }
  }

  if (aiReviews.length >= 3) {
    const signal = getSuspiciousSignal('ai_generated_pattern')
    if (!signal) return null
    return {
      name: 'ai_generated_pattern',
      weight: signal.weight,
      evidence: aiReviews.slice(0, 3).map((s) =>
        makeEvidence('ai_generated_pattern', s.snippet, 'pattern analysis'),
      ),
      explanation: `${aiReviews.length} review(s) show patterns consistent with automated generation.`,
      strength: 'weak',
    }
  }

  return null
}

// Safe signal detectors
function detectDetailedReviews(reviews: ParsedReview[]): SignalResult | null {
  if (reviews.length < 5) return null

  const detailedCount = reviews.filter((r) => r.snippet.length > 200).length
  const ratio = detailedCount / reviews.length

  if (ratio > 0.6) {
    const safeSignal = getSafeSignal('detailed_reviews')
    if (!safeSignal) return null
    return {
      name: 'detailed_reviews',
      weight: safeSignal.weight, // weight is already negative in registry
      evidence: [makeEvidence('detailed_reviews', `${detailedCount}/${reviews.length} reviews are detailed (>200 chars)`, 'content analysis')],
      explanation: `${Math.round(ratio * 100)}% of reviews contain detailed content, suggesting authentic experiences.`,
      strength: 'strong',
    }
  }

  return null
}

function detectNaturalDistribution(reviews: ParsedReview[]): SignalResult | null {
  const ratedReviews = reviews.filter((r) => r.rating > 0)
  if (ratedReviews.length < 10) return null

  const ratings = ratedReviews.map((r) => r.rating)
  const uniqueRatings = new Set(ratings).size

  // Natural products typically have at least 3 different rating values
  if (uniqueRatings >= 4) {
    const safeSignal = getSafeSignal('natural_distribution')
    if (!safeSignal) return null
    return {
      name: 'natural_distribution',
      weight: safeSignal.weight, // weight is already negative
      evidence: [makeEvidence('natural_distribution', `${uniqueRatings} different rating values present`, 'rating distribution')],
      explanation: `Reviews show ${uniqueRatings} different rating levels, suggesting organic feedback.`,
      strength: 'weak',
    }
  }

  return null
}

export const signalDetectors: SignalDetector[] = [
  { name: 'temporal_sync', detect: (reviews) => detectTemporalSync(reviews) },
  { name: 'linguistic_mirror', detect: (reviews) => detectLinguisticMirror(reviews) },
  { name: 'sentiment_mismatch', detect: (reviews) => detectSentimentMismatch(reviews) },
  { name: 'keyword_spam', detect: (reviews) => detectKeywordSpam(reviews) },
  { name: 'anonymity_ratio', detect: (reviews) => detectAnonymityRatio(reviews) },
  { name: 'rating_polarization', detect: (reviews) => detectRatingPolarization(reviews) },
  { name: 'incentive_disclosure', detect: (reviews) => detectIncentiveDisclosure(reviews) },
  { name: 'safety_concern', detect: (reviews) => detectSafetyConcerns(reviews) },
  { name: 'warranty_complaint', detect: (reviews) => detectWarrantyComplaints(reviews) },
  { name: 'counterfeit_signal', detect: (reviews) => detectCounterfeitSignals(reviews) },
  { name: 'subscription_trap', detect: (reviews) => detectSubscriptionTrap(reviews) },
  { name: 'verified_ratio', detect: (reviews) => detectVerifiedRatio(reviews) },
  { name: 'ai_generated_pattern', detect: (reviews) => detectAIGeneratedPattern(reviews) },
  { name: 'detailed_reviews', detect: (reviews) => detectDetailedReviews(reviews) },
  { name: 'natural_distribution', detect: (reviews) => detectNaturalDistribution(reviews) },
]

export function runSignalDetection(
  reviews: ParsedReview[],
  metadata: Record<string, unknown>,
): SignalResult[] {
  const results: SignalResult[] = []

  for (const detector of signalDetectors) {
    try {
      const result = detector.detect(reviews, metadata)
      if (result) {
        results.push(result)
      }
    } catch {
      // Detector failed silently - don't crash the analysis
      continue
    }
  }

  return results
}
