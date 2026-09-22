import type {
  AuditEvent,
  GmailConnection,
  GmailFilterRecord,
  ScanRun,
  SenderAction,
  SenderCandidate,
  UnsubscribeAttempt,
} from "../domain.ts";
import { decryptSecret } from "../security/crypto.ts";
import type { AppStore } from "./store.ts";

type MemoryData = {
  users: Set<string>;
  connections: Map<string, GmailConnection>;
  scans: Map<string, ScanRun>;
  candidates: Map<string, SenderCandidate>;
  actions: Map<string, SenderAction>;
  filters: Map<string, GmailFilterRecord>;
  unsubscribeAttempts: Map<string, UnsubscribeAttempt>;
  auditEvents: Map<string, AuditEvent>;
  allowlist: Map<string, Set<string>>;
  blocklist: Map<string, Set<string>>;
};

const globalStore = globalThis as typeof globalThis & {
  __inboxExorcistMemoryStore?: MemoryData;
};

function data(): MemoryData {
  if (!globalStore.__inboxExorcistMemoryStore) {
    globalStore.__inboxExorcistMemoryStore = {
      users: new Set(),
      connections: new Map(),
      scans: new Map(),
      candidates: new Map(),
      actions: new Map(),
      filters: new Map(),
      unsubscribeAttempts: new Map(),
      auditEvents: new Map(),
      allowlist: new Map(),
      blocklist: new Map(),
    };
  }
  return globalStore.__inboxExorcistMemoryStore;
}

export class MemoryStore implements AppStore {
  async health() {
    return { mode: "memory" as const, degraded: true };
  }

  async upsertUser(userId: string) {
    data().users.add(userId);
  }

  async saveConnection(connection: GmailConnection) {
    data().connections.set(connection.userId, connection);
  }

  async getConnection(userId: string) {
    return data().connections.get(userId) || null;
  }

  async deleteConnection(userId: string) {
    data().connections.delete(userId);
  }

  async createScanRun(scanRun: ScanRun) {
    data().scans.set(scanRun.id, scanRun);
  }

  async updateScanRun(scanRun: ScanRun) {
    data().scans.set(scanRun.id, scanRun);
  }

  async getScanRun(scanRunId: string, userId: string) {
    const scan = data().scans.get(scanRunId);
    return scan?.userId === userId ? scan : null;
  }

  async saveCandidates(candidates: SenderCandidate[]) {
    for (const candidate of candidates) {
      data().candidates.set(candidate.id, candidate);
    }
  }

  async listCandidates(scanRunId: string, userId: string) {
    return [...data().candidates.values()]
      .filter((candidate) => candidate.scanRunId === scanRunId && candidate.userId === userId)
      .map((candidate) => {
        if (candidate.senderDisplayNameEncrypted && !candidate.senderDisplayName) {
          try {
            candidate.senderDisplayName = decryptSecret(candidate.senderDisplayNameEncrypted);
          } catch {
            // fallback
          }
        }
        return candidate;
      });
  }

  async getCandidate(candidateId: string, userId: string) {
    const candidate = data().candidates.get(candidateId);
    if (candidate?.userId === userId) {
      if (candidate.senderDisplayNameEncrypted && !candidate.senderDisplayName) {
        try {
          candidate.senderDisplayName = decryptSecret(candidate.senderDisplayNameEncrypted);
        } catch {
          // fallback
        }
      }
      return candidate;
    }
    return null;
  }

  async recordActions(input: {
    actions?: SenderAction[];
    filters?: GmailFilterRecord[];
    unsubscribeAttempts?: UnsubscribeAttempt[];
    auditEvents?: AuditEvent[];
  }) {
    for (const action of input.actions || []) {
      data().actions.set(action.id, action);
    }
    for (const filter of input.filters || []) {
      data().filters.set(filter.id, filter);
    }
    for (const attempt of input.unsubscribeAttempts || []) {
      data().unsubscribeAttempts.set(attempt.id, attempt);
    }
    for (const event of input.auditEvents || []) {
      data().auditEvents.set(event.id, event);
    }
  }

  async listActions(userId: string) {
    return [...data().actions.values()]
      .filter((action) => action.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async listFiltersByAction(actionId: string, userId: string) {
    return [...data().filters.values()].filter(
      (filter) =>
        filter.actionId === actionId &&
        filter.userId === userId &&
        !filter.deletedAt,
    );
  }

  async listActiveFilters(userId: string) {
    return [...data().filters.values()].filter(
      (filter) => filter.userId === userId && !filter.deletedAt,
    );
  }

  async markFilterDeleted(filterRecordId: string, userId: string) {
    const filter = data().filters.get(filterRecordId);
    if (filter?.userId === userId) {
      data().filters.set(filterRecordId, {
        ...filter,
        deletedAt: new Date().toISOString(),
      });
    }
  }

  async listAllowlist(userId: string) {
    return [...(data().allowlist.get(userId) || new Set<string>())];
  }

  async addAllowlist(userId: string, domain: string) {
    const list = data().allowlist.get(userId) || new Set<string>();
    list.add(domain.toLowerCase().trim());
    data().allowlist.set(userId, list);
  }

  async removeAllowlist(userId: string, domain: string) {
    const list = data().allowlist.get(userId);
    if (list) {
      list.delete(domain.toLowerCase().trim());
    }
  }

  async listBlocklist(userId: string) {
    return [...(data().blocklist.get(userId) || new Set<string>())];
  }

  async deleteUserData(userId: string) {
    data().users.delete(userId);
    data().connections.delete(userId);
    for (const [id, scan] of data().scans.entries()) {
      if (scan.userId === userId) data().scans.delete(id);
    }
    for (const [id, candidate] of data().candidates.entries()) {
      if (candidate.userId === userId) data().candidates.delete(id);
    }
    for (const [id, action] of data().actions.entries()) {
      if (action.userId === userId) data().actions.delete(id);
    }
    for (const [id, filter] of data().filters.entries()) {
      if (filter.userId === userId) data().filters.delete(id);
    }
    for (const [id, attempt] of data().unsubscribeAttempts.entries()) {
      if (attempt.userId === userId) data().unsubscribeAttempts.delete(id);
    }
    for (const [id, event] of data().auditEvents.entries()) {
      if (event.userId === userId) data().auditEvents.delete(id);
    }
    data().allowlist.delete(userId);
    data().blocklist.delete(userId);
  }
}

export function resetMemoryStoreForTests() {
  delete globalStore.__inboxExorcistMemoryStore;
}
