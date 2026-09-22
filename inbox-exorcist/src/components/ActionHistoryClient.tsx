"use client";

import { useEffect, useState } from "react";
import type { ApiEnvelope, SenderAction } from "@/lib/domain";

export function ActionHistoryClient() {
  const [actions, setActions] = useState<SenderAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [undoingId, setUndoingId] = useState<string | null>(null);
  const [undoingAll, setUndoingAll] = useState(false);

  async function load() {
    try {
      const response = await fetch("/api/me/actions");
      const payload = (await response.json()) as ApiEnvelope<{ actions: SenderAction[] }>;
      if (!payload.ok) {
        setError(`${payload.message} (${payload.code})`);
        return;
      }
      setActions(payload.data.actions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load actions");
    }
  }

  async function undoSpecific(actionId: string) {
    setUndoingId(actionId);
    setError(null);
    try {
      const response = await fetch("/api/gmail/actions/undo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ actionIds: [actionId] }),
      });
      const payload = (await response.json()) as ApiEnvelope<unknown>;
      setUndoingId(null);
      if (!payload.ok) {
        setError(`${payload.message} (${payload.code})`);
        return;
      }
      await load();
    } catch (err) {
      setUndoingId(null);
      setError(err instanceof Error ? err.message : "Failed to undo action");
    }
  }

  async function undoAll() {
    setUndoingAll(true);
    setError(null);
    try {
      const response = await fetch("/api/gmail/actions/undo", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const payload = (await response.json()) as ApiEnvelope<unknown>;
      setUndoingAll(false);
      if (!payload.ok) {
        setError(`${payload.message} (${payload.code})`);
        return;
      }
      await load();
    } catch (err) {
      setUndoingAll(false);
      setError(err instanceof Error ? err.message : "Failed to undo actions");
    }
  }

  function exportAuditReceipt() {
    const exportData = {
      exportedAt: new Date().toISOString(),
      service: "InboxExorcist",
      totalActions: actions.length,
      actions: actions.map((a) => ({
        domain: a.senderDomain,
        actionType: a.actionType,
        result: a.result,
        reversible: a.reversible,
        timestamp: a.createdAt,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inbox-exorcist-audit-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    let ignore = false;
    void (async () => {
      if (!ignore) {
        await load();
      }
    })();
    return () => {
      ignore = true;
    };
  }, []);

  const reversibleCount = actions.filter((a) => a.reversible).length;

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-white/10 pb-6">
        <div>
          <h2 className="text-2xl font-bold text-white">Reversible Action Log</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Every filter created by InboxExorcist can be reversed with one click.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportAuditReceipt}
            disabled={actions.length === 0}
            className="h-10 rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            📥 Export Proof Receipt
          </button>

          <button
            type="button"
            onClick={undoAll}
            disabled={undoingAll || reversibleCount === 0}
            className="h-10 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 text-xs font-bold text-amber-300 transition hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {undoingAll ? "Undoing All..." : `Undo All Active (${reversibleCount})`}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-500/30 bg-red-950/20 p-4 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="mt-6 divide-y divide-white/5">
        {actions.length === 0 ? (
          <div className="py-12 text-center text-sm text-zinc-500">
            No quieting actions recorded yet.
          </div>
        ) : (
          actions.map((action) => {
            const isUndoing = undoingId === action.id;
            return (
              <div
                key={action.id}
                className="grid gap-3 py-4 text-sm sm:grid-cols-[1fr_160px_170px_100px] sm:items-center"
              >
                <div>
                  <div className="font-semibold text-white font-mono">{action.senderDomain}</div>
                  <div className="text-xs text-zinc-400 capitalize">{action.actionType.replace("_", " ")}</div>
                </div>

                <div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      action.result === "QUIETED_BY_FILTER"
                        ? "bg-amber-500/20 text-amber-300"
                        : action.result === "UNSUBSCRIBED"
                          ? "bg-cyan-500/20 text-cyan-300"
                          : action.result === "UNDO_COMPLETED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {action.result.replace(/_/g, " ")}
                  </span>
                </div>

                <div className="font-mono text-xs text-zinc-500">
                  {new Date(action.createdAt).toLocaleDateString()}{" "}
                  {new Date(action.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </div>

                <div className="flex justify-end">
                  {action.reversible ? (
                    <button
                      type="button"
                      onClick={() => undoSpecific(action.id)}
                      disabled={isUndoing}
                      className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
                    >
                      {isUndoing ? "Undoing..." : "Undo"}
                    </button>
                  ) : (
                    <span className="text-xs text-zinc-600">Reversed</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
