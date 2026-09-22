import type { SuspiciousSignal, SafeSignal, SignalResult, ParsedReview, SignalEvidence } from '../types'

export const suspiciousSignals: Record<string, SuspiciousSignal> = {
  temporal_sync: {
    name: 'temporal_sync',
    description: 'Multiple reviews posted within a narrow time window',
    weight: 15,
    example: '47 reviews posted within 48 hours',
    explanation: 'Organic review patterns typically show natural distribution over time. Clustering suggests coordinated posting.',
  },
  burst_pattern: {
    name: 'burst_pattern',
    description: 'Sudden spike in review volume inconsistent with product lifecycle',
    weight: 12,
    example: '200 reviews in one week after months of 2-3 per week',
    explanation: 'Review bursts often indicate campaigns, incentives, or manipulation events.',
  },
  linguistic_mirror: {
    name: 'linguistic_mirror',
    description: 'Multiple reviews share unusual phrasing or sentence structure',
    weight: 18,
    example: 'Three reviews use identical uncommon phrases',
    explanation: 'Independent reviewers rarely use identical phrasing. Shared language suggests common authorship or templates.',
  },
  sentiment_mismatch: {
    name: 'sentiment_mismatch',
    description: 'Review text sentiment contradicts the star rating given',
    weight: 10,
    example: '5-star review with text describing multiple product failures',
    explanation: 'Mismatch between rating and text content suggests the rating may not reflect genuine experience.',
  },
  keyword_spam: {
    name: 'keyword_spam',
    description: 'Reviews contain unnatural repetition of product/brand keywords',
    weight: 14,
    example: '"This XYZ Brand XYZ Product is the best XYZ Product from XYZ Brand"',
    explanation: 'Keyword stuffing is a common manipulation technique to boost search visibility.',
  },
  anonymity_ratio: {
    name: 'anonymity_ratio',
    description: 'High proportion of reviews from anonymous or single-review accounts',
    weight: 12,
    example: '78% of reviewers have only posted this one review',
    explanation: 'Legitimate reviewers typically have a history. High anonymity suggests incentivized or fake reviews.',
  },
  helpful_vote_anomaly: {
    name: 'helpful_vote_anomaly',
    description: 'Helpful votes correlate suspiciously with positive ratings',
    weight: 10,
    example: 'All 5-star reviews have 50+ helpful votes, all 1-star have 0-2',
    explanation: 'Natural helpful vote distribution should not perfectly align with rating polarity.',
  },
  category_drift: {
    name: 'category_drift',
    description: 'Reviews discuss features inconsistent with the product category',
    weight: 16,
    example: 'Electronics reviews discussing fabric quality',
    explanation: 'Reviews for the wrong product indicate listing manipulation or review hijacking.',
  },
  geo_impossible: {
    name: 'geo_impossible',
    description: 'Reviewer locations inconsistent with product availability',
    weight: 11,
    example: 'Product only sold in US, but 60% of reviews from non-US locations',
    explanation: 'Geographic mismatch suggests reviews may not be for this specific product listing.',
  },
  honeypot_hidden: {
    name: 'honeypot_hidden',
    description: 'Hidden review content detected in page DOM',
    weight: 20,
    example: 'Reviews in display:none containers not visible to users',
    explanation: 'Hidden content may be injected to manipulate automated analysis while remaining invisible to users.',
  },
  rating_polarization: {
    name: 'rating_polarization',
    description: 'Bimodal rating distribution with few middle ratings',
    weight: 13,
    example: '70% 5-star, 25% 1-star, 5% everything else',
    explanation: 'Natural products typically show normal distribution. Polarization suggests manipulation on both sides.',
  },
  incentive_disclosure: {
    name: 'incentive_disclosure',
    description: 'Reviews mention receiving product at discount or for free',
    weight: 14,
    example: '"I received this product at a discount in exchange for my honest review"',
    explanation: 'Incentivized reviews tend to be more positive and may not reflect typical customer experience.',
  },
  ai_generated_pattern: {
    name: 'ai_generated_pattern',
    description: 'Review text shows patterns consistent with AI generation',
    weight: 17,
    example: 'Overly structured paragraphs, generic praise, lack of specific detail',
    explanation: 'AI-generated reviews lack authentic experience markers and often follow predictable patterns.',
  },
  verified_inconsistency: {
    name: 'verified_inconsistency',
    description: 'Verified purchase badges present but content contradicts actual purchase',
    weight: 16,
    example: '"Verified Purchase" badge on review that describes never receiving the product',
    explanation: 'Badge systems can be gamed. Content that contradicts purchase suggests badge manipulation.',
  },
  review_hijacking: {
    name: 'review_hijacking',
    description: 'Reviews appear to be for a different product than currently listed',
    weight: 22,
    example: 'Product is a phone case but reviews discuss a phone charger',
    explanation: 'Listing hijacking repurposes old reviews for new products, making reviews irrelevant to current offering.',
  },
  safety_concern: {
    name: 'safety_concern',
    description: 'Reviews mention safety hazards, injuries, or recalls',
    weight: 25,
    example: '"This overheated and caught fire"',
    explanation: 'Safety concerns in reviews are high-signal indicators that warrant immediate attention regardless of overall rating.',
  },
  warranty_complaint: {
    name: 'warranty_complaint',
    description: 'Reviews mention warranty denial or voided coverage',
    weight: 15,
    example: '"Warranty claim denied because of fine print"',
    explanation: 'Warranty issues mentioned in reviews may reveal gaps not disclosed in the product listing.',
  },
  counterfeit_signal: {
    name: 'counterfeit_signal',
    description: 'Reviews suggest product may be counterfeit or different from description',
    weight: 20,
    example: '"Packaging looked different from official product, quality is poor"',
    explanation: 'Counterfeit concerns in reviews suggest the listing may not represent the genuine product.',
  },
  subscription_trap: {
    name: 'subscription_trap',
    description: 'Reviews mention unexpected recurring charges or subscription terms',
    weight: 18,
    example: '"Was charged monthly after free trial, hard to cancel"',
    explanation: 'Subscription traps are a common consumer complaint that may not be clear from the product listing.',
  },
  review_gap: {
    name: 'review_gap',
    description: 'Significant gaps in review timeline suggesting selective deletion',
    weight: 12,
    example: 'No reviews for 6 months, then reviews resume',
    explanation: 'Gaps in review history may indicate negative review removal or listing manipulation.',
  },
}

export const safeSignals: Record<string, SafeSignal> = {
  verified_consistent: {
    name: 'verified_consistent',
    description: 'High ratio of verified purchases with consistent content',
    weight: -10,
    example: '85% verified purchases with detailed, varied review content',
  },
  natural_distribution: {
    name: 'natural_distribution',
    description: 'Rating distribution follows normal bell curve pattern',
    weight: -8,
    example: 'Normal distribution centered around 3.5-4 stars',
  },
  detailed_reviews: {
    name: 'detailed_reviews',
    description: 'Reviews contain specific, verifiable product details',
    weight: -12,
    example: 'Reviews mention specific use cases, measurements, comparisons',
  },
  reviewer_history: {
    name: 'reviewer_history',
    description: 'Reviewers have diverse review histories across products',
    weight: -10,
    example: 'Most reviewers have 10+ reviews across different categories',
  },
  temporal_natural: {
    name: 'temporal_natural',
    description: 'Reviews spread naturally over product lifecycle',
    weight: -8,
    example: 'Steady review flow matching sales patterns',
  },
  mixed_sentiment: {
    name: 'mixed_sentiment',
    description: 'Reviews show natural mix of pros and cons',
    weight: -10,
    example: 'Even positive reviews mention minor drawbacks',
  },
  image_evidence: {
    name: 'image_evidence',
    description: 'Reviews include customer photos showing actual product use',
    weight: -8,
    example: 'Multiple reviews with customer-uploaded photos',
  },
  response_from_seller: {
    name: 'response_from_seller',
    description: 'Seller responds to both positive and negative reviews',
    weight: -5,
    example: 'Seller has responded to 40% of reviews including negative ones',
  },
}

export function getSuspiciousSignal(name: string): SuspiciousSignal | undefined {
  return suspiciousSignals[name]
}

export function getSafeSignal(name: string): SafeSignal | undefined {
  return safeSignals[name]
}

export function getMaxSuspiciousWeight(): number {
  return Math.max(...Object.values(suspiciousSignals).map((s) => s.weight), 0)
}

function makeEvidence(signal: string, snippet: string, source: string): SignalEvidence {
  return { source, snippet: snippet.slice(0, 200) }
}

export interface SignalDetector {
  name: string
  detect: (reviews: ParsedReview[], metadata: Record<string, unknown>) => SignalResult | null
}

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

function detectLinguisticMirror(reviews: ParsedReview[]): SignalResult | null {
  const snippetCounts = new Map<string, number>()
  const duplicates: string[] = []

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

function detectSentimentMismatch(reviews: ParsedReview[]): SignalResult | null {
  const mismatches: { rating: number; snippet: string }[] = []

  const negativeWords = ['terrible', 'awful', 'worst', 'hate', 'broke', 'defective', 'waste', 'disappointing', 'garbage', 'useless']
  const positiveWords = ['excellent', 'amazing', 'love', 'great', 'perfect', 'best', 'wonderful', 'fantastic', 'outstanding']

  for (const review of reviews) {
    if (review.rating === 3) continue;

    const text = review.snippet.toLowerCase()
    let matchCount = 0;

    if (review.rating >= 4) {
      for (const w of negativeWords) {
        if (text.includes(w)) {
          matchCount++;
          if (matchCount >= 2) {
            mismatches.push({ rating: review.rating, snippet: review.snippet })
            break;
          }
        }
      }
    } else if (review.rating <= 2) {
      for (const w of positiveWords) {
        if (text.includes(w)) {
          matchCount++;
          if (matchCount >= 2) {
            mismatches.push({ rating: review.rating, snippet: review.snippet })
            break;
          }
        }
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

function detectDetailedReviews(reviews: ParsedReview[]): SignalResult | null {
  if (reviews.length < 5) return null

  const detailedCount = reviews.filter((r) => r.snippet.length > 200).length
  const ratio = detailedCount / reviews.length

  if (ratio > 0.6) {
    const safeSignal = getSafeSignal('detailed_reviews')
    if (!safeSignal) return null
    return {
      name: 'detailed_reviews',
      weight: safeSignal.weight,
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

  if (uniqueRatings >= 4) {
    const safeSignal = getSafeSignal('natural_distribution')
    if (!safeSignal) return null
    return {
      name: 'natural_distribution',
      weight: safeSignal.weight,
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
  metadata: Record<string, unknown> = {},
): SignalResult[] {
  const results: SignalResult[] = []

  for (const detector of signalDetectors) {
    try {
      const result = detector.detect(reviews, metadata)
      if (result) {
        results.push(result)
      }
    } catch {
      continue
    }
  }

  return results
}

export function aggregateSignals(signals: SignalResult[]): {
  totalWeight: number
  strongCount: number
  weakCount: number
  conflictingCount: number
  suspiciousWeight: number
  safeWeight: number
} {
  let totalWeight = 0
  let strongCount = 0
  let weakCount = 0
  let conflictingCount = 0
  let suspiciousWeight = 0
  let safeWeight = 0

  for (const signal of signals) {
    totalWeight += signal.weight
    if (signal.strength === 'strong') strongCount++
    else if (signal.strength === 'weak') weakCount++
    else if (signal.strength === 'conflicting') conflictingCount++

    if (signal.weight > 0) suspiciousWeight += signal.weight
    else safeWeight += Math.abs(signal.weight)
  }

  return {
    totalWeight,
    strongCount,
    weakCount,
    conflictingCount,
    suspiciousWeight,
    safeWeight,
  }
}
