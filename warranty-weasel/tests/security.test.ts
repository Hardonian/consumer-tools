import { describe, it, expect } from 'vitest'
import { validateUrl, sanitizeHtml } from '@/lib/security/urlValidator'

describe('validateUrl', () => {
  it('accepts valid HTTPS URLs', () => {
    const result = validateUrl('https://www.example.com/product/123')
    expect(result.valid).toBe(true)
    expect(result.url?.hostname).toBe('www.example.com')
  })

  it('rejects HTTP URLs', () => {
    const result = validateUrl('http://www.example.com/product/123')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('HTTPS')
  })

  it('rejects private IP addresses', () => {
    const result = validateUrl('https://192.168.1.1/admin')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('private')
  })

  it('rejects localhost', () => {
    const result = validateUrl('https://localhost:3000/api')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('not allowed')
  })

  it('rejects 127.0.0.1', () => {
    const result = validateUrl('https://127.0.0.1/api')
    expect(result.valid).toBe(false)
  })

  it('rejects 10.x.x.x range', () => {
    const result = validateUrl('https://10.0.0.1/internal')
    expect(result.valid).toBe(false)
  })

  it('rejects 172.16.x.x range', () => {
    const result = validateUrl('https://172.16.0.1/internal')
    expect(result.valid).toBe(false)
  })

  it('rejects metadata endpoints', () => {
    const result = validateUrl('https://169.254.169.254/latest/meta-data/')
    expect(result.valid).toBe(false)
  })

  it('rejects non-HTTP protocols', () => {
    const result = validateUrl('file:///etc/passwd')
    expect(result.valid).toBe(false)
  })

  it('rejects invalid URLs', () => {
    const result = validateUrl('not-a-url')
    expect(result.valid).toBe(false)
  })

  it('rejects direct IP access', () => {
    const result = validateUrl('https://8.8.8.8/')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('IP')
  })
})

describe('sanitizeHtml', () => {
  it('removes script tags', () => {
    const input = '<p>Hello</p><script>alert("xss")</script><p>World</p>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<script>')
    expect(result).toContain('<p>Hello</p>')
    expect(result).toContain('<p>World</p>')
  })

  it('removes event handlers', () => {
    const input = '<div onclick="alert(1)">Click</div>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('onclick')
  })

  it('removes javascript: URLs', () => {
    const input = '<a href="javascript:alert(1)">Link</a>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('javascript:')
  })

  it('removes iframes', () => {
    const input = '<iframe src="https://evil.com"></iframe><p>Safe</p>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<iframe')
  })

  it('removes forms', () => {
    const input = '<form action="/steal"><input type="text"></form>'
    const result = sanitizeHtml(input)
    expect(result).not.toContain('<form')
  })
})
