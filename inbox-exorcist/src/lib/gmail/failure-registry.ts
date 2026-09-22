export const GMAIL_FAILURE_CODES = [
  "oauth_denied",
  "insufficient_scopes",
  "token_expired",
  "token_refresh_failed",
  "gmail_quota_limited",
  "gmail_rate_limited",
  "partial_scan",
  "label_create_failed",
  "filter_create_failed",
  "unsubscribe_unavailable",
  "undo_partial_failure",
  "disconnect_failed",
  "data_delete_partial_failure",
] as const;

export type GmailFailureCode = (typeof GMAIL_FAILURE_CODES)[number];

type FailureSpec = {
  message: string;
  retryable: boolean;
  degraded: boolean;
  httpStatus?: number;
};

const FAILURE_REGISTRY: Record<GmailFailureCode, FailureSpec> = {
  oauth_denied: {
    message: "Google OAuth access was denied. Please authorize Gmail access and retry.",
    retryable: true,
    degraded: true,
    httpStatus: 403,
  },
  insufficient_scopes: {
    message: "Gmail did not grant enough access. Reconnect with full permissions.",
    retryable: false,
    degraded: true,
    httpStatus: 403,
  },
  token_expired: {
    message: "Gmail session expired. Please reconnect Gmail and retry.",
    retryable: true,
    degraded: true,
    httpStatus: 401,
  },
  token_refresh_failed: {
    message: "Gmail token refresh failed. Please reconnect Gmail.",
    retryable: true,
    degraded: true,
    httpStatus: 401,
  },
  gmail_quota_limited: {
    message: "Gmail quota limited. Retry in a few minutes.",
    retryable: true,
    degraded: true,
    httpStatus: 429,
  },
  gmail_rate_limited: {
    message: "Gmail rate limited. Please wait before retrying.",
    retryable: true,
    degraded: true,
    httpStatus: 429,
  },
  partial_scan: {
    message: "Scan completed partially. Some messages may not have been included.",
    retryable: true,
    degraded: true,
  },
  label_create_failed: {
    message: "Could not create the Quiet label. Filter creation may still work.",
    retryable: true,
    degraded: true,
  },
  filter_create_failed: {
    message: "Filter creation failed for a sender. Retry may succeed.",
    retryable: true,
    degraded: true,
  },
  unsubscribe_unavailable: {
    message: "No unsubscribe link found for this sender. Filter quieting still applied.",
    retryable: false,
    degraded: true,
  },
  undo_partial_failure: {
    message: "Some filters could not be removed. Manual cleanup may be needed.",
    retryable: true,
    degraded: true,
  },
  disconnect_failed: {
    message: "Gmail token revoke may have failed. Connection was removed locally.",
    retryable: false,
    degraded: true,
  },
  data_delete_partial_failure: {
    message: "Some inbox data may remain on Gmail servers. Local data was deleted.",
    retryable: false,
    degraded: true,
  },
};

export function lookupGmailFailure(code: GmailFailureCode): FailureSpec {
  return FAILURE_REGISTRY[code];
}

export function isKnownGmailFailure(code: string): code is GmailFailureCode {
  return code in FAILURE_REGISTRY;
}

export function gmailFailureEnvelope(
  code: GmailFailureCode,
  override?: { message?: string },
): { ok: false; code: GmailFailureCode; message: string; retryable: boolean; degraded: boolean } {
  const spec = FAILURE_REGISTRY[code];
  return {
    ok: false,
    code,
    message: override?.message ?? spec.message,
    retryable: spec.retryable,
    degraded: spec.degraded,
  };
}
