import test from "node:test";
import assert from "node:assert/strict";

import { MemoryStore, resetMemoryStoreForTests } from "../../src/lib/storage/memory-store.ts";

test("scan lookup enforces user ownership", async () => {
  resetMemoryStoreForTests();
  const store = new MemoryStore();
  await store.createScanRun({
    id: "scan-1",
    userId: "user-a",
    status: "completed",
    query: "q",
    messageCount: 0,
    candidateCount: 0,
    selectedCount: 0,
    skippedCount: 0,
    degraded: false,
    startedAt: new Date().toISOString(),
  });

  assert.ok(await store.getScanRun("scan-1", "user-a"));
  assert.equal(await store.getScanRun("scan-1", "user-b"), null);
});
