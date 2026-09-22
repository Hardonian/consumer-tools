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

type Json = Record<string, unknown>;

function baseHeaders() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  return {
    apikey: key,
    authorization: `Bearer ${key}`,
    "content-type": "application/json",
  };
}

function supabaseUrl(path: string) {
  const base = process.env.SUPABASE_URL;
  if (!base) {
    throw new Error("SUPABASE_URL is required");
  }
  return `${base.replace(/\/$/, "")}/rest/v1/${path}`;
}

function toSnake(value: string) {
  return value.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function snakeObject<T extends Json>(value: T) {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [toSnake(key), entry]),
  );
}

function camelObject<T>(value: Json): T {
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [
      key.replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase()),
      entry,
    ]),
  ) as T;
}

async function request<T>(
  table: string,
  {
    method = "GET",
    query = "",
    body,
    prefer,
  }: {
    method?: string;
    query?: string;
    body?: unknown;
    prefer?: string;
  } = {},
) {
  const response = await fetch(supabaseUrl(`${table}${query}`), {
    method,
    headers: {
      ...baseHeaders(),
      ...(prefer ? { prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Supabase ${table} ${method} failed with ${response.status}`);
  }

  if (response.status === 204) {
    return [] as T[];
  }

  return (await response.json()) as T[];
}

export class SupabaseRestStore implements AppStore {
  async health() {
    return { mode: "supabase" as const, degraded: false };
  }

  async upsertUser(userId: string) {
    await request("users", {
      method: "POST",
      prefer: "resolution=merge-duplicates",
      body: { id: userId, updated_at: new Date().toISOString() },
    });
  }

  async saveConnection(connection: GmailConnection) {
    await request("gmail_connections", {
      method: "POST",
      prefer: "resolution=merge-duplicates",
      body: snakeObject(connection as unknown as Json),
    });
  }

  async getConnection(userId: string) {
    const rows = await request<Json>("gmail_connections", {
      query: `?user_id=eq.${encodeURIComponent(userId)}&status=neq.disconnected&limit=1`,
    });
    return rows[0] ? camelObject<GmailConnection>(rows[0]) : null;
  }

  async deleteConnection(userId: string) {
    await request("gmail_connections", {
      method: "PATCH",
      query: `?user_id=eq.${encodeURIComponent(userId)}`,
      body: { status: "disconnected", updated_at: new Date().toISOString() },
    });
  }

  async createScanRun(scanRun: ScanRun) {
    await request("scan_runs", {
      method: "POST",
      body: snakeObject(scanRun as unknown as Json),
    });
  }

  async updateScanRun(scanRun: ScanRun) {
    await request("scan_runs", {
      method: "PATCH",
      query: `?id=eq.${encodeURIComponent(scanRun.id)}&user_id=eq.${encodeURIComponent(scanRun.userId)}`,
      body: snakeObject(scanRun as unknown as Json),
    });
  }

  async getScanRun(scanRunId: string, userId: string) {
    const rows = await request<Json>("scan_runs", {
      query: `?id=eq.${encodeURIComponent(scanRunId)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    });
    return rows[0] ? camelObject<ScanRun>(rows[0]) : null;
  }

  async saveCandidates(candidates: SenderCandidate[]) {
    if (candidates.length === 0) return;
    await request("sender_candidates", {
      method: "POST",
      body: candidates.map((candidate) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { senderDisplayName, ...rest } = candidate;
        return snakeObject(rest as unknown as Json);
      }),
    });
  }

  async listCandidates(scanRunId: string, userId: string) {
    const rows = await request<Json>("sender_candidates", {
      query: `?scan_run_id=eq.${encodeURIComponent(scanRunId)}&user_id=eq.${encodeURIComponent(userId)}&order=score.desc`,
    });
    return rows.map((row) => {
      const candidate = camelObject<SenderCandidate>(row);
      if (candidate.senderDisplayNameEncrypted) {
        try {
          candidate.senderDisplayName = decryptSecret(
            candidate.senderDisplayNameEncrypted,
          );
        } catch {
          // fallback to domain if decryption fails
        }
      }
      return candidate;
    });
  }

  async getCandidate(candidateId: string, userId: string) {
    const rows = await request<Json>("sender_candidates", {
      query: `?id=eq.${encodeURIComponent(candidateId)}&user_id=eq.${encodeURIComponent(userId)}&limit=1`,
    });
    if (!rows[0]) return null;
    const candidate = camelObject<SenderCandidate>(rows[0]);
    if (candidate.senderDisplayNameEncrypted) {
      try {
        candidate.senderDisplayName = decryptSecret(
          candidate.senderDisplayNameEncrypted,
        );
      } catch {
        // fallback
      }
    }
    return candidate;
  }

  async recordActions(input: {
    actions?: SenderAction[];
    filters?: GmailFilterRecord[];
    unsubscribeAttempts?: UnsubscribeAttempt[];
    auditEvents?: AuditEvent[];
  }) {
    if (input.actions?.length) {
      await request("sender_actions", {
        method: "POST",
        body: input.actions.map((action) => snakeObject(action as unknown as Json)),
      });
    }
    if (input.filters?.length) {
      await request("gmail_filters", {
        method: "POST",
        body: input.filters.map((filter) => snakeObject(filter as unknown as Json)),
      });
    }
    if (input.unsubscribeAttempts?.length) {
      await request("unsubscribe_attempts", {
        method: "POST",
        body: input.unsubscribeAttempts.map((attempt) =>
          snakeObject(attempt as unknown as Json),
        ),
      });
    }
    if (input.auditEvents?.length) {
      await request("audit_events", {
        method: "POST",
        body: input.auditEvents.map((event) => snakeObject(event as unknown as Json)),
      });
    }
  }

  async listActions(userId: string) {
    const rows = await request<Json>("sender_actions", {
      query: `?user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`,
    });
    return rows.map((row) => camelObject<SenderAction>(row));
  }

  async listFiltersByAction(actionId: string, userId: string) {
    const rows = await request<Json>("gmail_filters", {
      query: `?action_id=eq.${encodeURIComponent(actionId)}&user_id=eq.${encodeURIComponent(userId)}&deleted_at=is.null`,
    });
    return rows.map((row) => camelObject<GmailFilterRecord>(row));
  }

  async listActiveFilters(userId: string) {
    const rows = await request<Json>("gmail_filters", {
      query: `?user_id=eq.${encodeURIComponent(userId)}&deleted_at=is.null`,
    });
    return rows.map((row) => camelObject<GmailFilterRecord>(row));
  }

  async markFilterDeleted(filterRecordId: string, userId: string) {
    await request("gmail_filters", {
      method: "PATCH",
      query: `?id=eq.${encodeURIComponent(filterRecordId)}&user_id=eq.${encodeURIComponent(userId)}`,
      body: { deleted_at: new Date().toISOString() },
    });
  }

  async listAllowlist(userId: string) {
    const rows = await request<{ domain: string }>("user_allowlist", {
      query: `?user_id=eq.${encodeURIComponent(userId)}&select=domain`,
    });
    return rows.map((row) => row.domain);
  }

  async addAllowlist(userId: string, domain: string) {
    await request("user_allowlist", {
      method: "POST",
      prefer: "resolution=merge-duplicates",
      body: {
        user_id: userId,
        domain: domain.toLowerCase().trim(),
        created_at: new Date().toISOString(),
      },
    });
  }

  async removeAllowlist(userId: string, domain: string) {
    await request("user_allowlist", {
      method: "DELETE",
      query: `?user_id=eq.${encodeURIComponent(userId)}&domain=eq.${encodeURIComponent(domain.toLowerCase().trim())}`,
    });
  }

  async listBlocklist(userId: string) {
    const rows = await request<{ domain: string }>("user_blocklist", {
      query: `?user_id=eq.${encodeURIComponent(userId)}&select=domain`,
    });
    return rows.map((row) => row.domain);
  }

  async deleteUserData(userId: string) {
    const query = `?user_id=eq.${encodeURIComponent(userId)}`;
    for (const table of [
      "audit_events",
      "unsubscribe_attempts",
      "gmail_filters",
      "sender_actions",
      "sender_candidates",
      "scan_runs",
      "gmail_connections",
      "user_allowlist",
      "user_blocklist",
    ]) {
      await request(table, { method: "DELETE", query });
    }
    await request("users", {
      method: "PATCH",
      query: `?id=eq.${encodeURIComponent(userId)}`,
      body: { deleted_at: new Date().toISOString() },
    });
  }
}
