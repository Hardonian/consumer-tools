import test from "node:test";
import assert from "node:assert/strict";

import { classifySender } from "../../src/lib/classification/classifier.ts";

test("classifies high-confidence promotional senders", () => {
  const result = classifySender({
    senderDomain: "deals.example",
    senderEmail: "news@deals.example",
    senderDisplayName: "Daily Deals",
    messageCount: 12,
    hasListUnsubscribe: true,
    unsubscribeMethods: ["https"],
    bulkHeaders: true,
    labelIds: ["CATEGORY_PROMOTIONS"],
    subjectHints: ["Limited time coupon sale"],
  });

  assert.equal(result.classification, "PROMOTIONAL_HIGH_CONFIDENCE");
  assert.equal(result.selectedByDefault, true);
  assert.equal(result.proposedAction, "UNSUBSCRIBE_THEN_FILTER");
  assert.equal(result.score, 80);
});

test("skips financial and security senders even with bulk signals", () => {
  const result = classifySender({
    senderDomain: "bank.example",
    senderEmail: "alerts@bank.example",
    senderDisplayName: "Bank Security Alerts",
    messageCount: 20,
    hasListUnsubscribe: true,
    unsubscribeMethods: ["https"],
    bulkHeaders: true,
    labelIds: ["CATEGORY_PROMOTIONS"],
    subjectHints: ["Password reset security alert"],
  });

  assert.equal(result.classification, "ACCOUNT_SECURITY_SAFE_SKIP");
  assert.equal(result.selectedByDefault, false);
  assert.ok(result.protectedReason);
});

test("allowlisted domains fail closed into personal safe skip", () => {
  const result = classifySender({
    senderDomain: "friend.example",
    senderEmail: "hello@friend.example",
    messageCount: 10,
    hasListUnsubscribe: true,
    unsubscribeMethods: ["mailto"],
    bulkHeaders: true,
    labelIds: ["CATEGORY_PROMOTIONS"],
    allowlistedDomains: ["friend.example"],
  });

  assert.equal(result.classification, "PERSONAL_SAFE_SKIP");
  assert.equal(result.selectedByDefault, false);
});
