import type { FetchResult, ParsedData, ParsedReview } from '../types'
import { detectFailureFromResponse, buildFetchResult } from '../failure'
import * as cheerio from 'cheerio'

const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const MOBILE_USER_AGENT =
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'

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

export async function bestbuyFetch(url: string): Promise<FetchResult> {
  const normalizedUrl = normalizeBestBuyUrl(url)

  const tiers = [
    { name: 'desktop', ua: DESKTOP_USER_AGENT },
    { name: 'mobile', ua: MOBILE_USER_AGENT },
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
        const result = await fetchWithTimeout(normalizedUrl, headers)

        lastHtml = result.html
        lastStatus = result.status

        const failureId = detectFailureFromResponse(result.html, result.status)

        if (failureId) {
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

function normalizeBestBuyUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.searchParams.delete('irclickid')
    parsed.searchParams.delete('irgwc')
    parsed.searchParams.delete('clickid')
    parsed.searchParams.delete('cid')
    return parsed.toString()
  } catch {
    return url
  }
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

export function bestbuyParse(html: string): ParsedData {
  const sanitized = sanitizeHtml(html)
  const $ = cheerio.load(sanitized)
  const reviews: ParsedReview[] = []

  const productName = $('h1.sku-title').text().trim() ||
    $('meta[property="og:title"]').attr('content') ||
    null

  const ratingText = $('.c-ratings-reviews-v2__average')?.text() ||
    $('[itemprop="ratingValue"]').attr('content') ||
    ''
  const ratingMatch = ratingText.match(/(\d+(?:\.\d)?)/)
  const averageRating = ratingMatch ? parseFloat(ratingMatch[1]) : null

  const totalReviewsText = $('[itemprop="reviewCount"]').attr('content') ||
    $('.c-ratings-reviews-v2__count')?.text() ||
    ''
  const totalMatch = totalReviewsText.match(/(\d[\d,]*)/)
  const totalReviews = totalMatch ? parseInt(totalMatch[1].replace(/,/g, ''), 10) : null

  const reviewElements = $('.review-item, [data-testid="review-card"], .bv-content-item')
  reviewElements.each((index, el) => {
    if (reviews.length >= MAX_REVIEWS_TO_PARSE) return

    const $el = $(el)

    const ratingStr = $el.find('[itemprop="ratingValue"]').attr('content') ||
      $el.find('.bv-content-rating-stars')?.text() ||
      ''
    const starMatch = ratingStr.match(/(\d)/)
    const rating = starMatch ? parseInt(starMatch[1], 10) : 0

    const title = $el.find('.bv-content-title, [itemprop="name"], h3, h4').first().text().trim()

    const dateText = $el.find('[itemprop="datePublished"]').attr('content') ||
      $el.find('.bv-content-datetime').text().trim()
    const date = dateText || null

    const author = $el.find('.bv-content-author, .reviewer-name, [itemprop="author"]').text().trim() || 'Anonymous'

    const verified = $el.find('.verified-purchase, .bv-author-badge').length > 0 ||
      $el.text().toLowerCase().includes('verified')

    const snippet = $el.find('.bv-content-description, .review-text, [itemprop="reviewBody"], p').text().trim()

    const helpfulText = $el.find('.bv-feedback-positive-count, .helpful-count').text() || ''
    const helpfulMatch = helpfulText.match(/(\d+)/)
    const helpfulVotes = helpfulMatch ? parseInt(helpfulMatch[1], 10) : 0

    if (snippet || title) {
      reviews.push({
        id: `review-${index}`,
        title: title || 'Untitled Review',
        rating,
        date,
        author,
        verified,
        snippet: snippet.slice(0, 1000),
        helpfulVotes,
        rawHtml: $el.html() || '',
      })
    }
  })

  return {
    reviews,
    productName,
    averageRating,
    totalReviews,
    category: bestbuyExtractCategory(html, productName),
    metadata: { parseMethod: 'bestbuy-specific' },
  }
}

export function bestbuyExtractCategory(html: string, productName: string | null): string {
  const combined = `${productName || ''} ${html.slice(0, 5000)}`.toLowerCase()

  if (/\b(phone|laptop|tablet|headphones?|speakers?|cameras?|tv|monitor|charger|cables?|batter(?:y|ies)|usb|bluetooth|wireless|geek squad|open-box)\b/i.test(combined)) return 'electronics'
  if (/\b(drill|saw|hammer|wrench|tools?|sander|grinder|driver|pliers|socket)\b/i.test(combined)) return 'tools'
  if (/\b(shirts?|pants?|dress|shoes?|jackets?|coats?|hats?|socks?|apparel|clothing|fashion|wear)\b/i.test(combined)) return 'apparel'
  if (/\b(furniture|lamps?|curtains?|rugs?|pillows?|blankets?|decor|kitchen|cookware|appliances?)\b/i.test(combined)) return 'home_goods'
  if (/\b(software|apps?|subscription|games?|downloads?|digital|ebooks?|courses?|streaming)\b/i.test(combined)) return 'digital'
  if (/\b(vitamins?|supplements?|protein|pills?|capsules?|powders?|herbs?|organic|health)\b/i.test(combined)) return 'food_supplement'
  if (/\b(car|auto|vehicles?|tires?|oil|brakes?|filters?|motors?|engines?|automotive)\b/i.test(combined)) return 'automotive'
  return 'general'
}
