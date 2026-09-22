import type {
  AuditEvent,
  GmailConnection,
  GmailFilterRecord,
  ScanRun,
  SenderAction,
  SenderCandidate,
  UnsubscribeAttempt,
} from "../domain.ts";

export type AppStore = {
  health(): Promise<{ mode: "memory" | "supabase"; degraded: boolean }>;
  upsertUser(userId: string): Promise<void>;
  saveConnection(connection: GmailConnection): Promise<void>;
  getConnection(userId: string): Promise<GmailConnection | null>;
  deleteConnection(userId: string): Promise<void>;
  createScanRun(scanRun: ScanRun): Promise<void>;
  updateScanRun(scanRun: ScanRun): Promise<void>;
  getScanRun(scanRunId: string, userId: string): Promise<ScanRun | null>;
  saveCandidates(candidates: SenderCandidate[]): Promise<void>;
  listCandidates(scanRunId: string, userId: string): Promise<SenderCandidate[]>;
  getCandidate(candidateId: string, userId: string): Promise<SenderCandidate | null>;
  recordActions(input: {
    actions?: SenderAction[];
    filters?: GmailFilterRecord[];
    unsubscribeAttempts?: UnsubscribeAttempt[];
    auditEvents?: AuditEvent[];
  }): Promise<void>;
  listActions(userId: string): Promise<SenderAction[]>;
  listFiltersByAction(actionId: string, userId: string): Promise<GmailFilterRecord[]>;
  listActiveFilters(userId: string): Promise<GmailFilterRecord[]>;
  markFilterDeleted(filterRecordId: string, userId: string): Promise<void>;
  listAllowlist(userId: string): Promise<string[]>;
  addAllowlist(userId: string, domain: string): Promise<void>;
  removeAllowlist(userId: string, domain: string): Promise<void>;
  listBlocklist(userId: string): Promise<string[]>;
  deleteUserData(userId: string): Promise<void>;
};
