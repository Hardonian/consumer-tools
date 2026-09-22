# Security

## SSRF Protection

All URLs are validated before fetching:

- **HTTPS only** — HTTP URLs are rejected
- **Private IP blocking** — 10.x.x.x, 172.16-31.x.x, 192.168.x.x, 127.x.x.x, 169.254.x.x, ::1, fe80:, fc00:, fd00:
- **Direct IP blocking** — No raw IP addresses allowed
- **Blocked hosts** — localhost, metadata.google.internal, 169.254.169.254, metadata.azure.com
- **Protocol validation** — Only http: and https: allowed (http rejected in practice)

## Request Limits

- **Timeout**: 15 seconds per request
- **Max response size**: 2MB (truncated safely if exceeded)
- **Max retries**: 3 per tier
- **Max tiers**: 3 (desktop, mobile, alternate mobile)

## HTML Sanitization

All HTML content is sanitized before parsing:

- Script tags and content removed
- Event handlers (onclick, onerror, etc.) stripped
- javascript: URLs removed
- iframe, object, embed, form elements removed
- No external JavaScript execution

## Error Handling

- **No hard 500s** — All errors return graceful JSON responses
- **Catch-all error handler** in API routes returns `{ ok: false, retryable: true }`
- **Signal detectors** wrapped in try/catch — individual detector failures don't crash analysis
- **Parser failures** fall back gracefully (JSON-LD → DOM → empty)

## Rate Limiting

The scraper implements exponential backoff:
- Base delay: 1 second
- Multiplier: 2× per retry
- Maximum: 3 retries per tier

## Data Privacy

- No user accounts required
- No PII collected
- No review data persisted
- No analytics tracking (MVP)
- All processing is stateless
