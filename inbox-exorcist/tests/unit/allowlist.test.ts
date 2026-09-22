import test from "node:test";
import assert from "node:assert/strict";
import { MemoryStore } from "../../src/lib/storage/memory-store.ts";

test("MemoryStore manages allowlist correctly", async () => {
  const store = new MemoryStore();
  const userId = "test-user-allowlist-1";

  // Initially empty
  const initial = await store.listAllowlist(userId);
  assert.deepEqual(initial, []);

  // Add domains
  await store.addAllowlist(userId, "substack.com");
  await store.addAllowlist(userId, "nytimes.com");
  const updated = await store.listAllowlist(userId);
  assert.equal(updated.length, 2);
  assert.ok(updated.includes("substack.com"));
  assert.ok(updated.includes("nytimes.com"));

  // Remove domain
  await store.removeAllowlist(userId, "substack.com");
  const afterRemove = await store.listAllowlist(userId);
  assert.equal(afterRemove.length, 1);
  assert.equal(afterRemove[0], "nytimes.com");

  // User data deletion clears allowlist
  await store.deleteUserData(userId);
  const afterDelete = await store.listAllowlist(userId);
  assert.deepEqual(afterDelete, []);
});
