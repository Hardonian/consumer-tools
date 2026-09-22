export const MAX_RESPONSE_SIZE = 2 * 1024 * 1024 // 2MB
export const FETCH_TIMEOUT = 15000 // 15 seconds
export const MAX_RETRIES = 3
export const RETRY_DELAY_BASE = 1000 // 1 second
export const MAX_REVIEWS_TO_PARSE = 100
export const MIN_REVIEWS_FOR_ANALYSIS = 5

export const CAPTCHA_INDICATORS = [
  'captcha',
  'recaptcha',
  'verify you are human',
  'prove you are not a robot',
  'security check',
  'challenge',
  'g-recaptcha',
  'hcaptcha',
  'cf-challenge',
  'cloudflare challenge',
]

export const WAF_INDICATORS = [
  'blocked',
  'access denied',
  'forbidden',
  'firewall',
  'security policy',
  'request rejected',
  'suspicious activity',
  'automated access',
]

export const OUT_OF_STOCK_INDICATORS = [
  'out of stock',
  'unavailable',
  'currently unavailable',
  'not available',
  'discontinued',
  'no longer available',
  'delisted',
  'this product is not',
]

export const JS_CHALLENGE_INDICATORS = [
  'jschl-answer',
  'jschl_vc',
  'pass',
  'trk_jschl_js',
  'challenge-platform',
  '__cf_chl_rt_tk',
]

export const SAFETY_KEYWORDS = [
  'fire',
  'burn',
  'shock',
  'injury',
  'hurt',
  'danger',
  'hazard',
  'recall',
  'unsafe',
  'exploded',
  'smoke',
  'melt',
  'overheat',
  'electric shock',
  'cut',
  'bleeding',
  'poison',
  'toxic',
  'choking',
]

export const WARRANTY_KEYWORDS = [
  'warranty',
  'guarantee',
  'return',
  'refund',
  'denied',
  'void',
  'claim',
  'customer service',
  'support',
  'replacement',
  'defective',
  'broken',
  'not working',
  'stopped working',
]

export const COUNTERFEIT_KEYWORDS = [
  'fake',
  'counterfeit',
  'knockoff',
  'knock-off',
  'replica',
  'not genuine',
  'not authentic',
  'different from',
  'not the same',
  'packaging different',
  'cheap quality',
  'poor quality',
  'not as described',
]

export const INCENTIVE_KEYWORDS = [
  'free product',
  'free sample',
  'discount',
  'in exchange for',
  'honest review',
  'unbiased review',
  'compensated',
  'provided by',
  'sent to me',
  'received for',
  'vine program',
  'early reviewer',
]

export const SUBSCRIPTION_KEYWORDS = [
  'subscription',
  'recurring',
  'monthly charge',
  'auto renew',
  'auto-renew',
  'hard to cancel',
  'charged again',
  'free trial',
  'continues to charge',
]

export const PRIVACY_KEYWORDS = [
  'data collection',
  'privacy',
  'tracking',
  'personal information',
  'data sharing',
  'sold my data',
  'spyware',
  'monitoring',
]

export const REGULATORY_KEYWORDS = [
  'fcc',
  'ce marking',
  'fda',
  'certification',
  'compliance',
  'regulation',
  'not certified',
  'illegal',
  'banned',
]

export const MOBILE_USER_AGENTS = [
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
]

export const DESKTOP_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

export const DEFAULT_HEADERS = {
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'gzip, deflate, br',
  Connection: 'keep-alive',
  'Upgrade-Insecure-Requests': '1',
  'Sec-Fetch-Dest': 'document',
  'Sec-Fetch-Mode': 'navigate',
  'Sec-Fetch-Site': 'none',
  'Sec-Fetch-User': '?1',
}
