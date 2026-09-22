import Link from "next/link";
import { ProviderHubClient } from "@/components/ProviderHubClient";

export const metadata = {
  title: "Supported Email Providers & Integration Hub | InboxExorcist",
  description:
    "Works seamlessly with Gmail, Microsoft Outlook, Apple Mail, ProtonMail, Yahoo Mail, Fastmail, and Superhuman.",
};

export default function ProvidersPage() {
  return (
    <main className="min-h-screen px-5 py-12 sm:px-8 max-w-7xl mx-auto space-y-12">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-4">
        <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-amber-400">
          Universal Compatibility
        </span>
        <h1 className="text-3xl font-extrabold text-white sm:text-5xl tracking-tight">
          Works with <span className="text-amber-400">Every Major Email Service</span>
        </h1>
        <p className="text-sm sm:text-base leading-relaxed text-zinc-300">
          Whether you use Gmail, Microsoft 365, Apple Mail, or privacy-focused providers like ProtonMail, InboxExorcist provides instant native synchronization and universal reversible filter recipes.
        </p>
      </div>

      {/* Interactive Provider Client Hub */}
      <ProviderHubClient />

      {/* Zero Deletion & Privacy Guarantee Section */}
      <section className="glass-card rounded-3xl p-8 sm:p-12 border border-white/10">
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-2">
            <div className="text-2xl">🛡️</div>
            <h3 className="font-bold text-white text-lg">Zero Body Deletion Invariant</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              InboxExorcist never requests delete permissions. Promos are safely routed to a quiet folder where you can review them at any time.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl">🔒</div>
            <h3 className="font-bold text-white text-lg">Zero-Access Encryption Friendly</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Proton and encrypted mailbox users can use our client-side Sieve generator without sharing any credentials or tokens.
            </p>
          </div>
          <div className="space-y-2">
            <div className="text-2xl">⚡</div>
            <h3 className="font-bold text-white text-lg">100% Reversible in 1-Click</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              All rules and filters created can be undone in seconds either through our dashboard or directly in your email client settings.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <div className="text-xs text-zinc-400">
            Ready to exorcise your inbox today?
          </div>
          <div className="flex gap-3">
            <a
              href="/api/auth/google/start"
              className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 px-5 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition"
            >
              Connect Gmail Free
            </a>
            <Link
              href="/demo"
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 px-5 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              Try Interactive Demo &rarr;
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
