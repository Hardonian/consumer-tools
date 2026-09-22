import type { FetchResult, ParsedData, ParsedReview } from '../types'
import { detectFailureFromResponse, buildFetchResult, getFailureScenario } from '../failure'
import * as cheerio from 'cheerio'

const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const MOBILE_USER_AGENTS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
]

const DEFAULT_HEADERS: Record<string, string> = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
}

const FETCH_TIMEOUT = 15000
const MAX_RETRIES = 3
const RETRY_DELAY_BASE = 1000
const MAX_RESPONSE_SIZE = 2 * 1024 * 1024
const MAX_REVIEWS_TO_PARSE = 100

function buildHeaders(userAgent: string): Record<string, string> {
  return { ...DEFAULT_HEADERS, 'User-Agent': userAgent }
}

async function fetchWithTimeout(
  url: string,
  headers: Record<string, string>,
  timeout: number = FETCH_TIMEOUT,
): Promise<{ html: string; status: number; redirected: boolean; responseUrl: string }> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, { headers, signal: controller.signal, redirect: 'follow' })

    const contentLength = response.headers.get('content-length')
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
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
      return { html: result, status: response.status, redirected: response.redirected, responseUrl: response.url }
    }

    const text = await response.text()
    clearTimeout(timeoutId)
    const truncated = text.length > MAX_RESPONSE_SIZE ? text.slice(0, MAX_RESPONSE_SIZE) : text

    return { html: truncated, status: response.status, redirected: response.redirected, responseUrl: response.url }
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function genericFetch(url: string): Promise<FetchResult> {
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

        const failureId = detectFailureFromResponse(result.html, result.status)

        if (failureId) {
          const _scenario = getFailureScenario(failureId)

          if (failureId === 'FS-02' || failureId === 'FS-10') {
            if (tierIndex < tiers.length - 1) continue
            return buildFetchResult(false, result.html, result.status, tier.name, failureId, result.redirected, result.responseUrl)
          }

          if (failureId === 'FS-01') {
            if (attempt < MAX_RETRIES - 1) continue
            return buildFetchResult(false, result.html, result.status, tier.name, failureId, result.redirected, result.responseUrl)
          }

          return buildFetchResult(failureId !== 'FS-04', result.html, result.status, tier.name, failureId, result.redirected, result.responseUrl)
        }

        return buildFetchResult(true, result.html, result.status, tier.name, null, result.redirected, result.responseUrl)
      } catch (error) {
        lastError = error as Error

        if (error instanceof Error && error.name === 'AbortError') {
          if (tierIndex < tiers.length - 1) break
          return buildFetchResult(false, null, 0, 'timeout', 'FS-14')
        }

        if (tierIndex < tiers.length - 1) break
      }
    }
  }

  return buildFetchResult(false, lastHtml || null, lastStatus, 'all-tiers-failed', lastError ? 'FS-50' : 'FS-04')
}

function extractJsonLdScripts(html: string): string[] {
  const results: string[] = []
  const regex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    results.push(match[1])
  }
  return results
}

function parseJsonLd(html: string): { productName: string | null; averageRating: number | null; totalReviews: number | null } | null {
  try {
    const jsonLdContents = extractJsonLdScripts(html)

    for (const content of jsonLdContents) {
      if (!content || !content.trim()) continue

      try {
        const data = JSON.parse(content)

        if (data.aggregateRating) {
          const rating = data.aggregateRating
          return {
            productName: data.name || null,
            averageRating: parseFloat(rating.ratingValue) || null,
            totalReviews: parseInt(rating.reviewCount, 10) || null,
          }
        }

        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.aggregateRating) {
              const rating = item.aggregateRating
              return {
                productName: item.name || null,
                averageRating: parseFloat(rating.ratingValue) || null,
                totalReviews: parseInt(rating.reviewCount, 10) || null,
              }
            }
          }
        }

        if (data['@graph'] && Array.isArray(data['@graph'])) {
          for (const node of data['@graph']) {
            if (node.aggregateRating) {
              const rating = node.aggregateRating
              return {
                productName: node.name || null,
                averageRating: parseFloat(rating.ratingValue) || null,
                totalReviews: parseInt(rating.reviewCount, 10) || null,
              }
            }
          }
        }
      } catch {
        continue
      }
    }
  } catch {
    return null
  }

  return null
}

function sanitizeHtml(html: string): string {
  let sanitized = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/\son\w+\s*=\s*\S+/gi, '')
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')
  sanitized = sanitized.replace(/<(iframe|object|embed|form)[\s\S]*?<\/\1>/gi, '')
  sanitized = sanitized.replace(/<(iframe|object|embed|form)[^>]*\/?>/gi, '')
  return sanitized
}

function extractReviewsFromDOM(html: string): ParsedReview[] {
  const sanitized = sanitizeHtml(html)
  const $ = cheerio.load(sanitized)
  const reviews: ParsedReview[] = []

  const reviewElements = $(
    '[data-testid*="review"], [data-testid*="Review"], .review, [class*="review-item"], [class*="review-card"]',
  )

  if (reviewElements.length === 0) {
    const ariaReviews = $('[aria-label*="review"], [aria-label*="Review"]')
    ariaReviews.each((_, el) => {
      const review = extractReviewFromElement($(el), reviews.length)
      if (review) reviews.push(review)
    })
  }

  reviewElements.each((_, el) => {
    const review = extractReviewFromElement($(el), reviews.length)
    if (review && reviews.length < MAX_REVIEWS_TO_PARSE) {
      reviews.push(review)
    }
  })

  return reviews
}

function extractReviewFromElement($el: cheerio.Cheerio<any>, index: number): ParsedReview | null {
  const text = $el.text().trim()
  if (!text || text.length < 10) return null

  let rating = 0
  const ratingText = $el.find('[class*="rating"], [class*="star"], [data-testid*="rating"]').text() || ''
  const ratingMatch = ratingText.match(/(\d(?:\.\d)?)\s*(?:out of|\/)\s*5/)
  if (ratingMatch) {
    rating = parseFloat(ratingMatch[1])
  } else {
    const starCount = $el.find('.star-filled, [class*="filled"]').length || 0
    if (starCount > 0 && starCount <= 5) {
      rating = starCount
    }
  }

  const title = $el.find('[class*="title"], [data-testid*="title"], h3, h4, h5').first().text().trim() || text.slice(0, 100)

  const dateText = $el.find('[class*="date"], [class*="time"], [data-testid*="date"]').first().text().trim() || ''
  const dateMatch = dateText.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/)
  const date = dateMatch ? dateMatch[1] : null

  const author = $el.find('[class*="author"], [class*="reviewer"], [data-testid*="author"]').first().text().trim() || 'Anonymous'

  const verified = $el.text().toLowerCase().includes('verified') || $el.find('[class*="verified"]').length > 0

  const helpfulText = $el.find('[class*="helpful"], [class*="useful"]').text() || ''
  const helpfulMatch = helpfulText.match(/(\d+)/)
  const helpfulVotes = helpfulMatch ? parseInt(helpfulMatch[1], 10) : 0

  const snippet = $el.find('[class*="body"], [class*="content"], [class*="text"], p').text().trim() || text.slice(0, 500)

  return {
    id: `review-${index}`,
    title: title || 'Untitled Review',
    rating,
    date,
    author: author || 'Anonymous',
    verified,
    snippet: snippet.slice(0, 1000),
    helpfulVotes,
    rawHtml: $el.html() || '',
  }
}

function detectCategoryFromDOM(html: string): string {
  const $ = cheerio.load(html)
  const body = $('body').text().toLowerCase()

  const categoryKeywords: Record<string, RegExp[]> = {
    electronics: [/\b(phone|laptop|tablet|headphones?|speakers?|cameras?|tv|monitor|charger|electronics?)\b/i],
    tools: [/\b(drill|saw|hammer|wrench|tools?|sander|grinder)\b/i],
    apparel: [/\b(shirts?|pants?|dress|shoes?|jackets?|clothing|apparel)\b/i],
    home_goods: [/\b(furniture|lamps?|curtains?|rugs?|kitchen|cookware)\b/i],
    digital: [/\b(software|apps?|subscription|games?|download|digital)\b/i],
  }

  for (const [category, patterns] of Object.entries(categoryKeywords)) {
    if (patterns.some((p) => p.test(body))) {
      return category
    }
  }

  return 'general'
}

export function genericParse(html: string): ParsedData {
  const jsonLdData = parseJsonLd(html)

  if (jsonLdData && jsonLdData.averageRating !== null) {
    const reviews = extractReviewsFromDOM(html)
    return {
      reviews,
      productName: jsonLdData.productName ?? null,
      averageRating: jsonLdData.averageRating ?? null,
      totalReviews: jsonLdData.totalReviews ?? null,
      category: detectCategoryFromDOM(html),
      metadata: { parseMethod: 'jsonld-dom' },
    }
  }

  const reviews = extractReviewsFromDOM(html)
  const ratings = reviews.filter((r) => r.rating > 0).map((r) => r.rating)
  const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null

  return {
    reviews,
    productName: null,
    averageRating: avgRating,
    totalReviews: reviews.length > 0 ? reviews.length : null,
    category: detectCategoryFromDOM(html),
    metadata: { parseMethod: 'dom-only' },
  }
}

export function genericExtractCategory(html: string, productName: string | null): string {
  if (productName) {
    const name = productName.toLowerCase()
    if (/\b(phone|laptop|tablet|headphones?|speakers?|cameras?|tv|monitor|charger|cables?|batter(?:y|ies)|usb|bluetooth|wireless|electronics?)\b/i.test(name)) return 'electronics'
    if (/\b(drill|saw|hammer|wrench|tools?|sander|grinder|driver|pliers|socket)\b/i.test(name)) return 'tools'
    if (/\b(shirts?|pants?|dress|shoes?|jackets?|coats?|hats?|socks?|apparel|clothing|fashion|wear)\b/i.test(name)) return 'apparel'
    if (/\b(furniture|lamps?|curtains?|rugs?|pillows?|blankets?|decor|kitchen|cookware|appliances?)\b/i.test(name)) return 'home_goods'
    if (/\b(software|apps?|subscription|games?|downloads?|digital|ebooks?|courses?|streaming)\b/i.test(name)) return 'digital'
    if (/\b(vitamins?|supplements?|protein|pills?|capsules?|powders?|herbs?|organic|health)\b/i.test(name)) return 'food_supplement'
    if (/\b(car|auto|vehicles?|tires?|oil|brakes?|filters?|motors?|engines?|automotive)\b/i.test(name)) return 'automotive'
  }
  return detectCategoryFromDOM(html)
}
