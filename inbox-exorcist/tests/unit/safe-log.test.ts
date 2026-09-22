import test from "node:test";
import assert from "node:assert/strict";
import { safeLog, safeStringify } from "../../src/lib/diagnostics/safe-log.ts";

test("safeStringify redacts sensitive fields", () => {
  const obj = {
    email: "user@example.com",
    access_token: "ya29.secret",
    sender_email: "sender@example.com",
    safeField: "visible",
    senderDomain: "example.com",
  };

  const result = JSON.parse(safeStringify(obj));
  assert.equal(result.email, "[REDACTED]");
  assert.equal(result.access_token, "[REDACTED]");
  assert.equal(result.sender_email, "[REDACTED]");
  assert.equal(result.safeField, "visible");
  assert.equal(result.senderDomain, "example.com");
});

test("safeStringify handles circular references", () => {
  const obj: Record<string, unknown> = { name: "test" };
  obj.self = obj;

  const result = safeStringify(obj);
  assert.ok(result.includes("[CIRCULAR]"));
});

test("safeLog produces structured output", () => {
  let logOutput = "";
  const originalLog = console.log;
  console.log = (msg: string) => { logOutput = msg; };

  safeLog("info", "test message", { userId: "test-user" });

  console.log = originalLog;

  const parsed = JSON.parse(logOutput);
  assert.equal(parsed.level, "info");
  assert.equal(parsed.msg, "test message");
  assert.equal(parsed.service, "InboxExorcist");
  assert.ok(parsed.ts);
});
