import { describe, it, expect } from 'vitest'
import { walmartParse, walmartExtractCategory } from '@/lib/core-intelligence/adapters/walmart'

describe('walmart adapter', () => {
  describe('walmartParse', () => {
    it('parses typical review data correctly', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="Test Product" />
          </head>
          <body>
            <h1 class="prod-ProductTitle">Test Product</h1>
            <span itemprop="ratingValue" content="4.5"></span>
            <span itemprop="reviewCount" content="123"></span>

            <div data-testid="customer-review">
              <span itemprop="ratingValue" content="5"></span>
              <div data-testid="review-title">Great item!</div>
              <span itemprop="datePublished" content="2023-01-01"></span>
              <span itemprop="author">Jane Doe</span>
              <span class="verified-purchase">Verified Purchaser</span>
              <div itemprop="reviewBody">I loved this product, works as expected.</div>
              <span class="helpful-count">10 people found this helpful</span>
            </div>

            <div class="review-item">
              <span itemprop="ratingValue" content="2"></span>
              <h3 class="review-title">Not what I expected</h3>
              <div class="review-date">2023-02-01</div>
              <div class="reviewer-name">John Smith</div>
              <p class="review-text">The quality is quite poor.</p>
              <span data-testid="helpful-count">2</span>
            </div>
          </body>
        </html>
      `

      const result = walmartParse(html)

      expect(result.productName).toBe('Test Product')
      expect(result.averageRating).toBe(4.5)
      expect(result.totalReviews).toBe(123)
      expect(result.category).toBe('general')
      expect(result.metadata.parseMethod).toBe('walmart-specific')

      expect(result.reviews).toHaveLength(2)

      const review1 = result.reviews[0]
      expect(review1.rating).toBe(5)
      expect(review1.title).toBe('Great item!')
      expect(review1.date).toBe('2023-01-01')
      expect(review1.author).toBe('Jane Doe')
      expect(review1.verified).toBe(true)
      expect(review1.snippet).toBe('I loved this product, works as expected.')
      expect(review1.helpfulVotes).toBe(10)

      const review2 = result.reviews[1]
      expect(review2.rating).toBe(2)
      expect(review2.title).toBe('Not what I expected')
      expect(review2.date).toBe('2023-02-01')
      expect(review2.author).toBe('John Smith')
      expect(review2.verified).toBe(false)
      expect(review2.snippet).toBe('The quality is quite poor.')
      expect(review2.helpfulVotes).toBe(2)
    })

    it('handles empty html safely', () => {
      const result = walmartParse('')
      expect(result.productName).toBeNull()
      expect(result.averageRating).toBeNull()
      expect(result.totalReviews).toBeNull()
      expect(result.reviews).toEqual([])
    })

    it('falls back to default values for missing data', () => {
      const html = `
        <html>
          <body>
            <div class="bg-white border-bottom">
              <p>Just some review text</p>
            </div>
          </body>
        </html>
      `
      const result = walmartParse(html)
      expect(result.reviews).toHaveLength(1)
      const review = result.reviews[0]
      expect(review.title).toBe('Untitled Review')
      expect(review.rating).toBe(0)
      expect(review.author).toBe('Anonymous')
      expect(review.date).toBeNull()
      expect(review.verified).toBe(false)
      expect(review.helpfulVotes).toBe(0)
      expect(review.snippet).toBe('Just some review text')
    })

    it('limits the number of reviews parsed', () => {
      let html = '<html><body>'
      for (let i = 0; i < 110; i++) {
        html += `
          <div class="review-item">
            <h3 class="review-title">Review ${i}</h3>
            <p>Some text</p>
          </div>
        `
      }
      html += '</body></html>'

      const result = walmartParse(html)
      expect(result.reviews).toHaveLength(100) // MAX_REVIEWS_TO_PARSE
    })
  })

  describe('walmartExtractCategory', () => {
    it('extracts electronics category', () => {
      expect(walmartExtractCategory('Great wireless bluetooth headphones', 'Headphones')).toBe('electronics')
    })

    it('extracts tools category', () => {
      expect(walmartExtractCategory('Powerful power drill with hammer action', 'Power Drill')).toBe('tools')
    })

    it('extracts apparel category', () => {
      expect(walmartExtractCategory('Comfortable running shoes and shirts', 'Shoes')).toBe('apparel')
    })

    it('extracts home_goods category', () => {
      expect(walmartExtractCategory('Beautiful decorative pillows and curtains', 'Curtains')).toBe('home_goods')
    })

    it('extracts digital category', () => {
      expect(walmartExtractCategory('Download the new software subscription', 'Software')).toBe('digital')
    })

    it('extracts food_supplement category', () => {
      expect(walmartExtractCategory('Organic health vitamins capsules', 'Vitamins')).toBe('food_supplement')
    })

    it('extracts automotive category', () => {
      expect(walmartExtractCategory('Premium auto car oil filters', 'Filters')).toBe('automotive')
    })

    it('returns general for unmatched text', () => {
      expect(walmartExtractCategory('Just a normal item with nothing special', 'Normal Item')).toBe('general')
    })
  })
})
