import { AppError } from "../errors.ts";
import type { GmailFailureCode } from "./failure-registry.ts";
import { lookupGmailFailure, isKnownGmailFailure, gmailFailureEnvelope } from "./failure-registry.ts";

export function mapGmailError(status: number, bodyText = "") {
  if (status === 401) {
    const spec = lookupGmailFailure("token_expired");
    return new AppError({
      code: spec.httpStatus === 401 ? "GMAIL_AUTH_EXPIRED" : "token_expired",
      message: spec.message,
      retryable: spec.retryable,
      status: spec.httpStatus || 401,
      degraded: spec.degraded,
    });
  }

  if (status === 403) {
    const spec = lookupGmailFailure("insufficient_scopes");
    return new AppError({
      code: "INSUFFICIENT_SCOPES",
      message: spec.message,
      retryable: spec.retryable,
      status: spec.httpStatus || 403,
      degraded: spec.degraded,
    });
  }

  if (status === 429 || /quota/i.test(bodyText) || /rate/i.test(bodyText)) {
    const spec = lookupGmailFailure("gmail_quota_limited");
    return new AppError({
      code: "GMAIL_QUOTA_LIMITED",
      message: spec.message,
      retryable: spec.retryable,
      status: spec.httpStatus || 429,
      degraded: spec.degraded,
    });
  }

  if (status >= 500) {
    return new AppError({
      code: "GMAIL_UPSTREAM_ERROR",
      message: "Gmail had a temporary issue. No emails were deleted.",
      retryable: true,
      status: 503,
      degraded: true,
    });
  }

  return new AppError({
    code: "GMAIL_REQUEST_FAILED",
    message: "Gmail could not complete the request. No emails were deleted.",
    retryable: false,
    status: 502,
    degraded: true,
  });
}

export function normalizeGmailFailureCode(code: string): GmailFailureCode | null {
  if (isKnownGmailFailure(code)) {
    return code;
  }

  const mapping: Record<string, GmailFailureCode> = {
    GMAIL_AUTH_EXPIRED: "token_expired",
    GMAIL_RECONNECT_REQUIRED: "token_expired",
    INSUFFICIENT_SCOPES: "insufficient_scopes",
    GMAIL_QUOTA_LIMITED: "gmail_quota_limited",
    GMAIL_UPSTREAM_ERROR: "gmail_quota_limited",
    GMAIL_REQUEST_FAILED: "gmail_quota_limited",
    FILTER_CREATION_FAILED: "filter_create_failed",
    LABEL_CREATE_FAILED: "label_create_failed",
    UNSUBSCRIBE_UNAVAILABLE: "unsubscribe_unavailable",
    UNDO_PARTIAL: "undo_partial_failure",
    SCAN_FAILED: "partial_scan",
    DISCONNECT_FAILED: "disconnect_failed",
    DATA_DELETE_FAILED: "data_delete_partial_failure",
  };

  return mapping[code] || null;
}

export { gmailFailureEnvelope, lookupGmailFailure };
