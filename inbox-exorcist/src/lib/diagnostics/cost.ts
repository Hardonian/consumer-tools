export type CostMetrics = {
  gmailApiCalls: number;
  gmailApiCallsInWindow: number;
  scanSize: number;
  senderCount: number;
  actionCount: number;
  partialScanRate: number;
  cacheHits: number;
  cacheMisses: number;
  retryCount: number;
  windowStart: string;
  windowMs: number;
  cacheHitRate: number;
};

const DEFAULT_WINDOW_MS = 60_000;

const globalCost = globalThis as typeof globalThis & {
  __inboxExorcistCostMetrics?: CostMetrics;
};

function getCostState(): CostMetrics {
  if (!globalCost.__inboxExorcistCostMetrics) {
    globalCost.__inboxExorcistCostMetrics = {
      gmailApiCalls: 0,
      gmailApiCallsInWindow: 0,
      scanSize: 0,
      senderCount: 0,
      actionCount: 0,
      partialScanRate: 0,
      cacheHits: 0,
      cacheMisses: 0,
      retryCount: 0,
      windowStart: new Date().toISOString(),
      windowMs: DEFAULT_WINDOW_MS,
      cacheHitRate: 0,
    };
  }
  const state = globalCost.__inboxExorcistCostMetrics;
  const elapsed = Date.now() - new Date(state.windowStart).getTime();
  if (elapsed > state.windowMs) {
    state.gmailApiCallsInWindow = 0;
    state.windowStart = new Date().toISOString();
  }
  return state;
}

export function countGmailApiCall() {
  const state = getCostState();
  state.gmailApiCalls += 1;
  state.gmailApiCallsInWindow += 1;
}

export function countRetry() {
  getCostState().retryCount += 1;
}

export function recordScanSize(size: number) {
  getCostState().scanSize = size;
}

export function recordSenderCount(count: number) {
  getCostState().senderCount = count;
}

export function countAction() {
  getCostState().actionCount += 1;
}

export function recordCacheHit() {
  getCostState().cacheHits += 1;
}

export function recordCacheMiss() {
  getCostState().cacheMisses += 1;
}

export function recordPartialScan() {
  const state = getCostState();
  state.partialScanRate =
    (state.partialScanRate * (state.scanSize - 1) + 1) / Math.max(state.scanSize, 1);
}

export function getCostMetrics(): CostMetrics {
  const state = getCostState();
  const totalCacheOps = state.cacheHits + state.cacheMisses;
  state.cacheHitRate = totalCacheOps > 0 ? state.cacheHits / totalCacheOps : 0;
  return { ...state };
}

export function resetCostMetrics() {
  delete globalCost.__inboxExorcistCostMetrics;
}
