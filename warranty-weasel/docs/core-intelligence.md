# Core Intelligence Layer

**Location:** `src/lib/core-intelligence/`

**Purpose:** Reusable intelligence system for WarrantyWeasel, ReviewGhost, and InboxExorcist.

---

## Architecture

```
lib/core-intelligence/
├── types.ts              # Shared type contract (all apps use this)
├── index.ts              # Public API exports
├── scoring.ts            # Category-aware score computation
├── degradedState.ts      # Central degraded state handler
├── failure/              # Failure engine
│   └── index.ts          # Handler registry, scenario mapping, fallback strategies
├── signals/              # Signal engine
│   └── index.ts          # Modular detection, weighted scoring, aggregation
├── confidence/           # Confidence engine
│   └── index.ts          # Confidence calculation with caps
├── adapters/             # Domain adapters
│   ├── index.ts          # Adapter registry + router
│   ├── amazon.ts         # Amazon-specific fetch/parse/category
│   ├── walmart.ts        # Walmart-specific fetch/parse/category
│   ├── bestbuy.ts        # Best Buy-specific fetch/parse/category
│   └── generic.ts        # Fallback for any domain
├── cache/                # Caching layer
│   └── index.ts          # URL hashing, TTL, in-flight dedup
├── observability/        # Observability layer
│   └── index.ts          # Structured logs, latency, degraded/UNKNOWN rate
└── utils/                # Utility functions
    └── index.ts          # clamp, sleep, normalizeUrl, textSimilarity, etc.
```

---

## Modules

### Failure Engine (`failure/`)

- **Handler registry:** `failureScenarios` record maps FS-* IDs to full metadata
- **Scenario mapping:** `detectFailureFromResponse()` maps HTTP status + HTML to failure ID
- **Fallback strategies:** Each scenario declares its strategy (`retry-with-backoff`, `try-next-tier`, `return-unknown`, etc.)
- All failures map to degraded state or UNKNOWN
- All failures include user-safe message and confidence penalty

### Signal Engine (`signals/`)

- **Modular detection:** 15+ independent signal detectors, each with `detect()` function
- **Weighted scoring:** Suspicious signals (positive weight) and safe signals (negative weight)
- **Signal aggregation:** `aggregateSignals()` computes totals by strength category
- Signals are deterministic, include explanations, and produce evidence

### Confidence Engine (`confidence/`)

- Calculates confidence from signal strength, review count, and failure penalties
- Caps applied for: missing data, failure scenarios, weak evidence
- 3+ strong signals boost confidence (only when failure penalty < 25)
- Returns `capped` flag and `capReason` for transparency

### Domain Adapters (`adapters/`)

- **Router:** `getAdapterForUrl()` selects the right adapter by domain pattern
- Each adapter provides: `fetch()`, `parse()`, `extractCategory()`
- Adapters degrade gracefully — never crash, always return structured data
- Generic adapter handles any unknown domain

### Caching Layer (`cache/`)

- **URL hashing:** SHA-256 of normalized URL
- **TTL cache:** Configurable TTL (default 1 hour)
- **In-flight deduplication:** `withCoalescing()` prevents duplicate concurrent requests
- **Memory store:** `IntelligenceCache` class with max size eviction
- No PII stored

### Observability (`observability/`)

- **Structured logs:** All events typed with `ObservabilityEvent`
- **Latency tracking:** `trackLatency(operation, durationMs, success)`
- **Degraded state tracking:** `trackDegraded(context)`
- **UNKNOWN rate tracking:** `getStats()` returns degradedRate and unknownRate
- No personal data logged — URLs are hashed, sensitive fields redacted

### Degraded State Handler (`degradedState.ts`)

```ts
handleDegradedState({
  reason: 'captcha_block',
  failureId: 'FS-02',
  fallback: 'return-unknown',
  userMessage: 'Unable to access reviews.',
  confidenceImpact: 50,
})
// Returns: { verdict: 'UNKNOWN', confidenceImpact: 50, userMessage: '...', shouldReturnUnknown: true }
```

- Maintains history (last 100 entries)
- Provides stats: total count, average impact, most common reason

---

## Shared Type Contract

All apps import types from `@/lib/core-intelligence`:

```ts
import type {
  AnalysisResult,
  SignalResult,
  FetchResult,
  ParsedData,
  ConfidenceResult,
  ScoreResult,
  DegradedStateContext,
  ObservabilityEvent,
  Verdict,
  ErrorCode,
} from '@/lib/core-intelligence'
```

The `AnalysisResult` interface is the primary output contract:

```ts
interface AnalysisResult {
  schemaVersion: string
  ok: boolean
  resultId: string
  url: string
  verdict: Verdict
  confidence: number
  confidenceExplanation: string
  reasons: string[]
  signals: SignalDetail[]
  evidence: EvidenceDetail[]
  limitations: string[]
  degraded?: boolean
  errorCode?: ErrorCode
  reviewCount: number
  productName?: string
  category?: string
}
```

---

## Reuse Pattern

### For ReviewGhost / InboxExorcist

1. Copy `src/lib/core-intelligence/` into the target project
2. Install `cheerio` dependency (used by adapters)
3. Import from `@/lib/core-intelligence`
4. Use `getAdapterForUrl(url)` to route fetches
5. Use `runSignalDetection(reviews, metadata)` for analysis
6. Use `computeConfidence()` and `computeScore()` for scoring
7. Types are shared — no adaptation needed

### Minimal Integration

```ts
import { getAdapterForUrl, runSignalDetection, computeConfidence, computeScore } from '@/lib/core-intelligence'

const adapter = getAdapterForUrl(url)
const fetchResult = await adapter.fetch(url)
const parsedData = adapter.parse(fetchResult.html || '')
const signals = runSignalDetection(parsedData.reviews, parsedData.metadata)
const confidence = computeConfidence(signals, parsedData.reviews.length, fetchResult.confidencePenalty, parsedData.reviews.length > 0)
const score = computeScore(signals, parsedData.reviews.length, fetchResult.confidencePenalty, parsedData.productName, parsedData.metadata, confidence.confidence, confidence.explanation)
```

---

## Tests

| Module | Tests | Status |
|--------|-------|--------|
| failure | 21 | PASS |
| signals | 20 | PASS |
| confidence | 14 | PASS |
| cache | 10 | PASS |
| degradedState | 8 | PASS |
| utils | 16 | PASS |

Total: 89 core-intelligence tests + 86 existing tests = **175 tests passing**

---

## Verification

| Command | Result |
|---------|--------|
| `npm run typecheck` | PASS (0 errors) |
| `npm run lint` | PASS (0 errors, 0 warnings) |
| `npm run test` | PASS (175/175 tests, 12 test files) |
| `npm run build` | PASS |
