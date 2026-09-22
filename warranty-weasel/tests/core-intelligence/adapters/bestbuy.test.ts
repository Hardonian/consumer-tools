import { describe, it, expect } from 'vitest'
import { bestbuyParse } from '@/lib/core-intelligence/adapters/bestbuy'

describe('bestbuyParse', () => {
  it('handles empty HTML gracefully', () => {
    const result = bestbuyParse('')

    expect(result.reviews).toEqual([])
    expect(result.productName).toBeNull()
    expect(result.averageRating).toBeNull()
    expect(result.totalReviews).toBeNull()
  })

  it('extracts primary product data', () => {
    const html = `
      <html>
        <head></head>
        <body>
          <h1 class="sku-title">Test BestBuy Product</h1>
          <div class="c-ratings-reviews-v2__average">4.5</div>
          <span itemprop="reviewCount" content="1,234"></span>
        </body>
      </html>
    `
    const result = bestbuyParse(html)

    expect(result.productName).toBe('Test BestBuy Product')
    expect(result.averageRating).toBe(4.5)
    expect(result.totalReviews).toBe(1234)
  })

  it('extracts fallback product data', () => {
    const html = `
      <html>
        <head>
          <meta property="og:title" content="Fallback Title" />
        </head>
        <body>
          <span itemprop="ratingValue" content="3.8"></span>
          <span class="c-ratings-reviews-v2__count">543</span>
        </body>
      </html>
    `
    const result = bestbuyParse(html)

    expect(result.productName).toBe('Fallback Title')
    expect(result.averageRating).toBe(3.8)
    expect(result.totalReviews).toBe(543)
  })

  it('extracts review details correctly', () => {
    const html = `
      <html>
        <body>
          <div class="review-item">
            <span itemprop="ratingValue" content="5"></span>
            <div class="bv-content-title">Excellent Product</div>
            <div class="bv-content-author">John Doe</div>
            <span itemprop="datePublished" content="2023-10-15"></span>
            <span class="verified-purchase">Verified</span>
            <div class="bv-content-description">This is a great product, highly recommended.</div>
            <div class="bv-feedback-positive-count">12</div>
          </div>
        </body>
      </html>
    `
    const result = bestbuyParse(html)

    expect(result.reviews.length).toBe(1)
    const review = result.reviews[0]
    expect(review.rating).toBe(5)
    expect(review.title).toBe('Excellent Product')
    expect(review.author).toBe('John Doe')
    expect(review.date).toBe('2023-10-15')
    expect(review.verified).toBe(true)
    expect(review.snippet).toBe('This is a great product, highly recommended.')
    expect(review.helpfulVotes).toBe(12)
  })

  it('handles fallback review details correctly', () => {
    const html = `
      <html>
        <body>
          <div class="bv-content-item">
            <span class="bv-content-rating-stars">4 stars</span>
            <h3>Good Value</h3>
            <div class="reviewer-name">Jane Smith</div>
            <div class="bv-content-datetime">October 10, 2023</div>
            <p>It works well for the price.</p>
            <div class="helpful-count">5 people found this helpful</div>
          </div>
        </body>
      </html>
    `
    const result = bestbuyParse(html)

    expect(result.reviews.length).toBe(1)
    const review = result.reviews[0]
    expect(review.rating).toBe(4)
    expect(review.title).toBe('Good Value')
    expect(review.author).toBe('Jane Smith')
    expect(review.date).toBe('October 10, 2023')
    expect(review.verified).toBe(false)
    expect(review.snippet).toBe('It works well for the price.')
    expect(review.helpfulVotes).toBe(5)
  })

  it('limits the number of parsed reviews to 100', () => {
    let reviewsHtml = ''
    for (let i = 0; i < 150; i++) {
      reviewsHtml += `
        <div class="review-item">
          <div class="bv-content-title">Review ${i}</div>
          <div class="bv-content-description">Description ${i}</div>
        </div>
      `
    }
    const html = `<html><body>${reviewsHtml}</body></html>`

    const result = bestbuyParse(html)

    expect(result.reviews.length).toBe(100)
  })
})
