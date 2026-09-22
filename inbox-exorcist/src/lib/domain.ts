export type ApiErrorEnvelope = {
  ok: false;
  code: string;
  message: string;
  retryable: boolean;
  degraded?: boolean;
};

export type ApiSuccessEnvelope<T> = {
  ok: true;
  data: T;
  degraded?: boolean;
  warnings?: ApiErrorEnvelope[];
};

export type ApiEnvelope<T> = ApiSuccessEnvelope<T> | ApiErrorEnvelope;

export type ScanResult = {
  schemaVersion: string;
  ok: boolean;
  resultId: string;
  confidence: "high" | "medium" | "low";
  confidenceExplanation: string;
  reasons: string[];
  signals: {
    senderCount: number;
    messageCount: number;
    scanDuration: string;
    degraded: boolean;
  };
  evidence: string[];
  limitations: string[];
  degraded: boolean;
  diagnosticsId?: string;
  noisySenders: string[];
  reviewSenders: string[];
  protectedSenders: string[];
  proposedActions: Array<{
    senderDomain: string;
    action: "QUIET_BY_FILTER" | "UNSUBSCRIBE_THEN_FILTER" | "REVIEW" | "SKIP";
    reason: string;
  }>;
  filtersCreated: number;
  unsubscribeAttempts: number;
  undoAvailable: boolean;
};

export type NoisySenderSummary = {
  senderDomain: string;
  senderDisplayName?: string;
  messageCount: number;
  classification: Classification;
  score: number;
  protectedReason?: string;
  proposedAction: ProposedAction;
  hasUnsubscribeLink: boolean;
};

export type QuietResult = {
  schemaVersion: string;
  ok: boolean;
  resultId: string;
  confidence: "high" | "medium" | "low";
  confidenceExplanation: string;
  reasons: string[];
  signals: {
    quietedCount: number;
    filtersCreated: number;
    unsubscribeAttempts: number;
    skippedCount: number;
  };
  evidence: string[];
  limitations: string[];
  degraded: boolean;
  diagnosticsId?: string;
  noisySenders: string[];
  reviewSenders: string[];
  protectedSenders: string[];
  proposedActions: Array<{
    senderDomain: string;
    action: "QUIETED" | "UNSUBSCRIBED" | "FAILED";
    reason: string;
  }>;
  filtersCreated: number;
  unsubscribeAttempts: number;
  undoAvailable: boolean;
};

export type UndoResult = {
  schemaVersion: string;
  ok: boolean;
  resultId: string;
  confidence: "high" | "medium" | "low";
  confidenceExplanation: string;
  reasons: string[];
  signals: {
    removedFilters: number;
    failedCount: number;
  };
  evidence: string[];
  limitations: string[];
  degraded: boolean;
  diagnosticsId?: string;
  noisySenders: string[];
  reviewSenders: string[];
  protectedSenders: string[];
  proposedActions: Array<{
    senderDomain: string;
    action: "UNDO_COMPLETED" | "UNDO_PARTIAL";
    reason: string;
  }>;
  filtersCreated: number;
  unsubscribeAttempts: number;
  undoAvailable: boolean;
};

export const classifications = [
  "PROMOTIONAL_HIGH_CONFIDENCE",
  "NEWSLETTER_HIGH_CONFIDENCE",
  "TRANSACTIONAL_SAFE_SKIP",
  "FINANCIAL_SAFE_SKIP",
  "ACCOUNT_SECURITY_SAFE_SKIP",
  "PERSONAL_SAFE_SKIP",
  "UNKNOWN_REVIEW",
] as const;

export type Classification = (typeof classifications)[number];

export const proposedActions = [
  "QUIET_BY_FILTER",
  "UNSUBSCRIBE_THEN_FILTER",
  "REVIEW",
  "SKIP",
] as const;

export type ProposedAction = (typeof proposedActions)[number];

export type ProposedActionItem = {
  senderDomain: string;
  action: "QUIET_BY_FILTER" | "UNSUBSCRIBE_THEN_FILTER" | "REVIEW" | "SKIP";
  reason: string;
};

export const actionResults = [
  "UNSUBSCRIBED",
  "QUIETED_BY_FILTER",
  "NEEDS_MANUAL_REVIEW",
  "SKIPPED_FOR_SAFETY",
  "FILTER_CREATION_FAILED",
  "UNSUBSCRIBE_UNAVAILABLE",
  "UNDO_COMPLETED",
  "UNDO_PARTIAL",
] as const;

export type SenderActionResult = (typeof actionResults)[number];

export type GmailConnection = {
  id: string;
  userId: string;
  gmailEmailHash: string;
  gmailEmailEncrypted: string;
  encryptedAccessToken: string;
  encryptedRefreshToken?: string;
  tokenExpiresAt: string;
  scopes: string[];
  status: "connected" | "disconnected" | "insufficient_scopes";
  createdAt: string;
  updatedAt: string;
};

export type ScanRun = {
  id: string;
  userId: string;
  status: "running" | "completed" | "partial" | "failed";
  query: string;
  messageCount: number;
  candidateCount: number;
  selectedCount: number;
  skippedCount: number;
  degraded: boolean;
  errorCode?: string;
  startedAt: string;
  finishedAt?: string;
};

export type SenderCandidate = {
  id: string;
  scanRunId: string;
  userId: string;
  senderDomain: string;
  senderEmailHash?: string;
  senderDisplayNameEncrypted?: string;
  senderDisplayName?: string;
  classification: Classification;
  score: number;
  reasons: string[];
  messageCount: number;
  proposedAction: ProposedAction;
  selectedByDefault: boolean;
  unsubscribeMethods: Array<"https" | "mailto">;
  protectedReason?: string;
  createdAt: string;
};

export type SenderAction = {
  id: string;
  userId: string;
  scanRunId?: string;
  senderDomain: string;
  candidateId?: string;
  actionType:
    | "quiet"
    | "unsubscribe_attempt"
    | "skip"
    | "undo"
    | "disconnect"
    | "delete_data";
  result: SenderActionResult;
  errorCode?: string;
  reversible: boolean;
  createdAt: string;
};

export type GmailFilterRecord = {
  id: string;
  userId: string;
  actionId: string;
  senderDomain: string;
  gmailFilterId: string;
  gmailLabelId: string;
  labelName: string;
  createdAt: string;
  deletedAt?: string;
};

export type UnsubscribeAttempt = {
  id: string;
  userId: string;
  actionId?: string;
  senderDomain: string;
  method: "https" | "mailto";
  result: "attempted" | "confirmed" | "blocked" | "unavailable" | "failed";
  errorCode?: string;
  createdAt: string;
};

export type AuditEvent = {
  id: string;
  userId: string;
  actor: "system" | "user";
  actionType: string;
  targetSenderDomain?: string;
  result: string;
  errorCode?: string;
  reversibleIds?: string[];
  createdAt: string;
};

export type QuietSummary = {
  quietedSenders: number;
  messagesArchivedOrLabeled: number;
  filtersCreated: number;
  unsubscribeAttemptsSent: number;
  skippedForSafety: number;
  failedFilters: number;
  warnings: ApiErrorEnvelope[];
};

export type ScanRunWithCandidates = ScanRun & {
  candidates: SenderCandidate[];
};
