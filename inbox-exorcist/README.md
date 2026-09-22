# InboxExorcist

<!-- BEGIN: REPO HERO -->
![InboxExorcist — hero generated locally on the GPU stack](assets/repo-hero.png)
<!-- END: REPO HERO -->

InboxExorcist is a one-function B2C app:

Connect Gmail → identify junk/promotional senders → unsubscribe where safe → create reversible Gmail filters/labels to silence future noise.

It is not a general inbox assistant, budgeting tool, billing-cancellation product, or financial-access app.

## MVP Flow

1. Landing page: "Your inbox has demons. Exorcise them."
2. Google OAuth.
3. Scan recent Gmail headers only.
4. Preview high-confidence noisy senders, review senders, and protected skips.
5. One click quieting with Gmail label/filter creation.
6. Standards-first unsubscribe attempts where safe.
7. Success screen and reversible action log.

## Commands

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
npm run verify
```

`npm run verify` runs lint, typecheck, unit/integration tests, HTTP smoke tests, and build.

## Local Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Google OAuth is required for live Gmail behavior. Without Google credentials, `/api/auth/google/start` redirects to a configured degraded error page and `/api/health` reports degraded.

## Data Posture

InboxExorcist does not store full email bodies, attachments, or message snippets. It stores minimal operational data: user id, encrypted Gmail account email, hashed sender emails, sender domains, classifications, action results, reversible Gmail filter/label ids, aggregate counts, timestamps, and audit events.

Supabase Postgres is supported through the REST store when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set. Without Supabase, the app runs in degraded in-memory mode for local smoke testing only.

## Gmail Scopes

- `openid email profile`: identify the connected Gmail account.
- `gmail.modify`: list/search messages, read metadata headers, apply/remove labels, and archive messages without deleting them.
- `gmail.settings.basic`: create reversible Gmail filters.
- `gmail.send`: optional only when `GMAIL_ENABLE_MAILTO_UNSUBSCRIBE=true`; not requested by default.

See `docs/gmail-scope-rationale.md`.

## Shared Diagnostics

The app ships a diagnostics layer (`src/lib/diagnostics/`) with six zero-dependency modules:

| Module | Purpose |
|--------|---------|
| `safe-log` | PII-safe structured logging with 18-field redaction |
| `events` | 17-event CRM diagnostic pipeline |
| `cost` | Gmail API call metrics and cache tracking |
| `cache` | In-flight scan dedup + 5-min sender result cache |
| `circuit-breaker` | Gmail upstream fault isolation (5 failures → open → 30s → half-open) |
| `idempotency` | Request deduplication with 60s result caching |

See `docs/shared-core-integration.md` and `docs/diagnostics.md`.

## Gmail Failure Registry

13 failure codes with retryability and degradation flags are centralized in `src/lib/gmail/failure-registry.ts`. Every Gmail error maps to a consistent `{ok: false, code, message, retryable, degraded}` envelope.

See `docs/degraded-states.md`.

## API Contract

All API responses use typed envelopes:

- **ScanResult**: `{schemaVersion, ok, resultId, confidence, signals, noisySenders, reviewSenders, protectedSenders, proposedActions, ...}`
- **QuietResult**: `{schemaVersion, ok, resultId, signals: {quietedCount, filtersCreated, unsubscribeAttempts, skippedCount}, ...}`
- **UndoResult**: `{schemaVersion, ok, resultId, signals: {removedFilters, failedCount}, ...}`

See `src/lib/domain.ts` for full type definitions.

## Payment Gate

The MVP is free-first. Pricing is documented as:

- Free scan
- $5 one-time clean
- $3/month ongoing protection

Stripe should remain behind `NEXT_PUBLIC_ENABLE_PAYMENTS=true` until the Gmail flow is live-verified.

## Tests

40 passing tests (unit + integration + E2E):

- **Unit**: safe-log, cache, circuit-breaker, cost, classifier, idempotency, engine, gmail-error-map, action-planner, diagnostics, unsubscribe-url, ownership
- **Integration**: full scan → quiet → undo flow
- **E2E**: Next.js dev server smoke tests

```bash
npm run verify  # lint + typecheck + test + test:e2e + build
```

## Documentation

| File | Purpose |
|------|---------|
| `docs/shared-core-integration.md` | Shared diagnostics API and integration points |
| `docs/gmail-scope-rationale.md` | OAuth scope justification and API endpoints |
| `docs/email-signals.md` | Classification signals and thresholds |
| `docs/diagnostics.md` | Diagnostics layer overview |
| `docs/cost-controls.md` | Gmail API cost management |
| `docs/degraded-states.md` | Graceful degradation matrix |
| `docs/classification-rules.md` | MVP classifier rules |
| `docs/data-retention.md` | What is and isn't stored |
| `docs/google-oauth-verification.md` | Google verification workflow |
| `docs/incident-response.md` | S1/S2 incident procedures |
| `docs/refund-policy.md` | Draft refund policy |
| `docs/customer-support-macros.md` | Support response templates |
| `docs/release/go-live-report.md` | Go-live readiness audit |
| `MODEL_SPEC.md` | Classification model specification |
| `SECURITY.md` | Security principles and secrets |
| `PRIVACY.md` | Privacy policy |
| `LAUNCH_CHECKLIST.md` | Pre-launch checklist |
