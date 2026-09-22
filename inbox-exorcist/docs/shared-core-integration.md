# Shared Core Integration

This document describes the shared diagnostic primitives available to all InboxExorcist subsystems and how to use them.

## Overview

All shared components live under `src/lib/diagnostics/` and are designed to be:

- **Stateless per request** where possible
- **Process-scoped** via `globalThis` registries when shared state is needed
- **Zero external dependencies** — only Node.js built-ins and TypeScript
- **Privacy-first** — no token, body, or PII leakage

## Components

| Module | File | Purpose |
|---|---|---|
| safe-log | `src/lib/diagnostics/safe-log.ts` | Structured, redacted logging |
| events | `src/lib/diagnostics/events.ts` | 17-type diagnostic event bus |
| cost | `src/lib/diagnostics/cost.ts` | API call and cache metrics |
| cache | `src/lib/diagnostics/cache.ts` | In-flight dedup + TTL sender cache |
| circuit-breaker | `src/lib/diagnostics/circuit-breaker.ts` | Per-service failure isolation |
| idempotency | `src/lib/diagnostics/idempotency.ts` | Deduplicated execution with cached results |

---

## Safe Log

**File:** `src/lib/diagnostics/safe-log.ts`

Guarantees that sensitive values never appear in log output.

### Redaction Rules

**17 sensitive fields** are replaced with `[REDACTED]`:

```
access_token, refresh_token, token, authorization, cookie, password, secret,
pi_hash, email, sender_email, body, subject, raw, content, message_body, attachment
```

**3 regex patterns** mask inline values:

- Email addresses
- OAuth tokens (`ya29.*`)
- JWT tokens (`eyJ.*`)

### API

```ts
import { safeLogInfo, safeLogWarn, safeLogError, safeStringify } from './diagnostics/safe-log';

safeLogInfo('scan_started', { userId: 'u1', senderCount: 42 });
// → {"ts":"2026-05-01T14:00:00.000Z","level":"info","service":"inboxexorcist","msg":"scan_started","meta":{"userId":"u1","senderCount":42}}

safeLogError('token_expired', { access_token: 'ya29.xxx', userId: 'u1' });
// → {"ts":"...","level":"error",...,"meta":{"access_token":"[REDACTED]","userId":"u1"}}
```

Use `safeStringify` for any JSON output that may contain user data.

### Integration Points

- All API route handlers log entry/exit with `safeLogInfo`/`safeLogError`
- Gmail client methods use `safeLogWarn` for retries
- Never bypass `safeLog*` — do not use `console.log` in production code paths

---

## Diagnostic Events

**File:** `src/lib/diagnostics/events.ts`

Structured event emission for the full user lifecycle. Used by CRM integrations, audit trails, and degraded-mode telemetry.

### 17 Event Types

| Category | Events |
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
  id: string;           // crypto.randomUUID()
  userId: string;
  type: DiagnosticEventType;
  timestamp: string;    // ISO 8601
  metadata?: Record<string, unknown>;
  degraded?: boolean;
  error?: string;
}
```

### API

```ts
import { emitDiagnosticEvent, setDiagnosticEventSink } from './diagnostics/events';

// Set persistent sink (e.g. Supabase, file, queue)
setDiagnosticEventSink(async (events) => {
  await supabase.from('diagnostic_events').insert(events);
});

// Emit anywhere in the codebase
emitDiagnosticEvent({
  type: 'scan_completed',
  userId: req.session.userId,
  metadata: { noisyCount: 12, reviewCount: 5, protectedCount: 3 },
});
```

### Integration Points

- `/api/auth/google/callback` emits `oauth_completed` / `oauth_failed`
- `/api/scan/run` emits `scan_started` → `scan_completed` (or `partial_scan`)
- `/api/quiet/run` emits `quiet_action_started` → `quiet_action_completed` (or `quiet_action_partial`)
- `/api/undo/run` emits `undo_started` → `undo_completed` (or `undo_partial`)
- Protected sender logic emits `protected_sender_skipped`

---

## Cost Tracking

**File:** `src/lib/diagnostics/cost.ts`

Tracks Gmail API call volume, cache effectiveness, and retry rates. Process-scoped via `globalThis.__inboxExorcistCostMetrics`.

### Metrics

```ts
interface CostMetrics {
  gmailApiCalls: number;
  gmailApiCallsInWindow: number;  // sliding window (default 60s)
  scanSize: number;               // messages scanned
  senderCount: number;
  actionCount: number;
  partialScanRate: number;
  cacheHits: number;
  cacheMisses: number;
  cacheHitRate: number;           // hits / (hits + misses)
  retryCount: number;
  windowStart: number;            // epoch ms
  windowMs: number;               // default 60000
}
```

### API

```ts
import {
  countGmailApiCall, recordCacheHit, recordCacheMiss,
  getCostMetrics, resetCostMetrics, countRetry, recordScanSize
} from './diagnostics/cost';

// Before each Gmail API call
countGmailApiCall();

// Cache layer
if (cached) { recordCacheHit(); } else { recordCacheMiss(); }

// On retry
countRetry();

// Health/monitoring endpoint
const metrics = getCostMetrics();
// → { gmailApiCalls: 42, cacheHitRate: 0.85, ... }
```

### Integration Points

- Gmail client calls `countGmailApiCall()` on each API invocation
- Cache module calls `recordCacheHit()` / `recordCacheMiss()`
- `/api/health` exposes cost metrics in the response
- `resetCostMetrics()` is called on cold start to clear stale windows

---

## Cache and Deduplication

**File:** `src/lib/diagnostics/cache.ts`

Two complementary caches to prevent redundant work and duplicate scans.

### In-Flight Dedup

`SCAN_IN_FLIGHT: Map<userId, Promise>` — prevents concurrent duplicate scans for the same user.

```ts
import { getInFlightScan, registerInFlightScan, hasInFlightScan } from './diagnostics/cache';

async function handleScan(userId: string) {
  const existing = getInFlightScan(userId);
  if (existing) return existing;

  const promise = performScan(userId).finally(() => {
    // Auto-cleanup on resolve/reject
  });
  registerInFlightScan(userId, promise);
  return promise;
}
```

### Sender Cache

`SENDER_CACHE: Map<key, {data, expiresAt}>` — TTL-based cache for sender classification results.

```ts
import { getSenderFromCache, cacheSender, clearSenderCache } from './diagnostics/cache';

const cached = getSenderFromCache('user1:sender@domain.com');
if (cached) return cached;

const result = classifySender(sender);
cacheSender('user1:sender@domain.com', result, { ttlMs: 300_000 }); // 5 min default
```

### Functions

| Function | Purpose |
|---|---|
| `getInFlightScan(userId)` | Returns pending scan promise or undefined |
| `registerInFlightScan(userId, promise)` | Registers in-flight scan with auto-cleanup |
| `hasInFlightScan(userId)` | Boolean check |
| `getSenderFromCache(key)` | Returns cached data or undefined |
| `cacheSender(key, data, opts?)` | Stores with TTL |
| `clearSenderCache(userId?)` | Clears all or user-specific entries |
| `resetAllCaches()` | Clears both caches entirely |

---

## Circuit Breaker

**File:** `src/lib/diagnostics/circuit-breaker.ts`

Prevents cascading failures by isolating failing services. Per-named-breaker state via `globalThis.__inboxExorcistBreakers`.

### States

| State | Behavior |
|---|---|
| `closed` | Normal — requests pass through |
| `open` | Failing — requests fail immediately |
| `half-open` | Testing — limited requests probe recovery |

### Default Configuration

```ts
const defaultConfig = {
  failureThreshold: 5,      // consecutive failures to open
  recoveryTimeoutMs: 30000, // 30s before half-open
  halfOpenMaxAttempts: 3,   // successes needed to close
};
```

### API

```ts
import { getCircuitBreaker, resetCircuitBreakers } from './diagnostics/circuit-breaker';

const gmailBreaker = getCircuitBreaker('gmail-api');

try {
  const result = await gmailBreaker.execute(async () => {
    return await gmailClient.listMessages();
  });
} catch (err) {
  if (gmailBreaker.isDegraded()) {
    // Return degraded response to user
    return { ok: false, degraded: true };
  }
}

// Admin/reset endpoint
resetCircuitBreakers();
```

### Integration Points

- Gmail API calls are wrapped in `gmail-api` circuit breaker
- Supabase store calls use `supabase-store` breaker
- `/api/health` reports breaker states
- When degraded, API routes return structured error envelopes

---

## Idempotency

**File:** `src/lib/diagnostics/idempotency.ts`

Dual-map approach prevents duplicate execution and caches results.

### Maps

| Map | Purpose | TTL |
|---|---|---|
| `IDEMPOTENCY_KEYS` | In-flight promises prevent concurrent duplicate execution | Until promise settles |
| `IDEMPOTENCY_RESULTS` | Cached results for repeated calls | 60 seconds |

### API

```ts
import { withIdempotency, clearIdempotencyKeys, resetIdempotency } from './diagnostics/idempotency';

// Wrap any async operation
const result = await withIdempotency(`quiet:${userId}:${quietId}`, async () => {
  return await performQuietAction(userId, quietId);
});

// Cleanup
clearIdempotencyKeys('quiet:');
resetIdempotency();
```

### Integration Points

- `/api/quiet/run` wrapped with `withIdempotency('quiet:${userId}')`
- `/api/undo/run` wrapped with `withIdempotency('undo:${userId}')`
- `/api/scan/run` uses in-flight dedup (cache module) which is equivalent
- Prevents double-charging and duplicate filter creation

---

## Failure Registry

**File:** `src/lib/gmail/failure-registry.ts`

Centralizes all known Gmail failure modes with retry and degradation guidance.

### 13 Failure Codes

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
| `unsubscribe_unavailable` | No | No | - |
| `undo_partial_failure` | Yes | Yes | 206 |
| `disconnect_failed` | Yes | Yes | 500 |
| `data_delete_partial_failure` | Yes | Yes | 206 |

### API

```ts
import { lookupGmailFailure, isKnownGmailFailure, gmailFailureEnvelope } from './gmail/failure-registry';

const spec = lookupGmailFailure('gmail_quota_limited');
// → { message: 'Gmail quota exceeded. Retry later.', retryable: true, degraded: true, httpStatus: 429 }

// Build error response envelope
const envelope = gmailFailureEnvelope('oauth_denied');
// → { ok: false, code: 'oauth_denied', message: '...', retryable: false, degraded: false }
```

### Integration Points

- All Gmail client error handlers map to failure codes
- API routes return `gmailFailureEnvelope()` on failure
- Circuit breaker increments use failure codes to track consecutive errors
- User-facing error messages come from `FailureSpec.message`

---

## Usage Rules

1. **Always use `safeLog*`** — never `console.log` for operational logging
2. **Emit events at entry and exit** of every user-facing operation
3. **Wrap Gmail API calls** in the circuit breaker
4. **Use `withIdempotency`** for any mutation endpoint
5. **Check `isDegraded()`** before returning user-facing errors
6. **Never store raw tokens or email bodies** — use `safeStringify` for any structured output
7. **Reset state on cold start** — all `globalThis` registries are process-scoped and do not survive restarts
