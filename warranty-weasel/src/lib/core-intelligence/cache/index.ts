import { createHash } from 'crypto'
import type { CacheEntry, CacheConfig, AnalysisResult } from '../types'

const DEFAULT_CONFIG: CacheConfig = {
  defaultTTL: 3600 * 1000,
  maxSize: 1000,
}

class IntelligenceCache {
  private cache: Map<string, CacheEntry<AnalysisResult>>
  private inFlight: Map<string, Promise<AnalysisResult>>
  private config: CacheConfig

  constructor(config: Partial<CacheConfig> = {}) {
    this.cache = new Map()
    this.inFlight = new Map()
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  getUrlHash(url: string): string {
    return createHash('sha256').update(url).digest('hex')
  }

  get(urlHash: string): AnalysisResult | null {
    const entry = this.cache.get(urlHash)
    if (!entry) return null
    if (entry.expiresAt <= Date.now()) {
      this.cache.delete(urlHash)
      return null
    }
    return entry.result
  }

  getById(id: string): AnalysisResult | null {
    for (const [urlHash, entry] of this.cache.entries()) {
      if (entry.result.resultId === id) {
        if (entry.expiresAt <= Date.now()) {
          this.cache.delete(urlHash)
          return null
        }
        return entry.result
      }
    }
    return null
  }

  set(urlHash: string, result: AnalysisResult, ttl?: number): void {
    if (this.cache.size >= this.config.maxSize) {
      const oldestKey = this.cache.keys().next().value
      if (oldestKey) this.cache.delete(oldestKey)
    }

    this.cache.set(urlHash, {
      result,
      expiresAt: Date.now() + (ttl ?? this.config.defaultTTL),
      createdAt: Date.now(),
    })
  }

  async withCoalescing(
    urlHash: string,
    fetcher: () => Promise<AnalysisResult>,
  ): Promise<AnalysisResult> {
    const existing = this.inFlight.get(urlHash)
    if (existing) return existing

    const promise = fetcher().finally(() => this.inFlight.delete(urlHash))
    this.inFlight.set(urlHash, promise)
    return promise
  }

  invalidate(urlHash: string): void {
    this.cache.delete(urlHash)
  }

  clear(): void {
    this.cache.clear()
    this.inFlight.clear()
  }

  getSize(): number {
    return this.cache.size
  }

  getInFlightCount(): number {
    return this.inFlight.size
  }
}

export const cache = new IntelligenceCache()

export function createCache(config?: Partial<CacheConfig>): IntelligenceCache {
  return new IntelligenceCache(config)
}

export function getUrlHash(url: string): string {
  return createHash('sha256').update(url).digest('hex')
}

export function getCachedResult(urlHash: string): AnalysisResult | null {
  return cache.get(urlHash)
}

export function getCachedResultById(id: string): AnalysisResult | null {
  return cache.getById(id)
}

export function setCachedResult(
  urlHash: string,
  result: AnalysisResult,
  ttl?: number,
): void {
  cache.set(urlHash, result, ttl)
}

export async function withCoalescing(
  urlHash: string,
  fetcher: () => Promise<AnalysisResult>,
): Promise<AnalysisResult> {
  return cache.withCoalescing(urlHash, fetcher)
}
