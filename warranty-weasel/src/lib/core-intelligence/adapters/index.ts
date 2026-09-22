import type { FetchResult, ParsedData } from '../types'
import { amazonFetch, amazonParse, amazonExtractCategory } from './amazon'
import { walmartFetch, walmartParse, walmartExtractCategory } from './walmart'
import { bestbuyFetch, bestbuyParse, bestbuyExtractCategory } from './bestbuy'
import { genericFetch, genericParse, genericExtractCategory } from './generic'

interface AdapterRegistry {
  domain: string
  patterns: RegExp[]
  fetch: (url: string) => Promise<FetchResult>
  parse: (html: string) => ParsedData
  extractCategory: (html: string, productName: string | null) => string
}

const adapters: AdapterRegistry[] = [
  {
    domain: 'amazon',
    patterns: [/amazon\.(com|co\.uk|de|fr|it|es|ca|com\.au|co\.jp|in|sg|ae|sa|pl|se|nl|ie)/i],
    fetch: amazonFetch,
    parse: amazonParse,
    extractCategory: amazonExtractCategory,
  },
  {
    domain: 'walmart',
    patterns: [/walmart\.com/i],
    fetch: walmartFetch,
    parse: walmartParse,
    extractCategory: walmartExtractCategory,
  },
  {
    domain: 'bestbuy',
    patterns: [/bestbuy\.com/i],
    fetch: bestbuyFetch,
    parse: bestbuyParse,
    extractCategory: bestbuyExtractCategory,
  },
]

export function getAdapterForUrl(url: string): AdapterRegistry {
  for (const adapter of adapters) {
    if (adapter.patterns.some((pattern) => pattern.test(url))) {
      return adapter
    }
  }
  return {
    domain: 'generic',
    patterns: [/.*/],
    fetch: genericFetch,
    parse: genericParse,
    extractCategory: genericExtractCategory,
  }
}

export function getAdapterForDomain(domain: string): AdapterRegistry {
  for (const adapter of adapters) {
    if (adapter.domain === domain.toLowerCase()) {
      return adapter
    }
  }
  return {
    domain: 'generic',
    patterns: [/.*/],
    fetch: genericFetch,
    parse: genericParse,
    extractCategory: genericExtractCategory,
  }
}

export { amazonFetch, amazonParse, amazonExtractCategory }
export { walmartFetch, walmartParse, walmartExtractCategory }
export { bestbuyFetch, bestbuyParse, bestbuyExtractCategory }
export { genericFetch, genericParse, genericExtractCategory }
