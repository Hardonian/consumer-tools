export type {
  Verdict,
  ErrorCode,
  SignalStrength,
  FailureSeverity,
  SignalEvidence,
  SignalResult,
  SignalDetail,
  EvidenceDetail,
  FailureScenario,
  FallbackStrategy,
  FetchResult,
  ParsedReview,
  ParsedData,
  ConfidenceResult,
  ScoreResult,
  AnalysisResult,
  DegradedStateContext,
  ObservabilityEvent,
  CacheEntry,
  CacheConfig,
  DomainAdapter,
  CategoryRule,
  SuspiciousSignal,
  SafeSignal,
  EdgeCase,
  IntelConfig,
} from './types'

export {
  failureScenarios,
  getFailureScenario,
  getFailureByTrigger,
  getAllFailureIds,
  detectFailureFromResponse,
  getFallbackStrategy,
  buildFetchResult,
} from './failure'

export {
  suspiciousSignals,
  safeSignals,
  getSuspiciousSignal,
  getSafeSignal,
  getMaxSuspiciousWeight,
  signalDetectors,
  runSignalDetection,
  aggregateSignals,
} from './signals'

export {
  computeConfidence,
  applyConfidenceCaps,
  computeMissingDataPenalty,
} from './confidence'

export {
  computeScore,
  detectCategory,
  getCategoryRule,
  CATEGORY_RULES,
  MIN_REVIEWS_FOR_ANALYSIS,
} from './scoring'

export {
  getAdapterForUrl,
  getAdapterForDomain,
  amazonFetch,
  amazonParse,
  amazonExtractCategory,
  walmartFetch,
  walmartParse,
  walmartExtractCategory,
  bestbuyFetch,
  bestbuyParse,
  bestbuyExtractCategory,
  genericFetch,
  genericParse,
  genericExtractCategory,
} from './adapters'

export {
  cache,
  createCache,
  getUrlHash,
  getCachedResult,
  getCachedResultById,
  setCachedResult,
  withCoalescing,
} from './cache'

export {
  observability,
  createObservabilityLayer,
  recordEvent,
  logInfo,
  logWarn,
  logError,
  logDebug,
  trackLatency,
  trackDegraded,
  trackUnknown,
  getStats,
} from './observability'

export {
  handleDegradedState,
  getDegradedHistory,
  getRecentDegradedStates,
  clearDegradedHistory,
  getDegradedStats,
} from './degradedState'

export {
  clamp,
  sleep,
  truncateString,
  normalizeUrl,
  generateId,
  safeJsonParse,
  deduplicateArray,
  textSimilarity,
} from './utils'
