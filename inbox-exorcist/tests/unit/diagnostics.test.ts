import test from "node:test";
import assert from "node:assert/strict";
import {
  recordDiagnosticEvent,
  setDiagnosticEventSink,
  type DiagnosticEvent,
} from "../../src/lib/diagnostics/events.ts";

test("emits diagnostic events to sink", () => {
  const events: DiagnosticEvent[] = [];
  setDiagnosticEventSink((event) => events.push(event));

  recordDiagnosticEvent("user-1", "scan_started", { maxMessages: 250 });

  assert.equal(events.length, 1);
  assert.equal(events[0].userId, "user-1");
  assert.equal(events[0].type, "scan_started");
  assert.equal(events[0].metadata.maxMessages, 250);
  assert.equal(events[0].degraded, false);
});

test("emits degraded event with error", () => {
  const events: DiagnosticEvent[] = [];
  setDiagnosticEventSink((event) => events.push(event));

  recordDiagnosticEvent(
    "user-2",
    "scan_completed",
    { scanId: "scan-1" },
    true,
    { code: "GMAIL_QUOTA_LIMITED", message: "Quota exceeded" },
  );

  assert.equal(events[0].degraded, true);
  assert.ok(events[0].error);
  assert.equal(events[0].error?.code, "GMAIL_QUOTA_LIMITED");
});

test("diagnostic event has valid id and timestamp", () => {
  const events: DiagnosticEvent[] = [];
  setDiagnosticEventSink((event) => events.push(event));

  recordDiagnosticEvent("user-3", "oauth_started");

  assert.ok(events[0].id.startsWith("diag_"));
  assert.ok(events[0].timestamp);
});
