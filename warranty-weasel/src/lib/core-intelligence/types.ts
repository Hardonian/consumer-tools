export type Verdict = 'BUY' | 'CAUTION' | 'AVOID' | 'UNKNOWN'

export type ErrorCode =
  | 'UNSUPPORTED_DOMAIN'
  | 'INVALID_URL'
  | 'FETCH_BLOCKED'
  | 'PARTIAL_PARSE'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'UNKNOWN_ERROR'

export type SignalStrength = 'strong' | 'weak' | 'conflicting'

export type FailureSeverity = 'low' | 'medium' | 'high' | 'critical'

export interface SignalEvidence {
  source: string
  snippet: string
}

export interface SignalResult {
  name: string
  weight: number
  explanation: string
  strength: SignalStrength
  evidence?: SignalEvidence[]
}

export interface SignalDetail {
  name: string
  weight: number
  explanation: string
}

export interface EvidenceDetail {
  signal: string
  snippet: string
  source: string
}

export interface FailureScenario {
  id: string
  scenario: string
  trigger: string
  severity: FailureSeverity
  expectedBehavior: string
  userMessage: string
  confidencePenalty: number
  fallbackStrategy: FallbackStrategy
  testCase: string
}

export type FallbackStrategy =
  | 'retry-with-backoff'
  | 'try-next-tier'
  | 'return-unknown'
  | 'partial-parse'
  | 'safe-truncate'
  | 'none'

export interface FetchResult {
  success: boolean
  html: string | null
  status: number
  strategy: string
  degraded: boolean
  userMessage: string
  confidencePenalty: number
  failureId: string | null
  redirected: boolean
  responseUrl: string
}

export interface ParsedReview {
  id: string
  title: string
  rating: number
  date: string | null
  author: string
  verified: boolean
  snippet: string
  helpfulVotes: number
  rawHtml: string
}

export interface ParsedData {
  reviews: ParsedReview[]
  productName: string | null
  averageRating: number | null
  totalReviews: number | null
  category: string | null
  metadata: Record<string, unknown>
}

export interface ConfidenceResult {
  confidence: number
  explanation: string
  capped: boolean
  capReason: string | null
}

export interface ScoreResult {
  score: number
  verdict: Verdict
  confidence: number
  confidenceExplanation: string
  signals: SignalResult[]
  reasons: string[]
  limitations: string[]
}

export interface AnalysisResult {
  schemaVersion: string
  ok: boolean
  resultId: string
  url: string
  verdict: Verdict
  confidence: number
  confidenceExplanation: string
  reasons: string[]
  signals: SignalDetail[]
  evidence: EvidenceDetail[]
  limitations: string[]
  degraded?: boolean
  errorCode?: ErrorCode
  reviewCount: number
  productName?: string
  category?: string
}

export interface DegradedStateContext {
  reason: string
  failureId: string | null
  fallback: string
  userMessage: string
  confidenceImpact: number
  timestamp: number
}

export interface ObservabilityEvent {
  type: 'fetch' | 'parse' | 'signal' | 'score' | 'cache' | 'degraded'
  url: string
  durationMs: number
  success: boolean
  degraded: boolean
  errorCode: string | null
  confidencePenalty: number
  timestamp: number
}

export interface CacheEntry<T> {
  result: T
  expiresAt: number
  createdAt: number
}

export interface CacheConfig {
  defaultTTL: number
  maxSize: number
}

export interface DomainAdapter {
  domain: string
  patterns: RegExp[]
  fetch: (url: string) => Promise<FetchResult>
  parse: (html: string) => ParsedData
  extractCategory: (html: string, productName: string | null) => string
}

export interface CategoryRule {
  category: string
  adjustments: Record<string, number>
  description: string
}

export interface SuspiciousSignal {
  name: string
  description: string
  weight: number
  example: string
  explanation: string
}

export interface SafeSignal {
  name: string
  description: string
  weight: number
  example: string
}

export interface EdgeCase {
  id: string
  description: string
  handling: string
}

export interface IntelConfig {
  maxResponseSize: number
  fetchTimeout: number
  maxRetries: number
  retryDelayBase: number
  maxReviewsToParse: number
  minReviewsForAnalysis: number
  cacheTTL: number
}
