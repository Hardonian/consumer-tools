import { describe, it, expect } from 'vitest'
import { detectFailureType } from '../fetchController'
import {
  CAPTCHA_INDICATORS,
  WAF_INDICATORS,
  OUT_OF_STOCK_INDICATORS,
  JS_CHALLENGE_INDICATORS,
} from '@/lib/intel'

describe('detectFailureType', () => {
  it('detects 429 status as rate limit (FS-01)', () => {
    expect(detectFailureType('some html', 429)).toBe('FS-01')
  })

  it('detects 403 status as WAF (FS-05)', () => {
    expect(detectFailureType('some html', 403)).toBe('FS-05')
  })

  it('detects 403 status with WAF indicators as WAF (FS-05)', () => {
    expect(detectFailureType(`<html>${WAF_INDICATORS[0]}</html>`, 403)).toBe('FS-05')
  })

  it('detects CAPTCHA indicators (FS-02)', () => {
    expect(detectFailureType(`<html>${CAPTCHA_INDICATORS[0]}</html>`, 200)).toBe('FS-02')
    expect(detectFailureType(`<html>${CAPTCHA_INDICATORS[1].toUpperCase()}</html>`, 200)).toBe('FS-02')
  })

  it('detects JS challenge indicators (FS-10)', () => {
    expect(detectFailureType(`<html>${JS_CHALLENGE_INDICATORS[0]}</html>`, 200)).toBe('FS-10')
  })

  it('detects Out of Stock indicators (FS-04)', () => {
    expect(detectFailureType(`<html>${OUT_OF_STOCK_INDICATORS[0]}</html>`, 200)).toBe('FS-04')
  })

  it('detects 500+ status as server error (FS-50)', () => {
    expect(detectFailureType('some html', 500)).toBe('FS-50')
    expect(detectFailureType('some html', 503)).toBe('FS-50')
  })

  it('detects empty 200 response as out of stock/missing (FS-04)', () => {
    const shortHtml = 'a'.repeat(499)
    expect(detectFailureType(shortHtml, 200)).toBe('FS-04')
  })

  it('returns null for valid responses without indicators', () => {
    const validHtml = 'a'.repeat(500)
    expect(detectFailureType(validHtml, 200)).toBeNull()
  })
})
