# Scraping Limitations

ReviewGhost fetches and analyzes publicly available review data using server-side HTTP requests. This approach has inherent limitations.

## What ReviewGhost Can Access

- **Static HTML content** — Reviews rendered server-side
- **JSON-LD structured data** — Schema.org aggregate ratings and reviews
- **DOM review elements** — Reviews with standard CSS selectors
- **First page of reviews** — Initial page load content

## What ReviewGhost Cannot Access

- **JavaScript-rendered content** — Reviews loaded via client-side JavaScript after initial page load
- **Infinite scroll** — Reviews that require scrolling to load
- **Login-walled reviews** — Reviews requiring authentication
- **API-only data** — Reviews accessible only via private APIs
- **Image content** — Review photos and videos are not analyzed
- **CAPTCHA-protected pages** — Pages requiring human verification

## Failure Modes

When ReviewGhost cannot access review data, it returns an **UNKNOWN** verdict with:

1. **Why** — The specific reason (blocked, insufficient data, unsupported)
2. **What was attempted** — The fetch strategies tried (desktop UA, mobile UA, etc.)
3. **Next steps** — Suggestions for the user

## Tiered Fetch Strategy

ReviewGhost attempts multiple strategies before giving up:

1. **Tier 1**: Standard desktop browser User-Agent
2. **Tier 2**: Mobile browser User-Agent (iPhone Safari)
3. **Tier 3**: Alternate mobile User-Agent (Android Chrome)

Each tier retries up to 3 times with exponential backoff.

## Common Blockers

| Blocker | Detection | Response |
|---------|-----------|----------|
| Rate limiting (429) | HTTP status code | Backoff + retry, report degraded |
| CAPTCHA | HTML keywords/forms | Return UNKNOWN |
| WAF 403 | Response patterns | Retry with mobile UA, report degraded |
| JS challenge | Obfuscated code patterns | Return UNKNOWN |
| Timeout | Request exceeds 15s | Try next tier, report degraded |
| Empty 200 | No review content | Return UNKNOWN |
| Site down | Network error | Return UNKNOWN |

## Accuracy Expectations

- **Best case**: Full access to static review data → high confidence
- **Typical case**: Partial access with some degradation → moderate confidence
- **Worst case**: Complete block → UNKNOWN verdict

ReviewGhost is designed to be honest about its limitations rather than produce misleading results.
