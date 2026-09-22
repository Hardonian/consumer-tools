import test from "node:test";
import assert from "node:assert/strict";
import { classifyDemonArchetype } from "../../src/lib/intelligence/archetypes.ts";
import type { SenderCandidate } from "../../src/lib/domain.ts";

test("classifyDemonArchetype assigns Guardian Angel to protected senders", () => {
  const candidate: SenderCandidate = {
    id: "cand-1",
    userId: "user-1",
    scanRunId: "scan-1",
    senderDomain: "chase.com",
    senderDisplayName: "Chase Bank",
    messageCount: 5,
    score: 0,
    classification: "FINANCIAL_SAFE_SKIP",
    reasons: ["Bank statement"],
    unsubscribeMethods: [],
    proposedAction: "SKIP",
    selectedByDefault: false,
    protectedReason: "Financial institution safety rule",
    createdAt: new Date().toISOString(),
  };

  const archetype = classifyDemonArchetype(candidate);
  assert.equal(archetype.id, "guardian");
  assert.equal(archetype.threatLevel, "BENIGN");
});

test("classifyDemonArchetype identifies Vampire for high volume promos", () => {
  const candidate: SenderCandidate = {
    id: "cand-2",
    userId: "user-1",
    scanRunId: "scan-1",
    senderDomain: "fastfashion.com",
    senderDisplayName: "Daily Deals",
    messageCount: 6,
    score: 92,
    classification: "PROMOTIONAL_HIGH_CONFIDENCE",
    reasons: ["Bulk sender header", "Daily promo cadence"],
    unsubscribeMethods: ["https"],
    proposedAction: "QUIET_BY_FILTER",
    selectedByDefault: true,
    createdAt: new Date().toISOString(),
  };

  const archetype = classifyDemonArchetype(candidate);
  assert.equal(archetype.id, "vampire");
  assert.equal(archetype.threatLevel, "CRITICAL");
});
