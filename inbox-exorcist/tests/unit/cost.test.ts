import test from "node:test";
import assert from "node:assert/strict";
import {
  countGmailApiCall,
  countRetry,
  recordScanSize,
  recordCacheHit,
  recordCacheMiss,
  getCostMetrics,
  resetCostMetrics,
} from "../../src/lib/diagnostics/cost.ts";

test("tracks Gmail API calls", () => {
  resetCostMetrics();
  countGmailApiCall();
  countGmailApiCall();

  const metrics = getCostMetrics();
  assert.equal(metrics.gmailApiCalls, 2);
  assert.equal(metrics.gmailApiCallsInWindow, 2);
});

test("tracks cache hit/miss rate", () => {
  resetCostMetrics();
  recordCacheHit();
  recordCacheHit();
  recordCacheMiss();

  const metrics = getCostMetrics();
  assert.equal(metrics.cacheHits, 2);
  assert.equal(metrics.cacheMisses, 1);
  const expectedRate = 2 / 3;
  assert.ok(Math.abs(metrics.cacheHitRate - expectedRate) < 0.001);
});

test("tracks retries and scan size", () => {
  resetCostMetrics();
  countRetry();
  countRetry();
  countRetry();
  recordScanSize(150);

  const metrics = getCostMetrics();
  assert.equal(metrics.retryCount, 3);
  assert.equal(metrics.scanSize, 150);
});

test("resets cost metrics", () => {
  resetCostMetrics();
  countGmailApiCall();
  resetCostMetrics();

  const metrics = getCostMetrics();
  assert.equal(metrics.gmailApiCalls, 0);
});
