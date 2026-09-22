# Degraded States

InboxExorcist is designed to degrade gracefully rather than crash. Every user-facing route and API endpoint returns a structured degraded response when upstream services fail.

## Degraded Response Envelope

All API responses follow the `ApiErrorEnvelope` or `ApiSuccessEnvelope` pattern:

```typescript
interface ApiErrorEnvelope {
  ok: false;
  code: string;
  message: string;
  retryable: boolean;
  degraded?: boolean;
}

interface ApiSuccessEnvelope<T> {
  ok: true;
  data: T;
  degraded?: boolean;
  warnings?: string[];
}
```

When `degraded: true`, the response indicates partial functionality. The UI should display a warning but continue to operate where possible.

## Degraded State Matrix

| Condition | Route | Behavior | User Message |
|-----------|-------|----------|--------------|
| Google OAuth not configured | `/api/auth/google/start` | Redirect to `/auth/error` | "Gmail connection unavailable" |
| Google OAuth not configured | `/api/health` | `googleOAuthConfigured: false` | Health check reports degraded |
| Gmail token expired | Any Gmail API route | Return 401 with `token_expired`, retry once | "Gmail session expired. Reconnect." |
| Gmail token refresh failed | Any Gmail API route | Return 500 with `token_refresh_failed` | "Gmail session expired. Reconnect." |
| Insufficient scopes | Any Gmail API route | Return 403 with `insufficient_scopes` | "Gmail did not grant required access" |
| Gmail quota limited (429) | Any Gmail API route | Return 429 with `gmail_quota_limited`, retryable | "Gmail is busy. Retry in a moment." |
| Gmail rate limited (429) | Any Gmail API route | Return 429 with `gmail_rate_limited`, retryable | "Gmail is busy. Retry in a moment." |
| Circuit breaker open | Scan/quiet routes | Return degraded envelope | "Gmail is temporarily unavailable" |
| Scan partial | `/api/scan/run` | Return `partial_scan` with results so far | "Some senders could not be classified" |
| Label creation fails | `/api/quiet/run` | Continue with remaining, `quiet_action_partial` | "Some filters could not be created" |
| Filter creation fails | `/api/quiet/run` | Continue with remaining, warnings in result | "Some filters could not be created" |
| Undo partial | `/api/undo/run` | Return `undo_partial` with removed count | "Some filters could not be removed" |
| Supabase unavailable | All routes | Fall back to in-memory store | No user-visible change; data not persisted |
| No session | Any authenticated route | Return 401 `UNAUTHENTICATED` | Redirect to landing page |
| Gmail disconnected | `/api/gmail/*` | Return 401 | "Gmail connection required" |

## Failure Code Details

The Gmail failure registry (`src/lib/gmail/failure-registry.ts`) defines each failure's properties:

| Code | HTTP | Retryable | Degraded |
|------|------|-----------|----------|
| `oauth_denied` | 401 | no | no |
| `insufficient_scopes` | 403 | no | no |
| `token_expired` | 401 | yes | no |
| `token_refresh_failed` | 500 | yes | yes |
| `gmail_quota_limited` | 429 | yes | yes |
| `gmail_rate_limited` | 429 | yes | yes |
| `partial_scan` | 206 | partial | yes |
| `label_create_failed` | 500 | yes | yes |
| `filter_create_failed` | 500 | yes | yes |
| `unsubscribe_unavailable` | — | no | no |
| `undo_partial_failure` | 206 | yes | yes |
| `disconnect_failed` | 500 | yes | yes |
| `data_delete_partial_failure` | 206 | yes | yes |

## Circuit Breaker Degradation

When the circuit breaker opens after 5 consecutive Gmail failures:

1. All Gmail calls throw immediately with `{code: "CIRCUIT_OPEN", degraded: true}`
2. The health endpoint reports `circuitBreakersDegraded: true`
3. New scan requests are rejected with a degraded envelope
4. After 30 seconds, the circuit transitions to half-open
5. Three successful calls re-close the circuit
6. Any failure in half-open reopens the circuit

## Supabase Degradation

When `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY` is not set:

- The store falls back to `MemoryStore` (in-memory)
- Data does not persist across server restarts
- The health endpoint reports `storage: "memory"` and `supabase: false`
- All user flows continue to work
- No user-visible error is shown

This is intentional for local development. Production must have Supabase configured.

## OAuth Configuration Degradation

When `GOOGLE_CLIENT_ID` or `GOOGLE_CLIENT_SECRET` is not set:

- `/api/auth/google/start` redirects to `/auth/error`
- `/api/health` reports `googleOAuth: false`
- The scan page displays "Ready when Gmail is connected"
- No crash or 500 error

## Partial Action Handling

When a quiet or undo operation encounters a failure mid-batch:

1. Completed actions are recorded in the database
2. Failed actions are logged with their error code
3. The response includes `degraded: true` with `warnings` array
4. The `UndoResult` includes `signals.removedFilters` and `signals.failedCount`
5. Users can retry the failed portion via the action history UI

## Error Mapping

The Gmail error mapper (`src/lib/gmail/error-map.ts`) translates HTTP responses to consistent app errors:

| HTTP Status | App Error Code | Retryable |
|-------------|----------------|-----------|
| 401 | `GMAIL_AUTH_EXPIRED` | yes |
| 403 | `INSUFFICIENT_SCOPES` | no |
| 429 | `GMAIL_QUOTA_LIMITED` | yes |
| 500+ | `GMAIL_UPSTREAM_ERROR` | yes (503) |
| Other | `GMAIL_REQUEST_FAILED` | no (502) |
