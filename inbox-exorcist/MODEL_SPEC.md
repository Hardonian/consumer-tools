# Classification Model Specification (v1)

This document specifies the deterministic classification logic used by InboxExorcist to identify and score email senders.

## Architecture

The InboxExorcist Intelligence Engine uses a multi-pass scoring system to categorize senders. It prioritizes safety and user intent, following a "Fail-Keep" principle for critical communications.

Two implementations exist:

1. **`src/lib/intelligence/engine.ts`** — `IntelligenceEngine` class with configurable `SafetyRule`, `SenderPattern`, and `EdgeCase` objects
2. **`src/lib/classification/classifier.ts`** — Runtime classifier using `SenderEvidence` with weighted scoring

### 1. Safety Pass (Highest Priority)

The engine first evaluates messages against a library of `SafetyRule` objects.

- **FORCE_KEEP**: Sets the score to 100 and immediately flags the sender as `keep`. Used for 2FA, fraud alerts, and government communications.
- **PROTECT**: Adds a +50 score boost. Used for bank statements, medical reminders, and utility bills.

Safety rules match on `subject_keywords` and `sender_fragments`. They are evaluated before all other scoring and cannot be overridden.

### 2. Sender Pattern Match

Analyzes the sender's domain and name fragments against `SenderPattern` datasets.

- **Domain Match**: High-precision matching for known bulk domains (e.g., `*@marketing.brand.com`).
- **Fragment Match**: Substring matching for sender names (e.g., "Newsletter").
- **Multipliers**: Scores are adjusted based on category-specific multipliers (e.g., `security` = 2.5x, `promotional` = 0.5x).

### 3. Header Heuristics

The runtime classifier (`classifier.ts`) evaluates these signals from Gmail metadata headers:

| Signal | Weight | Source |
|--------|--------|--------|
| `List-Unsubscribe` header present | +25 | `hasListUnsubscribe` |
| Send frequency >= 8 messages | +20 | `messageCount` |
| Send frequency >= 4 messages | +10 | `messageCount` |
| Promotional keywords in subject | +15 | `subjectHints` |
| Gmail CATEGORY_PROMOTIONS label | +10 | `labelIds` |
| `no-reply` sender pattern | +10 | `senderDisplayName` |
| Bulk headers present | +10 | `bulkHeaders` |
| Financial keywords (bank, credit, paypal, stripe, chase) | -40 | `subjectHints` |
| Security keywords (password, reset, login, 2fa, mfa) | -40 | `subjectHints` |
| Transactional keywords (receipt, invoice, order, shipping) | -30 | `subjectHints` |
| Healthcare/legal/government keywords | -30 | `subjectHints` |
| User engagement / recent human reply | -30 | `userEngaged`, `recentHumanReply` |
| Allowlisted domain | -50 | `allowlistedDomains` |

The `IntelligenceEngine` header analysis evaluates:

- `List-Unsubscribe`: Presence indicates automated mail (-10 weight).
- `Re:` prefix: Indicates a thread, likely personal (+25 weight).
- `Priority: urgent`: Technical priority flags (+30 weight).

### 4. Edge Case Engine

Heuristic-based detection for specific scenarios that might slip through patterns:

- **OTP Detection** (`EC_OTP_001`): Looks for 4-8 digit codes in the body combined with "code" or "otp" in the subject. Body is scanned in-memory only and never persisted.
- **Calendar Invites** (`EC_CAL_001`): Detects `.ics` attachments and calendar content types.

## Scoring Thresholds

| Threshold | Score Range | Action |
|-----------|-------------|--------|
| Junk | <= -40 | Recommended for Quieting |
| Review | -40 to 30 | Flagged for user review |
| Keep | >= 30 | Safe to stay in Inbox |
| Immediate Junk | <= -80 | Auto-quiet (optional) |
| Immediate Keep | >= 90 | Whitelisted |

### MVP Runtime Thresholds (clamped 0-100)

| Score | Classification | Proposed Action |
|-------|----------------|-----------------|
| >= 80 | `PROMOTIONAL_HIGH_CONFIDENCE` or `NEWSLETTER_HIGH_CONFIDENCE` | QUIET_BY_FILTER / UNSUBSCRIBE_THEN_FILTER |
| 50-79 | `UNKNOWN_REVIEW` | REVIEW |
| < 50 | `UNKNOWN_REVIEW` | SKIP |

Protected senders receive category-specific classifications:

| Category | Classification |
|----------|----------------|
| Financial | `FINANCIAL_SAFE_SKIP` |
| Account security | `ACCOUNT_SECURITY_SAFE_SKIP` |
| Transactional | `TRANSACTIONAL_SAFE_SKIP` |
| Personal | `PERSONAL_SAFE_SKIP` |

## Taxonomy

- `PROMOTIONAL_HIGH_CONFIDENCE`: Marketing mail with clear unsubscribe headers.
- `NEWSLETTER_HIGH_CONFIDENCE`: Periodic publications.
- `TRANSACTIONAL_SAFE_SKIP`: Order confirmations, shipping updates.
- `FINANCIAL_SAFE_SKIP`: Bank statements, invoices.
- `ACCOUNT_SECURITY_SAFE_SKIP`: 2FA, password resets.
- `PERSONAL_SAFE_SKIP`: Direct 1:1 communication.
- `UNKNOWN_REVIEW`: Low-confidence matches requiring human input.

## SenderEvidence Type

```typescript
interface SenderEvidence {
  senderDomain: string;
  senderEmail?: string;
  senderDisplayName?: string;
  messageCount: number;
  hasListUnsubscribe: boolean;
  unsubscribeMethods: Set<string>;
  bulkHeaders: boolean;
  labelIds: string[];
  subjectHints?: string[];
  allowlistedDomains?: string[];
  userEngaged?: boolean;
  recentHumanReply?: boolean;
}
```

## Data Invariants

1. **Determinism**: The same input (headers + metadata) must produce the same score and category.
2. **No Body Persistence**: Email bodies are processed in-memory for edge-case detection (like OTP) but are NEVER stored in the database.
3. **Anonymity**: Senders are identified via salted SHA-256 hashes in production logs to protect user social graphs.
4. **Fail-Keep**: Unclassified senders default to "keep" rather than "quiet".
5. **Explainability**: Every classification includes `confidenceExplanation` and `reasons` fields in the API response.

## Engine Configuration

```typescript
interface EngineSettings {
  junk_threshold: number;
  keep_threshold: number;
  uncertainty_buffer: number;
  safety_override_enabled: boolean;
  edge_case_enabled: boolean;
  default_base_score: number;
  score_clamping: { min: number; max: number };
}

interface IntelligenceConfig {
  version: string;
  last_updated: string;
  engine_settings: EngineSettings;
  weight_modifiers: {
    category_multipliers: Record<string, number>;
    header_weights: Record<string, number>;
  };
  auto_actions: {
    immediate_junk_below: number;
    immediate_keep_above: number;
    flag_for_review_range: [number, number];
  };
}
```

## IntelligenceReport Output

```typescript
interface IntelligenceReport {
  decision: 'keep' | 'junk' | 'review';
  final_score: number;
  matching_rules: string[];
  matching_patterns: string[];
  category: string;
  explanation: string;
}
```
