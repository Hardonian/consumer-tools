import { describe, it, expect } from 'vitest'
import { amazonParse, amazonExtractCategory } from '@/lib/core-intelligence/adapters/amazon'

describe('amazon adapter', () => {
  describe('amazonParse', () => {
    it('parses basic product info and reviews', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="Test Product OG" />
          </head>
          <body>
            <div id="productTitle">Test Product Name</div>
            <div id="acrPopover" title="4.5 out of 5 stars"></div>
            <span data-hook="total-review-count">1,234 global ratings</span>

            <div data-hook="review">
              <a data-hook="review-star-rating"><span class="a-star-5"></span></a>
              <a data-hook="review-title">
                <span>Amazing product!</span>
              </a>
              <span data-hook="review-date">Reviewed in the United States on January 1, 2023</span>
              <div class="a-profile-name">John Doe</div>
              <span data-hook="avp-badge">Verified Purchase</span>
              <span data-hook="review-body">
                <span>This is a great product. Highly recommend.</span>
              </span>
              <span data-hook="helpful-vote-statement">42 people found this helpful</span>
            </div>

            <div data-hook="review">
              <a data-hook="review-star-rating"><span class="a-star-3"></span></a>
              <a data-hook="review-title">
                <span>It's okay</span>
              </a>
              <span data-hook="review-date">Reviewed in the United States on February 15, 2023</span>
              <div class="a-profile-name">Jane Smith</div>
              <span data-hook="review-body">
                <span>Not bad, but could be better.</span>
              </span>
              <span data-hook="helpful-vote-statement">One person found this helpful</span>
            </div>
          </body>
        </html>
      `

      const result = amazonParse(html)

      expect(result.productName).toBe('Test Product Name')
      expect(result.averageRating).toBe(4.5)
      expect(result.totalReviews).toBe(1234)
      expect(result.category).toBe('general')
      expect(result.metadata.parseMethod).toBe('amazon-specific')

      expect(result.reviews.length).toBe(2)

      const r1 = result.reviews[0]
      expect(r1.title).toBe('Amazing product!')
      expect(r1.rating).toBe(5)
      expect(r1.author).toBe('John Doe')
      expect(r1.date).toBe('January 1, 2023')
      expect(r1.verified).toBe(true)
      expect(r1.snippet).toContain('This is a great product')
      expect(r1.helpfulVotes).toBe(42)

      const r2 = result.reviews[1]
      expect(r2.title).toBe("It's okay")
      expect(r2.rating).toBe(3)
      expect(r2.author).toBe('Jane Smith')
      expect(r2.verified).toBe(false)
      expect(r2.helpfulVotes).toBe(0) // "One person" doesn't match the \d+ regex
    })

    it('falls back to og:title if productTitle is missing', () => {
      const html = `
        <html>
          <head>
            <meta property="og:title" content="Fallback Title" />
          </head>
          <body>
            <span data-hook="rating-out-of-text">3.8 out of 5</span>
          </body>
        </html>
      `

      const result = amazonParse(html)
      expect(result.productName).toBe('Fallback Title')
      expect(result.averageRating).toBe(3.8)
    })

    it('handles missing data gracefully', () => {
      const html = '<html><body><p>Nothing here</p></body></html>'
      const result = amazonParse(html)

      expect(result.productName).toBeNull()
      expect(result.averageRating).toBeNull()
      expect(result.totalReviews).toBeNull()
      expect(result.reviews.length).toBe(0)
    })

    it('sanitizes scripts and iframes', () => {
      const html = `
        <html>
          <body>
            <div id="productTitle">Product Name</div>
            <script>alert("xss")</script>
            <iframe src="evil.com"></iframe>
            <div data-hook="review">
              <a data-hook="review-title"><span>Review with <script>bad()</script> script</span></a>
            </div>
          </body>
        </html>
      `

      const result = amazonParse(html)
      expect(result.reviews[0].rawHtml).not.toContain('<script>')
      expect(result.reviews[0].rawHtml).not.toContain('<iframe>')
    })

    it('limits parsed reviews to 100', () => {
      let html = '<html><body><div id="productTitle">Title</div>'
      for (let i = 0; i < 150; i++) {
        html += `
          <div data-hook="review">
            <a data-hook="review-title"><span>Review ${i}</span></a>
            <span data-hook="review-body"><span>Body ${i}</span></span>
          </div>
        `
      }
      html += '</body></html>'

      const result = amazonParse(html)
      expect(result.reviews.length).toBe(100)
    })
  })

  describe('amazonExtractCategory', () => {
    it('detects electronics category', () => {
      expect(amazonExtractCategory('Awesome bluetooth headphones', null)).toBe('electronics')
      expect(amazonExtractCategory('', 'Apple phone 13 Pro Max')).toBe('electronics')
    })

    it('detects tools category', () => {
      expect(amazonExtractCategory('powerful dewalt drill', null)).toBe('tools')
    })

    it('detects apparel category', () => {
      expect(amazonExtractCategory('comfortable cotton shirts', null)).toBe('apparel')
    })

    it('detects home_goods category', () => {
      expect(amazonExtractCategory('soft throw blankets for couch', null)).toBe('home_goods')
    })

    it('detects digital category', () => {
      expect(amazonExtractCategory('prime video subscription', null)).toBe('digital')
    })

    it('detects food_supplement category', () => {
      expect(amazonExtractCategory('organic whey protein powder', null)).toBe('food_supplement')
    })

    it('detects automotive category', () => {
      expect(amazonExtractCategory('synthetic motor oil', null)).toBe('automotive')
    })

    it('defaults to general', () => {
      expect(amazonExtractCategory('a very nice notebook', null)).toBe('general')
    })
  })
})
