"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ritualAudio } from "@/lib/audio/ritual-audio";
import type { ApiEnvelope, ScanRunWithCandidates } from "@/lib/domain";

const stages = [
  { id: 1, name: "Connecting to Gmail", desc: "Establishing secure token session" },
  { id: 2, name: "Reading Headers", desc: "Inspecting From, Subject, List-Unsubscribe" },
  { id: 3, name: "Grouping Senders", desc: "Aggregating volume and domain reputation" },
  { id: 4, name: "Intelligence Scoring", desc: "Evaluating safety rules & pattern algorithms" },
  { id: 5, name: "Action Blueprint", desc: "Preparing reversible filter plan" },
];

export function ScanClient({ autoStart }: { autoStart: boolean }) {
  const [state, setState] = useState<"idle" | "scanning" | "done" | "error">("idle");
  const [activeStage, setActiveStage] = useState(0);
  const [scan, setScan] = useState<ScanRunWithCandidates | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function startScan() {
    setState("scanning");
    setError(null);
    setActiveStage(0);
    ritualAudio.playCandleIgnite();

    const stageInterval = setInterval(() => {
      setActiveStage((prev) => {
        const next = prev < 4 ? prev + 1 : prev;
        ritualAudio.playScanningPulse();
        return next;
      });
    }, 1200);

    try {
      const response = await fetch("/api/gmail/scan", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ maxMessages: 250 }),
      });
      const payload = (await response.json()) as ApiEnvelope<ScanRunWithCandidates>;
      clearInterval(stageInterval);

      if (!payload.ok) {
        setState("error");
        setError(`${payload.message} (${payload.code})`);
        return;
      }
      setActiveStage(4);
      setScan(payload.data);
      setState("done");
      ritualAudio.playBellOfLiberation();
    } catch (err) {
      clearInterval(stageInterval);
      setState("error");
      setError(err instanceof Error ? err.message : "Failed to communicate with Gmail API.");
    }
  }

  useEffect(() => {
    let ignore = false;
    if (autoStart) {
      void (async () => {
        if (!ignore) {
          await startScan();
        }
      })();
    }
    return () => {
      ignore = true;
    };
  }, [autoStart]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 py-12 sm:px-8">
      <div className="mb-10 text-center sm:text-left">
        <Link href="/" className="text-sm font-semibold text-amber-400 hover:underline">
          &larr; InboxExorcist
        </Link>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Scan Your Inbox for Demons
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-300">
          We scan recent Gmail metadata headers only. No message bodies or attachments are accessed.
        </p>
      </div>

      <div className="glass-card rounded-3xl p-6 sm:p-10">
        {state === "idle" && (
          <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
            <div>
              <h2 className="text-2xl font-bold text-white">Ready for Exorcism</h2>
              <p className="mt-1 text-sm text-zinc-400">
                Ready when Gmail is connected. Click below to begin scanning your 250 most recent email headers.
              </p>
            </div>
            <button
              type="button"
              onClick={startScan}
              className="inline-flex h-13 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 text-base font-bold text-zinc-950 shadow-lg shadow-amber-500/25 transition hover:scale-[1.02] hover:from-amber-400 hover:to-amber-500"
            >
              <span>🕯️</span> Start Gmail Scan
            </button>
          </div>
        )}

        {state === "scanning" && (
          <div className="py-4">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="relative flex h-28 w-28 items-center justify-center">
                <div className="absolute inset-0 rounded-full border-2 border-amber-500/20" />
                <div className="radar-sweep absolute inset-0 rounded-full border-2 border-transparent border-t-amber-400" />
                <div className="pulse-slow flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-3xl">
                  🕯️
                </div>
              </div>
              <h3 className="mt-6 text-xl font-bold text-white">
                Channeling Exorcism Ritual...
              </h3>
              <p className="mt-1 text-sm text-zinc-400">
                Scanning headers and computing intelligence rules
              </p>
            </div>

            <div className="mt-10 space-y-3">
              {stages.map((stage, idx) => {
                const isDone = activeStage > idx;
                const isCurrent = activeStage === idx;
                return (
                  <div
                    key={stage.id}
                    className={`flex items-center justify-between rounded-xl border p-4 transition ${
                      isDone
                        ? "border-emerald-500/30 bg-emerald-950/20 text-zinc-200"
                        : isCurrent
                          ? "border-amber-500/50 bg-amber-950/20 text-white shadow-sm"
                          : "border-white/5 bg-zinc-900/40 text-zinc-500"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs font-bold">0{stage.id}</span>
                      <div>
                        <div className="text-sm font-semibold">{stage.name}</div>
                        <div className="text-xs text-zinc-400">{stage.desc}</div>
                      </div>
                    </div>
                    <div>
                      {isDone && <span className="text-emerald-400 font-bold text-sm">✓ Complete</span>}
                      {isCurrent && <span className="text-amber-400 text-xs font-bold animate-pulse">Running...</span>}
                      {!isDone && !isCurrent && <span className="text-zinc-600 text-xs">Waiting</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {state === "error" && (
          <div className="rounded-2xl border border-red-500/30 bg-red-950/20 p-6 text-red-200">
            <div className="flex items-center gap-2 font-bold text-red-400">
              <span>⚠️</span> Scan Interrupted
            </div>
            <p className="mt-2 text-sm leading-relaxed">{error}</p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <a
                href="/api/auth/google/start"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-red-500 px-5 text-sm font-bold text-white transition hover:bg-red-600"
              >
                Reconnect Gmail
              </a>
              <button
                type="button"
                onClick={startScan}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-white/20 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {state === "done" && scan && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-6">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <span>✨</span> Scan Completed Successfully
            </div>
            <p className="mt-2 text-base text-zinc-200">
              Identified <strong>{scan.candidateCount} senders</strong> across <strong>{scan.messageCount} recent messages</strong>. 
              Found <strong>{scan.selectedCount} high-confidence noise candidates</strong> ready for quieting.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href={`/preview/${scan.id}`}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 font-bold text-zinc-950 shadow-md shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-500"
              >
                <span>🔍</span> Preview Action Blueprint &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
