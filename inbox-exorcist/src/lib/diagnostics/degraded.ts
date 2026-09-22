import type { ApiErrorEnvelope } from "../domain.ts";

export type DegradedState =
  | "full"
  | "oauth_degraded"
  | "scan_degraded"
  | "action_degraded"
  | "storage_degraded"
  | "gmail_api_degraded";

export const DEGRADED_STATE_MESSAGES: Record<DegradedState, string> = {
  full: "All services are operational.",
  oauth_degraded: "OAuth is partially functional. Some features may be unavailable.",
  scan_degraded: "Scanning is running in degraded mode. Results may be incomplete.",
  action_degraded: "Some actions may not complete. Results are being tracked best-effort.",
  storage_degraded: "Storage is degraded. Data may not persist across sessions.",
  gmail_api_degraded: "Gmail API access is limited. Retry after a short wait.",
};

export function isDegraded(state: DegradedState): boolean {
  return state !== "full";
}

export function createDegradedEnvelope(
  state: DegradedState,
  details?: Record<string, unknown>,
): { degraded: boolean; state: DegradedState; message: string; details?: Record<string, unknown> } {
  return {
    degraded: isDegraded(state),
    state,
    message: DEGRADED_STATE_MESSAGES[state],
    ...(details ? { details } : {}),
  };
}

export function degradedWarnings(warningCodes: string[]): ApiErrorEnvelope[] {
  return warningCodes.map((code) => ({
    ok: false,
    code,
    message: DEGRADED_STATE_MESSAGES[code as DegradedState] || `Degraded: ${code}`,
    retryable: true,
    degraded: true,
  }));
}
