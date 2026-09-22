# Diagnostics

InboxExorcist includes a suite of shared diagnostic primitives that power observability, reliability, and cost control across all subsystems.

## Components

| Component | File | Purpose |
|---|---|---|
| Safe Log | `src/lib/diagnostics/safe-log.ts` | Structured, privacy-safe logging with automatic redaction |
| Event Bus | `src/lib/diagnostics/events.ts` | 17-type diagnostic event system for CRM and audit |
| Cost Tracking | `src/lib/diagnostics/cost.ts` | Gmail API call metrics, cache rates, retry counts |
| Cache/Dedupe | `src/lib/diagnostics/cache.ts` | In-flight scan dedup + TTL sender cache |
| Circuit Breaker | `src/lib/diagnostics/circuit-breaker.ts` | Per-service failure isolation with recovery |
| Idempotency | `src/lib/diagnostics/idempotency.ts` | Dual-map deduplication with result caching |

## Safe Log

### Redaction

- **17 sensitive fields** are replaced with `[REDACTED]`: `access_token`, `refresh_token`, `token`, `authorization`, `cookie`, `password`, `secret`, `pi_hash`, `email`, `sender_email`, `body`, `subject`, `raw`, `content`, `message_body`, `attachment`
- **3 regex patterns** mask inline values: email addresses, OAuth tokens (`ya29.*`), JWT tokens (`eyJ.*`)
- Circular references produce `[CIRCULAR]`

### API

```ts
import { safeLogInfo, safeLogWarn, safeLogError, safeStringify } from './diagnostics/safe-log';

safeLogInfo('scan_started', { userId: 'u1', senderCount: 42 });
// Produces structured JSON: {ts, level, service, msg, meta}
```

### Output

```json
{
  "ts": "2026-05-01T14:00:00.000Z",
  "level": "info",
  "service": "inboxexorcist",
  "msg": "scan_started",
  "meta": { "userId": "u1", "senderCount": 42 }
}
```

## Event Bus

### 17 Diagnostic Event Types

| Prefix | Events |
|---|---|
| OAuth | `oauth_started`, `oauth_completed`, `oauth_failed` |
| Scan | `scan_started`, `scan_completed`, `partial_scan` |
| Preview | `preview_viewed` |
| Quiet | `quiet_action_started`, `quiet_action_completed`, `quiet_action_partial` |
| Undo | `undo_started`, `undo_completed`, `undo_partial` |
| User | `disconnect_clicked`, `data_delete_requested` |
| Safety | `protected_sender_skipped` |
| Degraded | `gmail_quota_limited` |

### Event Shape

```ts
interface DiagnosticEvent {
  id: string;
  userId: string;
  type: DiagnosticEventType;
  timestamp: string;  // ISO 8601
  metadata?: Record<string, unknown>;
  degraded?: boolean;
  error?: string;
}
```

### Sink Registration

```ts
setDiagnosticEventSink(async (events) => {
  await supabase.from('diagnostic_events').insert(events);
});
```

Without a registered sink, events are processed in-memory and logged via `safeLog`.

## Cost Tracking

Process-scoped metrics via `globalThis.__inboxExorcistCostMetrics`:

```ts
interface CostMetrics {
  gmailApiCalls: number;
  gmailApiCallsInWindow: number;
  scanSize: number;
  senderCount: number;
  actionCount: number;
  partialScanRate: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;
  retryCount: number;
  windowStart: number;
  windowMs: number;  // default 60000
}
```

### API

| Function | Purpose |
|---|---|
| `countGmailApiCall()` | Increment before each Gmail API invocation |
| `recordCacheHit()` / `recordCacheMiss()` | Track cache effectiveness |
| `countRetry()` | Track retry attempts |
| `recordScanSize(n)` | Record messages scanned |
| `recordSenderCount(n)` | Record senders classified |
| `countAction()` | Record quiet/undo action |
| `recordPartialScan()` | Track partial scan rate |
| `getCostMetrics()` | Read current snapshot |
| `resetCostMetrics()` | Clear all counters (cold start) |

## Cache and Dedupe

### In-Flight Scan Dedup

`SCAN_IN_FLIGHT: Map<userId, Promise>` — prevents concurrent duplicate scans per user. Auto-cleanup via `Promise.finally()`.

```ts
const existing = getInFlightScan(userId);
if (existing) return existing;
registerInFlightScan(userId, performScan(userId));
```

### Sender Cache

`SENDER_CACHE: Map<key, {data, expiresAt}>` — TTL-based sender classification cache, default 5 minutes.

```ts
cacheSender('user1:sender@domain.com', result, { ttlMs: 300_000 });
const cached = getSenderFromCache('user1:sender@domain.com');
```

### Functions

| Function | Purpose |
|---|---|
| `getInFlightScan(userId)` | Returns pending scan promise or undefined |
| `registerInFlightScan(userId, promise)` | Register with auto-cleanup |
| `hasInFlightScan(userId)` | Boolean check |
| `getSenderFromCache(key)` | Returns cached data or undefined |
| `cacheSender(key, data, opts?)` | Store with TTL |
| `clearSenderCache(userId?)` | Clear user-specific or all |
| `resetAllCaches()` | Full reset |

## Circuit Breaker

### States

| State | Behavior |
|---|---|
| `closed` | Normal operation |
| `open` | Failing — requests fail immediately |
| `half-open` | Probing — limited requests test recovery |

### Configuration

```ts
{
  failureThreshold: 5,       // consecutive failures to open
  recoveryTimeoutMs: 30000,  // 30s before half-open
  halfOpenMaxAttempts: 3,    // successes to close
}
```

### API

```ts
const breaker = getCircuitBreaker('gmail-api');
try {
  return await breaker.execute(() => gmailClient.listMessages());
} catch {
  if (breaker.isDegraded()) {
    return { ok: false, degraded: true };
  }
}
```

Breakers are registered on `globalThis.__inboxExorcistBreakers`. Use `resetCircuitBreakers()` to clear all state.

## Idempotency

### Dual-Map Approach

| Map | Purpose | TTL |
|---|---|---|
| `IDEMPOTENCY_KEYS` | In-flight promises prevent concurrent duplicates | Until settle |
| `IDEMPOTENCY_RESULTS` | Cached results for repeated calls | 60 seconds |

### API

```ts
const result = await withIdempotency(`quiet:${userId}:${quietId}`, async () => {
  return await performQuietAction(userId, quietId);
});
```

### Functions

| Function | Purpose |
|---|---|
| `withIdempotency(key, fn)` | Execute with dedup |
| `clearIdempotencyKeys(prefix?)` | Clear by prefix or all |
| `resetIdempotency()` | Full reset |

## Gmail Failure Registry

**13 failure codes** in `src/lib/gmail/failure-registry.ts`:

| Code | Retryable | Degraded | HTTP Status |
|---|---|---|---|
| `oauth_denied` | No | No | 401 |
| `insufficient_scopes` | No | No | 403 |
| `token_expired` | Yes | No | 401 |
| `token_refresh_failed` | Yes | Yes | 500 |
| `gmail_quota_limited` | Yes | Yes | 429 |
| `gmail_rate_limited` | Yes | Yes | 429 |
| `partial_scan` | Partial | Yes | 206 |
| `label_create_failed` | Yes | Yes | 500 |
| `filter_create_failed` | Yes | Yes | 500 |
| `unsubscribe_unavailable` | No | No | — |
| `undo_partial_failure` | Yes | Yes | 206 |
| `disconnect_failed` | Yes | Yes | 500 |
| `data_delete_partial_failure` | Yes | Yes | 206 |

### API

```ts
import { lookupGmailFailure, gmailFailureEnvelope } from './gmail/failure-registry';

const spec = lookupGmailFailure('gmail_quota_limited');
// → { message: 'Gmail quota exceeded. Retry later.', retryable: true, degraded: true, httpStatus: 429 }

const envelope = gmailFailureEnvelope('oauth_denied');
// → { ok: false, code: 'oauth_denied', message: '...', retryable: false, degraded: false }
```

## Health Endpoint

`GET /api/health` aggregates diagnostics:

```json
{
  "ok": true,
  "googleOAuthConfigured": true,
  "securitySecretsConfigured": true,
  "storageMode": "supabase",
  "paymentFeatureFlag": false,
  "degraded": false,
  "costMetrics": { "gmailApiCalls": 42, "cacheHitRate": 0.85 },
  "circuitBreakers": { "gmail-api": "closed", "supabase-store": "closed" }
}
```
