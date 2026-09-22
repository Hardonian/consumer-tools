import type { SuspiciousSignal, SafeSignal } from '@/types'

export const suspiciousSignals: SuspiciousSignal[] = [
  {
    name: 'temporal_sync',
    description: 'Multiple reviews posted within a narrow time window',
    weight: 15,
    example: '47 reviews posted within 48 hours',
    explanation: 'Organic review patterns typically show natural distribution over time. Clustering suggests coordinated posting.',
  },
  {
    name: 'burst_pattern',
    description: 'Sudden spike in review volume inconsistent with product lifecycle',
    weight: 12,
    example: '200 reviews in one week after months of 2-3 per week',
    explanation: 'Review bursts often indicate campaigns, incentives, or manipulation events.',
  },
  {
    name: 'linguistic_mirror',
    description: 'Multiple reviews share unusual phrasing or sentence structure',
    weight: 18,
    example: 'Three reviews use identical uncommon phrases',
    explanation: 'Independent reviewers rarely use identical phrasing. Shared language suggests common authorship or templates.',
  },
  {
    name: 'sentiment_mismatch',
    description: 'Review text sentiment contradicts the star rating given',
    weight: 10,
    example: '5-star review with text describing multiple product failures',
    explanation: 'Mismatch between rating and text content suggests the rating may not reflect genuine experience.',
  },
  {
    name: 'keyword_spam',
    description: 'Reviews contain unnatural repetition of product/brand keywords',
    weight: 14,
    example: '"This XYZ Brand XYZ Product is the best XYZ Product from XYZ Brand"',
    explanation: 'Keyword stuffing is a common manipulation technique to boost search visibility.',
  },
  {
    name: 'anonymity_ratio',
    description: 'High proportion of reviews from anonymous or single-review accounts',
    weight: 12,
    example: '78% of reviewers have only posted this one review',
    explanation: 'Legitimate reviewers typically have a history. High anonymity suggests incentivized or fake reviews.',
  },
  {
    name: 'helpful_vote_anomaly',
    description: 'Helpful votes correlate suspiciously with positive ratings',
    weight: 10,
    example: 'All 5-star reviews have 50+ helpful votes, all 1-star have 0-2',
    explanation: 'Natural helpful vote distribution should not perfectly align with rating polarity.',
  },
  {
    name: 'category_drift',
    description: 'Reviews discuss features inconsistent with the product category',
    weight: 16,
    example: 'Electronics reviews discussing fabric quality',
    explanation: 'Reviews for the wrong product indicate listing manipulation or review hijacking.',
  },
  {
    name: 'geo_impossible',
    description: 'Reviewer locations inconsistent with product availability',
    weight: 11,
    example: 'Product only sold in US, but 60% of reviews from non-US locations',
    explanation: 'Geographic mismatch suggests reviews may not be for this specific product listing.',
  },
  {
    name: 'honeypot_hidden',
    description: 'Hidden review content detected in page DOM',
    weight: 20,
    example: 'Reviews in display:none containers not visible to users',
    explanation: 'Hidden content may be injected to manipulate automated analysis while remaining invisible to users.',
  },
  {
    name: 'rating_polarization',
    description: 'Bimodal rating distribution with few middle ratings',
    weight: 13,
    example: '70% 5-star, 25% 1-star, 5% everything else',
    explanation: 'Natural products typically show normal distribution. Polarization suggests manipulation on both sides.',
  },
  {
    name: 'incentive_disclosure',
    description: 'Reviews mention receiving product at discount or for free',
    weight: 14,
    example: '"I received this product at a discount in exchange for my honest review"',
    explanation: 'Incentivized reviews tend to be more positive and may not reflect typical customer experience.',
  },
  {
    name: 'ai_generated_pattern',
    description: 'Review text shows patterns consistent with AI generation',
    weight: 17,
    example: 'Overly structured paragraphs, generic praise, lack of specific detail',
    explanation: 'AI-generated reviews lack authentic experience markers and often follow predictable patterns.',
  },
  {
    name: 'verified_inconsistency',
    description: 'Verified purchase badges present but content contradicts actual purchase',
    weight: 16,
    example: '"Verified Purchase" badge on review that describes never receiving the product',
    explanation: 'Badge systems can be gamed. Content that contradicts purchase suggests badge manipulation.',
  },
  {
    name: 'review_hijacking',
    description: 'Reviews appear to be for a different product than currently listed',
    weight: 22,
    example: 'Product is a phone case but reviews discuss a phone charger',
    explanation: 'Listing hijacking repurposes old reviews for new products, making reviews irrelevant to current offering.',
  },
  {
    name: 'safety_concern',
    description: 'Reviews mention safety hazards, injuries, or recalls',
    weight: 25,
    example: '"This overheated and caught fire"',
    explanation: 'Safety concerns in reviews are high-signal indicators that warrant immediate attention regardless of overall rating.',
  },
  {
    name: 'warranty_complaint',
    description: 'Reviews mention warranty denial or voided coverage',
    weight: 15,
    example: '"Warranty claim denied because of fine print"',
    explanation: 'Warranty issues mentioned in reviews may reveal gaps not disclosed in the product listing.',
  },
  {
    name: 'counterfeit_signal',
    description: 'Reviews suggest product may be counterfeit or different from description',
    weight: 20,
    example: '"Packaging looked different from official product, quality is poor"',
    explanation: 'Counterfeit concerns in reviews suggest the listing may not represent the genuine product.',
  },
  {
    name: 'subscription_trap',
    description: 'Reviews mention unexpected recurring charges or subscription terms',
    weight: 18,
    example: '"Was charged monthly after free trial, hard to cancel"',
    explanation: 'Subscription traps are a common consumer complaint that may not be clear from the product listing.',
  },
  {
    name: 'review_gap',
    description: 'Significant gaps in review timeline suggesting selective deletion',
    weight: 12,
    example: 'No reviews for 6 months, then reviews resume',
    explanation: 'Gaps in review history may indicate negative review removal or listing manipulation.',
  },
]

export const safeSignals: SafeSignal[] = [
  {
    name: 'verified_consistent',
    description: 'High ratio of verified purchases with consistent content',
    weight: -10,
    example: '85% verified purchases with detailed, varied review content',
  },
  {
    name: 'natural_distribution',
    description: 'Rating distribution follows normal bell curve pattern',
    weight: -8,
    example: 'Normal distribution centered around 3.5-4 stars',
  },
  {
    name: 'detailed_reviews',
    description: 'Reviews contain specific, verifiable product details',
    weight: -12,
    example: 'Reviews mention specific use cases, measurements, comparisons',
  },
  {
    name: 'reviewer_history',
    description: 'Reviewers have diverse review histories across products',
    weight: -10,
    example: 'Most reviewers have 10+ reviews across different categories',
  },
  {
    name: 'temporal_natural',
    description: 'Reviews spread naturally over product lifecycle',
    weight: -8,
    example: 'Steady review flow matching sales patterns',
  },
  {
    name: 'mixed_sentiment',
    description: 'Reviews show natural mix of pros and cons',
    weight: -10,
    example: 'Even positive reviews mention minor drawbacks',
  },
  {
    name: 'image_evidence',
    description: 'Reviews include customer photos showing actual product use',
    weight: -8,
    example: 'Multiple reviews with customer-uploaded photos',
  },
  {
    name: 'response_from_seller',
    description: 'Seller responds to both positive and negative reviews',
    weight: -5,
    example: 'Seller has responded to 40% of reviews including negative ones',
  },
]

const suspiciousSignalMap = new Map<string, SuspiciousSignal>(
  suspiciousSignals.map(s => [s.name, s])
)

const safeSignalMap = new Map<string, SafeSignal>(
  safeSignals.map(s => [s.name, s])
)

export function getSuspiciousSignal(name: string): SuspiciousSignal | undefined {
  return suspiciousSignalMap.get(name)
}

export function getSafeSignal(name: string): SafeSignal | undefined {
  return safeSignalMap.get(name)
}

export function getMaxSuspiciousWeight(): number {
  return suspiciousSignals.reduce((max, s) => Math.max(max, s.weight), 0)
}
