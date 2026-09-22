"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { classifyDemonArchetype } from "@/lib/intelligence/archetypes";
import { ritualAudio } from "@/lib/audio/ritual-audio";
import { KeyboardShortcutsModal } from "@/components/KeyboardShortcutsModal";
import type {
  ApiEnvelope,
  QuietSummary,
  ScanRunWithCandidates,
  SenderCandidate,
} from "@/lib/domain";

type FilterTab = "all" | "high" | "review" | "protected" | "unsub";

export function PreviewClient({
  scanId,
  initialScan,
}: {
  scanId: string;
  initialScan?: ScanRunWithCandidates;
}) {
  const [scan, setScan] = useState<ScanRunWithCandidates | null>(initialScan || null);
  const [selected, setSelected] = useState<Set<string>>(
    new Set(initialScan?.candidates.filter((c) => c.selectedByDefault).map((c) => c.id) || []),
  );
  const [activeTab, setActiveTab] = useState<FilterTab>("high");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "messages" | "domain">("score");
  const [inspectCandidate, setInspectCandidate] = useState<SenderCandidate | null>(null);
  const [allowlistedDomains, setAllowlistedDomains] = useState<Set<string>>(new Set());
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);

  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<QuietSummary | null>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (initialScan) return;
    void (async () => {
      try {
        const response = await fetch(`/api/gmail/scan/${scanId}`);
        const payload = (await response.json()) as ApiEnvelope<ScanRunWithCandidates>;
        if (!payload.ok) {
          setError(`${payload.message} (${payload.code})`);
          return;
        }
        setScan(payload.data);
        setSelected(
          new Set(payload.data.candidates.filter((c) => c.selectedByDefault).map((c) => c.id)),
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load scan");
      }
    })();
  }, [initialScan, scanId]);

  // Load allowlist
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/me/allowlist");
        const payload = (await res.json()) as ApiEnvelope<{ allowlist: string[] }>;
        if (payload.ok) {
          setAllowlistedDomains(new Set(payload.data.allowlist));
        }
      } catch {
        // ignore in demo
      }
    })();
  }, []);

  const toggleAllowlist = useCallback(
    async (domain: string) => {
      const isAllow = allowlistedDomains.has(domain);
      const method = isAllow ? "DELETE" : "POST";

      const next = new Set(allowlistedDomains);
      if (isAllow) next.delete(domain);
      else next.add(domain);
      setAllowlistedDomains(next);

      try {
        await fetch("/api/me/allowlist", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ domain }),
        });
      } catch {
        // fallback
      }
    },
    [allowlistedDomains],
  );

  const counts = useMemo(() => {
    const candidates = scan?.candidates || [];
    return {
      all: candidates.length,
      high: candidates.filter((c) => c.selectedByDefault).length,
      review: candidates.filter(
        (c) => !c.selectedByDefault && !c.protectedReason && c.proposedAction !== "SKIP",
      ).length,
      protected: candidates.filter((c) => c.protectedReason || c.proposedAction === "SKIP").length,
      unsub: candidates.filter((c) => c.unsubscribeMethods.length > 0).length,
      totalMessages: candidates.reduce((acc, c) => acc + c.messageCount, 0),
    };
  }, [scan]);

  const filteredCandidates = useMemo(() => {
    if (!scan) return [];
    let list = scan.candidates;

    // Filter by tab
    if (activeTab === "high") {
      list = list.filter((c) => c.selectedByDefault);
    } else if (activeTab === "review") {
      list = list.filter(
        (c) => !c.selectedByDefault && !c.protectedReason && c.proposedAction !== "SKIP",
      );
    } else if (activeTab === "protected") {
      list = list.filter((c) => c.protectedReason || c.proposedAction === "SKIP");
    } else if (activeTab === "unsub") {
      list = list.filter((c) => c.unsubscribeMethods.length > 0);
    }

    // Filter by search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.senderDomain.toLowerCase().includes(q) ||
          c.senderDisplayName?.toLowerCase().includes(q) ||
          c.reasons.some((r) => r.toLowerCase().includes(q)),
      );
    }

    // Sort
    return [...list].sort((a, b) => {
      if (sortBy === "score") return b.score - a.score;
      if (sortBy === "messages") return b.messageCount - a.messageCount;
      return a.senderDomain.localeCompare(b.senderDomain);
    });
  }, [scan, activeTab, searchQuery, sortBy]);

  // Keyboard navigation & hotkeys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === "j" || e.key === "ArrowDown") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.min(filteredCandidates.length - 1, prev + 1));
      } else if (e.key === "k" || e.key === "ArrowUp") {
        e.preventDefault();
        setFocusedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === " " && filteredCandidates[focusedIndex]) {
        e.preventDefault();
        const cand = filteredCandidates[focusedIndex];
        if (!cand.protectedReason) {
          const next = new Set(selected);
          if (next.has(cand.id)) next.delete(cand.id);
          else next.add(cand.id);
          setSelected(next);
        }
      } else if (e.key.toLowerCase() === "w" && filteredCandidates[focusedIndex]) {
        e.preventDefault();
        const cand = filteredCandidates[focusedIndex];
        void toggleAllowlist(cand.senderDomain);
      } else if ((e.key.toLowerCase() === "i" || e.key === "Enter") && filteredCandidates[focusedIndex]) {
        e.preventDefault();
        setInspectCandidate(filteredCandidates[focusedIndex]);
      } else if (e.key === "?") {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      } else if (e.key.toLowerCase() === "m") {
        e.preventDefault();
        ritualAudio.toggleMute();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredCandidates, focusedIndex, selected, toggleAllowlist]);

  const selectedStats = useMemo(() => {
    if (!scan) return { count: 0, messages: 0 };
    const chosen = scan.candidates.filter((c) => selected.has(c.id));
    return {
      count: chosen.length,
      messages: chosen.reduce((acc, c) => acc + c.messageCount, 0),
    };
  }, [scan, selected]);

  async function quietSelected() {
    if (!scan) return;
    ritualAudio.playDemonBanish();

    if (scan.id === "mock") {
      // Demo simulated success
      setSummary({
        quietedSenders: selected.size,
        messagesArchivedOrLabeled: selectedStats.messages,
        filtersCreated: selected.size,
        unsubscribeAttemptsSent: selected.size,
        skippedForSafety: counts.protected,
        failedFilters: 0,
        warnings: [],
      });
      ritualAudio.playBellOfLiberation();
      return;
    }

    setWorking(true);
    setError(null);
    try {
      const response = await fetch("/api/gmail/actions/quiet", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          scanId: scan.id,
          candidateIds: [...selected],
          allowHttpsUnsubscribe: true,
          allowMailtoUnsubscribe: false,
        }),
      });
      const payload = (await response.json()) as ApiEnvelope<QuietSummary>;
      setWorking(false);
      if (!payload.ok) {
        setError(`${payload.message} (${payload.code})`);
        return;
      }
      setSummary(payload.data);
      ritualAudio.playBellOfLiberation();
    } catch (err) {
      setWorking(false);
      setError(err instanceof Error ? err.message : "Failed to quiet senders.");
    }
  }

  function selectAllRecommended() {
    if (!scan) return;
    setSelected(new Set(scan.candidates.filter((c) => c.selectedByDefault).map((c) => c.id)));
  }

  function selectAllFiltered() {
    const next = new Set(selected);
    filteredCandidates.forEach((c) => next.add(c.id));
    setSelected(next);
  }

  function clearAll() {
    setSelected(new Set());
  }

  if (error) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col px-5 py-12 sm:px-8">
        <Link href="/scan" className="text-sm font-semibold text-amber-400 hover:underline">
          &larr; Back to Scan
        </Link>
        <div className="mt-8 rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-red-200">
          <h2 className="text-lg font-bold text-red-400">Failed to Load Blueprint</h2>
          <p className="mt-2 text-sm">{error}</p>
        </div>
      </main>
    );
  }

  if (!scan) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-5 py-20 text-center">
        <div className="radar-sweep h-12 w-12 rounded-full border-2 border-transparent border-t-amber-400" />
        <p className="mt-4 text-zinc-400 font-medium">Loading exorcism blueprint...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-5 py-10 pb-32 sm:px-8">
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-white/10 pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/scan" className="text-sm font-semibold text-amber-400 hover:underline">
            &larr; Back to Scan
          </Link>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
            Exorcism Blueprint
          </h1>
          <p className="mt-2 text-sm text-zinc-400">
            Preview the exorcism. Review senders detected in your recent headers. Nothing is changed until you click Quiet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setShowShortcuts(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-white/15 bg-white/5 px-3 text-xs font-semibold text-zinc-300 hover:bg-white/10 hover:text-white"
          >
            <span>⌨️</span> Hotkeys <kbd className="font-mono text-[10px] text-amber-400">?</kbd>
          </button>

          {scan.id === "mock" && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs font-semibold text-amber-300">
              🎭 Simulation Mode
            </div>
          )}
        </div>
      </div>

      {/* Metric Cards */}
      <section className="mt-8 grid gap-4 grid-cols-2 sm:grid-cols-4">
        {[
          { label: "High-Confidence Promos", value: counts.high, color: "text-amber-400" },
          { label: "Needs Review", value: counts.review, color: "text-zinc-300" },
          { label: "Protected Safe Skips", value: counts.protected, color: "text-emerald-400" },
          { label: "Estimated Messages", value: counts.totalMessages, color: "text-cyan-400" },
        ].map((item) => (
          <div key={item.label} className="glass-card rounded-2xl p-5">
            <div className={`font-mono text-3xl font-extrabold ${item.color}`}>
              {item.value}
            </div>
            <div className="mt-1 text-xs text-zinc-400">{item.label}</div>
          </div>
        ))}
      </section>

      {/* Quieted Success Alert */}
      {summary && (
        <section className="mt-8 rounded-2xl border border-emerald-500/40 bg-emerald-950/30 p-6 shadow-xl backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20 text-xl font-bold text-emerald-400">
              ✓
            </span>
            <div>
              <h2 className="text-2xl font-bold text-white">Your Inbox Has Been Quieted!</h2>
              <p className="text-sm text-emerald-200">
                Silenced {summary.quietedSenders} senders (~{summary.messagesArchivedOrLabeled} messages archived). Created {summary.filtersCreated} reversible Gmail filters and sent {summary.unsubscribeAttemptsSent} unsubscribe requests.
              </p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Link
              href={`/success/${scan.id}`}
              className="inline-flex h-10 items-center rounded-lg bg-emerald-500 px-5 text-sm font-bold text-zinc-950 shadow-md transition hover:bg-emerald-400"
            >
              View Reversible Action Log &rarr;
            </Link>
          </div>
        </section>
      )}

      {/* Filter Tabs & Search Controls */}
      <section className="mt-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "high" as const, label: `High Confidence (${counts.high})` },
            { id: "review" as const, label: `Needs Review (${counts.review})` },
            { id: "protected" as const, label: `Protected Skips (${counts.protected})` },
            { id: "unsub" as const, label: `Has Unsubscribe (${counts.unsub})` },
            { id: "all" as const, label: `All Senders (${counts.all})` },
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

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Search domain or reason..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="rounded-xl border border-white/10 bg-zinc-900/80 px-4 py-2 text-xs text-white placeholder-zinc-500 focus:border-amber-500 focus:outline-none"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as "score" | "messages" | "domain")}
            className="rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2 text-xs text-zinc-300 focus:border-amber-500 focus:outline-none"
          >
            <option value="score">Sort: Noise Score</option>
            <option value="messages">Sort: Message Count</option>
            <option value="domain">Sort: Domain Name</option>
          </select>
        </div>
      </section>

      {/* Bulk Selection Bar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <div className="flex items-center gap-3">
          <span>Showing {filteredCandidates.length} senders</span>
          <button
            type="button"
            onClick={selectAllRecommended}
            className="text-amber-400 hover:underline"
          >
            Select Recommended
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={selectAllFiltered}
            className="hover:text-white hover:underline"
          >
            Select Filtered
          </button>
          <span>•</span>
          <button
            type="button"
            onClick={clearAll}
            className="hover:text-white hover:underline"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Senders List */}
      <section className="mt-4 divide-y divide-white/5 overflow-hidden rounded-2xl glass-card">
        {filteredCandidates.length === 0 ? (
          <div className="p-12 text-center text-sm text-zinc-500">
            No senders found in this category or search filter.
          </div>
        ) : (
          filteredCandidates.map((candidate, idx) => {
            const isSelected = selected.has(candidate.id);
            const isAllow = allowlistedDomains.has(candidate.senderDomain);
            const isProtected = Boolean(candidate.protectedReason);
            const isFocused = idx === focusedIndex;
            const archetype = classifyDemonArchetype(candidate);

            return (
              <div
                key={candidate.id}
                onClick={() => setFocusedIndex(idx)}
                className={`grid gap-4 p-4 transition sm:grid-cols-[40px_1fr_160px_130px_100px] sm:items-center cursor-pointer ${
                  isFocused ? "ring-1 ring-amber-500/50 bg-white/[0.03]" : ""
                } ${isSelected ? "bg-amber-500/5" : "hover:bg-white/[0.02]"}`}
              >
                <div className="flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isProtected}
                    onChange={(e) => {
                      const next = new Set(selected);
                      if (e.target.checked) next.add(candidate.id);
                      else next.delete(candidate.id);
                      setSelected(next);
                    }}
                    className="h-5 w-5 rounded border-zinc-700 bg-zinc-900 accent-amber-500 cursor-pointer disabled:opacity-30"
                  />
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-white truncate">
                      {candidate.senderDisplayName || candidate.senderDomain}
                    </span>

                    {/* Demon Archetype Badge */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold ${archetype.badgeClass}`}
                      title={archetype.description}
                    >
                      <span>{archetype.emoji}</span>
                      <span>{archetype.name}</span>
                    </span>

                    {isAllow && (
                      <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300">
                        WHITELISTED
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 font-mono">{candidate.senderDomain}</div>
                  <div className="mt-1 text-xs text-zinc-400 line-clamp-1">
                    {candidate.reasons.join(" • ")}
                  </div>
                </div>

                <div className="text-xs text-zinc-300">
                  <span className="font-mono font-bold text-zinc-100">{candidate.messageCount}</span>{" "}
                  messages
                </div>

                <div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      void toggleAllowlist(candidate.senderDomain);
                    }}
                    className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition ${
                      isAllow
                        ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-300"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {isAllow ? "✓ Whitelisted" : "+ Whitelist"}
                  </button>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3">
                  <span
                    className={`font-mono text-xs font-bold ${
                      candidate.score >= 80
                        ? "text-amber-400"
                        : candidate.score >= 50
                          ? "text-zinc-300"
                          : "text-emerald-400"
                    }`}
                  >
                    {candidate.score}/100
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspectCandidate(candidate);
                    }}
                    className="text-xs text-zinc-400 hover:text-white underline"
                  >
                    Inspect
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Floating Sticky Action Bar */}
      <div className="fixed bottom-6 left-0 right-0 z-30 mx-auto max-w-3xl px-5">
        <div className="glass-card glow-amber flex items-center justify-between rounded-2xl border-amber-500/30 p-4 shadow-2xl backdrop-blur-xl">
          <div>
            <div className="text-sm font-bold text-white">
              {selectedStats.count} senders selected
            </div>
            <div className="text-xs text-zinc-400">
              ~{selectedStats.messages} messages will be silenced to archive
            </div>
          </div>

          <button
            type="button"
            onClick={quietSelected}
            disabled={working || selected.size === 0}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 font-bold text-zinc-950 shadow-md shadow-amber-500/25 transition hover:scale-[1.02] hover:from-amber-400 hover:to-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {working ? (
              <>
                <span className="radar-sweep h-4 w-4 rounded-full border-2 border-transparent border-t-zinc-950" />
                <span>Quieting...</span>
              </>
            ) : (
              <>
                <span>🕯️</span>
                <span>Quiet Selected Senders</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Candidate Inspector Drawer / Modal */}
      {inspectCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
          <div className="glass-card w-full max-w-xl rounded-3xl p-6 shadow-2xl border-amber-500/20">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-white">
                    {inspectCandidate.senderDisplayName || inspectCandidate.senderDomain}
                  </h3>
                </div>
                <p className="font-mono text-xs text-zinc-400">{inspectCandidate.senderDomain}</p>
              </div>
              <button
                type="button"
                onClick={() => setInspectCandidate(null)}
                className="rounded-full bg-white/10 p-2 text-zinc-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-6 space-y-4 text-sm text-zinc-300">
              {/* Demon Threat Profile */}
              {(() => {
                const arch = classifyDemonArchetype(inspectCandidate);
                return (
                  <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-4">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{arch.emoji}</span>
                      <div>
                        <div className="font-bold text-white text-base">{arch.name}</div>
                        <div className="text-xs text-amber-400">{arch.tagline}</div>
                      </div>
                    </div>
                    <p className="mt-3 text-xs leading-relaxed text-zinc-300">{arch.description}</p>
                    <div className="mt-3 text-xs text-zinc-400">
                      🛡️ <strong>Countermeasure:</strong> {arch.countermeasure}
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-zinc-900/80 p-3">
                  <div className="text-xs text-zinc-500">Noise Score</div>
                  <div className="font-mono text-2xl font-bold text-amber-400">
                    {inspectCandidate.score} / 100
                  </div>
                </div>
                <div className="rounded-xl bg-zinc-900/80 p-3">
                  <div className="text-xs text-zinc-500">Classification</div>
                  <div className="font-mono text-xs font-bold text-white mt-1">
                    {inspectCandidate.classification}
                  </div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-white">Detection Evidence:</div>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-xs text-zinc-300">
                  {inspectCandidate.reasons.map((reason, i) => (
                    <li key={i}>{reason}</li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="font-semibold text-white">Unsubscribe Channels:</div>
                <div className="mt-2 flex gap-2">
                  {inspectCandidate.unsubscribeMethods.length === 0 ? (
                    <span className="text-xs text-zinc-500">No List-Unsubscribe header</span>
                  ) : (
                    inspectCandidate.unsubscribeMethods.map((method) => (
                      <span
                        key={method}
                        className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-amber-300 uppercase font-mono"
                      >
                        {method}
                      </span>
                    ))
                  )}
                </div>
              </div>

              {inspectCandidate.protectedReason && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-200">
                  🛡️ <strong>Safety Override:</strong> {inspectCandidate.protectedReason}
                </div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectCandidate(null)}
                className="h-10 rounded-xl border border-white/20 bg-white/5 px-5 text-sm font-semibold text-white hover:bg-white/10"
              >
                Close (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
