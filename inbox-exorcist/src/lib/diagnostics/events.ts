export const DIAGNOSTIC_EVENTS = [
  "oauth_started",
  "oauth_completed",
  "oauth_failed",
  "scan_started",
  "scan_completed",
  "partial_scan",
  "preview_viewed",
  "quiet_action_started",
  "quiet_action_completed",
  "quiet_action_partial",
  "undo_started",
  "undo_completed",
  "undo_partial",
  "disconnect_clicked",
  "data_delete_requested",
  "protected_sender_skipped",
  "gmail_quota_limited",
] as const;

export type DiagnosticEventType = (typeof DIAGNOSTIC_EVENTS)[number];

export type DiagnosticEvent = {
  id: string;
  userId: string;
  type: DiagnosticEventType;
  timestamp: string;
  metadata: Record<string, unknown>;
  degraded: boolean;
  error?: {
    code: string;
    message: string;
  };
};

let eventSink: ((event: DiagnosticEvent) => void) | null = null;

export function setDiagnosticEventSink(sink: (event: DiagnosticEvent) => void) {
  eventSink = sink;
}

export function emitDiagnosticEvent(event: DiagnosticEvent) {
  if (eventSink) {
    eventSink(event);
  }
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[DIAGNOSTIC] ${event.type} userId=${event.userId.substring(0, 10)}... degraded=${event.degraded}`);
  }
}

export function createDiagnosticEvent(
  userId: string,
  type: DiagnosticEventType,
  metadata: Record<string, unknown> = {},
  degraded = false,
  error?: { code: string; message: string },
): DiagnosticEvent {
  const id = `diag_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  return {
    id,
    userId,
    type,
    timestamp: new Date().toISOString(),
    metadata,
    degraded,
    error,
  };
}

export function recordDiagnosticEvent(
  userId: string,
  type: DiagnosticEventType,
  metadata: Record<string, unknown> = {},
  degraded = false,
  error?: { code: string; message: string },
) {
  const event = createDiagnosticEvent(userId, type, metadata, degraded, error);
  emitDiagnosticEvent(event);
  return event;
}
