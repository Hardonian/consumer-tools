import test from "node:test";
import assert from "node:assert/strict";
import {
  exportGmailFilterXml,
  exportSieveScript,
  exportAppleMailScript,
  exportOutlookRuleJson,
} from "../../src/lib/providers/exporters.ts";
import type { SenderCandidate } from "../../src/lib/domain.ts";

const mockCandidates: SenderCandidate[] = [
  {
    id: "cand-1",
    userId: "user-1",
    scanRunId: "scan-1",
    senderDomain: "fastfashion.com",
    senderDisplayName: "Fast Fashion Daily",
    messageCount: 12,
    score: 95,
    classification: "PROMOTIONAL_HIGH_CONFIDENCE",
    reasons: ["Bulk promo headers"],
    unsubscribeMethods: ["https"],
    proposedAction: "QUIET_BY_FILTER",
    selectedByDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cand-2",
    userId: "user-1",
    scanRunId: "scan-1",
    senderDomain: "dailyblast.net",
    senderDisplayName: "Daily Blast Deals",
    messageCount: 8,
    score: 88,
    classification: "PROMOTIONAL_HIGH_CONFIDENCE",
    reasons: ["Frequent marketing"],
    unsubscribeMethods: ["https"],
    proposedAction: "QUIET_BY_FILTER",
    selectedByDefault: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: "cand-3",
    userId: "user-1",
    scanRunId: "scan-1",
    senderDomain: "chase.com",
    senderDisplayName: "Chase Bank",
    messageCount: 4,
    score: 0,
    classification: "FINANCIAL_SAFE_SKIP",
    reasons: ["Bank statement"],
    unsubscribeMethods: [],
    proposedAction: "SKIP",
    selectedByDefault: false,
    protectedReason: "Financial protection",
    createdAt: new Date().toISOString(),
  },
];

test("exportGmailFilterXml generates valid Atom XML feed with promo domains", () => {
  const result = exportGmailFilterXml(mockCandidates);
  assert.equal(result.filename, "inboxexorcist-gmail-filters.xml");
  assert.equal(result.mimeType, "application/xml");
  assert.match(result.content, /<\?xml version='1.0'/);
  assert.match(result.content, /\*@fastfashion.com OR \*@dailyblast.net/);
  // Protected candidate should be omitted
  assert.equal(result.content.includes("chase.com"), false);
});

test("exportSieveScript generates valid RFC-5228 script for Proton and Fastmail", () => {
  const result = exportSieveScript(mockCandidates);
  assert.equal(result.filename, "inboxexorcist-rules.sieve");
  assert.equal(result.mimeType, "application/sieve");
  assert.match(result.content, /require \["fileinto", "envelope"\];/);
  assert.match(result.content, /"fastfashion.com", "dailyblast.net"/);
  assert.equal(result.content.includes("chase.com"), false);
});

test("exportAppleMailScript creates macOS automation script", () => {
  const result = exportAppleMailScript(mockCandidates);
  assert.equal(result.filename, "setup-inboxexorcist-apple-mail.applescript");
  assert.match(result.content, /tell application "Mail"/);
  assert.match(result.content, /@fastfashion.com/);
  assert.match(result.content, /@dailyblast.net/);
  assert.equal(result.content.includes("@chase.com"), false);
});

test("exportOutlookRuleJson creates structured rule recipe for Office 365", () => {
  const result = exportOutlookRuleJson(mockCandidates);
  assert.equal(result.filename, "inboxexorcist-outlook-rules.json");
  const parsed = JSON.parse(result.content);
  assert.equal(parsed.provider, "Microsoft Outlook / Office 365");
  assert.deepEqual(parsed.condition.values, ["fastfashion.com", "dailyblast.net"]);
  assert.equal(parsed.condition.values.includes("chase.com"), false);
});
