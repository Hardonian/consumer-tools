import { PreviewClient } from "@/components/PreviewClient";
import { getDemoScan } from "@/lib/demo-data";

export const metadata = {
  title: "Interactive Demo | InboxExorcist",
  description: "Test drive the InboxExorcist blueprint and noise classification with simulated demo data.",
};

export default function DemoPage() {
  const demoScan = getDemoScan();

  return (
    <div className="flex min-h-screen flex-col">
      <div className="border-b border-amber-500/30 bg-amber-500/10 py-3 text-center text-xs font-bold text-amber-300 backdrop-blur">
        ✨ Interactive Simulation Mode: This is simulated preview data. No real Gmail mutations will be made.
      </div>
      <PreviewClient scanId="mock" initialScan={demoScan} />
      <div className="mx-auto mt-auto flex w-full max-w-5xl flex-col items-center border-t border-white/10 px-5 py-14 text-center sm:px-8">
        <div className="glass-card glow-amber w-full rounded-3xl p-8 sm:p-12">
          <span className="text-3xl">🕯️</span>
          <h2 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
            Ready to exorcise your real Gmail inbox?
          </h2>
          <p className="mt-3 text-sm text-zinc-300 max-w-xl mx-auto">
            Connect your Gmail account to scan your real recent headers, identify promo senders, and build your personalized reversible action blueprint.
          </p>
          <a
            href="/api/auth/google/start"
            className="mt-8 inline-flex h-13 items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-8 text-base font-bold text-zinc-950 shadow-lg shadow-amber-500/25 transition hover:scale-[1.02] hover:from-amber-400 hover:to-amber-500"
          >
            Connect Gmail Safely &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
