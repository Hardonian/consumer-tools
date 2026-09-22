# Email Signals

This document specifies the signals the InboxExorcist Intelligence Engine uses to classify email senders. All signals are derived from Gmail metadata headers and aggregate patterns — no email body content is stored.

## Signal Categories

The engine evaluates four signal categories in order: Safety Pass, Pattern Match, Header Heuristics, and Edge Case Engine.

---

## 1. Safety Pass Signals (Highest Priority)

Safety signals override all scoring. They are evaluated first and can force a sender to be kept regardless of other signals.

### FORCE_KEEP

Sets score to 100 and flags the sender as `keep`. Cannot be overridden.

| Signal | Trigger |
|---|---|
| 2FA/OTP sender | Subject or sender name contains "verification code", "security code", "two-factor", "OTP" |
| Fraud alert | Sender domain matches known bank/security domains with fraud alert patterns |
| Government | Sender domain ends in `.gov` or matches known government sender patterns |

### PROTECT

Adds +50 score boost.

| Signal | Trigger |
|---|---|
| Bank statement | Sender matches known financial institution with statement/summary patterns |
| Medical reminder | Sender matches healthcare provider with appointment/reminder patterns |
| Utility bill | Sender matches known utility company with bill/payment patterns |

---

## 2. Pattern Match Signals

Analyzes sender domain and name against known datasets.

### Positive Signals (Promotional Indicators)

| Signal | Score | Trigger |
|---|---|---|
| List-Unsubscribe header | +25 | `List-Unsubscribe` header present |
| High send frequency | +20 | Sender appears above frequency threshold in recent scan |
| Promotional keywords | +15 | Subject/sender contains marketing language |
| Gmail Promotions category | +15 | Message categorized as Promotions by Gmail |
| No-reply sender | +10 | Sender matches `no-reply@`, `noreply@`, `do-not-reply@` |
| Bulk/list headers | +10 | `List-Id`, `List-Post`, `Precedence: bulk/list` headers present |

### Negative Signals (Keep Indicators)

| Signal | Score | Trigger |
|---|---|---|
| Financial/security keywords | -40 | Subject contains banking, security, account alert terms |
| Transactional keywords | -30 | Subject contains receipt, invoice, order, shipping, confirmation terms |
| Personal reply/engagement | -30 | `Re:` prefix in subject, or sender has recent human reply |
| Allowlisted domain | -50 | Sender domain is in user's allowlist |

### Domain Matching

| Match Type | Precision | Example |
|---|---|---|
| Exact domain | High | `*@newsletter.example.com` |
| Wildcard subdomain | Medium | `*@*.example.com` |
| Fragment match | Low | Sender name contains "Newsletter", "Digest", "Update" |

### Multipliers

Category-specific multipliers adjust final scores:

| Category | Multiplier | Effect |
|---|---|---|
| Security | 2.5x | Amplifies keep signals for security senders |
| Promotional | 0.5x | Reduces noise for clearly promotional senders |

---

## 3. Header Heuristic Signals

Technical header analysis without content inspection.

| Signal | Score | Header |
|---|---|---|
| List-Unsubscribe present | -10 | `List-Unsubscribe` exists |
| Re: prefix in subject | +25 | Subject starts with `Re:` |
| Priority: urgent | +30 | `Priority: urgent` header |
| Auto-Submitted | +5 | `Auto-Submitted: auto-generated` present |
| Precedence: bulk | +5 | `Precedence: bulk` header |

---

## 4. Edge Case Signals

Heuristic detection for scenarios that bypass pattern matching.

### OTP Detection

| Signal | Condition |
|---|---|
| OTP pattern | 4-8 digit code in body AND "code" or "otp" in subject |

Note: Body is scanned in-memory only and never persisted.

### Calendar Invites

| Signal | Condition |
|---|---|
| Calendar content | `.ics` attachment detected AND `text/calendar` content type |

---

## Classification Thresholds

| Threshold | Score Range | Action | Confidence |
|---|---|---|---|
| Immediate Junk | ≤ -80 | Auto-quiet (optional) | Highest |
| Junk | -40 to -80 | Recommended for quieting | High |
| Review | -40 to 30 | Flagged for user review | Medium |
| Keep | ≥ 30 | Safe to stay in inbox | Low |
| Immediate Keep | ≥ 90 | Whitelisted | Highest |

### MVP Thresholds

| Score | Classification |
|---|---|
| 80+ | `PROMOTIONAL_HIGH_CONFIDENCE` — one-click quiet eligible |
| 50-79 | `NEWSLETTER_HIGH_CONFIDENCE` or `UNKNOWN_REVIEW` — review bucket |
| Below 50 | `TRANSACTIONAL_SAFE_SKIP` or `UNKNOWN_REVIEW` — skip |

---

## Protected Senders

Always skipped or requiring explicit review:

- Banks, credit cards, payment processors
- Government, tax authorities
- Healthcare providers
- Legal correspondence
- School/employer senders
- Password reset services
- Login/2FA providers
- Receipt/invoice senders
- Shipping/tracking services
- Personal-looking senders
- Allowlisted domains
- Senders with recent human replies

---

## Data Invariants

1. **Determinism**: The same headers produce the same score and classification
2. **No body persistence**: Body content is analyzed in-memory for OTP detection only
3. **Anonymization**: Senders are identified by salted SHA-256 hashes in logs
4. **Fail-keep**: Unclassified senders default to "keep" rather than "quiet"
5. **Explainability**: Every classification includes `confidenceExplanation` and `reasons` fields

See the API contract types in `src/lib/domain.ts` for the full `ScanResult`, `QuietResult`, and `UndoResult` shapes returned to clients.
