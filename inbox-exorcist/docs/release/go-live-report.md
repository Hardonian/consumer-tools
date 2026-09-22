# Go-Live Report: InboxExorcist

**Date:** 2026-05-01
**Status:** GREEN — GO
**Version:** 0.1.0

---

## 1. Executive Summary

InboxExorcist has progressed from a late-infrastructure library state (NO-GO as of 2026-04-29) to a fully deployable application. All MVP routes are implemented, 40 tests pass, lint/typecheck/build succeed, and the shared diagnostics layer is operational.

## 2. Pass/Fail Checklist

| Category | Item | Status | Notes |
| :--- | :--- | :--- | :--- |
| **Build** | `npm install` | ✅ PASS | |
| **Build** | `npm run lint` | ✅ PASS | |
| **Build** | `npm run typecheck` | ✅ PASS | |
| **Build** | `npm run test` | ✅ PASS | 40 tests (unit + integration) |
| **Build** | `npm run test:e2e` | ✅ PASS | HTTP smoke tests |
| **Build** | `npm run build` | ✅ PASS | |
| **Build** | `npm run verify` | ✅ PASS | All checks pass |
| **Routes** | Homepage (`/`) | ✅ PASS | Landing page with "Your inbox has demons" |
| **Routes** | Demo (`/demo`) | ✅ PASS | Mock scan data |
| **Routes** | Scan (`/scan`) | ✅ PASS | ScanClient component |
| **Routes** | Preview (`/preview/[id]`) | ✅ PASS | PreviewClient component |
| **Routes** | Success (`/success/[id]`) | ✅ PASS | Results display |
| **Routes** | Settings (`/settings`) | ✅ PASS | Action history, disconnect, data deletion |
| **Routes** | Privacy (`/privacy`) | ✅ PASS | Privacy policy page |
| **Routes** | Security (`/security`) | ✅ PASS | Security page |
| **Routes** | Auth error (`/auth/error`) | ✅ PASS | Degraded error page |
| **API** | `GET /api/health` | ✅ PASS | Returns service status |
| **API** | `GET /api/auth/google/start` | ✅ PASS | OAuth redirect |
| **API** | `GET /api/auth/google/callback` | ✅ PASS | OAuth callback |
| **API** | `POST /api/gmail/scan` | ✅ PASS | Scan with dedup + circuit breaker |
| **API** | `GET /api/gmail/scan/[id]` | ✅ PASS | Scan results with ownership check |
| **API** | `POST /api/gmail/actions/quiet` | ✅ PASS | Idempotent quiet with unsubscribe |
| **API** | `POST /api/gmail/actions/undo` | ✅ PASS | Idempotent undo with 25-action limit |
| **API** | `POST /api/gmail/disconnect` | ✅ PASS | Token revocation |
| **API** | `GET /api/me/actions` | ✅ PASS | Action history |
| **API** | `POST /api/me/delete-data` | ✅ PASS | Full data deletion |
| **Safety** | Token Encryption | ✅ PASS | AES-256-GCM in production |
| **Safety** | PII Hashing | ✅ PASS | HMAC-SHA256 |
| **Safety** | Safe Logging | ✅ PASS | 18 fields redacted, 3 regex patterns |
| **Safety** | SSRF Protection | ✅ PASS | Unsubscribe URL validation |
| **Safety** | Circuit Breaker | ✅ PASS | Gmail fault isolation |
| **Safety** | Idempotency | ✅ PASS | Quiet and undo deduplication |
| **Privacy** | Data Retention Policy | ✅ PASS | `docs/data-retention.md` |
| **Privacy** | Privacy Policy | ✅ PASS | `PRIVACY.md` |
| **Docs** | Launch Checklist | ✅ PASS | `LAUNCH_CHECKLIST.md` |
| **Docs** | Scope Rationale | ✅ PASS | `docs/gmail-scope-rationale.md` |
| **Docs** | Classification Rules | ✅ PASS | `docs/classification-rules.md` |
| **Docs** | Diagnostics | ✅ PASS | `docs/diagnostics.md` |
| **Docs** | Shared Core Integration | ✅ PASS | `docs/shared-core-integration.md` |
| **Docs** | Email Signals | ✅ PASS | `docs/email-signals.md` |
| **Docs** | Cost Controls | ✅ PASS | `docs/cost-controls.md` |
| **Docs** | Degraded States | ✅ PASS | `docs/degraded-states.md` |
| **Docs** | Google OAuth Verification | ✅ PASS | `docs/google-oauth-verification.md` |
| **Docs** | Incident Response | ✅ PASS | `docs/incident-response.md` |
| **Docs** | Refund Policy | ✅ PASS | `docs/refund-policy.md` |
| **Docs** | Customer Support Macros | ✅ PASS | `docs/customer-support-macros.md` |
| **Database** | Supabase Migration | ✅ PASS | 10 tables with RLS |
| **Database** | In-Memory Fallback | ✅ PASS | Degrades gracefully |

## 3. Test Results

### Unit Tests (11 files)

| Test File | Coverage |
|-----------|----------|
| `safe-log.test.ts` | Redaction of sensitive fields, circular refs, structured output |
| `cache.test.ts` | In-flight dedup, sender cache TTL, prefix clearing, full reset |
| `circuit-breaker.test.ts` | State transitions, failure threshold, recovery, singleton registry |
| `cost.test.ts` | API call counting, cache hit rate, scan size tracking, reset |
| `classifier.test.ts` | High-confidence promotional, financial/security protection, allowlist fail-closed |
| `idempotency.test.ts` | Duplicate prevention, result caching, prefix clearing |
| `engine.test.ts` | Safety rule force-keep, junk threshold identification |
| `gmail-error-map.test.ts` | Quota → retryable degraded, insufficient scopes → fail-closed |
| `action-planner.test.ts` | High-confidence sender selection, protected skip count |
| `diagnostics.test.ts` | Event sink emission, degraded events with error, valid ID/timestamp |
| `unsubscribe-url.test.ts` | HTTPS allowed, localhost/private IP blocked, non-HTTPS blocked |
| `ownership.test.ts` | Scan lookup enforces user ownership |

### Integration Tests

| Test File | Coverage |
|-----------|----------|
| `gmail-flow.test.ts` | Full scan → quiet → undo flow, partial filter failure with degraded warnings |

### E2E Tests

| Test File | Coverage |
|-----------|----------|
| `smoke.mjs` | Boots Next.js dev server, landing page text check, OAuth start → error redirect, settings → /scan redirect, scan page load, preview mock |

**Total: 40 passing tests**

## 4. API Contract

### ScanResult

```typescript
interface ScanResult {
  schemaVersion: string;
  ok: boolean;
  resultId: string;
  confidence: string;
  confidenceExplanation: string;
  reasons: string[];
  signals: { senderCount: number; messageCount: number; scanDuration: number; degraded: boolean };
  evidence: unknown;
  limitations: string[];
  degraded: boolean;
  diagnosticsId?: string;
  noisySenders: SenderCandidate[];
  reviewSenders: SenderCandidate[];
  protectedSenders: SenderCandidate[];
  proposedActions: ProposedAction[];
  filtersCreated: number;
  unsubscribeAttempts: number;
  undoAvailable: boolean;
}
```

### QuietResult

```typescript
interface QuietResult {
  schemaVersion: string;
  ok: boolean;
  resultId: string;
  confidence: string;
  confidenceExplanation: string;
  reasons: string[];
  signals: { quietedCount: number; filtersCreated: number; unsubscribeAttempts: number; skippedCount: number };
  evidence: unknown;
  limitations: string[];
  degraded: boolean;
  diagnosticsId?: string;
  noisySenders: SenderCandidate[];
  reviewSenders: SenderCandidate[];
  protectedSenders: SenderCandidate[];
  proposedActions: ProposedAction[];
  filtersCreated: number;
  unsubscribeAttempts: number;
  undoAvailable: boolean;
}
```

### UndoResult

```typescript
interface UndoResult {
  schemaVersion: string;
  ok: boolean;
  resultId: string;
  confidence: string;
  confidenceExplanation: string;
  reasons: string[];
  signals: { removedFilters: number; failedCount: number };
  evidence: unknown;
  limitations: string[];
  degraded: boolean;
  diagnosticsId?: string;
  noisySenders: SenderCandidate[];
  reviewSenders: SenderCandidate[];
  protectedSenders: SenderCandidate[];
  proposedActions: ProposedAction[];
  filtersCreated: number;
  unsubscribeAttempts: number;
  undoAvailable: boolean;
}
```

## 5. Gmail Failure Registry

13 failure codes with retryability and degradation flags:

| Code | Retryable | Degraded | HTTP |
|------|-----------|----------|------|
| `oauth_denied` | no | no | 401 |
| `insufficient_scopes` | no | no | 403 |
| `token_expired` | yes | no | 401 |
| `token_refresh_failed` | yes | yes | 500 |
| `gmail_quota_limited` | yes | yes | 429 |
| `gmail_rate_limited` | yes | yes | 429 |
| `partial_scan` | partial | yes | 206 |
| `label_create_failed` | yes | yes | 500 |
| `filter_create_failed` | yes | yes | 500 |
| `unsubscribe_unavailable` | no | no | — |
| `undo_partial_failure` | yes | yes | 206 |
| `disconnect_failed` | yes | yes | 500 |
| `data_delete_partial_failure` | yes | yes | 206 |

## 6. Database Schema

10 Supabase tables with RLS enabled:

- `users`, `gmail_connections`, `scan_runs`, `sender_candidates`
- `sender_actions`, `gmail_filters`, `unsubscribe_attempts`
- `audit_events`, `user_allowlist`, `user_blocklist`

## 7. Remaining Blockers for Public Launch

| Blocker | Owner | Notes |
|---------|-------|-------|
| Google OAuth verification | Operator | Required for restricted scopes (`gmail.modify`, `gmail.settings.basic`) |
| Stripe payment integration | Operator | Feature-flagged off until Gmail flow is live-verified |
| Production Supabase instance | Operator | Migration ready; instance must be provisioned |
| Secret rotation policy | Operator | Define cadence for `TOKEN_ENCRYPTION_KEY`, `SESSION_SECRET` |

## 8. Conclusion

**GO** — All MVP requirements met. Remaining items are operational (OAuth verification, payments, production infra) and do not block code-level readiness.
