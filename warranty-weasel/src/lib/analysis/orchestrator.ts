import type { AnalysisResult, FetchResult, ParsedData, SignalResult, SignalEvidence } from '@/lib/core-intelligence'
import { validateUrl } from '@/lib/security/urlValidator'
import {
  getAdapterForUrl,
  runSignalDetection,
  computeScore,
  computeConfidence,
  handleDegradedState,
  getCachedResult,
  setCachedResult,
  getUrlHash,
  withCoalescing,
  getFailureScenario,
  MIN_REVIEWS_FOR_ANALYSIS,
  recordEvent,
  trackLatency,
  trackUnknown,
  generateId,
} from '@/lib/core-intelligence'

const SCHEMA_VERSION = '1.0.0'

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const startTime = Date.now()

  const validation = validateUrl(url)
  if (!validation.valid) {
    const result: AnalysisResult = {
      schemaVersion: SCHEMA_VERSION,
      ok: true,
      resultId: generateId(),
      verdict: 'UNKNOWN',
      confidence: 0,
      confidenceExplanation: validation.error || 'Invalid URL.',
      reasons: ['URL validation failed.'],
      signals: [],
      evidence: [],
      limitations: [validation.error || 'Invalid URL format.'],
      url,
      reviewCount: 0,
    }

    recordEvent({
      type: 'fetch',
      url,
      durationMs: Date.now() - startTime,
      success: false,
      degraded: true,
      errorCode: 'INVALID_URL',
      confidencePenalty: 0,
      timestamp: Date.now(),
    })

    return result
  }

  const urlHash = getUrlHash(url)

  const cached = getCachedResult(urlHash)
  if (cached) {
    recordEvent({
      type: 'cache',
      url,
      durationMs: Date.now() - startTime,
      success: true,
      degraded: cached.degraded ?? false,
      errorCode: null,
      confidencePenalty: 0,
      timestamp: Date.now(),
    })
    return cached
  }

  try {
    const result = await withCoalescing(urlHash, async () => {
      return executeAnalysis(url, urlHash, startTime)
    })
    return result
  } catch {
    return {
      schemaVersion: SCHEMA_VERSION,
      ok: true,
      resultId: generateId(),
      verdict: 'UNKNOWN',
      confidence: 0,
      confidenceExplanation: 'Analysis failed due to an unexpected error.',
      reasons: ['An internal error occurred during analysis.'],
      signals: [],
      evidence: [],
      limitations: ['Analysis could not be completed. Please try again.'],
      url,
      reviewCount: 0,
      degraded: true,
    }
  }
}

async function executeAnalysis(
  url: string,
  urlHash: string,
  startTime: number,
): Promise<AnalysisResult> {
  const adapter = getAdapterForUrl(url)

  const fetchStart = Date.now()
  const fetchResult: FetchResult = await adapter.fetch(url)
  trackLatency('fetch', Date.now() - fetchStart, fetchResult.success)

  recordEvent({
    type: 'fetch',
    url,
    durationMs: Date.now() - fetchStart,
    success: fetchResult.success,
    degraded: fetchResult.degraded,
    errorCode: fetchResult.failureId,
    confidencePenalty: fetchResult.confidencePenalty,
    timestamp: Date.now(),
  })

  if (!fetchResult.success && !fetchResult.html) {
    const failureScenario = fetchResult.failureId ? getFailureScenario(fetchResult.failureId) : null
    const degradedResult = handleDegradedState({
      reason: fetchResult.failureId || 'fetch_failed',
      failureId: fetchResult.failureId,
      fallback: fetchResult.strategy,
      userMessage: fetchResult.userMessage || 'Unable to access the review page.',
      confidenceImpact: fetchResult.confidencePenalty,
    })

    trackUnknown(url, fetchResult.failureId || 'fetch_failed')

    const result: AnalysisResult = {
      schemaVersion: SCHEMA_VERSION,
      ok: true,
      resultId: generateId(),
      verdict: degradedResult.verdict,
      confidence: 0,
      confidenceExplanation: fetchResult.userMessage || 'Unable to access the review page.',
      reasons: [fetchResult.userMessage || 'The review page could not be accessed.'],
      signals: [],
      evidence: [],
      limitations: [
        fetchResult.userMessage || 'Unable to fetch review data.',
        'Strategy attempted: ' + fetchResult.strategy,
        failureScenario?.userMessage || '',
      ].filter(Boolean),
      url,
      reviewCount: 0,
      degraded: true,
      errorCode: fetchResult.failureId ? (fetchResult.failureId as AnalysisResult['errorCode']) : undefined,
    }

    setCachedResult(urlHash, result)
    return result
  }

  const parseStart = Date.now()
  const parsedData: ParsedData = adapter.parse(fetchResult.html || '')
  trackLatency('parse', Date.now() - parseStart, parsedData.reviews.length > 0)

  recordEvent({
    type: 'parse',
    url,
    durationMs: Date.now() - parseStart,
    success: parsedData.reviews.length > 0,
    degraded: false,
    errorCode: null,
    confidencePenalty: 0,
    timestamp: Date.now(),
  })

  const signalStart = Date.now()
  const signals: SignalResult[] = runSignalDetection(parsedData.reviews, parsedData.metadata)
  trackLatency('signal', Date.now() - signalStart, true)

  recordEvent({
    type: 'signal',
    url,
    durationMs: Date.now() - signalStart,
    success: true,
    degraded: false,
    errorCode: null,
    confidencePenalty: 0,
    timestamp: Date.now(),
  })

  const confidenceResult = computeConfidence(
    signals,
    parsedData.reviews.length,
    fetchResult.confidencePenalty,
    parsedData.reviews.length > 0,
  )

  const scoreResult = computeScore(
    signals,
    parsedData.reviews.length,
    fetchResult.confidencePenalty,
    parsedData.productName,
    parsedData.metadata,
    confidenceResult.confidence,
    confidenceResult.explanation,
  )

  const evidence = signals.flatMap((s) =>
    (s.evidence || []).map((e: SignalEvidence) => ({
      signal: s.name,
      snippet: e.snippet,
      source: e.source,
    })),
  )

  const limitations = [...scoreResult.limitations]
  if (scoreResult.verdict === 'UNKNOWN') {
    limitations.push(
      'Try another product listing to compare.',
      'Check the seller return window and warranty information manually.',
    )
  }

  const result: AnalysisResult = {
    schemaVersion: SCHEMA_VERSION,
    ok: true,
    resultId: generateId(),
    verdict: scoreResult.verdict,
    confidence: scoreResult.confidence,
    confidenceExplanation: scoreResult.confidenceExplanation,
    reasons: scoreResult.reasons.length > 0 ? scoreResult.reasons : ['No significant signals detected.'],
    signals: scoreResult.signals.map((s: SignalResult) => ({
      name: s.name,
      weight: s.weight,
      explanation: s.explanation,
    })),
    evidence,
    limitations,
    degraded: fetchResult.degraded || parsedData.reviews.length < MIN_REVIEWS_FOR_ANALYSIS,
    url,
    reviewCount: parsedData.reviews.length,
    productName: parsedData.productName || undefined,
    category: parsedData.category || undefined,
  }

  setCachedResult(urlHash, result)

  recordEvent({
    type: 'score',
    url,
    durationMs: Date.now() - startTime,
    success: true,
    degraded: result.degraded ?? false,
    errorCode: null,
    confidencePenalty: fetchResult.confidencePenalty,
    timestamp: Date.now(),
  })

  return result
}
