import test from "node:test";
import assert from "node:assert/strict";
import {
  CircuitBreaker,
  getCircuitBreaker,
  resetCircuitBreakers,
} from "../../src/lib/diagnostics/circuit-breaker.ts";

test("circuit breaker starts closed", () => {
  const breaker = new CircuitBreaker("test-1");
  assert.equal(breaker.currentState, "closed");
  assert.equal(breaker.isOpen, false);
});

test("circuit breaker opens after threshold failures", async () => {
  const breaker = new CircuitBreaker("test-2", {
    failureThreshold: 3,
    recoveryTimeoutMs: 1000,
  });

  for (let i = 0; i < 3; i++) {
    try {
      await breaker.execute(() => Promise.reject(new Error("fail")));
    } catch {
    }
  }

  assert.equal(breaker.isOpen, true);
});

test("circuit breaker throws when open", async () => {
  const breaker = new CircuitBreaker("test-3", {
    failureThreshold: 1,
    recoveryTimeoutMs: 60000,
  });

  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch {
  }

  await assert.rejects(
    () => breaker.execute(() => Promise.resolve("ok")),
    /is open/,
  );
});

test("circuit breaker resets to closed on success", async () => {
  const breaker = new CircuitBreaker("test-4", {
    failureThreshold: 2,
    recoveryTimeoutMs: 50,
  });

  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch {
  }
  try {
    await breaker.execute(() => Promise.reject(new Error("fail")));
  } catch {
  }

  assert.equal(breaker.isOpen, true);

  await new Promise((r) => setTimeout(r, 60));

  const result = await breaker.execute(() => Promise.resolve("success"));
  assert.equal(result, "success");
  assert.equal(breaker.isOpen, false);
});

test("global breaker registry returns same instance", () => {
  resetCircuitBreakers();
  const a = getCircuitBreaker("shared");
  const b = getCircuitBreaker("shared");
  assert.equal(a, b);
});
