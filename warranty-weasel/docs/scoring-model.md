# Scoring Model

## Overview

ReviewGhost uses a weighted signal detection model to evaluate review authenticity. The model is deterministic, explainable, and category-aware.

## Signal Detection Phase

Each of 15 signal detectors analyzes the parsed review data independently:

```
for each detector:
  result = detector(reviews, metadata)
  if result:
    signals.append(result)
```

Each detector returns:
- `name`: Signal identifier
- `weight`: Positive (risk) or negative (trust) integer
- `evidence`: Array of source snippets supporting the signal
- `explanation`: Human-readable description
- `strength`: "strong", "weak", or "conflicting"

## Category Adjustment Phase

Detected product category adjusts signal weights:

```
for each signal:
  if category_adjustments[signal.name]:
    signal.weight *= category_adjustments[signal.name]
```

Categories with adjustments:
- **electronics**: Safety and counterfeit concerns weighted higher
- **tools**: Safety concerns weighted highest (1.6×)
- **apparel**: Review hijacking and linguistic patterns weighted higher
- **digital**: Subscription traps and verification concerns weighted higher
- **automotive**: Safety and warranty concerns weighted highest (1.7×)
- **food_supplement**: Safety and regulatory concerns weighted higher

## Score Calculation

```
raw_score = Σ max(0, signal.weight)  // Only risk signals contribute
raw_score = clamp(raw_score, 0, 100)
```

Safe signals (negative weights) reduce the raw score by offsetting positive signals.

## Verdict Mapping

| Score | Verdict | Interpretation |
|-------|---------|---------------|
| 0–30 | BUY | Low risk — reviews appear authentic |
| 31–60 | CAUTION | Moderate risk — some suspicious patterns |
| 61–100 | AVOID | High risk — multiple strong signals |
| N/A | UNKNOWN | Insufficient data for analysis |

## Confidence Calculation

```
base = min(100, strong_signals × 20 + weak_signals × 10 + 30)
confidence = base - failure_penalty
```

Then apply caps based on data quality (see degraded-states.md).

## Example

Input: 20 reviews for wireless headphones

Detected signals:
- temporal_sync: weight 15 (strong) — 8 reviews on same date
- safety_concern: weight 25 × 1.5 = 38 (strong) — "overheated" mentioned
- detailed_reviews: weight -12 (strong) — 75% detailed reviews

Score: max(0, 15) + max(0, 38) + max(0, -12) = 15 + 38 + 0 = 53

Verdict: CAUTION (53 is in 31–60 range)

Confidence: min(100, 3×20 + 0×10 + 30) = 90%
No failure penalty, 20 reviews → no cap
Final confidence: 90%

## Determinism

The model is fully deterministic:
- Same input → same output
- No random elements
- No ML model inference
- All thresholds are explicit constants
- All weights are defined in registries
