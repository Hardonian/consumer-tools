import { describe, it, expect, vi, beforeEach } from 'vitest'
import { analyzeUrl } from '@/lib/analysis/orchestrator'
import * as urlValidator from '@/lib/security/urlValidator'
import * as coreIntelligence from '@/lib/core-intelligence'
import type { AnalysisResult } from '@/lib/core-intelligence'

vi.mock('@/lib/security/urlValidator')
vi.mock('@/lib/core-intelligence')

describe('analyzeUrl', () => {
  const mockUrl = 'https://example.com/product/123'
  const mockHash = 'mock-hash-123'

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(coreIntelligence.generateId).mockReturnValue('mock-id-123')
    vi.mocked(coreIntelligence.getUrlHash).mockReturnValue(mockHash)

    // Default valid URL
    vi.mocked(urlValidator.validateUrl).mockReturnValue({ valid: true })

    // Default: not cached
    vi.mocked(coreIntelligence.getCachedResult).mockReturnValue(null)

    // Default: execute the internal execution block
    vi.mocked(coreIntelligence.withCoalescing).mockImplementation(async (key, fn) => {
      return fn()
    })
  })

  it('returns early when URL is invalid', async () => {
    vi.mocked(urlValidator.validateUrl).mockReturnValue({ valid: false, error: 'Invalid mock URL' })

    const result = await analyzeUrl(mockUrl)

    expect(result.ok).toBe(true)
    expect(result.verdict).toBe('UNKNOWN')
    expect(result.confidence).toBe(0)
    expect(result.limitations).toContain('Invalid mock URL')
    expect(coreIntelligence.recordEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'fetch',
      success: false,
      errorCode: 'INVALID_URL'
    }))
  })

  it('returns cached result if available', async () => {
    const cachedResult: AnalysisResult = {
      schemaVersion: '1.0.0',
      ok: true,
      resultId: 'cached-id',
      verdict: 'BUY',
      confidence: 90,
      confidenceExplanation: 'Cached',
      reasons: [],
      signals: [],
      evidence: [],
      limitations: [],
      url: mockUrl,
      reviewCount: 100,
    }
    vi.mocked(coreIntelligence.getCachedResult).mockReturnValue(cachedResult)

    const result = await analyzeUrl(mockUrl)

    expect(result).toEqual(cachedResult)
    expect(coreIntelligence.recordEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'cache',
      success: true
    }))
    expect(coreIntelligence.withCoalescing).not.toHaveBeenCalled()
  })

  it('handles unexpected errors during analysis gracefully', async () => {
    vi.mocked(coreIntelligence.withCoalescing).mockRejectedValue(new Error('Unexpected crash'))

    const result = await analyzeUrl(mockUrl)

    expect(result.ok).toBe(true)
    expect(result.verdict).toBe('UNKNOWN')
    expect(result.confidence).toBe(0)
    expect(result.degraded).toBe(true)
    expect(result.confidenceExplanation).toBe('Analysis failed due to an unexpected error.')
  })

  it('executes analysis and handles degraded fetch', async () => {
    const mockAdapter = {
      fetch: vi.fn().mockResolvedValue({
        success: false,
        failureId: 'mock_failure',
        strategy: 'none',
        userMessage: 'Fetch failed msg',
        confidencePenalty: 50,
      }),
      parse: vi.fn(),
    }
    vi.mocked(coreIntelligence.getAdapterForUrl).mockReturnValue(mockAdapter as any)
    vi.mocked(coreIntelligence.handleDegradedState).mockReturnValue({
      verdict: 'CAUTION',
      confidenceImpact: 50,
    })

    const result = await analyzeUrl(mockUrl)

    expect(mockAdapter.fetch).toHaveBeenCalledWith(mockUrl)
    expect(result.verdict).toBe('CAUTION')
    expect(result.degraded).toBe(true)
    expect(result.confidenceExplanation).toBe('Fetch failed msg')
    expect(coreIntelligence.setCachedResult).toHaveBeenCalledWith(mockHash, result)
  })

  it('executes analysis successfully', async () => {
    const mockAdapter = {
      fetch: vi.fn().mockResolvedValue({
        success: true,
        html: '<html>Mock HTML</html>',
        confidencePenalty: 0,
      }),
      parse: vi.fn().mockReturnValue({
        reviews: [{}, {}],
        metadata: {},
        productName: 'Mock Product',
        category: 'electronics'
      }),
    }
    vi.mocked(coreIntelligence.getAdapterForUrl).mockReturnValue(mockAdapter as any)
    vi.mocked(coreIntelligence.runSignalDetection).mockReturnValue([
      { name: 'mock_signal', weight: 10, explanation: 'mock expl' } as any
    ])
    vi.mocked(coreIntelligence.computeConfidence).mockReturnValue({
      confidence: 85,
      explanation: 'High confidence',
    })
    vi.mocked(coreIntelligence.computeScore).mockReturnValue({
      verdict: 'BUY',
      confidence: 85,
      confidenceExplanation: 'High confidence',
      reasons: ['Reason 1'],
      limitations: ['Limitation 1'],
      signals: [{ name: 'mock_signal', weight: 10, explanation: 'mock expl' } as any]
    })

    const result = await analyzeUrl(mockUrl)

    expect(result.verdict).toBe('BUY')
    expect(result.confidence).toBe(85)
    expect(result.reviewCount).toBe(2)
    expect(result.productName).toBe('Mock Product')
    expect(result.category).toBe('electronics')
    expect(coreIntelligence.setCachedResult).toHaveBeenCalledWith(mockHash, result)
    expect(coreIntelligence.recordEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'score', success: true }))
  })
})
