import * as cheerio from 'cheerio'
import type { ParsedReview, ParsedData } from '@/types'
import { sanitizeHtml } from '@/lib/security/urlValidator'
import { MAX_REVIEWS_TO_PARSE } from '@/lib/intel'

function extractJsonLdScripts(html: string): string[] {
  // Extract JSON-LD script contents BEFORE sanitization (sanitizeHtml removes script tags)
  const results: string[] = []
  const regex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  let match: RegExpExecArray | null
  while ((match = regex.exec(html)) !== null) {
    results.push(match[1])
  }
  return results
}

function parseJsonLd(html: string): Partial<ParsedData> | null {
  try {
    const jsonLdContents = extractJsonLdScripts(html)

    for (const content of jsonLdContents) {
      if (!content || !content.trim()) continue

      try {
        const data = JSON.parse(content)

        // Handle aggregateRating
        if (data.aggregateRating) {
          const rating = data.aggregateRating
          return {
            productName: data.name || null,
            averageRating: parseFloat(rating.ratingValue) || null,
            totalReviews: parseInt(rating.reviewCount, 10) || null,
            metadata: { jsonLdSource: data },
          }
        }

        // Handle array of items
        if (Array.isArray(data)) {
          for (const item of data) {
            if (item.aggregateRating) {
              const rating = item.aggregateRating
              return {
                productName: item.name || null,
                averageRating: parseFloat(rating.ratingValue) || null,
                totalReviews: parseInt(rating.reviewCount, 10) || null,
                metadata: { jsonLdSource: item },
              }
            }
          }
        }

        // Handle @graph
        if (data['@graph'] && Array.isArray(data['@graph'])) {
          for (const node of data['@graph']) {
            if (node.aggregateRating) {
              const rating = node.aggregateRating
              return {
                productName: node.name || null,
                averageRating: parseFloat(rating.ratingValue) || null,
                totalReviews: parseInt(rating.reviewCount, 10) || null,
                metadata: { jsonLdSource: node },
              }
            }
          }
        }
      } catch {
        // Invalid JSON-LD, try next script
        continue
      }
    }
  } catch {
    return null
  }

  return null
}

function extractReviewsFromDOM(html: string): ParsedReview[] {
  const sanitized = sanitizeHtml(html)
  const $ = cheerio.load(sanitized)
  const reviews: ParsedReview[] = []

  // Strategy 1: data-testid selectors
  const reviewElements = $(
    '[data-testid*="review"], [data-testid*="Review"], .review, [class*="review-item"], [class*="review-card"]',
  )

  if (reviewElements.length === 0) {
    // Strategy 2: aria-label selectors
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

  // Extract rating
  let rating = 0
  const ratingText =
    $el.find('[class*="rating"], [class*="star"], [data-testid*="rating"]').text() || ''
  const ratingMatch = ratingText.match(/(\d(?:\.\d)?)\s*(?:out of|\/)\s*5/)
  if (ratingMatch) {
    rating = parseFloat(ratingMatch[1])
  } else {
    const starCount = ($el.find('.star-filled, [class*="filled"]').length || 0)
    if (starCount > 0 && starCount <= 5) {
      rating = starCount
    }
  }

  // Extract title
  const title =
    $el.find('[class*="title"], [data-testid*="title"], h3, h4, h5').first().text().trim() ||
    text.slice(0, 100)

  // Extract date
  const dateText =
    $el.find('[class*="date"], [class*="time"], [data-testid*="date"]').first().text().trim() || ''
  const dateMatch = dateText.match(/(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4})/)
  const date = dateMatch ? dateMatch[1] : null

  // Extract author
  const author =
    $el.find('[class*="author"], [class*="reviewer"], [data-testid*="author"]').first().text().trim() ||
    'Anonymous'

  // Extract verified status
  const verified =
    $el.text().toLowerCase().includes('verified') ||
    $el.find('[class*="verified"]').length > 0

  // Extract helpful votes
  const helpfulText =
    $el.find('[class*="helpful"], [class*="useful"]').text() || ''
  const helpfulMatch = helpfulText.match(/(\d+)/)
  const helpfulVotes = helpfulMatch ? parseInt(helpfulMatch[1], 10) : 0

  // Extract snippet (review body)
  const snippet =
    $el.find('[class*="body"], [class*="content"], [class*="text"], p').text().trim() ||
    text.slice(0, 500)

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

function detectCategoryFromDOM(html: string): string | null {
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

  return null
}

export function parseReviews(html: string): ParsedData {
  // Try JSON-LD first
  const jsonLdData = parseJsonLd(html)

  if (jsonLdData && jsonLdData.averageRating !== null) {
    // JSON-LD succeeded for aggregate data
    const reviews = extractReviewsFromDOM(html)
    return {
      reviews,
      productName: jsonLdData.productName ?? null,
      averageRating: jsonLdData.averageRating ?? null,
      totalReviews: jsonLdData.totalReviews ?? null,
      category: (jsonLdData.metadata?.category as string | null) || detectCategoryFromDOM(html),
      metadata: jsonLdData.metadata || {},
    }
  }

  // Fall back to DOM-only parsing
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
