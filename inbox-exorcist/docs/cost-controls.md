# Cost Controls

InboxExorcist tracks and controls Gmail API usage to prevent quota exhaustion, unexpected charges, and degraded user experience.

## Gmail API Quota Limits

Google's Gmail API has per-user and per-project quotas:

| Quota | Limit |
|-------|-------|
| Requests per user per second | 250 |
| Requests per project per second | 1,000,000 |
| Daily quota | Varies by project |

InboxExorcist implements controls at multiple layers to stay within safe bounds.

## In-Flight Scan Deduplication

`src/lib/diagnostics/cache.ts` prevents concurrent scans for the same user:

```typescript
const existing = getInFlightScan(userId);
if (existing) return existing;
```

If a user clicks "Scan" twice rapidly, the second request receives the same Promise as the first. This halves API calls for duplicate requests.

## Sender Classification Cache

Classification results are cached for 5 minutes per `userId:senderDomain`:

```typescript
const cached = getSenderFromCache(`${userId}:${domain}`);
if (cached) return cached;
```

Re-scanning the same inbox within the TTL window avoids re-fetching headers for already-classified senders.

## Circuit Breaker

`src/lib/diagnostics/circuit-breaker.ts` stops calling Gmail when errors exceed a threshold:

```
closed (normal) → 5 failures → open (block all calls) → 30s → half-open → 3 successes → closed
```

When the circuit is open, scan and quiet operations fail fast with a degraded response instead of hammering a failing Gmail endpoint.

## Batch Operations

Message modification uses Gmail's batch endpoint:

```
POST /gmail/v1/users/me/messages/batchModify
```

Messages are chunked in groups of 1000, reducing API calls from N (one per message) to ceil(N/1000).

## Paginated Fetching

`listRecentMessageHeaders` uses Gmail's pagination with `maxResults` per page. The scan validates `maxMessages` between 10 and 500, preventing unbounded fetching.

Default scan query targets only relevant messages:

```
newer_than:90d (category:promotions OR list:* OR unsubscribe) -from:me
```

This reduces the message set from the full inbox to likely promotional senders in the last 90 days.

## Cost Metrics Tracking

All API calls, retries, cache hits, and misses are tracked in real-time via `src/lib/diagnostics/cost.ts`:

```typescript
interface CostMetrics {
  gmailApiCalls: number;
  gmailApiCallsInWindow: number;   // 60s rolling window
  scanSize: number;
  senderCount: number;
  actionCount: number;
  cacheHits: number;
  cacheMisses: number;
  retryCount: number;
  partialScanRate: number;
  cacheHitRate: number;
}
```

These metrics are available via `getCostMetrics()` and exposed in `/api/health`.

## Rate Limit Handling

The Gmail error mapper (`src/lib/gmail/error-map.ts`) recognizes 429 responses:

| Status | Code | Retryable |
|--------|------|-----------|
| 429 | `gmail_quota_limited` | yes |
| 429 | `gmail_rate_limited` | yes |

Both emit the `gmail_quota_limited` diagnostic event and return a degraded envelope with `retryable: true`.

## Scan Size Controls

The scan API validates `maxMessages` between 10 and 500:

```typescript
if (maxMessages < 10 || maxMessages > 500) {
  // AppError: maxMessages must be between 10 and 500
}
```

This prevents a single scan from fetching more than 500 message pages.

## Undo Limits

Undo operations default to affecting at most 25 actions when no specific action IDs are provided:

```typescript
const actions = actionIds ? allActions : allActions.slice(0, 25);
```

This prevents accidental bulk undo of all historical actions.

## Storage Mode Cost Implications

| Mode | Gmail API Calls | Storage Cost |
|------|-----------------|--------------|
| Supabase (production) | Controlled by above mechanisms | Postgres row storage |
| In-memory (dev) | Same controls apply | No persistence |

The in-memory fallback has no additional storage cost but also no persistence across restarts.

## Monitoring Recommendations

1. Monitor `gmailApiCallsInWindow` for spikes above expected patterns
2. Alert when `partialScanRate` exceeds 0.1 (10% of scans are partial)
3. Track `cacheHitRate` — a low rate indicates the 5-minute TTL may be insufficient
4. Watch `retryCount` — increasing retries suggest upstream degradation
5. Monitor circuit breaker state transitions — frequent open/close cycles indicate flaky Gmail connectivity
