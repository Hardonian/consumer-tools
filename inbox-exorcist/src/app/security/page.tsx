import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Security Architecture | InboxExorcist",
  description: "Detailed breakdown of the security controls, invariants, and token encryption in InboxExorcist.",
};

export default function SecurityPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-12 sm:px-8">
      <div className="mb-8">
        <Link href="/" className="text-sm font-semibold text-[#f59e0b] hover:underline">
          &larr; Back to InboxExorcist
        </Link>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Security Architecture
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          How we protect your inbox, tokens, and data privacy.
        </p>
      </div>

      <div className="space-y-8 text-zinc-300">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold">✓</span>
            <h2 className="text-xl font-semibold text-white">The No-Delete Invariant</h2>
          </div>
          <p className="mt-3 leading-relaxed">
            InboxExorcist is architected from the ground up to be mathematically incapable of deleting your emails. We do not request Google&apos;s delete scope (<code className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-amber-400">https://mail.google.com/</code>), and no deletion endpoint or routine exists anywhere in our codebase. Messages from quieted senders are labeled and moved away from the inbox, preserving full message integrity.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold">🔒</span>
            <h2 className="text-xl font-semibold text-white">AES-256-GCM Token Encryption</h2>
          </div>
          <p className="mt-3 leading-relaxed">
            All Google OAuth access and refresh tokens are encrypted at rest using AES-256 in Galois/Counter Mode (GCM) with authenticated encryption tags. Encryption keys are stored strictly in environment variables and never logged or exposed in client payloads.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-500/20 text-purple-400 font-bold">🛡️</span>
            <h2 className="text-xl font-semibold text-white">SSRF Defense & Unsubscribe Verification</h2>
          </div>
          <p className="mt-3 leading-relaxed">
            To protect against Server-Side Request Forgery (SSRF), all List-Unsubscribe HTTP URLs undergo DNS resolution verification against strict denylists. Localhost, loopback addresses (127.0.0.0/8, ::1), private IPv4 subnets (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16), and link-local ranges (169.254.0.0/16) are strictly blocked before issuing any network requests.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400 font-bold">⚡</span>
            <h2 className="text-xl font-semibold text-white">Circuit Breaker & Fault Isolation</h2>
          </div>
          <p className="mt-3 leading-relaxed">
            Upstream Gmail API requests are protected by a stateful circuit breaker. If 5 consecutive failures occur, the breaker automatically transitions to Open state for 30 seconds to prevent cascading degradation, fail-closing safely into degraded mode without executing partial destructive mutations.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-400 font-bold">🚫</span>
            <h2 className="text-xl font-semibold text-white">PII Redaction in Structured Logs</h2>
          </div>
          <p className="mt-3 leading-relaxed">
            Our diagnostics logging pipeline employs an 18-field automatic redaction filter. Email addresses, access tokens, refresh tokens, auth codes, and user display names are automatically replaced with deterministic hashes or redaction masks before hitting persistent logs.
          </p>
        </section>
      </div>
    </main>
  );
}
