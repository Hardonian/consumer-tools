import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { setCachedResult, getCachedResult, getUrlHash } from '@/lib/intel/cache';
import type { AnalysisResult } from '@/types';

function makeResult(url: string): AnalysisResult {
  return {
    schemaVersion: '1.0.0',
    ok: true,
    resultId: 'test-id',
    url,
    verdict: 'BUY',
    confidence: 80,
    confidenceExplanation: 'Test',
    reasons: [],
    signals: [],
    evidence: [],
    limitations: [],
    reviewCount: 10,
  }
}

describe('intel/cache: setCachedResult', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Setting an initial time so Date.now() isn't 0, though not strictly required
    vi.setSystemTime(new Date(2023, 1, 1, 12, 0, 0));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should store an item in the cache and retrieve it', () => {
    const hash = getUrlHash('https://example.com/1');
    const result = makeResult('https://example.com/1');

    setCachedResult(hash, result);

    const cached = getCachedResult(hash);
    expect(cached).toEqual(result);
  });

  it('should expire item after default TTL', () => {
    const hash = getUrlHash('https://example.com/2');
    const result = makeResult('https://example.com/2');

    setCachedResult(hash, result);

    // Default TTL is 3600 * 1000 (1 hour)
    // Advance time just before expiration
    vi.advanceTimersByTime(3600 * 1000 - 1);
    expect(getCachedResult(hash)).toEqual(result);

    // Advance past expiration
    vi.advanceTimersByTime(2);
    expect(getCachedResult(hash)).toBeNull();
  });

  it('should expire item after custom TTL', () => {
    const hash = getUrlHash('https://example.com/3');
    const result = makeResult('https://example.com/3');
    const customTtl = 5000;

    setCachedResult(hash, result, customTtl);

    // Advance time to just before expiration
    vi.advanceTimersByTime(customTtl - 1);
    expect(getCachedResult(hash)).toEqual(result);

    // Advance time to past expiration
    vi.advanceTimersByTime(2);
    expect(getCachedResult(hash)).toBeNull();
  });
});
