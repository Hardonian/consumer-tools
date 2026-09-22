import { isIP } from 'net'
import { URL } from 'url'

const PRIVATE_IP_RANGES = [
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^127\./,
  /^0\./,
  /^169\.254\./,
  /^::1$/,
  /^fe80:/,
  /^fc00:/,
  /^fd00:/,
]

const BLOCKED_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  'metadata.google.internal',
  '169.254.169.254',
  'instance-data',
  'metadata.azure.com',
]

export function normalizeUrl(urlStr: string): string {
  try {
    const url = new URL(urlStr)
    // Remove search params often used for tracking (UTM, ref, qid, etc)
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'ref', 'qid', 'sr', 'ie', 'tag']
    trackingParams.forEach(p => url.searchParams.delete(p))
    
    // Sort remaining params for consistency
    url.searchParams.sort()
    
    // Lowercase hostname
    url.hostname = url.hostname.toLowerCase()
    
    // Remove trailing slash from pathname if present
    if (url.pathname.length > 1 && url.pathname.endsWith('/')) {
      url.pathname = url.pathname.slice(0, -1)
    }
    
    // Standardize protocol to https
    url.protocol = 'https:'
    
    return url.toString()
  } catch {
    return urlStr
  }
}

export function validateUrl(input: string): { valid: boolean; error?: string; url?: URL } {
  let parsedUrl: URL
  try {
    parsedUrl = new URL(input)
  } catch {
    return { valid: false, error: 'Invalid URL format' }
  }

  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    return { valid: false, error: 'Only HTTP and HTTPS protocols are allowed' }
  }

  // Require HTTPS for production safety
  if (parsedUrl.protocol !== 'https:') {
    return { valid: false, error: 'HTTPS is required for security' }
  }

  const hostname = parsedUrl.hostname.toLowerCase()

  // Check blocked hosts
  if (BLOCKED_HOSTS.some((blocked) => hostname === blocked || hostname.endsWith(`.${blocked}`))) {
    return { valid: false, error: 'Access to this host is not allowed' }
  }

  // Check private IP ranges
  if (isIP(hostname)) {
    if (PRIVATE_IP_RANGES.some((pattern) => pattern.test(hostname))) {
      return { valid: false, error: 'Access to private networks is not allowed' }
    }
  }

  // Check for DNS rebinding via IP in hostname
  if (hostname.match(/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/)) {
    return { valid: false, error: 'Direct IP access is not allowed' }
  }

  return { valid: true, url: parsedUrl }
}

export function sanitizeHtml(html: string): string {
  // Remove script tags and content
  let sanitized = html.replace(/<script[\s\S]*?<\/script>/gi, '')
  // Remove event handlers
  sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '')
  sanitized = sanitized.replace(/\son\w+\s*=\s*\S+/gi, '')
  // Remove javascript: URLs
  sanitized = sanitized.replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')
  // Remove iframe, object, embed
  sanitized = sanitized.replace(/<(iframe|object|embed|form)[\s\S]*?<\/\1>/gi, '')
  sanitized = sanitized.replace(/<(iframe|object|embed|form)[^>]*\/?>/gi, '')
  return sanitized
}

export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str
  return str.slice(0, maxLength).trimEnd() + '...'
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}
