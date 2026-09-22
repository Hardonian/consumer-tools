import test from "node:test";
import assert from "node:assert/strict";
import {
  withIdempotency,
  clearIdempotencyKeys,
  resetIdempotency,
} from "../../src/lib/diagnostics/idempotency.ts";

test("idempotency prevents duplicate execution", async () => {
  resetIdempotency();

  let callCount = 0;
  const fn = async () => {
    callCount += 1;
    await new Promise((r) => setTimeout(r, 10));
    return "result";
  };

  const [r1, r2] = await Promise.all([
    withIdempotency("test-key-1", fn),
    withIdempotency("test-key-1", fn),
  ]);

  assert.equal(r1, "result");
  assert.equal(r2, "result");
  assert.equal(callCount, 1);
});

test("idempotency returns cached result", async () => {
  resetIdempotency();

  let callCount = 0;
  const fn = async () => {
    callCount += 1;
    return "cached";
  };

  await withIdempotency("test-key-2", fn);
  await withIdempotency("test-key-2", fn);

  assert.equal(callCount, 1);
});

test("different keys allow separate execution", async () => {
  resetIdempotency();

  let callCount = 0;
  const fn = async () => {
    callCount += 1;
    return callCount;
  };

  const r1 = await withIdempotency("key-a", fn);
  const r2 = await withIdempotency("key-b", fn);

  assert.equal(r1, 1);
  assert.equal(r2, 2);
  assert.equal(callCount, 2);
});

test("clearIdempotencyKeys clears by prefix", async () => {
  resetIdempotency();

  let aCount = 0;
  let bCount = 0;

  await withIdempotency("scan:user-1", async () => { aCount += 1; return 1; });
  await withIdempotency("quiet:user-1", async () => { bCount += 1; return 2; });

  clearIdempotencyKeys("scan:");

  await withIdempotency("scan:user-1", async () => { aCount += 1; return 3; });
  await withIdempotency("quiet:user-1", async () => { bCount += 1; return 4; });

  assert.equal(aCount, 2);
  assert.equal(bCount, 1);
});
