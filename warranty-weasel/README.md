# ReviewGhost

**See through fake reviews.**

<!-- BEGIN: REPO HERO -->
![Repository hero generated locally on the EPYC GPU stack](assets/repo-hero.png)
<!-- END: REPO HERO -->

ReviewGhost analyzes publicly available product review pages to detect suspicious patterns that may indicate manipulated, fake, or unreliable reviews.

## What It Does

Given a product page URL, ReviewGhost:

1. **Fetches** the page using a tiered, failure-aware scraper
2. **Parses** review data from JSON-LD structured data and DOM content
3. **Detects** 15+ suspicious signals (temporal clustering, duplicate text, safety concerns, etc.)
4. **Scores** the evidence using category-adjusted weights
5. **Returns** a verdict (BUY / CAUTION / AVOID / UNKNOWN) with confidence and evidence

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000` and paste a product URL.

## API

### POST /api/analyze

```json
{ "url": "https://www.example.com/product/123" }
```

Returns an `AnalysisResult` with verdict, confidence, signals, evidence, and limitations.

### GET /api/health

Returns service health status.

## Architecture

- **Intelligence Engine** — 50 failure scenarios, 20 suspicious signals, 8 safe signals, 8 category rules, 10 edge cases
- **Tiered Scraper** — Desktop UA → Mobile UA → Alternate Mobile → UNKNOWN
- **Resilient Parser** — JSON-LD first, DOM fallback, strict HTML sanitization
- **Signal Detection** — 15 detectors covering temporal, linguistic, behavioral, and content patterns
- **Scoring Engine** — Category-adjusted weights with confidence caps
- **Security** — SSRF protection, HTTPS-only, HTML sanitization, size/timeout limits

## Verdicts

| Verdict | Score Range | Meaning |
|---------|------------|---------|
| BUY | 0–30 | Low risk signals detected |
| CAUTION | 31–60 | Moderate risk signals detected |
| AVOID | 61–100 | High risk signals detected |
| UNKNOWN | N/A | Insufficient or inaccessible data |

## Tech Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Cheerio (server-side HTML parsing)
- Vitest (testing)

## License

MIT
