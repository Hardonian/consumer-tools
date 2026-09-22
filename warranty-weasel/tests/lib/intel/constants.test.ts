import { describe, it, expect } from 'vitest'
import * as constants from '@/lib/intel/constants'

describe('Constants', () => {
  it('should export correct numeric configuration values', () => {
    expect(constants.MAX_RESPONSE_SIZE).toBe(2 * 1024 * 1024)
    expect(constants.FETCH_TIMEOUT).toBe(15000)
    expect(constants.MAX_RETRIES).toBe(3)
    expect(constants.RETRY_DELAY_BASE).toBe(1000)
    expect(constants.MAX_REVIEWS_TO_PARSE).toBe(100)
    expect(constants.MIN_REVIEWS_FOR_ANALYSIS).toBe(5)
  })

  it('should export correct string arrays for indicators and keywords', () => {
    expect(Array.isArray(constants.CAPTCHA_INDICATORS)).toBe(true)
    expect(constants.CAPTCHA_INDICATORS.length).toBeGreaterThan(0)
    expect(constants.CAPTCHA_INDICATORS).toContain('captcha')

    expect(Array.isArray(constants.WAF_INDICATORS)).toBe(true)
    expect(constants.WAF_INDICATORS.length).toBeGreaterThan(0)
    expect(constants.WAF_INDICATORS).toContain('blocked')

    expect(Array.isArray(constants.OUT_OF_STOCK_INDICATORS)).toBe(true)
    expect(constants.OUT_OF_STOCK_INDICATORS.length).toBeGreaterThan(0)
    expect(constants.OUT_OF_STOCK_INDICATORS).toContain('out of stock')

    expect(Array.isArray(constants.JS_CHALLENGE_INDICATORS)).toBe(true)
    expect(constants.JS_CHALLENGE_INDICATORS.length).toBeGreaterThan(0)
    expect(constants.JS_CHALLENGE_INDICATORS).toContain('pass')

    expect(Array.isArray(constants.SAFETY_KEYWORDS)).toBe(true)
    expect(constants.SAFETY_KEYWORDS.length).toBeGreaterThan(0)
    expect(constants.SAFETY_KEYWORDS).toContain('fire')

    expect(Array.isArray(constants.WARRANTY_KEYWORDS)).toBe(true)
    expect(constants.WARRANTY_KEYWORDS.length).toBeGreaterThan(0)
    expect(constants.WARRANTY_KEYWORDS).toContain('warranty')

    expect(Array.isArray(constants.COUNTERFEIT_KEYWORDS)).toBe(true)
    expect(constants.COUNTERFEIT_KEYWORDS.length).toBeGreaterThan(0)
    expect(constants.COUNTERFEIT_KEYWORDS).toContain('fake')

    expect(Array.isArray(constants.INCENTIVE_KEYWORDS)).toBe(true)
    expect(constants.INCENTIVE_KEYWORDS.length).toBeGreaterThan(0)
    expect(constants.INCENTIVE_KEYWORDS).toContain('discount')

    expect(Array.isArray(constants.SUBSCRIPTION_KEYWORDS)).toBe(true)
    expect(constants.SUBSCRIPTION_KEYWORDS.length).toBeGreaterThan(0)
    expect(constants.SUBSCRIPTION_KEYWORDS).toContain('subscription')

    expect(Array.isArray(constants.PRIVACY_KEYWORDS)).toBe(true)
    expect(constants.PRIVACY_KEYWORDS.length).toBeGreaterThan(0)
    expect(constants.PRIVACY_KEYWORDS).toContain('privacy')

    expect(Array.isArray(constants.REGULATORY_KEYWORDS)).toBe(true)
    expect(constants.REGULATORY_KEYWORDS.length).toBeGreaterThan(0)
    expect(constants.REGULATORY_KEYWORDS).toContain('fda')

    expect(Array.isArray(constants.MOBILE_USER_AGENTS)).toBe(true)
    expect(constants.MOBILE_USER_AGENTS.length).toBeGreaterThan(0)
  })

  it('should export correct desktop user agent string', () => {
    expect(typeof constants.DESKTOP_USER_AGENT).toBe('string')
    expect(constants.DESKTOP_USER_AGENT.length).toBeGreaterThan(0)
    expect(constants.DESKTOP_USER_AGENT).toContain('Mozilla')
  })

  it('should export correct default headers object', () => {
    expect(typeof constants.DEFAULT_HEADERS).toBe('object')
    expect(constants.DEFAULT_HEADERS).not.toBeNull()
    expect(constants.DEFAULT_HEADERS).toHaveProperty('Accept')
    expect(constants.DEFAULT_HEADERS).toHaveProperty('Connection', 'keep-alive')
  })
})
