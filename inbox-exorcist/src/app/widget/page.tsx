import Link from "next/link";
import { getDemoScan } from "@/lib/demo-data";

export const metadata = {
  title: "InboxExorcist Partner Widget",
  description: "Embeddable Gmail noise exorcist widget for partner blogs and productivity tools.",
};

export default function WidgetPage() {
  const demoScan = getDemoScan();
  const topCandidates = demoScan.candidates.slice(0, 3);

  return (
    <div className="flex min-h-screen flex-col bg-[#090a0f] p-4 text-zinc-100 antialiased font-sans">
      <div className="glass-card rounded-2xl p-5 border border-amber-500/30 shadow-xl">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🕯️</span>
            <span className="font-mono text-sm font-bold text-white">
              Inbox<span className="text-amber-400">Exorcist</span>
            </span>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
            PARTNER WIDGET
          </span>
        </div>

        <div className="mt-4 text-center">
          <h2 className="text-lg font-bold text-white">Gmail Noise Radar</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Detected <strong>{demoScan.candidateCount} promo senders</strong> in sample headers.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          {topCandidates.map((c) => (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl bg-zinc-900/80 p-2.5 text-xs"
            >
              <div>
                <div className="font-semibold text-white truncate max-w-[140px]">
                  {c.senderDisplayName || c.senderDomain}
                </div>
                <div className="text-[10px] text-zinc-500 font-mono">{c.senderDomain}</div>
              </div>
              <span className="font-mono font-bold text-amber-400">{c.messageCount} msgs</span>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-2">
          <a
            href="/api/auth/google/start"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-xs font-bold text-zinc-950 shadow-md shadow-amber-500/20 transition hover:from-amber-400 hover:to-amber-500"
          >
            <span>🕯️</span> Scan My Real Gmail Free
          </a>
          <Link
            href="/demo"
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-8 w-full items-center justify-center text-[11px] font-semibold text-zinc-400 hover:text-white hover:underline"
          >
            View Full Interactive Demo &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
}
