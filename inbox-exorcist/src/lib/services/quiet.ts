import type {
  AuditEvent,
  GmailFilterRecord,
  QuietSummary,
  SenderAction,
  UnsubscribeAttempt,
} from "../domain.ts";
import { AppError } from "../errors.ts";
import type { GmailClient } from "../gmail/client.ts";
import { gmailMailtoUnsubscribeScope } from "../gmail/scopes.ts";
import { newId, nowIso } from "../ids.ts";
import type { AppStore } from "../storage/store.ts";
import { attemptHttpsUnsubscribe } from "../unsubscribe/engine.ts";
import { selectedQuietCandidates, skippedCandidateCount } from "./action-planner.ts";
import {
  safeLogInfo,
  recordDiagnosticEvent,
  countGmailApiCall,
  countAction,
  getCircuitBreaker,
  withIdempotency,
} from "../diagnostics/index.ts";

const quietLabelName = "InboxExorcist/Quieted";

export async function quietSenders({
  userId,
  scanRunId,
  candidateIds,
  gmail,
  store,
  grantedScopes,
  allowHttpsUnsubscribe = true,
  allowMailtoUnsubscribe = false,
}: {
  userId: string;
  scanRunId: string;
  candidateIds?: string[];
  gmail: GmailClient;
  store: AppStore;
  grantedScopes: string[];
  allowHttpsUnsubscribe?: boolean;
  allowMailtoUnsubscribe?: boolean;
}): Promise<QuietSummary> {
  return withIdempotency(
    `quiet:${userId}:${scanRunId}:${(candidateIds || []).sort().join(",")}`,
    () => executeQuietSenders({
      userId,
      scanRunId,
      candidateIds,
      gmail,
      store,
      grantedScopes,
      allowHttpsUnsubscribe,
      allowMailtoUnsubscribe,
    }),
  );
}

async function executeQuietSenders({
  userId,
  scanRunId,
  candidateIds,
  gmail,
  store,
  grantedScopes,
  allowHttpsUnsubscribe = true,
  allowMailtoUnsubscribe = false,
}: {
  userId: string;
  scanRunId: string;
  candidateIds?: string[];
  gmail: GmailClient;
  store: AppStore;
  grantedScopes: string[];
  allowHttpsUnsubscribe?: boolean;
  allowMailtoUnsubscribe?: boolean;
}): Promise<QuietSummary> {
  recordDiagnosticEvent(userId, "quiet_action_started", { scanRunId, candidateIds });

  const scan = await store.getScanRun(scanRunId, userId);
  if (!scan) {
    throw new AppError({
      code: "SCAN_NOT_FOUND",
      message: "That scan was not found for this user.",
      status: 404,
    });
  }

  const candidates = await store.listCandidates(scanRunId, userId);
  const selected = selectedQuietCandidates(candidates, candidateIds);
  const skippedForSafety = skippedCandidateCount(candidates, candidateIds);
  const warnings: QuietSummary["warnings"] = [];
  const actions: SenderAction[] = [];
  const filters: GmailFilterRecord[] = [];
  const attempts: UnsubscribeAttempt[] = [];
  const audits: AuditEvent[] = [];
  let messagesArchivedOrLabeled = 0;
  let failedFilters = 0;
  let unsubscribeAttemptsSent = 0;

  if (selected.length === 0) {
    recordDiagnosticEvent(userId, "quiet_action_completed", {
      scanRunId,
      selectedCount: 0,
      skippedForSafety,
    }, true);
    throw new AppError({
      code: "NO_SAFE_SENDERS_SELECTED",
      message: "No high-confidence safe senders were selected.",
      status: 400,
      degraded: true,
    });
  }

  const breaker = getCircuitBreaker("gmail-api");

  let labelId: string;
  try {
    const quietLabel = await breaker.execute(async () => {
      countGmailApiCall();
      return gmail.ensureLabel(quietLabelName);
    });
    labelId = quietLabel.id;
  } catch (error) {
    const code = error instanceof AppError ? error.code : "LABEL_CREATE_FAILED";
    recordDiagnosticEvent(userId, "quiet_action_partial", {
      scanRunId,
      error: code,
    }, true, { code: String(code), message: String(error) });
    warnings.push({
      ok: false,
      code: String(code),
      message: "Could not create the quiet label. Quiet action may still work.",
      retryable: true,
      degraded: true,
    });
    throw new AppError({
      code: "LABEL_CREATE_FAILED",
      message: "Could not create the quiet label.",
      retryable: true,
      degraded: true,
      status: 502,
    });
  }

  for (const candidate of selected) {
    const createdAt = nowIso();
    let action: SenderAction = {
      id: newId("action"),
      userId,
      scanRunId,
      candidateId: candidate.id,
      senderDomain: candidate.senderDomain,
      actionType: "quiet",
      result: "QUIETED_BY_FILTER",
      reversible: true,
      createdAt,
    };

    if (allowHttpsUnsubscribe && candidate.unsubscribeMethods.includes("https")) {
      const options = await gmail.getSenderUnsubscribeOptions(candidate.senderDomain);
      const httpsOption = options.find((option) => option.method === "https");
      if (httpsOption) {
        const result = await attemptHttpsUnsubscribe(httpsOption);
        const attempt: UnsubscribeAttempt = {
          id: newId("unsub"),
          userId,
          actionId: action.id,
          senderDomain: candidate.senderDomain,
          method: "https",
          result: result.result,
          errorCode: "code" in result ? result.code : undefined,
          createdAt,
        };
        attempts.push(attempt);
        if (result.result === "confirmed" || result.result === "attempted") {
          unsubscribeAttemptsSent += 1;
          action = { ...action, result: "UNSUBSCRIBED" };
        } else {
          warnings.push({
            ok: false,
            code: attempt.errorCode || "UNSUBSCRIBE_UNAVAILABLE",
            message: `Unsubscribe was not confirmed for ${candidate.senderDomain}; filter quieting still applied.`,
            retryable: false,
            degraded: true,
          });
        }
      }
    }

    if (
      allowMailtoUnsubscribe &&
      grantedScopes.includes(gmailMailtoUnsubscribeScope) &&
      candidate.unsubscribeMethods.includes("mailto")
    ) {
      attempts.push({
        id: newId("unsub"),
        userId,
        actionId: action.id,
        senderDomain: candidate.senderDomain,
        method: "mailto",
        result: "unavailable",
        errorCode: "MAILTO_UNSUBSCRIBE_NOT_ENABLED_IN_UI",
        createdAt,
      });
    }

    try {
      const filter = await breaker.execute(async () => {
        countGmailApiCall();
        return gmail.createQuietFilter({
          senderDomain: candidate.senderDomain,
          labelId,
        });
      });

      const messageIds = await breaker.execute(async () => {
        countGmailApiCall();
        return gmail.listMessageIdsForSender({
          senderDomain: candidate.senderDomain,
          maxMessages: 500,
        });
      });

      const modified = await breaker.execute(async () => {
        countGmailApiCall();
        return gmail.batchModifyMessages({
          messageIds,
          addLabelIds: [labelId],
          removeLabelIds: ["INBOX"],
        });
      });
      messagesArchivedOrLabeled += modified.modifiedCount;
      countAction();
      filters.push({
        id: newId("filter"),
        userId,
        actionId: action.id,
        senderDomain: candidate.senderDomain,
        gmailFilterId: filter.id,
        gmailLabelId: labelId,
        labelName: quietLabelName,
        createdAt,
      });
    } catch (error) {
      failedFilters += 1;
      action = {
        ...action,
        result: "FILTER_CREATION_FAILED",
        errorCode: error instanceof AppError ? error.code : "FILTER_CREATION_FAILED",
      };
      warnings.push({
        ok: false,
        code: action.errorCode || "FILTER_CREATION_FAILED",
        message: `Filter creation failed for ${candidate.senderDomain}.`,
        retryable: true,
        degraded: true,
      });
    }

    actions.push(action);
    audits.push({
      id: newId("audit"),
      userId,
      actor: "user",
      actionType: action.actionType,
      targetSenderDomain: candidate.senderDomain,
      result: action.result,
      errorCode: action.errorCode,
      reversibleIds: filters
        .filter((filter) => filter.actionId === action.id)
        .map((filter) => filter.gmailFilterId),
      createdAt,
    });
  }

  if (skippedForSafety > 0) {
    audits.push({
      id: newId("audit"),
      userId,
      actor: "system",
      actionType: "skip_protected_senders",
      result: "SKIPPED_FOR_SAFETY",
      createdAt: nowIso(),
    });
  }

  await store.recordActions({
    actions,
    filters,
    unsubscribeAttempts: attempts,
    auditEvents: audits,
  });

  const hasPartial = failedFilters > 0;
  recordDiagnosticEvent(
    userId,
    hasPartial ? "quiet_action_partial" : "quiet_action_completed",
    {
      scanRunId,
      quietedCount: actions.filter(
        (a) => a.result === "QUIETED_BY_FILTER" || a.result === "UNSUBSCRIBED",
      ).length,
      failedFilters,
      skippedForSafety,
    },
    hasPartial,
    hasPartial ? { code: "quiet_action_partial", message: `${failedFilters} filter(s) failed` } : undefined,
  );

  safeLogInfo("Quiet action completed", {
    userId,
    scanRunId,
    quietedCount: actions.filter(
      (a) => a.result === "QUIETED_BY_FILTER" || a.result === "UNSUBSCRIBED",
    ).length,
    failedFilters,
  });

  return {
    quietedSenders: actions.filter(
      (action) =>
        action.result === "QUIETED_BY_FILTER" || action.result === "UNSUBSCRIBED",
    ).length,
    messagesArchivedOrLabeled,
    filtersCreated: filters.length,
    unsubscribeAttemptsSent,
    skippedForSafety,
    failedFilters,
    warnings,
  };
}
