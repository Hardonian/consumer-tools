import { describe, it, expect } from 'vitest'
import {
  failureScenarios,
  getFailureScenario,
  getFailureByTrigger,
  getAllFailureIds,
  detectFailureFromResponse,
  getFallbackStrategy,
  buildFetchResult,
} from '@/lib/core-intelligence/failure'

describe('failure engine', () => {
  describe('failureScenarios', () => {
    it('has expected scenarios', () => {
      expect(failureScenarios['FS-01']).toBeDefined()
      expect(failureScenarios['FS-02']).toBeDefined()
      expect(failureScenarios['FS-50']).toBeDefined()
    })

    it('each scenario has required fields', () => {
      for (const [id, scenario] of Object.entries(failureScenarios)) {
        expect(scenario.id).toBe(id)
        expect(scenario.scenario).toBeDefined()
        expect(scenario.trigger).toBeDefined()
        expect(scenario.severity).toBeDefined()
        expect(scenario.userMessage).toBeDefined()
        expect(scenario.confidencePenalty).toBeGreaterThanOrEqual(0)
        expect(scenario.fallbackStrategy).toBeDefined()
      }
    })
  })

  describe('getFailureScenario', () => {
    it('returns scenario by id', () => {
      const scenario = getFailureScenario('FS-02')
      expect(scenario?.id).toBe('FS-02')
      expect(scenario?.severity).toBe('critical')
    })

    it('returns undefined for unknown id', () => {
      expect(getFailureScenario('FS-999')).toBeUndefined()
    })
  })

  describe('getFailureByTrigger', () => {
    it('finds scenario by trigger keyword', () => {
      const scenario = getFailureByTrigger('429')
      expect(scenario?.id).toBe('FS-01')
    })

    it('returns undefined for unknown trigger', () => {
      expect(getFailureByTrigger('xyz-nonexistent')).toBeUndefined()
    })
  })

  describe('getAllFailureIds', () => {
    it('returns all scenario ids', () => {
      const ids = getAllFailureIds()
      expect(ids.length).toBeGreaterThan(5)
      expect(ids).toContain('FS-01')
      expect(ids).toContain('FS-50')
    })
  })

  describe('detectFailureFromResponse', () => {
    it('detects 429 rate limiting', () => {
      expect(detectFailureFromResponse('', 429)).toBe('FS-01')
    })

    it('detects 403 WAF block', () => {
      expect(detectFailureFromResponse('', 403)).toBe('FS-05')
    })

    it('detects 500 server error', () => {
      expect(detectFailureFromResponse('', 500)).toBe('FS-50')
    })

    it('detects CAPTCHA in HTML', () => {
      const html = '<html><body>please solve the recaptcha challenge</body></html>'
      expect(detectFailureFromResponse(html, 200)).toBe('FS-02')
    })

    it('detects JS challenge', () => {
      const html = '<html><body>jschl-answer token</body></html>'
      expect(detectFailureFromResponse(html, 200)).toBe('FS-10')
    })

    it('detects out of stock', () => {
      const html = '<html><body>This product is out of stock</body></html>'
      expect(detectFailureFromResponse(html, 200)).toBe('FS-04')
    })

    it('detects empty 200', () => {
      expect(detectFailureFromResponse('tiny', 200)).toBe('FS-04')
    })

    it('returns null for normal response', () => {
      const html = '<html><head><title>Product Reviews Page</title></head><body><div class="review"><h2>Great product!</h2><p>This is a wonderful product that I have been using for several months now and it works exactly as described. The quality is excellent and I would highly recommend it to anyone looking for a reliable solution. It has exceeded all my expectations and I am very satisfied with this purchase overall.</p></div><div class="review"><h2>Good value for the price</h2><p>Another detailed review with lots of content about the product features and performance in daily use cases. I have tested it thoroughly and found it to be very reliable and well-built.</p></div></body></html>'
      expect(detectFailureFromResponse(html, 200)).toBeNull()
    })
  })

  describe('getFallbackStrategy', () => {
    it('returns strategy for known failure', () => {
      expect(getFallbackStrategy('FS-01')).toBe('retry-with-backoff')
      expect(getFallbackStrategy('FS-02')).toBe('return-unknown')
      expect(getFallbackStrategy('FS-05')).toBe('try-next-tier')
    })

    it('returns none for null', () => {
      expect(getFallbackStrategy(null)).toBe('none')
    })

    it('returns none for unknown id', () => {
      expect(getFallbackStrategy('FS-999')).toBe('none')
    })
  })

  describe('buildFetchResult', () => {
    it('builds success result', () => {
      const result = buildFetchResult(true, '<html>...</html>', 200, 'desktop', null)
      expect(result.success).toBe(true)
      expect(result.degraded).toBe(false)
      expect(result.confidencePenalty).toBe(0)
      expect(result.failureId).toBeNull()
    })

    it('builds failure result with scenario data', () => {
      const result = buildFetchResult(false, '', 429, 'desktop', 'FS-01')
      expect(result.success).toBe(false)
      expect(result.degraded).toBe(true)
      expect(result.failureId).toBe('FS-01')
      expect(result.confidencePenalty).toBe(20)
      expect(result.userMessage).toContain('rate-limited')
    })

    it('builds failure result with default penalty for unknown id', () => {
      const result = buildFetchResult(false, '', 500, 'desktop', 'FS-999')
      expect(result.confidencePenalty).toBe(50)
    })
  })
})
