import test from "node:test";
import assert from "node:assert/strict";

import { mapGmailError } from "../../src/lib/gmail/error-map.ts";

test("maps Gmail quota failures to retryable degraded envelope source", () => {
  const error = mapGmailError(429, "quota exceeded");
  assert.equal(error.code, "GMAIL_QUOTA_LIMITED");
  assert.equal(error.retryable, true);
  assert.equal(error.degraded, true);
});

test("maps insufficient scope failures fail-closed", () => {
  const error = mapGmailError(403, "insufficient permissions");
  assert.equal(error.code, "INSUFFICIENT_SCOPES");
  assert.equal(error.retryable, false);
});
