import type { AuditEvent, SenderAction } from "../domain.ts";
import { AppError } from "../errors.ts";
import type { GmailClient } from "../gmail/client.ts";
import { newId, nowIso } from "../ids.ts";
import type { AppStore } from "../storage/store.ts";
import {
  safeLogInfo,
  safeLogWarn,
  recordDiagnosticEvent,
  countGmailApiCall,
  countAction,
  getCircuitBreaker,
  withIdempotency,
} from "../diagnostics/index.ts";

export async function undoActions({
  userId,
  actionIds,
  gmail,
  store,
}: {
  userId: string;
  actionIds?: string[];
  gmail: GmailClient;
  store: AppStore;
}) {
  return withIdempotency(
    `undo:${userId}:${(actionIds || []).sort().join(",")}`,
    () => executeUndoActions({ userId, actionIds, gmail, store }),
  );
}

async function executeUndoActions({
  userId,
  actionIds,
  gmail,
  store,
}: {
  userId: string;
  actionIds?: string[];
  gmail: GmailClient;
  store: AppStore;
}) {
  recordDiagnosticEvent(userId, "undo_started", {
    actionIds,
    count: actionIds ? actionIds.length : "all",
  });

  const actions = await store.listActions(userId);
  const selected = actionIds?.length
    ? actions.filter((action) => actionIds.includes(action.id))
    : actions.filter((action) => action.reversible).slice(0, 25);

  if (selected.length === 0) {
    recordDiagnosticEvent(userId, "undo_completed", {
      removedFilters: 0,
      failures: 0,
    }, true, { code: "NO_REVERSIBLE_ACTIONS", message: "No reversible actions found" });
    throw new AppError({
      code: "NO_REVERSIBLE_ACTIONS",
      message: "No reversible InboxExorcist actions were found.",
      status: 404,
    });
  }

  const breaker = getCircuitBreaker("gmail-api");

  let removedFilters = 0;
  const failures: string[] = [];
  const undoActionsToRecord: SenderAction[] = [];
  const audits: AuditEvent[] = [];

  for (const action of selected) {
    const filters = await store.listFiltersByAction(action.id, userId);
    for (const filter of filters) {
      try {
        await breaker.execute(async () => {
          countGmailApiCall();
          return gmail.deleteFilter(filter.gmailFilterId);
        });
        await store.markFilterDeleted(filter.id, userId);
        removedFilters += 1;
        countAction();
      } catch {
        failures.push(filter.senderDomain);
      }
    }

    const createdAt = nowIso();
    const undoAction: SenderAction = {
      id: newId("action"),
      userId,
      scanRunId: action.scanRunId,
      senderDomain: action.senderDomain,
      actionType: "undo",
      result: failures.length ? "UNDO_PARTIAL" : "UNDO_COMPLETED",
      reversible: false,
      errorCode: failures.length ? "UNDO_PARTIALLY_COMPLETED" : undefined,
      createdAt,
    };
    undoActionsToRecord.push(undoAction);
    audits.push({
      id: newId("audit"),
      userId,
      actor: "user",
      actionType: "undo",
      targetSenderDomain: action.senderDomain,
      result: undoAction.result,
      errorCode: undoAction.errorCode,
      createdAt,
    });
  }

  await store.recordActions({ actions: undoActionsToRecord, auditEvents: audits });

  const hasPartial = failures.length > 0;
  recordDiagnosticEvent(
    userId,
    hasPartial ? "undo_partial" : "undo_completed",
    {
      removedFilters,
      failureCount: failures.length,
      failedSenders: failures,
    },
    hasPartial,
    hasPartial ? { code: "undo_partial_failure", message: `${failures.length} filter(s) could not be removed` } : undefined,
  );

  if (hasPartial) {
    safeLogWarn("Undo completed partially", {
      userId,
      removedFilters,
      failures,
    });
  } else {
    safeLogInfo("Undo completed successfully", {
      userId,
      removedFilters,
    });
  }

  return {
    removedFilters,
    failures,
    result: failures.length ? "UNDO_PARTIAL" : "UNDO_COMPLETED",
  };
}
