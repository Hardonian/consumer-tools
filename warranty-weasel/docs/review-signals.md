# Review Signals Guide

ReviewGhost detects 20 suspicious signals and 8 safe signals in product reviews.

## Suspicious Signals

### Temporal Signals

**temporal_sync** (weight: 15)
- Detects multiple reviews posted on the exact same date
- Threshold: ≥5 reviews on one date
- Indicates: Coordinated posting campaign

**burst_pattern** (weight: 12)
- Detects sudden spikes in review volume
- Threshold: ≥10 reviews within 7 days
- Indicates: Review bombing or incentive campaign

### Content Signals

**linguistic_mirror** (weight: 18)
- Detects identical or near-identical review text
- Indicates: Copy-paste reviews, common authorship

**sentiment_mismatch** (weight: 10)
- Detects ratings that contradict review text sentiment
- Example: 5-star review describing product failures
- Indicates: Manipulated ratings

**keyword_spam** (weight: 14)
- Detects unnatural keyword repetition
- Threshold: >15% keyword density with ≥3 repetitions
- Indicates: SEO manipulation

**ai_generated_pattern** (weight: 17)
- Detects text patterns consistent with AI generation
- Indicators: Generic praise, structured paragraphs, lack of specific detail
- Threshold: ≥3 reviews with AI-like patterns

### Authenticity Signals

**anonymity_ratio** (weight: 12)
- Detects high proportion of anonymous reviewers
- Threshold: >50% anonymous
- Indicates: Incentivized or fake reviews

**rating_polarization** (weight: 13)
- Detects bimodal rating distribution (mostly 5-star and 1-star)
- Threshold: >80% extreme ratings
- Indicates: Manipulation on both sides

**incentive_disclosure** (weight: 14)
- Detects reviews mentioning free products or discounts
- Keywords: "free product", "discount", "in exchange for", "honest review"
- Threshold: ≥2 reviews with incentive mentions

### Safety & Trust Signals

**safety_concern** (weight: 25) — *highest weight*
- Detects reviews mentioning safety hazards
- Keywords: fire, burn, shock, injury, recall, explode, overheat
- Any mention triggers this signal

**warranty_complaint** (weight: 15)
- Detects reviews mentioning warranty denial
- Keywords: "warranty denied", "void", "claim", "would not honor"

**counterfeit_signal** (weight: 20)
- Detects reviews suggesting non-genuine product
- Keywords: fake, counterfeit, knockoff, not genuine, not authentic
- Threshold: ≥2 reviews

**subscription_trap** (weight: 18)
- Detects reviews mentioning unexpected recurring charges
- Keywords: subscription, recurring, auto renew, hard to cancel

### Review Integrity Signals

**review_hijacking** (weight: 22)
- Detects reviews that appear to be for a different product
- Compares review content keywords with product title

**verified_inconsistency** (weight: 16)
- Detects verified purchase badges that contradict review content

**category_drift** (weight: 16)
- Detects reviews discussing features inconsistent with product category

**geo_impossible** (weight: 11)
- Detects reviewer locations inconsistent with product availability

**honeypot_hidden** (weight: 20)
- Detects hidden review content in page DOM

**review_gap** (weight: 12)
- Detects significant gaps in review timeline
- Indicates: Possible selective review deletion

## Safe Signals

Safe signals have negative weights and reduce the overall risk score:

| Signal | Weight | Condition |
|--------|--------|-----------|
| verified_consistent | -10 | High verified purchase ratio |
| natural_distribution | -8 | ≥4 different rating values |
| detailed_reviews | -12 | >60% reviews with >200 chars |
| reviewer_history | -10 | Reviewers have diverse histories |
| temporal_natural | -8 | Natural review distribution |
| mixed_sentiment | -10 | Natural mix of pros and cons |
| image_evidence | -8 | Customer photos present |
| response_from_seller | -5 | Seller responds to reviews |
