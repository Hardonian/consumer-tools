# ReviewGhost Model Specification

## Overview

ReviewGhost uses a deterministic, evidence-first scoring model to evaluate product review authenticity. Every verdict is backed by detectable signals with explicit weights and evidence snippets.

## Signal Detection

### Suspicious Signals (20 defined, 15 implemented)

Each signal has a name, description, base weight (1–25), and detection logic:

| Signal | Weight | Detection Method |
|--------|--------|-----------------|
| temporal_sync | 15 | Reviews clustered on same date (≥5) |
| burst_pattern | 12 | ≥10 reviews within 7 days |
| linguistic_mirror | 18 | Identical review text pairs |
| sentiment_mismatch | 10 | Rating contradicts text sentiment (≥2 cases) |
| keyword_spam | 14 | Keyword density >15% with ≥3 repetitions |
| anonymity_ratio | 12 | >50% anonymous reviewers |
| helpful_vote_anomaly | 10 | Helpful votes correlate with rating polarity |
| category_drift | 16 | Review content mismatches product category |
| geo_impossible | 11 | Reviewer locations vs product availability |
| honeypot_hidden | 20 | Hidden DOM elements containing review content |
| rating_polarization | 13 | Bimodal distribution (>80% extreme ratings) |
| incentive_disclosure | 14 | Reviews mention discounts/free products (≥2) |
| ai_generated_pattern | 17 | AI-like text patterns (≥3 reviews) |
| verified_inconsistency | 16 | Verified badge contradicts review content |
| review_hijacking | 22 | Reviews discuss different product |
| safety_concern | 25 | Reviews mention safety hazards |
| warranty_complaint | 15 | Reviews mention warranty denial |
| counterfeit_signal | 20 | Reviews suggest non-genuine product (≥2) |
| subscription_trap | 18 | Reviews mention recurring charges |
| review_gap | 12 | Timeline gaps suggest selective deletion |

### Safe Signals (8 defined)

Negative-weight signals that reduce risk score:

| Signal | Weight | Condition |
|--------|--------|-----------|
| verified_consistent | -10 | High verified purchase ratio |
| natural_distribution | -8 | ≥4 different rating values |
| detailed_reviews | -12 | >60% reviews with >200 chars |
| reviewer_history | -10 | Reviewers have diverse histories |
| temporal_natural | -8 | Natural review distribution over time |
| mixed_sentiment | -10 | Natural mix of pros and cons |
| image_evidence | -8 | Customer photos present |
| response_from_seller | -5 | Seller responds to reviews |

## Scoring Formula

```
raw_score = Σ max(0, signal_weight)  // Only positive weights contribute
raw_score = clamp(raw_score, 0, 100)
```

### Category Adjustments

Weights are multiplied by category-specific factors before scoring:

| Category | Key Adjustments |
|----------|----------------|
| electronics | safety_concern ×1.5, counterfeit ×1.4 |
| tools | safety_concern ×1.6, warranty ×1.4 |
| apparel | category_drift ×1.3, linguistic_mirror ×1.2 |
| digital | subscription_trap ×1.5, verified_inconsistency ×1.3 |
| automotive | safety_concern ×1.7, warranty ×1.5 |
| food_supplement | safety_concern ×1.6, regulatory ×1.5 |

### Confidence Calculation

```
base_confidence = min(100, strong_signals × 20 + weak_signals × 10 + 30)
confidence = base_confidence - failure_penalty
```

**Caps:**
- Blocked/no data: ≤30%
- Partial data: ≤60%
- Weak evidence (≤2 weak signals): ≤75%
- Strong multi-signal (≥3 strong): ≥80%
- Few reviews (<5): ≤30%
- Moderate reviews (<20): ≤60%

## Verdict Thresholds

| Verdict | Score | Confidence Cap |
|---------|-------|---------------|
| BUY | 0–30 | Normal |
| CAUTION | 31–60 | Normal |
| AVOID | 61–100 | Normal |
| UNKNOWN | N/A | 0% |

## Determinism Guarantees

1. All signal detectors use explicit, testable thresholds
2. No opaque AI/ML models — all logic is rule-based
3. Same input always produces same output
4. Every verdict includes evidence snippets and signal explanations
5. Category detection is keyword-based and reproducible
