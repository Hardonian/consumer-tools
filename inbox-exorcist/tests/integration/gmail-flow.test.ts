import test from "node:test";
import assert from "node:assert/strict";

import { MemoryStore, resetMemoryStoreForTests } from "../../src/lib/storage/memory-store.ts";
import { runScan } from "../../src/lib/services/scan.ts";
import { quietSenders } from "../../src/lib/services/quiet.ts";
import { undoActions } from "../../src/lib/services/undo.ts";
import {
  MockGmailClient,
  promoMessage,
  protectedMessage,
} from "../helpers/mock-gmail.ts";
import { resetAllCaches, resetIdempotency, resetCostMetrics } from "../../src/lib/diagnostics/index.ts";

function resetAll() {
  resetMemoryStoreForTests();
  resetAllCaches();
  resetIdempotency();
  resetCostMetrics();
}

test("scan creates candidates and skips protected senders", async () => {
  resetAll();
  const store = new MemoryStore();
  const gmail = new MockGmailClient([
    ...Array.from({ length: 12 }, (_, index) => promoMessage(`promo-${index}`)),
    protectedMessage("bank-1"),
  ]);

  const scan = await runScan({ userId: "user-1", gmail, store, maxMessages: 50 });

  assert.equal(scan.selectedCount, 1);
  assert.equal(scan.candidates[0].classification, "PROMOTIONAL_HIGH_CONFIDENCE");
  assert.ok(scan.candidates.some((candidate) => candidate.protectedReason));
});

test("quiet action creates label and filter, then undo removes the filter", async () => {
  resetAll();
  const store = new MemoryStore();
  const gmail = new MockGmailClient(
    Array.from({ length: 12 }, (_, index) => promoMessage(`promo-${index}`)),
  );
  const scan = await runScan({ userId: "user-1", gmail, store });

  const summary = await quietSenders({
    userId: "user-1",
    scanRunId: scan.id,
    gmail,
    store,
    grantedScopes: [],
    allowHttpsUnsubscribe: false,
  });

  assert.equal(summary.filtersCreated, 1);
  assert.equal(summary.messagesArchivedOrLabeled, 12);
  assert.equal(gmail.filters.size, 1);

  const undo = await undoActions({ userId: "user-1", gmail, store });
  assert.equal(undo.removedFilters, 1);
  assert.equal(gmail.filters.size, 0);
});

test("partial Gmail filter failure returns degraded warning summary", async () => {
  resetAll();
  const store = new MemoryStore();
  const gmail = new MockGmailClient(
    Array.from({ length: 12 }, (_, index) => promoMessage(`promo-${index}`)),
  );
  gmail.failFilterFor.add("deals.example");
  const scan = await runScan({ userId: "user-1", gmail, store });

  const summary = await quietSenders({
    userId: "user-1",
    scanRunId: scan.id,
    gmail,
    store,
    grantedScopes: [],
    allowHttpsUnsubscribe: false,
  });

  assert.equal(summary.failedFilters, 1);
  assert.equal(summary.warnings.length, 1);
});
