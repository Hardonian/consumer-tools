import type { FetchResult } from '@/types'
import {
  FETCH_TIMEOUT,
  MAX_RESPONSE_SIZE,
  MAX_RETRIES,
  RETRY_DELAY_BASE,
  CAPTCHA_INDICATORS,
  WAF_INDICATORS,
  OUT_OF_STOCK_INDICATORS,
  JS_CHALLENGE_INDICATORS,
  DESKTOP_USER_AGENT,
  MOBILE_USER_AGENTS,
  DEFAULT_HEADERS,
  getFailureScenario,
} from '@/lib/intel'
import { sleep } from '@/lib/security/urlValidator'

export function detectFailureType(html: string, status: number): string | null {
  const lowerHtml = html.toLowerCase()

  if (status === 429) return 'FS-01'
  if (status === 403) {
    if (WAF_INDICATORS.some((ind) => lowerHtml.includes(ind))) return 'FS-05'
    return 'FS-05'
  }
  if (CAPTCHA_INDICATORS.some((ind) => lowerHtml.includes(ind))) return 'FS-02'
  if (JS_CHALLENGE_INDICATORS.some((ind) => lowerHtml.includes(ind))) return 'FS-10'
  if (OUT_OF_STOCK_INDICATORS.some((ind) => lowerHtml.includes(ind))) return 'FS-04'
  if (status >= 500) return 'FS-50'

  // Check for empty 200
  if (status === 200 && html.length < 500) return 'FS-04'

  return null
}

function buildHeaders(userAgent: string): Record<string, string> {
  return {
    ...DEFAULT_HEADERS,
    'User-Agent': userAgent,
  }
}

async function fetchWithTimeout(
  url: string,
  headers: Record<string, string>,
  timeout: number = FETCH_TIMEOUT,
): Promise<{ html: string; status: number; redirected: boolean; responseUrl: string }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
      redirect: 'follow',
    })

    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
      // Read only up to MAX_RESPONSE_SIZE
      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      let result = ''
      let received = 0
      while (received < MAX_RESPONSE_SIZE) {
        const { done, value } = await reader.read()
        if (done) break
        received += value.length
        result += new TextDecoder().decode(value, { stream: true })
      }
      clearTimeout(timeoutId)
      return {
        html: result,
        status: response.status,
        redirected: response.redirected,
        responseUrl: response.url,
      }
    }

    const text = await response.text()
    clearTimeout(timeoutId)

    // Truncate if still too large
    const truncated = text.length > MAX_RESPONSE_SIZE ? text.slice(0, MAX_RESPONSE_SIZE) : text

    return {
      html: truncated,
      status: response.status,
      redirected: response.redirected,
      responseUrl: response.url,
    }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

export async function fetchController(url: string): Promise<FetchResult> {
  const tiers = [
    { name: 'desktop', ua: DESKTOP_USER_AGENT },
    { name: 'mobile', ua: MOBILE_USER_AGENTS[0] },
    { name: 'mobile-alt', ua: MOBILE_USER_AGENTS[1] },
  ]

  let lastError: Error | null = null
  let lastStatus = 0
  let lastHtml = ''

  for (let tierIndex = 0; tierIndex < tiers.length; tierIndex++) {
    const tier = tiers[tierIndex]

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        if (attempt > 0) {
          const delay = RETRY_DELAY_BASE * Math.pow(2, attempt)
          await sleep(delay)
        }

        const headers = buildHeaders(tier.ua)
        const result = await fetchWithTimeout(url, headers)

        lastHtml = result.html
        lastStatus = result.status

        const failureId = detectFailureType(result.html, result.status)

        if (failureId) {
          const scenario = getFailureScenario(failureId)
          // For CAPTCHA and JS challenge, don't retry with same tier
          if (failureId === 'FS-02' || failureId === 'FS-10') {
            if (tierIndex < tiers.length - 1) {
              continue // Try next tier
            }
            // All tiers exhausted
            return {
              success: false,
              html: result.html,
              status: result.status,
              strategy: tier.name,
              degraded: true,
              userMessage: scenario?.userMessage || 'Unable to access reviews.',
              confidencePenalty: scenario?.confidenceImpact || 50,
              failureId,
            }
          }

          // For rate limiting, retry with backoff
          if (failureId === 'FS-01') {
            if (attempt < MAX_RETRIES - 1) {
              continue
            }
            // Exhausted retries
            return {
              success: false,
              html: result.html,
              status: result.status,
              strategy: tier.name,
              degraded: true,
              userMessage: scenario?.userMessage || 'Rate limited. Results may be incomplete.',
              confidencePenalty: scenario?.confidenceImpact || 20,
              failureId,
            }
          }

          // For other failures, return with degradation
          return {
            success: failureId === 'FS-04' ? false : true,
            html: result.html,
            status: result.status,
            strategy: tier.name,
            degraded: true,
            userMessage: scenario?.userMessage || 'Some issues accessing reviews.',
            confidencePenalty: scenario?.confidenceImpact || 10,
            failureId,
          }
        }

        // Success
        return {
          success: true,
          html: result.html,
          status: result.status,
          strategy: tier.name,
          degraded: tierIndex > 0,
          userMessage: tierIndex > 0 ? 'Reviews accessed with alternate method.' : '',
          confidencePenalty: tierIndex > 0 ? 5 : 0,
          failureId: null,
        }
      } catch (error) {
        lastError = error as Error

        if (error instanceof Error && error.name === 'AbortError') {
          // Timeout - try next tier
          if (tierIndex < tiers.length - 1) {
            break
          }
          const scenario = getFailureScenario('FS-14')
          return {
            success: false,
            html: null,
            status: 0,
            strategy: 'timeout',
            degraded: true,
            userMessage: scenario?.userMessage || 'Request timed out.',
            confidencePenalty: scenario?.confidenceImpact || 25,
            failureId: 'FS-14',
          }
        }

        // Network error - try next tier
        if (tierIndex < tiers.length - 1) {
          break
        }
      }
    }
  }

  // All tiers exhausted
  const scenario = getFailureScenario('FS-50')
  return {
    success: false,
    html: lastHtml || null,
    status: lastStatus,
    strategy: 'all-tiers-failed',
    degraded: true,
    userMessage: scenario?.userMessage || 'Unable to access the review page.',
    confidencePenalty: scenario?.confidenceImpact || 50,
    failureId: lastError ? 'FS-50' : 'FS-04',
  }
}
