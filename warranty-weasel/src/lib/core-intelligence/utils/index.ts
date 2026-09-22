export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '...'
}

export function normalizeUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr)
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'qid', 'sr', 'ie', 'tag']
    trackingParams.forEach((p) => url.searchParams.delete(p))
    url.searchParams.sort()
    url.hostname = url.hostname.toLowerCase()
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1)
    }
    url.protocol = 'https:'
    return url.toString()
  } catch {
    return urlStr
  }
}

export function generateId(): string {
  return crypto.randomUUID()
}

export function safeJsonParse<T>(input: string, fallback: T): T {
  try {
    return JSON.parse(input) as T
  } catch {
    return fallback
  }
}

export function deduplicateArray<T>(arr: T[]): T[] {
  return [...new Set(arr)]
}

export function textSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b
  const shorter = a.length > b.length ? b : a
  if (longer.length === 0) return 1.0
  const editDist = levenshteinDistance(longer, shorter)
  return (longer.length - editDist) / longer.length
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length < b.length) {
    const temp = a
    a = b
    b = temp
  }
  if (b.length === 0) return a.length

  let prevRow = new Uint32Array(b.length + 1)
  let currRow = new Uint32Array(b.length + 1)

  for (let j = 0; j <= b.length; j++) {
    prevRow[j] = j
  }

  for (let i = 1; i <= a.length; i++) {
    currRow[0] = i
    const aChar = a.charCodeAt(i - 1)
    for (let j = 1; j <= b.length; j++) {
      if (aChar === b.charCodeAt(j - 1)) {
        currRow[j] = prevRow[j - 1]
      } else {
        currRow[j] = Math.min(
          prevRow[j - 1],
          currRow[j - 1],
          prevRow[j]
        ) + 1
      }
    }
    const tempRow = prevRow
    prevRow = currRow
    currRow = tempRow
  }
  return prevRow[b.length]
}
