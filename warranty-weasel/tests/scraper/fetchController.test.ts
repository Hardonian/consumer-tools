import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchController } from '@/lib/scraper/fetchController'
import * as urlValidator from '@/lib/security/urlValidator'
import { MAX_RESPONSE_SIZE } from '@/lib/intel'

const originalFetch = global.fetch

function createMockResponse(options: {
  status?: number
  text?: string
  redirected?: boolean
  url?: string
  contentLength?: string
  reader?: any
}) {
  const headers = new Headers()
  if (options.contentLength) {
    headers.set('content-length', options.contentLength)
  }

  return {
    status: options.status ?? 200,
    redirected: options.redirected ?? false,
    url: options.url ?? 'https://example.com/reviews',
    headers,
    text: () => Promise.resolve(options.text ?? ''),
    body: options.reader ? { getReader: () => options.reader } : undefined,
  }
}

describe('fetchController', () => {
  beforeEach(() => {
    vi.spyOn(urlValidator, 'sleep').mockResolvedValue()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
    vi.restoreAllMocks()
  })

  it('should successfully fetch on first attempt', async () => {
    global.fetch = vi.fn().mockResolvedValue(
      createMockResponse({ text: '<html><body>Reviews' + 'x'.repeat(600) + '</body></html>' })
    )

    const result = await fetchController('https://example.com')

    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
    expect(result.strategy).toBe('desktop')
    expect(result.degraded).toBe(false)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should retry across tiers on timeout (AbortError)', async () => {
    const abortError = new Error('AbortError')
    abortError.name = 'AbortError'

    global.fetch = vi.fn().mockRejectedValue(abortError)

    const result = await fetchController('https://example.com')

    expect(result.success).toBe(false)
    expect(result.strategy).toBe('timeout')
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('should retry within tier on 429 Rate Limit', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(createMockResponse({ status: 429, text: 'Too Many Requests' }))
      .mockResolvedValueOnce(createMockResponse({ status: 429, text: 'Too Many Requests' }))
      .mockResolvedValueOnce(createMockResponse({ status: 200, text: '<html><body>Reviews' + 'x'.repeat(600) + '</body></html>' }))

    const result = await fetchController('https://example.com')

    expect(result.success).toBe(true)
    expect(result.status).toBe(200)
    expect(result.strategy).toBe('desktop')
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('should return degraded state if 429 Rate Limit persists across all retries in first tier', async () => {
    global.fetch = vi.fn().mockResolvedValue(createMockResponse({ status: 429, text: 'Too Many Requests' }))

    const result = await fetchController('https://example.com')

    expect(result.success).toBe(false)
    expect(result.failureId).toBe('FS-01')
    expect(result.degraded).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })

  it('should fallback to next tier on CAPTCHA via inner loop continue', async () => {
    global.fetch = vi.fn().mockResolvedValue(createMockResponse({ status: 200, text: 'please verify you are human' }))

    const result = await fetchController('https://example.com')

    expect(result.success).toBe(false)
    expect(result.failureId).toBe('FS-02')
    // Due to the 'continue', the inner loop runs 3 times for tier 0, 3 times for tier 1. Wait, let's see.
    // If it reaches the end of the tier loop, the outer loop continues.
    // For the last tier, it returns instead of 'continue'.
    // So 3 + 3 + 1 = 7 fetches.
    expect(global.fetch).toHaveBeenCalledTimes(7)
  })

  it('should return degraded state immediately for WAF block (HTTP 403)', async () => {
    global.fetch = vi.fn().mockResolvedValue(createMockResponse({ status: 403, text: 'Access denied' }))

    const result = await fetchController('https://example.com')

    expect(result.success).toBe(true)
    expect(result.failureId).toBe('FS-05')
    expect(result.degraded).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should detect JS challenge (FS-10)', async () => {
    // Note: JS Challenge must not include the word 'challenge' which is in CAPTCHA list
    global.fetch = vi.fn().mockResolvedValue(createMockResponse({ status: 200, text: 'jschl_vc something else' }))

    const result = await fetchController('https://example.com')

    expect(result.success).toBe(false)
    expect(result.failureId).toBe('FS-10')
    expect(result.degraded).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(7)
  })

  it('should detect Empty 200 (FS-04) and return early', async () => {
    global.fetch = vi.fn().mockResolvedValue(createMockResponse({ status: 200, text: '<html>short</html>' }))

    const result = await fetchController('https://example.com')

    expect(result.success).toBe(false)
    expect(result.failureId).toBe('FS-04')
    expect(result.degraded).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should detect out of stock (FS-04) from text', async () => {
    global.fetch = vi.fn().mockResolvedValue(createMockResponse({ status: 200, text: '<html>currently unavailable' + 'x'.repeat(600) + '</html>' }))

    const result = await fetchController('https://example.com')

    expect(result.success).toBe(false)
    expect(result.failureId).toBe('FS-04')
    expect(result.degraded).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('should truncate response text if size > MAX_RESPONSE_SIZE', async () => {
    const hugeText = 'x'.repeat(MAX_RESPONSE_SIZE + 100)
    global.fetch = vi.fn().mockResolvedValue(createMockResponse({ text: hugeText }))

    const result = await fetchController('https://example.com')

    expect(result.success).toBe(true)
    expect(result.html?.length).toBe(MAX_RESPONSE_SIZE)
  })

  it('should use stream reader if content-length is large', async () => {
    let readCount = 0
    const mockReader = {
      read: vi.fn().mockImplementation(() => {
        readCount++
        if (readCount === 1) {
          return Promise.resolve({ done: false, value: new TextEncoder().encode('x'.repeat(MAX_RESPONSE_SIZE / 2)) })
        } else if (readCount === 2) {
          return Promise.resolve({ done: false, value: new TextEncoder().encode('y'.repeat(MAX_RESPONSE_SIZE / 2 + 100)) })
        }
        return Promise.resolve({ done: true, value: undefined })
      })
    }

    global.fetch = vi.fn().mockResolvedValue(createMockResponse({
      contentLength: (MAX_RESPONSE_SIZE + 1000).toString(),
      reader: mockReader,
    }))

    const result = await fetchController('https://example.com')

    expect(result.success).toBe(true)
    expect(result.html?.length).toBeGreaterThanOrEqual(MAX_RESPONSE_SIZE)
  })
})
