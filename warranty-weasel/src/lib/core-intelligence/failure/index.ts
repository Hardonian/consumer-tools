import type { FailureScenario, FallbackStrategy, FetchResult } from '../types'

const CAPTCHA_INDICATORS = [
  'captcha', 'recaptcha', 'verify you are human', 'prove you are not a robot',
  'security check', 'challenge', 'g-recaptcha', 'hcaptcha', 'cf-challenge', 'cloudflare challenge',
]

const WAF_INDICATORS = [
  'blocked', 'access denied', 'forbidden', 'firewall', 'security policy',
  'request rejected', 'suspicious activity', 'automated access',
]

const OUT_OF_STOCK_INDICATORS = [
  'out of stock', 'unavailable', 'currently unavailable', 'not available',
  'discontinued', 'no longer available', 'delisted', 'this product is not',
]

const JS_CHALLENGE_INDICATORS = [
  'jschl-answer', 'jschl_vc', 'pass', 'trk_jschl_js', 'challenge-platform', '__cf_chl_rt_tk',
]

export const failureScenarios: Record<string, FailureScenario> = {
  'FS-01': {
    id: 'FS-01',
    scenario: 'Rate limiting blocks review fetch',
    trigger: 'HTTP 429 Too Many Requests',
    severity: 'medium',
    expectedBehavior: 'Backoff, retry with delay, report degraded',
    userMessage: 'Review data is temporarily rate-limited. Results may be incomplete.',
    confidencePenalty: 20,
    fallbackStrategy: 'retry-with-backoff',
    testCase: 'Mock 429 response → verify retry → verify degraded output',
  },
  'FS-02': {
    id: 'FS-02',
    scenario: 'CAPTCHA blocks automated access',
    trigger: 'CAPTCHA page detected in HTML',
    severity: 'critical',
    expectedBehavior: 'Detect CAPTCHA, return UNKNOWN with explanation',
    userMessage: 'Unable to access reviews — the site requires human verification.',
    confidencePenalty: 50,
    fallbackStrategy: 'return-unknown',
    testCase: 'Mock CAPTCHA HTML → verify UNKNOWN verdict',
  },
  'FS-03': {
    id: 'FS-03',
    scenario: 'URL redirects to different region',
    trigger: 'Response URL differs from request URL',
    severity: 'low',
    expectedBehavior: 'Follow redirect, normalize region, note in limitations',
    userMessage: 'Reviews shown may be from a different regional store.',
    confidencePenalty: 10,
    fallbackStrategy: 'partial-parse',
    testCase: 'Mock redirect → verify region normalization',
  },
  'FS-04': {
    id: 'FS-04',
    scenario: 'Product delisted or out of stock returns 200 with no reviews',
    trigger: '200 OK but Review container empty or "not available" text',
    severity: 'high',
    expectedBehavior: 'Detect empty state, return UNKNOWN',
    userMessage: 'This product appears unavailable. No review data to analyze.',
    confidencePenalty: 40,
    fallbackStrategy: 'return-unknown',
    testCase: 'Mock 200 with "out of stock" → verify UNKNOWN',
  },
  'FS-05': {
    id: 'FS-05',
    scenario: 'Web Application Firewall blocks request',
    trigger: '403 Forbidden with WAF signature',
    severity: 'high',
    expectedBehavior: 'Detect WAF, retry with alternate strategy, report degraded',
    userMessage: 'Access to reviews was restricted. Results may be limited.',
    confidencePenalty: 30,
    fallbackStrategy: 'try-next-tier',
    testCase: 'Mock 403 WAF response → verify retry → degraded output',
  },
  'FS-10': {
    id: 'FS-10',
    scenario: 'Site requires JS execution to pass challenge',
    trigger: 'HTML contains JS challenge/obfuscation code',
    severity: 'critical',
    expectedBehavior: 'Detect challenge, return UNKNOWN',
    userMessage: 'This site requires JavaScript verification. Unable to access reviews.',
    confidencePenalty: 50,
    fallbackStrategy: 'return-unknown',
    testCase: 'Mock JS challenge page → verify UNKNOWN',
  },
  'FS-14': {
    id: 'FS-14',
    scenario: 'Request timeout during fetch',
    trigger: 'Fetch exceeds timeout threshold',
    severity: 'medium',
    expectedBehavior: 'Catch timeout, try fallback strategy, report degraded',
    userMessage: 'The review page timed out. Results may be incomplete.',
    confidencePenalty: 25,
    fallbackStrategy: 'try-next-tier',
    testCase: 'Mock slow response → verify timeout → fallback',
  },
  'FS-15': {
    id: 'FS-15',
    scenario: 'Response exceeds size limit',
    trigger: 'HTML body exceeds max size',
    severity: 'low',
    expectedBehavior: 'Truncate safely, parse what is available',
    userMessage: 'The page was very large. Only partial content was processed.',
    confidencePenalty: 15,
    fallbackStrategy: 'safe-truncate',
    testCase: 'Mock oversized response → verify safe truncation',
  },
  'FS-50': {
    id: 'FS-50',
    scenario: 'Entire review site is unreachable',
    trigger: 'DNS failure, connection refused, site down',
    severity: 'critical',
    expectedBehavior: 'Return UNKNOWN with clear explanation',
    userMessage: 'Unable to reach the review site. Please try again later.',
    confidencePenalty: 50,
    fallbackStrategy: 'return-unknown',
    testCase: 'Mock network error → verify UNKNOWN with explanation',
  },
}

export function getFailureScenario(id: string): FailureScenario | undefined {
  return failureScenarios[id]
}

export function getFailureByTrigger(trigger: string): FailureScenario | undefined {
  return Object.values(failureScenarios).find((fs) =>
    fs.trigger.toLowerCase().includes(trigger.toLowerCase()),
  )
}

export function getAllFailureIds(): string[] {
  return Object.keys(failureScenarios)
}

export function detectFailureFromResponse(html: string, status: number): string | null {
  const lowerHtml = html.toLowerCase()

  if (status === 429) return 'FS-01'
  if (status === 403) return 'FS-05'
  if (status >= 500) return 'FS-50'

  if (CAPTCHA_INDICATORS.some((ind) => lowerHtml.includes(ind))) return 'FS-02'
  if (JS_CHALLENGE_INDICATORS.some((ind) => lowerHtml.includes(ind))) return 'FS-10'
  if (OUT_OF_STOCK_INDICATORS.some((ind) => lowerHtml.includes(ind))) return 'FS-04'
  if (WAF_INDICATORS.some((ind) => lowerHtml.includes(ind))) return 'FS-05'
  if (status === 200 && html.length < 500) return 'FS-04'

  return null
}

export function getFallbackStrategy(id: string | null): FallbackStrategy {
  if (!id) return 'none'
  const scenario = getFailureScenario(id)
  return scenario?.fallbackStrategy ?? 'none'
}

export function buildFetchResult(
  success: boolean,
  html: string | null,
  status: number,
  strategy: string,
  failureId: string | null,
  redirected: boolean = false,
  responseUrl: string = '',
): FetchResult {
  const scenario = failureId ? getFailureScenario(failureId) : null

  return {
    success,
    html,
    status,
    strategy,
    degraded: !!failureId || !success,
    userMessage: scenario?.userMessage || (success ? '' : 'Unable to access reviews.'),
    confidencePenalty: scenario?.confidencePenalty ?? (success ? 0 : 50),
    failureId,
    redirected,
    responseUrl,
  }
}
