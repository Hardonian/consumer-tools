import test from "node:test";
import assert from "node:assert/strict";
import {
  getInFlightScan,
  registerInFlightScan,
  hasInFlightScan,
  getSenderFromCache,
  cacheSender,
  clearSenderCache,
  resetAllCaches,
} from "../../src/lib/diagnostics/cache.ts";

type CacheEntry = { domain?: string; d?: string };

test("registerInFlightScan deduplicates", async () => {
  resetAllCaches();

  let callCount = 0;
  const promise = new Promise((resolve) => setTimeout(() => {
    callCount += 1;
    resolve("result");
  }, 50));

  const first = registerInFlightScan("user-1", promise);
  const second = registerInFlightScan("user-1", Promise.resolve("other"));

  const inFlight = getInFlightScan("user-1");
  assert.ok(inFlight !== null);
  assert.ok(hasInFlightScan("user-1"));

  const [r1, r2] = await Promise.all([first, second]);
  assert.equal(r1, "result");
  assert.equal(r2, "other");
  assert.equal(callCount, 1);
});

test("sender cache stores and retrieves", () => {
  resetAllCaches();
  cacheSender("user-1:example.com", { domain: "example.com" });

  const result = getSenderFromCache("user-1:example.com");
  assert.ok(result !== null);
  assert.equal((result as CacheEntry).domain, "example.com");
});

test("sender cache returns null for missing key", () => {
  resetAllCaches();
  const result = getSenderFromCache("nonexistent");
  assert.equal(result, null);
});

test("clearSenderCache clears by user prefix", () => {
  resetAllCaches();
  cacheSender("user-1:a.com", { d: "a" });
  cacheSender("user-1:b.com", { d: "b" });
  cacheSender("user-2:c.com", { d: "c" });

  clearSenderCache("user-1");

  assert.equal(getSenderFromCache("user-1:a.com"), null);
  assert.equal(getSenderFromCache("user-1:b.com"), null);
  assert.ok(getSenderFromCache("user-2:c.com") !== null);
});

test("resetAllCaches clears everything", () => {
  resetAllCaches();
  cacheSender("user-1:x.com", {});
  registerInFlightScan("user-1", Promise.resolve({}));

  resetAllCaches();

  assert.equal(getSenderFromCache("user-1:x.com"), null);
  assert.equal(getInFlightScan("user-1"), null);
});
