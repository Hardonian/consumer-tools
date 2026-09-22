export type Verdict = 'BUY' | 'CAUTION' | 'AVOID' | 'UNKNOWN'

export interface SignalEvidence {
  source: string
  snippet: string
}

export interface SignalResult {
  name: string
  weight: number
  explanation: string
  strength: 'strong' | 'weak' | 'conflicting'
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

export interface ScoreResult {
  score: number
  verdict: Verdict
  confidence: number
  confidenceExplanation: string
  signals: SignalResult[]
  reasons: string[]
  limitations: string[]
}

export type ErrorCode =
  | 'UNSUPPORTED_DOMAIN'
  | 'INVALID_URL'
  | 'FETCH_BLOCKED'
  | 'PARTIAL_PARSE'
  | 'TIMEOUT'
  | 'RATE_LIMITED'
  | 'UNKNOWN_ERROR'

export interface AnalysisResult {
  schemaVersion?: string
  resultId?: string
  ok: boolean
  verdict: Verdict
  confidence: number
  confidenceExplanation: string
  reasons: string[]
  signals: SignalDetail[]
  evidence: EvidenceDetail[]
  limitations: string[]
  degraded?: boolean
  errorCode?: ErrorCode
  url: string
  reviewCount: number
  productName?: string
  category?: string
}

export interface ErrorResponse {
  ok: false
  code: string
  message: string
  retryable: boolean
  degraded?: boolean
}

export interface CategoryRule {
  category: string
  adjustments: Record<string, number>
  description: string
}

export interface EdgeCase {
  id: string
  description: string
  handling: string
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

export interface FetchResult {
  success: boolean
  html: string | null
  status: number
  strategy: string
  degraded: boolean
  userMessage: string
  confidencePenalty: number
  failureId: string | null
}

export interface FailureScenario {
  id: string
  scenario: string
  trigger: string
  expectedBehavior: string
  badBehavior: string
  fix: string
  userMessage: string
  confidenceImpact: number
  testCase: string
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
