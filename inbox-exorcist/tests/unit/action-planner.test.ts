import test from "node:test";
import assert from "node:assert/strict";

import { selectedQuietCandidates, skippedCandidateCount } from "../../src/lib/services/action-planner.ts";
import { mockScan } from "../../src/lib/mock-scan.ts";

test("selects only high-confidence safe senders", () => {
  const scan = mockScan();
  const selected = selectedQuietCandidates(scan.candidates);
  assert.equal(selected.length, 3);
  assert.ok(selected.every((candidate) => candidate.score >= 80));
});

test("counts protected senders skipped from a requested set", () => {
  const scan = mockScan();
  const skipped = skippedCandidateCount(scan.candidates, scan.candidates.map((c) => c.id));
  assert.equal(skipped, 2);
});
