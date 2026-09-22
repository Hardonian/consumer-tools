import { describe, it, expect } from 'vitest'
import { parseReviews } from '@/lib/parsers/reviewParser'

describe('reviewParser', () => {
  it('parses JSON-LD aggregate rating', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@type": "Product",
              "name": "Test Product",
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.2",
                "reviewCount": "150"
              }
            }
          </script>
        </head>
        <body></body>
      </html>
    `
    const result = parseReviews(html)
    expect(result.productName).toBe('Test Product')
    expect(result.averageRating).toBe(4.2)
    expect(result.totalReviews).toBe(150)
  })

  it('handles malformed JSON-LD gracefully', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            { invalid json }
          </script>
        </head>
        <body></body>
      </html>
    `
    const result = parseReviews(html)
    expect(result.reviews).toEqual([])
    expect(result.productName).toBeNull()
  })

  it('handles missing JSON-LD gracefully', () => {
    const html = '<html><body><p>No structured data</p></body></html>'
    const result = parseReviews(html)
    expect(result).toBeDefined()
    expect(result.reviews).toEqual([])
  })

  it('parses @graph JSON-LD format', () => {
    const html = `
      <html>
        <head>
          <script type="application/ld+json">
            {
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Product",
                  "name": "Graph Product",
                  "aggregateRating": {
                    "ratingValue": "3.8",
                    "reviewCount": "42"
                  }
                }
              ]
            }
          </script>
        </head>
        <body></body>
      </html>
    `
    const result = parseReviews(html)
    expect(result.productName).toBe('Graph Product')
    expect(result.averageRating).toBe(3.8)
  })

  it('handles empty HTML', () => {
    const result = parseReviews('')
    expect(result.reviews).toEqual([])
    expect(result.productName).toBeNull()
    expect(result.averageRating).toBeNull()
  })

  it('detects category from HTML content', () => {
    const html = `
      <html>
        <body>
          <h1>Wireless Bluetooth Headphones</h1>
          <p>Great sound quality for music and calls</p>
        </body>
      </html>
    `
    const result = parseReviews(html)
    expect(result.category).toBe('electronics')
  })
})
