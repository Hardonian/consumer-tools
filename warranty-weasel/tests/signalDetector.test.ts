import { describe, it, expect } from 'vitest'
import { runSignalDetection } from '@/lib/signals/signalDetector'
import type { ParsedReview } from '@/types'

function makeReview(overrides: Partial<ParsedReview> = {}): ParsedReview {
  return {
    id: 'review-0',
    title: 'Test Review',
    rating: 5,
    date: '2024-01-15',
    author: 'TestUser',
    verified: true,
    snippet: 'This is a great product with excellent quality. I would recommend it to anyone looking for a reliable item.',
    helpfulVotes: 0,
    rawHtml: '',
    ...overrides,
  }
}

describe('signalDetector', () => {
  it('detects temporal sync when all reviews on same date', () => {
    const reviews: ParsedReview[] = Array.from({ length: 6 }, (_, i) =>
      makeReview({ id: `r-${i}`, date: '2024-01-15', snippet: `Review ${i} content here with enough text` }),
    )

    const signals = runSignalDetection(reviews, {})
    const temporalSignal = signals.find((s) => s.name === 'temporal_sync')
    expect(temporalSignal).toBeDefined()
    expect(temporalSignal?.strength).toBe('strong')
  })

  it('detects burst pattern when many reviews in short window', () => {
    const reviews: ParsedReview[] = Array.from({ length: 12 }, (_, i) =>
      makeReview({
        id: `r-${i}`,
        date: `2024-01-${String(10 + (i % 5)).padStart(2, '0')}`,
        snippet: `Review ${i} with sufficient content for analysis purposes here`,
      }),
    )

    const signals = runSignalDetection(reviews, {})
    const burstSignal = signals.find((s) => s.name === 'burst_pattern')
    expect(burstSignal).toBeDefined()
  })

  it('detects linguistic mirror with duplicate reviews', () => {
    const duplicateText = 'This product is absolutely amazing and I love everything about it. Best purchase ever made.'
    const reviews: ParsedReview[] = [
      makeReview({ id: 'r-0', snippet: duplicateText }),
      makeReview({ id: 'r-1', snippet: duplicateText }),
      makeReview({ id: 'r-2', snippet: 'A completely different review with other content.' }),
    ]

    const signals = runSignalDetection(reviews, {})
    const mirrorSignal = signals.find((s) => s.name === 'linguistic_mirror')
    expect(mirrorSignal).toBeDefined()
  })

  it('detects sentiment mismatch', () => {
    const reviews: ParsedReview[] = [
      makeReview({ id: 'r-0', rating: 5, snippet: 'This is terrible and awful. The worst product I hate it. Total waste of money.' }),
      makeReview({ id: 'r-1', rating: 5, snippet: 'Awful experience, broke immediately, defective garbage product.' }),
      makeReview({ id: 'r-2', snippet: 'Good product, works as expected.' }),
    ]

    const signals = runSignalDetection(reviews, {})
    const mismatchSignal = signals.find((s) => s.name === 'sentiment_mismatch')
    expect(mismatchSignal).toBeDefined()
  })

  it('detects safety concerns', () => {
    const reviews: ParsedReview[] = [
      makeReview({ id: 'r-0', snippet: 'This product caught fire and started to smoke. Very dangerous hazard.' }),
      makeReview({ id: 'r-1', snippet: 'Great product, works well.' }),
    ]

    const signals = runSignalDetection(reviews, {})
    const safetySignal = signals.find((s) => s.name === 'safety_concern')
    expect(safetySignal).toBeDefined()
    expect(safetySignal?.strength).toBe('strong')
  })

  it('detects warranty complaints', () => {
    const reviews: ParsedReview[] = [
      makeReview({ id: 'r-0', snippet: 'Warranty claim was denied. They would not honor the guarantee at all.' }),
      makeReview({ id: 'r-1', snippet: 'Good product.' }),
    ]

    const signals = runSignalDetection(reviews, {})
    const warrantySignal = signals.find((s) => s.name === 'warranty_complaint')
    expect(warrantySignal).toBeDefined()
  })

  it('detects counterfeit signals', () => {
    const reviews: ParsedReview[] = [
      makeReview({ id: 'r-0', snippet: 'This is fake, not genuine. Packaging different from official product.' }),
      makeReview({ id: 'r-1', snippet: 'Not authentic, cheap quality knockoff.' }),
    ]

    const signals = runSignalDetection(reviews, {})
    const counterfeitSignal = signals.find((s) => s.name === 'counterfeit_signal')
    expect(counterfeitSignal).toBeDefined()
  })

  it('detects subscription trap mentions', () => {
    const reviews: ParsedReview[] = [
      makeReview({ id: 'r-0', snippet: 'Hard to cancel subscription. Auto renew charged me again without warning.' }),
    ]

    const signals = runSignalDetection(reviews, {})
    const subscriptionSignal = signals.find((s) => s.name === 'subscription_trap')
    expect(subscriptionSignal).toBeDefined()
  })

  it('detects incentive disclosures', () => {
    const reviews: ParsedReview[] = [
      makeReview({ id: 'r-0', snippet: 'I received this product at a discount in exchange for my honest review.' }),
      makeReview({ id: 'r-1', snippet: 'Free sample provided by the company for unbiased review.' }),
    ]

    const signals = runSignalDetection(reviews, {})
    const incentiveSignal = signals.find((s) => s.name === 'incentive_disclosure')
    expect(incentiveSignal).toBeDefined()
  })

  it('detects rating polarization', () => {
    const reviews: ParsedReview[] = [
      ...Array.from({ length: 8 }, (_, i) => makeReview({ id: `r-${i}`, rating: 5, snippet: `Great product review number ${i} here` })),
      ...Array.from({ length: 3 }, (_, i) => makeReview({ id: `r-${i + 8}`, rating: 1, snippet: `Terrible product review number ${i} here` })),
    ]

    const signals = runSignalDetection(reviews, {})
    const polarizationSignal = signals.find((s) => s.name === 'rating_polarization')
    expect(polarizationSignal).toBeDefined()
  })

  it('detects anonymity ratio', () => {
    const reviews: ParsedReview[] = [
      ...Array.from({ length: 8 }, (_, i) => makeReview({ id: `r-${i}`, author: 'Anonymous', snippet: `Review content ${i} here` })),
      ...Array.from({ length: 2 }, (_, i) => makeReview({ id: `r-${i + 8}`, snippet: `Review content ${i} here` })),
    ]

    const signals = runSignalDetection(reviews, {})
    const anonymitySignal = signals.find((s) => s.name === 'anonymity_ratio')
    expect(anonymitySignal).toBeDefined()
  })

  it('detects verified ratio issues', () => {
    const reviews: ParsedReview[] = Array.from({ length: 10 }, (_, i) =>
      makeReview({ id: `r-${i}`, verified: false, snippet: `Review content ${i} here` }),
    )

    const signals = runSignalDetection(reviews, {})
    const verifiedSignal = signals.find((s) => s.name === 'anonymity_ratio')
    expect(verifiedSignal).toBeDefined()
  })

  it('returns empty signals for clean reviews', () => {
    const reviews: ParsedReview[] = Array.from({ length: 10 }, (_, i) =>
      makeReview({
        id: `r-${i}`,
        date: `2024-0${(i % 9) + 1}-${String((i % 28) + 1).padStart(2, '0')}`,
        snippet: `Review ${i}: I used this product for several weeks. The build quality is solid and it performs as advertised. Minor issue with the packaging but overall satisfied.`,
        rating: 3 + (i % 3),
        verified: true,
      }),
    )

    const signals = runSignalDetection(reviews, {})
    // Should have minimal or no suspicious signals for natural reviews
    const strongSuspicious = signals.filter((s) => s.weight > 0 && s.strength === 'strong')
    expect(strongSuspicious.length).toBeLessThan(3)
  })

  it('handles empty review list without crashing', () => {
    const signals = runSignalDetection([], {})
    expect(Array.isArray(signals)).toBe(true)
  })

  it('detects detailed reviews as positive signal', () => {
    const reviews: ParsedReview[] = Array.from({ length: 8 }, (_, i) =>
      makeReview({
        id: `r-${i}`,
        snippet: 'This is a very detailed review with lots of specific information about the product features, build quality, performance metrics, comparison with competitors, and overall assessment of value for money. I have been using this product for three months now.',
      }),
    )

    const signals = runSignalDetection(reviews, {})
    const detailedSignal = signals.find((s) => s.name === 'detailed_reviews')
    expect(detailedSignal).toBeDefined()
    expect(detailedSignal?.weight).toBeLessThan(0)
  })
})
