export { safeLog, safeLogInfo, safeLogWarn, safeLogError } from "./safe-log.ts";
export {
  DIAGNOSTIC_EVENTS,
  type DiagnosticEventType,
  type DiagnosticEvent,
  setDiagnosticEventSink,
  emitDiagnosticEvent,
  createDiagnosticEvent,
  recordDiagnosticEvent,
} from "./events.ts";
export {
  type CostMetrics,
  countGmailApiCall,
  countRetry,
  recordScanSize,
  recordSenderCount,
  countAction,
  recordCacheHit,
  recordCacheMiss,
  recordPartialScan,
  getCostMetrics,
  resetCostMetrics,
} from "./cost.ts";
export {
  getInFlightScan,
  registerInFlightScan,
  hasInFlightScan,
  getSenderFromCache,
  cacheSender,
  clearSenderCache,
  resetAllCaches,
} from "./cache.ts";
export {
  CircuitBreaker,
  getCircuitBreaker,
  resetCircuitBreakers,
} from "./circuit-breaker.ts";
export {
  withIdempotency,
  clearIdempotencyKeys,
  resetIdempotency,
} from "./idempotency.ts";
export {
  type DegradedState,
  DEGRADED_STATE_MESSAGES,
  isDegraded,
  createDegradedEnvelope,
  degradedWarnings,
} from "./degraded.ts";
