# Security

## Principles

- Least-privilege Gmail access.
- No email body, snippet, attachment, or credential logging.
- No deleting by default.
- Fail closed for protected sender classes.
- Every action is auditable and reversible where Gmail exposes reversible ids.

## Secrets

Production requires:

- `SESSION_SECRET` — HMAC-SHA256 cookie signing
- `PII_HASH_SECRET` — HMAC-SHA256 sender email hashing
- `TOKEN_ENCRYPTION_KEY` — AES-256-GCM OAuth token encryption
- `GOOGLE_CLIENT_ID` — Google OAuth client identification
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret

OAuth access and refresh tokens are encrypted with AES-256-GCM before storage. The encrypted format is `enc:v1:<iv_base64url>:<tag_base64url>:<encrypted_base64url>`. Gmail account email is encrypted; sender email is hashed with HMAC-SHA256.

## Encryption Implementation

**Token encryption** (`src/lib/security/crypto.ts`):

- Algorithm: AES-256-GCM with random 12-byte IV
- Key source: `TOKEN_ENCRYPTION_KEY` (hex or base64, falls back to SHA-256 hash if wrong length)
- Throws in production if key is missing
- Format: `enc:v1:<iv>:<tag>:<encrypted>` with base64url encoding

**PII hashing** (`src/lib/security/hash.ts`):

- Algorithm: HMAC-SHA256
- Key source: `PII_HASH_SECRET` (falls back to `SESSION_SECRET`, then local dev default)
- Input: trimmed, lowercased value
- Output: hex digest

**Session cookies** (`src/lib/security/session.ts`):

- Cookie name: `ie_session`
- OAuth state cookie: `ie_oauth_state`
- Signing: HMAC-SHA256, format `value.signature`
- Verification: timing-safe comparison via `crypto.timingSafeEqual`
- Session cookie: httpOnly, sameSite=lax, 30-day maxAge

## Safe Logging

All logging uses `safe-log` (`src/lib/diagnostics/safe-log.ts`). 17 sensitive fields are always redacted to `[REDACTED]`. Three regex patterns mask inline values: email addresses, Google OAuth tokens (`ya29.`), and JWT tokens (`eyJ`). Circular references produce `[CIRCULAR]`.

Never bypass `safeLog*` — do not use `console.log` in production code paths.

## Gmail Safety

InboxExorcist uses metadata/header reads to classify senders. Quieting creates a Gmail label (`InboxExorcist/Quieted`) and filter that skips inbox. It does not delete messages. Messages are archived by removing the `INBOX` label, preserving them in `All Mail`.

Unsubscribe uses standards-first mechanisms (`src/lib/unsubscribe/`):

- HTTPS unsubscribe URLs are validated with SSRF protection
- Private/internal targets are blocked (localhost, 10.x, 192.168.x, 172.16.x, ::1, fc00::, .local, .internal, .test)
- DNS resolution verifies no private IPs
- Redirects are not followed blindly
- No credentials are entered on unsubscribe pages
- No arbitrary JavaScript is executed
- Unsubscribe URLs with personal tokens are redacted from logs

## SSRF Protection

The unsubscribe URL validator (`src/lib/unsubscribe/url.ts`) blocks:

- `localhost` and `127.0.0.1`
- Private IPv4: `10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`
- Private IPv6: `::1`, `fc00::/7`
- Internal hostnames: `.local`, `.internal`, `.test`
- Non-HTTPS schemes

Optional DNS resolution confirms the resolved IP is not private.

## Session Security

- Middleware (`src/proxy.ts`) redirects unauthenticated users away from protected routes
- E2E test bypass allows `/preview/mock` without a session
- Session cookie is httpOnly to prevent XSS access
- OAuth state cookies prevent CSRF with 10-minute TTL

## Gmail Failure Registry

13 failure codes with retryability and degradation flags are centralized in `src/lib/gmail/failure-registry.ts`. Non-retryable failures (`oauth_denied`, `insufficient_scopes`, `unsubscribe_unavailable`) fail closed. Retryable failures (`token_expired`, `token_refresh_failed`, `gmail_quota_limited`, `gmail_rate_limited`, `label_create_failed`, `filter_create_failed`, `undo_partial_failure`, `disconnect_failed`, `data_delete_partial_failure`) attempt recovery. Partial failures (`partial_scan`, `undo_partial_failure`, `data_delete_partial_failure`) complete what they can and report degradation.

## Incident Response

See `docs/incident-response.md` for S1/S2 procedures.

### Severity 1

Token exposure, unauthorized Gmail action, deletion behavior, or cross-user data access.

Actions:

1. Disable OAuth client if needed.
2. Rotate Google OAuth secrets.
3. Rotate `TOKEN_ENCRYPTION_KEY` and invalidate sessions.
4. Review audit events and Gmail filter ids.
5. Notify affected users with exact action scope.

### Severity 2

Gmail quota, filter creation failures, partial undo, or Supabase outage.

Actions:

1. Keep user-facing routes degraded, not crashed.
2. Preserve audit events for completed actions.
3. Disable new quiet actions if reversibility cannot be recorded.
4. Publish status and retry guidance.

### Log Rules

Never log OAuth tokens, email bodies, snippets, attachments, raw Gmail account email, or unsubscribe URLs with personal tokens.

## Incident Contact

Until a public security mailbox exists, route reports through the repository owner. Rotate Google OAuth secrets and `TOKEN_ENCRYPTION_KEY` after any suspected token exposure.
