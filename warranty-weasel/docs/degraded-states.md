# Degraded States

ReviewGhost treats degraded operation as a first-class concern. When the system cannot access or analyze review data fully, it degrades gracefully rather than producing misleading results.

## Degradation Triggers

### Fetch Degradation

| Trigger | Severity | Response |
|---------|----------|----------|
| Tier 1 fails, Tier 2 succeeds | Low | Confidence -5%, note in limitations |
| All tiers fail | High | UNKNOWN verdict |
| Timeout | Medium | Try next tier, confidence -25% |
| Rate limited | Medium | Backoff + retry, confidence -20% |
| Response truncated | Low | Parse available content, confidence -15% |

### Parse Degradation

| Trigger | Severity | Response |
|---------|----------|----------|
| JSON-LD missing | Low | Fall back to DOM parsing |
| JSON-LD malformed | Low | Fall back to DOM parsing |
| No review elements found | High | UNKNOWN if no data at all |
| Partial review data | Medium | Use available data, note missing fields |

### Analysis Degradation

| Trigger | Severity | Response |
|---------|----------|----------|
| < 5 reviews | High | Confidence capped at 30% |
| < 20 reviews | Medium | Confidence capped at 60% |
| No signals detected | Low | Return BUY with low confidence |
| Conflicting signals | Medium | Note in confidence explanation |

## Confidence Caps

The confidence score is capped based on data quality:

| Condition | Max Confidence |
|-----------|---------------|
| No data accessible | 0% |
| Blocked by site security | 30% |
| Partial data (timeout, truncation) | 60% |
| Weak evidence (≤2 weak signals) | 75% |
| Few reviews (<5) | 30% |
| Moderate reviews (<20) | 60% |
| Strong multi-signal (≥3 strong) | 90%+ |

## UNKNOWN Verdict

UNKNOWN is returned when:

1. **Blocked** — Site security prevents access (CAPTCHA, WAF, JS challenge)
2. **Insufficient data** — Fewer than 5 reviews accessible
3. **Unsupported** — URL format not recognized or site not supported
4. **Network failure** — Site unreachable, DNS failure, connection refused

UNKNOWN responses include:
- Clear explanation of why
- What strategies were attempted
- Next steps for the user

## User Communication

Degraded results always include:

1. **User message** — Plain language explanation of the issue
2. **Limitations list** — Specific constraints on the analysis
3. **Degraded flag** — Boolean indicator for UI styling
4. **Next steps** — Actionable suggestions

## Design Principle

> "It is better to say 'I don't know' than to give a wrong answer with high confidence."

ReviewGhost prioritizes honesty over completeness. A degraded result with clear limitations is more valuable than a confident but incorrect analysis.
