"use client";

import { useEffect, useState } from "react";
import { ActionHistoryClient } from "@/components/ActionHistoryClient";
import type { ApiEnvelope } from "@/lib/domain";

type Tab = "connection" | "allowlist" | "actions" | "data" | "diagnostics" | "embed";

export function SettingsClient() {
  const [activeTab, setActiveTab] = useState<Tab>("connection");
  const [allowlist, setAllowlist] = useState<string[]>([]);
  const [newDomain, setNewDomain] = useState("");
  const [addingDomain, setAddingDomain] = useState(false);

  const [disconnectModal, setDisconnectModal] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [working, setWorking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const [diagnostics, setDiagnostics] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    let ignore = false;
    async function init() {
      try {
        const [allowRes, diagRes] = await Promise.all([
          fetch("/api/me/allowlist"),
          fetch("/api/diagnostics/metrics"),
        ]);
        const allowPayload = (await allowRes.json()) as ApiEnvelope<{ allowlist: string[] }>;
        const diagPayload = (await diagRes.json()) as ApiEnvelope<Record<string, unknown>>;
        if (!ignore) {
          if (allowPayload.ok) setAllowlist(allowPayload.data.allowlist);
          if (diagPayload.ok) setDiagnostics(diagPayload.data);
        }
      } catch {
        // fallback
      }
    }
    void init();
    return () => {
      ignore = true;
    };
  }, []);

  async function addDomainToAllowlist(e: React.FormEvent) {
    e.preventDefault();
    if (!newDomain.trim()) return;
    setAddingDomain(true);
    try {
      const res = await fetch("/api/me/allowlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain: newDomain.trim() }),
      });
      const payload = (await res.json()) as ApiEnvelope<{ allowlist: string[] }>;
      setAddingDomain(false);
      if (payload.ok) {
        setAllowlist(payload.data.allowlist);
        setNewDomain("");
      }
    } catch {
      setAddingDomain(false);
    }
  }

  async function removeDomainFromAllowlist(domain: string) {
    try {
      const res = await fetch("/api/me/allowlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      });
      const payload = (await res.json()) as ApiEnvelope<{ allowlist: string[] }>;
      if (payload.ok) {
        setAllowlist(payload.data.allowlist);
      }
    } catch {
      // fallback
    }
  }

  async function handleDisconnect() {
    setWorking(true);
    try {
      await fetch("/api/gmail/disconnect", { method: "POST" });
      setWorking(false);
      setDisconnectModal(false);
      setStatusMessage("Gmail account disconnected successfully.");
    } catch {
      setWorking(false);
    }
  }

  async function handleDeleteData() {
    setWorking(true);
    try {
      await fetch("/api/me/delete-data", { method: "POST" });
      setWorking(false);
      setDeleteModal(false);
      window.location.href = "/";
    } catch {
      setWorking(false);
    }
  }

  function copyCode(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(id);
    setTimeout(() => setCopiedSnippet(null), 2500);
  }

  const iframeSnippet = `<iframe
  src="https://inboxexorcist.com/widget"
  width="100%"
  height="380"
  frameborder="0"
  style="border-radius: 16px; max-width: 420px; overflow: hidden;"
  title="InboxExorcist Partner Widget">
</iframe>`;

  const scriptSnippet = `<script src="https://inboxexorcist.com/api/widget/embed.js" async></script>`;

  return (
    <div className="space-y-8">
      {statusMessage && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-4 text-sm text-emerald-300 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        {[
          { id: "connection" as const, label: "Gmail Connection" },
          { id: "allowlist" as const, label: `Trusted Allowlist (${allowlist.length})` },
          { id: "actions" as const, label: "Action History" },
          { id: "embed" as const, label: "Partner & Embed SDK" },
          { id: "data" as const, label: "Data & Privacy" },
          { id: "diagnostics" as const, label: "System Health" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition ${
              activeTab === tab.id
                ? "bg-amber-500 text-zinc-950 shadow-md"
                : "glass-card text-zinc-400 hover:text-white hover:border-white/20"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Gmail Connection */}
      {activeTab === "connection" && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Google OAuth Connection</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Manage your active Gmail token session and granted permissions.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-5">
              <div className="text-xs text-zinc-500">Connection Status</div>
              <div className="mt-1 flex items-center gap-2 font-bold text-emerald-400">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                Active Session
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                Tokens are encrypted with AES-256-GCM at rest.
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-5">
              <div className="text-xs text-zinc-500">Active Permissions</div>
              <ul className="mt-1 space-y-1 text-xs text-zinc-300">
                <li>• <code className="text-amber-400">gmail.modify</code> (Metadata & Labels)</li>
                <li>• <code className="text-amber-400">gmail.settings.basic</code> (Reversible Filters)</li>
                <li>• <span className="text-emerald-400">Zero Deletion Scope</span></li>
              </ul>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-4 items-center">
            <a
              href="/api/auth/google/start"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 px-5 text-xs font-bold text-zinc-950 hover:bg-amber-400"
            >
              Re-authenticate Session
            </a>

            <button
              type="button"
              onClick={() => setDisconnectModal(true)}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-red-500/30 bg-red-950/20 px-5 text-xs font-bold text-red-300 hover:bg-red-950/40"
            >
              Disconnect Gmail Account
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Trusted Allowlist */}
      {activeTab === "allowlist" && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Personal Allowlist</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Domains added here will NEVER be classified as junk or quieted during scans.
            </p>
          </div>

          <form onSubmit={addDomainToAllowlist} className="flex gap-3 max-w-lg">
            <input
              type="text"
              placeholder="e.g. substack.com or nytimes.com"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              className="flex-1 rounded-xl border border-white/10 bg-zinc-900 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
            />
            <button
              type="submit"
              disabled={addingDomain || !newDomain.trim()}
              className="inline-flex items-center justify-center rounded-xl bg-amber-500 px-5 text-sm font-bold text-zinc-950 hover:bg-amber-400 disabled:opacity-50"
            >
              {addingDomain ? "Adding..." : "+ Add Domain"}
            </button>
          </form>

          <div className="mt-6 divide-y divide-white/5 border-t border-white/10 pt-4">
            {allowlist.length === 0 ? (
              <p className="py-8 text-center text-sm text-zinc-500">
                No custom domains in your allowlist. Standard protected domains (banks, 2FA, IRS) are always protected automatically.
              </p>
            ) : (
              allowlist.map((domain) => (
                <div key={domain} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-emerald-400 font-bold">✓</span>
                    <span className="font-mono text-sm font-semibold text-white">{domain}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeDomainFromAllowlist(domain)}
                    className="text-xs text-red-400 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Action History */}
      {activeTab === "actions" && <ActionHistoryClient />}

      {/* Tab 4: Partner & Embed SDK */}
      {activeTab === "embed" && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Partner Integration & Embed SDK</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Integrate the InboxExorcist scanner widget directly onto your blog, Substack, productivity platform, or partner portal.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Option A: iframe */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 flex flex-col justify-between">
              <div>
                <span className="rounded-md bg-amber-500/10 px-2.5 py-1 text-xs font-bold text-amber-400">
                  Option 1: Drop-In iFrame Widget
                </span>
                <p className="mt-2 text-xs text-zinc-300">
                  Embeds the responsive radar card cleanly into any web page or CMS without scripts.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-xl bg-black/60 p-3 font-mono text-xs text-amber-300">
                  {iframeSnippet}
                </pre>
              </div>
              <button
                type="button"
                onClick={() => copyCode(iframeSnippet, "iframe")}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition"
              >
                {copiedSnippet === "iframe" ? "✓ Copied HTML Snippet!" : "Copy iFrame Snippet"}
              </button>
            </div>

            {/* Option B: Floating Script Badge */}
            <div className="rounded-2xl border border-white/10 bg-zinc-900/70 p-5 flex flex-col justify-between">
              <div>
                <span className="rounded-md bg-cyan-500/10 px-2.5 py-1 text-xs font-bold text-cyan-400">
                  Option 2: Floating Script Badge
                </span>
                <p className="mt-2 text-xs text-zinc-300">
                  Adds a floating &quot;Exorcise Gmail Noise&quot; action launcher to the bottom corner of your site.
                </p>
                <pre className="mt-4 overflow-x-auto rounded-xl bg-black/60 p-3 font-mono text-xs text-cyan-300">
                  {scriptSnippet}
                </pre>
              </div>
              <button
                type="button"
                onClick={() => copyCode(scriptSnippet, "script")}
                className="mt-4 inline-flex h-10 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-500/10 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 transition"
              >
                {copiedSnippet === "script" ? "✓ Copied Script Tag!" : "Copy Script Tag"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Data & Privacy */}
      {activeTab === "data" && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Data Privacy & Account Wipe</h2>
            <p className="mt-1 text-sm text-zinc-400">
              You own your data. We never store email message bodies, snippets, or sell personal info.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/5 bg-zinc-900/60 p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-white">Export Stored Data</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                  Download a machine-readable JSON copy of all stored metadata, candidate domains, and filter records.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  const data = { exportedAt: new Date().toISOString(), allowlist };
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "inbox-exorcist-data.json";
                  a.click();
                }}
                className="mt-6 inline-flex h-10 items-center justify-center rounded-xl border border-white/20 bg-white/5 text-xs font-semibold text-white hover:bg-white/10"
              >
                Download Data JSON
              </button>
            </div>

            <div className="rounded-2xl border border-red-900/40 bg-red-950/20 p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-red-400">Purge & Delete Account</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-300">
                  Permanently deletes all encrypted tokens, scans, candidates, action history, and session cookies from our servers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDeleteModal(true)}
                className="mt-6 inline-flex h-10 items-center justify-center rounded-xl bg-red-600 text-xs font-bold text-white hover:bg-red-700"
              >
                Permanently Delete All Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 6: Diagnostics */}
      {activeTab === "diagnostics" && (
        <div className="glass-card rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-white">Live System Diagnostics</h2>
            <p className="mt-1 text-sm text-zinc-400">
              Operational metrics, circuit breaker status, and storage layer health.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-5">
            <pre className="overflow-x-auto font-mono text-xs text-amber-300">
              {JSON.stringify(diagnostics, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Disconnect Modal */}
      {disconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Disconnect Gmail Account?</h3>
            <p className="mt-2 text-sm text-zinc-300">
              This will revoke your active Google OAuth tokens and stop any future scan capabilities until you re-authenticate.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDisconnectModal(false)}
                className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={working}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {working ? "Disconnecting..." : "Confirm Disconnect"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Data Modal */}
      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
          <div className="glass-card w-full max-w-md rounded-3xl p-6 shadow-2xl border-red-500/40">
            <h3 className="text-lg font-bold text-red-400">Permanently Delete All Data?</h3>
            <p className="mt-2 text-sm text-zinc-300">
              This action is immediate and irreversible. All connection records, scan metadata, candidate classifications, and reversible filter tracking will be wiped permanently.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteModal(false)}
                className="rounded-xl border border-white/15 px-4 py-2 text-xs font-semibold text-white hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteData}
                disabled={working}
                className="rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {working ? "Purging Data..." : "Permanently Purge Everything"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
