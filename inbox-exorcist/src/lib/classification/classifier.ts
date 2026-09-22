import type { Classification, ProposedAction } from "../domain.ts";
import { getDefaultIntelligenceEngine } from "../intelligence/engine.ts";

export type SenderEvidence = {
  senderDomain: string;
  senderEmail?: string;
  senderDisplayName?: string;
  messageCount: number;
  hasListUnsubscribe: boolean;
  unsubscribeMethods: Array<"https" | "mailto">;
  bulkHeaders: boolean;
  labelIds: string[];
  subjectHints?: string[];
  allowlistedDomains?: string[];
  userEngaged?: boolean;
  recentHumanReply?: boolean;
};

export type ClassificationResult = {
  classification: Classification;
  score: number;
  reasons: string[];
  proposedAction: ProposedAction;
  selectedByDefault: boolean;
  protectedReason?: string;
};

const financialTerms = [
  "bank",
  "credit",
  "card",
  "paypal",
  "stripe",
  "square",
  "venmo",
  "amex",
  "visa",
  "mastercard",
  "discover",
  "capitalone",
  "chase",
  "citi",
  "wellsfargo",
  "intuit",
  "quickbooks",
  "tax",
  "irs",
];

const healthcareLegalGovTerms = [
  "health",
  "clinic",
  "hospital",
  "mychart",
  "pharmacy",
  "legal",
  "law",
  "court",
  "gov",
  "government",
  "school",
  "university",
  "college",
  "employer",
  "workday",
];

const securityTerms = [
  "password",
  "reset",
  "login",
  "2fa",
  "mfa",
  "verification",
  "verify",
  "security",
  "alert",
  "suspicious",
];

const transactionalTerms = [
  "receipt",
  "invoice",
  "order",
  "shipping",
  "delivered",
  "tracking",
  "statement",
  "payment",
  "refund",
  "appointment",
  "reservation",
  "ticket",
];

const promoTerms = [
  "sale",
  "discount",
  "deal",
  "coupon",
  "newsletter",
  "offer",
  "promo",
  "promotion",
  "digest",
  "weekly",
  "product update",
  "launch",
  "clearance",
  "limited time",
];

function includesAny(text: string, terms: string[]) {
  return terms.some((term) => text.includes(term));
}

function normalizeEvidenceText(evidence: SenderEvidence) {
  return [
    evidence.senderDomain,
    evidence.senderEmail,
    evidence.senderDisplayName,
    ...(evidence.subjectHints || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

export function classifySender(evidence: SenderEvidence): ClassificationResult {
  const text = normalizeEvidenceText(evidence);
  const reasons: string[] = [];
  let score = 0;

  const isAllowlisted = evidence.allowlistedDomains?.some(
    (domain) =>
      evidence.senderDomain === domain ||
      evidence.senderDomain.endsWith(`.${domain}`),
  );

  // 1. Evaluate with Deep Intelligence Engine (Safety rules & edge cases)
  const intelEngine = getDefaultIntelligenceEngine();
  const intelReport = intelEngine.analyze({
    sender: evidence.senderEmail || evidence.senderDisplayName || evidence.senderDomain,
    subject: (evidence.subjectHints || []).join(" "),
    body: "",
    headers: {
      ...(evidence.hasListUnsubscribe ? { "List-Unsubscribe": "true" } : {}),
      ...(evidence.recentHumanReply ? { "In-Reply-To": "true" } : {}),
    },
    has_attachments: false,
  });

  if (evidence.hasListUnsubscribe) {
    score += 25;
    reasons.push("List-Unsubscribe header exists");
  }

  if (evidence.messageCount >= 8) {
    score += 20;
    reasons.push("High send frequency");
  } else if (evidence.messageCount >= 4) {
    score += 10;
    reasons.push("Moderate send frequency");
  }

  if (includesAny(text, promoTerms)) {
    score += 15;
    reasons.push("Promotional language detected");
  }

  if (evidence.labelIds.includes("CATEGORY_PROMOTIONS")) {
    score += 10;
    reasons.push("Gmail promotional category");
  }

  if (/no-?reply|donotreply|do-not-reply|mailer/.test(text)) {
    score += 10;
    reasons.push("No-reply or mailer sender pattern");
  }

  if (evidence.bulkHeaders) {
    score += 10;
    reasons.push("Bulk/list headers present");
  }

  let protectedReason: string | undefined;
  let classification: Classification | undefined;

  // Check intelligence engine safety override
  if (intelReport.decision === "keep" && intelReport.matching_rules.length > 0) {
    if (intelReport.category === "finance") {
      score -= 40;
      protectedReason = intelReport.explanation || "Financial or tax sender";
      classification = "FINANCIAL_SAFE_SKIP";
      reasons.push(`Intelligence rule: ${intelReport.explanation}`);
    } else if (intelReport.category === "security") {
      score -= 40;
      protectedReason = intelReport.explanation || "Account security sender";
      classification = "ACCOUNT_SECURITY_SAFE_SKIP";
      reasons.push(`Intelligence rule: ${intelReport.explanation}`);
    } else if (intelReport.category === "government") {
      score -= 40;
      protectedReason = "Government or tax authority";
      classification = "ACCOUNT_SECURITY_SAFE_SKIP";
      reasons.push(`Intelligence rule: ${intelReport.explanation}`);
    } else if (intelReport.category === "healthcare" || intelReport.category === "legal") {
      score -= 30;
      protectedReason = `Protected ${intelReport.category} communication`;
      classification = "UNKNOWN_REVIEW";
      reasons.push(`Intelligence rule: ${intelReport.explanation}`);
    }
  }

  if (includesAny(text, financialTerms)) {
    score -= 40;
    protectedReason = protectedReason || "Financial or tax sender";
    classification = classification || "FINANCIAL_SAFE_SKIP";
    if (!reasons.some((r) => r.includes("Financial"))) {
      reasons.push("Financial/security-sensitive keyword");
    }
  }

  if (includesAny(text, securityTerms)) {
    score -= 40;
    protectedReason = protectedReason || "Account security sender";
    classification = "ACCOUNT_SECURITY_SAFE_SKIP";
    if (!reasons.some((r) => r.includes("security keyword"))) {
      reasons.push("Password, login, or security keyword");
    }
  }

  if (includesAny(text, transactionalTerms)) {
    score -= 30;
    protectedReason = protectedReason || "Transactional sender";
    classification = classification || "TRANSACTIONAL_SAFE_SKIP";
    if (!reasons.some((r) => r.includes("Receipt"))) {
      reasons.push("Receipt, invoice, shipping, or order keyword");
    }
  }

  if (includesAny(text, healthcareLegalGovTerms)) {
    score -= 30;
    protectedReason = protectedReason || "Healthcare, legal, school, employer, or government sender";
    classification = classification || "UNKNOWN_REVIEW";
    if (!reasons.some((r) => r.includes("institution keyword"))) {
      reasons.push("Protected institution keyword");
    }
  }

  if (evidence.recentHumanReply || evidence.userEngaged) {
    score -= 30;
    protectedReason = protectedReason || "Recent human engagement";
    classification = "PERSONAL_SAFE_SKIP";
    reasons.push("Recent human reply or engagement signal");
  }

  if (isAllowlisted) {
    score -= 50;
    protectedReason = protectedReason || "User allowlist";
    classification = "PERSONAL_SAFE_SKIP";
    reasons.push("User allowlisted domain");
  }

  const clampedScore = Math.max(0, Math.min(100, score));

  if (protectedReason) {
    return {
      classification: classification || "UNKNOWN_REVIEW",
      score: clampedScore,
      reasons,
      proposedAction: clampedScore >= 50 ? "REVIEW" : "SKIP",
      selectedByDefault: false,
      protectedReason,
    };
  }

  if (clampedScore >= 80) {
    const isNewsletter = text.includes("newsletter") || text.includes("digest");
    return {
      classification: isNewsletter
        ? "NEWSLETTER_HIGH_CONFIDENCE"
        : "PROMOTIONAL_HIGH_CONFIDENCE",
      score: clampedScore,
      reasons,
      proposedAction: evidence.hasListUnsubscribe
        ? "UNSUBSCRIBE_THEN_FILTER"
        : "QUIET_BY_FILTER",
      selectedByDefault: true,
    };
  }

  if (clampedScore >= 50) {
    return {
      classification: "UNKNOWN_REVIEW",
      score: clampedScore,
      reasons,
      proposedAction: "REVIEW",
      selectedByDefault: false,
    };
  }

  return {
    classification: "UNKNOWN_REVIEW",
    score: clampedScore,
    reasons,
    proposedAction: "SKIP",
    selectedByDefault: false,
  };
}
