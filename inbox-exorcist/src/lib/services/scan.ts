import { classifySender, type SenderEvidence } from "../classification/classifier.ts";
import type { ScanRunWithCandidates, SenderCandidate, ScanRun, ScanResult, NoisySenderSummary, ProposedActionItem } from "../domain.ts";
import { AppError } from "../errors.ts";
import { getHeader, parseSender, extractUnsubscribeMethods } from "../gmail/headers.ts";
import type { GmailClient, GmailMessageHeader } from "../gmail/client.ts";
import { encryptSecret } from "../security/crypto.ts";
import { hashPii } from "../security/hash.ts";
import type { AppStore } from "../storage/store.ts";
import { newId, nowIso } from "../ids.ts";
import {
  safeLogInfo,
  safeLogWarn,
  recordDiagnosticEvent,
  recordScanSize,
  recordSenderCount,
  countGmailApiCall,
  getInFlightScan,
  registerInFlightScan,
  getSenderFromCache,
  cacheSender,
  getCircuitBreaker,
} from "../diagnostics/index.ts";

export const defaultScanQuery =
  "newer_than:90d (category:promotions OR list:* OR unsubscribe) -from:me";

type SenderAggregate = SenderEvidence & {
  messageIds: string[];
};

function aggregateMessages(
  messages: GmailMessageHeader[],
  allowlistedDomains: string[],
) {
  const grouped = new Map<string, SenderAggregate>();

  for (const message of messages) {
    const sender =
      parseSender(getHeader(message.headers, "From")) ||
      parseSender(getHeader(message.headers, "Sender"));
    if (!sender) continue;

    const listUnsubscribe = getHeader(message.headers, "List-Unsubscribe");
    const listId = getHeader(message.headers, "List-ID");
    const precedence = getHeader(message.headers, "Precedence");
    const autoSubmitted = getHeader(message.headers, "Auto-Submitted");
    const subject = getHeader(message.headers, "Subject");
    const key = sender.domain;
    const existing = grouped.get(key);
    const unsubscribeMethods = extractUnsubscribeMethods(listUnsubscribe);

    if (existing) {
      existing.messageCount += 1;
      existing.messageIds.push(message.id);
      existing.hasListUnsubscribe =
        existing.hasListUnsubscribe || Boolean(listUnsubscribe);
      existing.bulkHeaders =
        existing.bulkHeaders ||
        Boolean(listId || /bulk|list|auto/i.test(`${precedence} ${autoSubmitted}`));
      existing.unsubscribeMethods = [
        ...new Set([...existing.unsubscribeMethods, ...unsubscribeMethods]),
      ];
      existing.labelIds = [...new Set([...existing.labelIds, ...message.labelIds])];
      if (subject) existing.subjectHints?.push(subject);
      continue;
    }

    grouped.set(key, {
      senderDomain: sender.domain,
      senderEmail: sender.email,
      senderDisplayName: sender.displayName,
      messageCount: 1,
      hasListUnsubscribe: Boolean(listUnsubscribe),
      unsubscribeMethods,
      bulkHeaders: Boolean(
        listId || /bulk|list|auto/i.test(`${precedence} ${autoSubmitted}`),
      ),
      labelIds: message.labelIds,
      subjectHints: subject ? [subject] : [],
      allowlistedDomains,
      messageIds: [message.id],
    });
  }

  return [...grouped.values()];
}

function buildScanResult(
  scan: ScanRunWithCandidates,
  startedAt: string,
): ScanResult {
  const finishedAt = scan.finishedAt || nowIso();
  const durationMs = new Date(finishedAt).getTime() - new Date(startedAt).getTime();
  const durationSec = (durationMs / 1000).toFixed(1);

  const noisySenders: string[] = [];
  const reviewSenders: string[] = [];
  const protectedSenders: string[] = [];
  const proposedActions: ProposedActionItem[] = [];

  for (const candidate of scan.candidates) {
    if (candidate.protectedReason) {
      protectedSenders.push(candidate.senderDomain);
      continue;
    }
    if (candidate.classification === "UNKNOWN_REVIEW") {
      reviewSenders.push(candidate.senderDomain);
    } else if (
      candidate.classification === "PROMOTIONAL_HIGH_CONFIDENCE" ||
      candidate.classification === "NEWSLETTER_HIGH_CONFIDENCE"
    ) {
      noisySenders.push(candidate.senderDomain);
    }

    proposedActions.push({
      senderDomain: candidate.senderDomain,
      action: candidate.proposedAction,
      reason: candidate.reasons.join("; ") || candidate.classification,
    });
  }

  const confidence =
    scan.degraded || scan.status === "partial"
      ? "low"
      : scan.candidates.length > 5
        ? "high"
        : "medium";

  const totalMessages = scan.candidates.reduce(
    (sum, c) => sum + c.messageCount,
    0,
  );

  return {
    schemaVersion: "1.0.0",
    ok: scan.status !== "failed",
    resultId: scan.id,
    confidence,
    confidenceExplanation: scan.degraded
      ? "Scan completed in degraded mode due to Gmail API constraints."
      : `Analyzed ${totalMessages} messages from ${scan.candidateCount} senders.`,
    reasons: scan.degraded ? ["Scan was degraded"] : ["Full scan completed"],
    signals: {
      senderCount: scan.candidateCount,
      messageCount: scan.messageCount,
      scanDuration: `${durationSec}s`,
      degraded: scan.degraded,
    },
    evidence: scan.candidates
      .slice(0, 5)
      .map((c) => `${c.senderDomain}: score=${c.score} classification=${c.classification}`),
    limitations: scan.status === "partial"
      ? ["Scan was truncated; not all messages were included"]
      : [],
    degraded: scan.degraded,
    diagnosticsId: `diag_scan_${scan.id}`,
    noisySenders,
    reviewSenders,
    protectedSenders,
    proposedActions,
    filtersCreated: 0,
    unsubscribeAttempts: 0,
    undoAvailable: false,
  };
}

function buildNoisySenderSummaries(candidates: SenderCandidate[]): NoisySenderSummary[] {
  return candidates
    .filter(
      (c) =>
        !c.protectedReason &&
        (c.classification === "PROMOTIONAL_HIGH_CONFIDENCE" ||
          c.classification === "NEWSLETTER_HIGH_CONFIDENCE" ||
          c.classification === "UNKNOWN_REVIEW"),
    )
    .map((c) => ({
      senderDomain: c.senderDomain,
      senderDisplayName: c.senderDisplayName,
      messageCount: c.messageCount,
      classification: c.classification,
      score: c.score,
      protectedReason: c.protectedReason,
      proposedAction: c.proposedAction,
      hasUnsubscribeLink: c.unsubscribeMethods.length > 0,
    }));
}

export async function runScan({
  userId,
  gmail,
  store,
  query = defaultScanQuery,
  maxMessages = 250,
}: {
  userId: string;
  gmail: GmailClient;
  store: AppStore;
  query?: string;
  maxMessages?: number;
}): Promise<ScanRunWithCandidates> {
  const inFlight = getInFlightScan(userId);
  if (inFlight) {
    safeLogInfo("Scan deduplicated: in-flight scan reused", { userId });
    return inFlight as Promise<ScanRunWithCandidates>;
  }

  const breaker = getCircuitBreaker("gmail-api");

  const scanPromise = (async () => {
    const startedAt = nowIso();
    recordDiagnosticEvent(userId, "scan_started", { query, maxMessages });

    const scanRun = {
      id: newId("scan"),
      userId,
      status: "running" as const,
      query,
      messageCount: 0,
      candidateCount: 0,
      selectedCount: 0,
      skippedCount: 0,
      degraded: false,
      startedAt,
    };
    await store.createScanRun(scanRun);

    try {
      const allowlist = await store.listAllowlist(userId);

      let degraded = false;
      let messages: GmailMessageHeader[];

      try {
        messages = await breaker.execute(() => {
          countGmailApiCall();
          return gmail.listRecentMessageHeaders({ query, maxMessages });
        });
      } catch (error) {
        if (error instanceof AppError) {
          degraded = true;
          messages = [];
          recordDiagnosticEvent(userId, "partial_scan", {
            errorCode: error.code,
            error: error.message,
          });
        } else {
          throw error;
        }
      }

      recordScanSize(messages.length);

      const aggregates = aggregateMessages(messages, allowlist);
      const createdAt = nowIso();

      const candidates: SenderCandidate[] = aggregates.map((aggregate) => {
        const cacheKey = `${userId}:${aggregate.senderDomain}`;
        const cached = getSenderFromCache(cacheKey);
        if (cached) {
          return cached as SenderCandidate;
        }

        const result = classifySender(aggregate);

        if (result.protectedReason) {
          recordDiagnosticEvent(userId, "protected_sender_skipped", {
            senderDomain: aggregate.senderDomain,
            reason: result.protectedReason,
          });
        }

        const candidate: SenderCandidate = {
          id: newId("sender"),
          scanRunId: scanRun.id,
          userId,
          senderDomain: aggregate.senderDomain,
          senderEmailHash: aggregate.senderEmail
            ? hashPii(aggregate.senderEmail)
            : undefined,
          senderDisplayNameEncrypted: aggregate.senderDisplayName
            ? encryptSecret(aggregate.senderDisplayName)
            : undefined,
          senderDisplayName: aggregate.senderDisplayName,
          classification: result.classification,
          score: result.score,
          reasons: result.reasons,
          messageCount: aggregate.messageCount,
          proposedAction: result.proposedAction,
          selectedByDefault: result.selectedByDefault,
          unsubscribeMethods: aggregate.unsubscribeMethods,
          protectedReason: result.protectedReason,
          createdAt,
        };

        cacheSender(cacheKey, candidate);
        return candidate;
      });

      await store.saveCandidates(candidates);

      recordSenderCount(candidates.length);

      const completed: ScanRun = {
        ...scanRun,
        status: degraded ? "partial" : "completed",
        messageCount: messages.length,
        candidateCount: candidates.length,
        selectedCount: candidates.filter(
          (candidate) => candidate.selectedByDefault,
        ).length,
        skippedCount: candidates.filter(
          (candidate) => candidate.proposedAction === "SKIP",
        ).length,
        degraded,
        finishedAt: nowIso(),
      };
      await store.updateScanRun(completed);

      const scanResult = buildScanResult(
        { ...completed, candidates },
        startedAt,
      );
      safeLogInfo("Scan completed", {
        userId,
        scanId: completed.id,
        candidateCount: completed.candidateCount,
        degraded,
        duration: scanResult.signals.scanDuration,
      });

      recordDiagnosticEvent(
        userId,
        degraded ? "partial_scan" : "scan_completed",
        {
          scanId: completed.id,
          candidateCount: completed.candidateCount,
          messageCount: completed.messageCount,
        },
        degraded,
      );

      return { ...completed, candidates };
    } catch (error) {
      const appError =
        error instanceof AppError
          ? error
          : new AppError({
              code: "SCAN_FAILED",
              message: "Scan failed before actions were taken.",
              retryable: true,
              degraded: true,
              status: 502,
            });

      const failed = {
        ...scanRun,
        status: "failed" as const,
        degraded: true,
        errorCode: appError.code,
        finishedAt: nowIso(),
      };
      await store.updateScanRun(failed);

      safeLogWarn("Scan failed", { userId, scanId: scanRun.id, error: appError.code });
      recordDiagnosticEvent(userId, "scan_completed", {
        scanId: scanRun.id,
        error: appError.code,
        message: appError.message,
      }, true, { code: appError.code, message: appError.message });

      throw appError;
    }
  })();

  return registerInFlightScan(userId, scanPromise);
}

export { buildNoisySenderSummaries };
