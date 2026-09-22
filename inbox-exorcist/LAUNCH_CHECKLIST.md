# Launch Checklist

## Infrastructure

- [ ] Provision production Supabase instance
- [ ] Run Supabase migration (`supabase/migrations/0001_initial.sql`)
- [ ] Configure Supabase RLS policies for all 10 tables
- [ ] Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

## Secrets

- [ ] Generate `SESSION_SECRET` (HMAC-SHA256 cookie signing)
- [ ] Generate `PII_HASH_SECRET` (HMAC-SHA256 sender hashing)
- [ ] Generate `TOKEN_ENCRYPTION_KEY` (AES-256-GCM token encryption)
- [ ] Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- [ ] Set Google OAuth redirect URI to production URL

## Google OAuth

- [ ] Configure Google OAuth consent screen with app name, logo, and description
- [ ] Submit for Google OAuth verification (restricted scopes: `gmail.modify`, `gmail.settings.basic`)
- [ ] Complete demo script per `docs/google-oauth-verification.md`
- [ ] Verify consent screen shows only requested scopes

## Verification

- [ ] Run `npm run verify` — lint, typecheck, tests, E2E, build all pass
- [ ] 40 tests passing (unit + integration + E2E)
- [ ] Live-test Gmail scan with a seed account
- [ ] Live-test quiet action creates `InboxExorcist/Quieted` label and filter
- [ ] Live-test undo removes created filters
- [ ] Confirm no email bodies, snippets, attachments, or tokens appear in logs

## Degraded Mode Testing

- [ ] Test `/api/auth/google/start` without Google credentials → redirects to `/auth/error`
- [ ] Test `/api/health` without Supabase → reports `storage: "memory"`
- [ ] Test scan with expired Gmail token → returns 401 `token_expired`
- [ ] Test scan with insufficient scopes → returns 403 `insufficient_scopes`
- [ ] Test Gmail quota exhaustion → returns 429 `gmail_quota_limited`

## Safety Validation

- [ ] Verify protected senders are always skipped (banks, 2FA, government, etc.)
- [ ] Verify unsubscribe URLs are validated against SSRF denylist
- [ ] Verify `safeLog` redacts all 17 sensitive fields
- [ ] Verify circuit breaker opens after 5 consecutive Gmail failures
- [ ] Verify idempotency prevents duplicate quiet/undo execution

## Payments

- [ ] Keep Stripe disabled (`NEXT_PUBLIC_ENABLE_PAYMENTS=false`) until Gmail flow is live-verified
- [ ] Configure Stripe webhook endpoint
- [ ] Test $5 one-time clean flow
- [ ] Test $3/month subscription flow
- [ ] Document refund policy per `docs/refund-policy.md`

## Documentation

- [x] `README.md` — project overview and commands
- [x] `MODEL_SPEC.md` — classification model specification
- [x] `SECURITY.md` — security principles and incident response
- [x] `PRIVACY.md` — privacy policy
- [x] `docs/shared-core-integration.md` — diagnostics API
- [x] `docs/gmail-scope-rationale.md` — OAuth scope justification
- [x] `docs/email-signals.md` — classification signals
- [x] `docs/diagnostics.md` — diagnostics overview
- [x] `docs/cost-controls.md` — API cost management
- [x] `docs/degraded-states.md` — graceful degradation matrix
- [x] `docs/classification-rules.md` — MVP classifier rules
- [x] `docs/data-retention.md` — data retention policy
- [x] `docs/google-oauth-verification.md` — verification workflow
- [x] `docs/incident-response.md` — S1/S2 procedures
- [x] `docs/refund-policy.md` — refund policy
- [x] `docs/customer-support-macros.md` — support templates
- [x] `docs/release/go-live-report.md` — go-live audit

## Monitoring

- [ ] Set up diagnostic event sink for production CRM/analytics
- [ ] Configure alerting on `gmailApiCallsInWindow` spikes
- [ ] Configure alerting on `partialScanRate` > 0.1
- [ ] Configure alerting on circuit breaker state changes
- [ ] Set up health check monitoring for `/api/health`

## Post-Launch

- [ ] Monitor first 100 live scans for classification accuracy
- [ ] Review protected sender skip rate
- [ ] Collect user feedback on preview UI clarity
- [ ] Evaluate enabling `gmail.send` scope for mailto unsubscribe
- [ ] Plan Stripe enablement after Gmail flow validation
