import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | InboxExorcist",
  description: "Learn how InboxExorcist protects your data with zero body storage and minimal metadata.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-12 sm:px-8">
      <div className="mb-8">
        <Link href="/" className="text-sm font-semibold text-[#f59e0b] hover:underline">
          &larr; Back to InboxExorcist
        </Link>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="mt-2 text-sm text-zinc-400">Last updated: August 2026</p>
      </div>

      <div className="space-y-8 text-zinc-300">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">1. Core Privacy Architecture</h2>
          <p className="mt-3 leading-relaxed">
            InboxExorcist is engineered around a strict <strong>Zero Body Storage</strong> principle. We do not read, process, store, or sell email message bodies, snippets, or attachments. We only inspect metadata headers required to classify promotional senders.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">2. What We Store vs. What We Never Store</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-emerald-900/40 bg-emerald-950/20 p-4">
              <h3 className="font-semibold text-emerald-400">What We Store (Minimal Metadata)</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
                <li>User ID & encrypted Gmail account email</li>
                <li>Salted SHA-256 hash of sender emails</li>
                <li>Sender domains (e.g., example.com)</li>
                <li>Classification tags & confidence scores</li>
                <li>Reversible Gmail label & filter IDs</li>
                <li>Action timestamps & audit logs</li>
              </ul>
            </div>
            <div className="rounded-lg border border-red-900/40 bg-red-950/20 p-4">
              <h3 className="font-semibold text-red-400">What We NEVER Store</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-300">
                <li>Full email message bodies</li>
                <li>Email attachments or files</li>
                <li>Message preview snippets</li>
                <li>Plaintext OAuth access/refresh tokens</li>
                <li>Personal banking or login passwords</li>
                <li>Private user social contact graphs</li>
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">3. Gmail API Scopes & Limited Use Disclosure</h2>
          <p className="mt-3 leading-relaxed">
            We request the minimum necessary OAuth scopes:
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-zinc-300">
            <li>
              <code className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-amber-400">openid email profile</code>: Identify your connected Gmail address.
            </li>
            <li>
              <code className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-amber-400">gmail.modify</code>: Read message headers, apply the &quot;InboxExorcist/Quieted&quot; label, and archive promotional noise without deleting.
            </li>
            <li>
              <code className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-amber-400">gmail.settings.basic</code>: Create reversible Gmail filters to silence future messages from selected senders.
            </li>
          </ul>
          <div className="mt-4 rounded-md border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
            <strong>Google API Limited Use Disclosure:</strong> InboxExorcist complies with the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline"
            >
              Google API Services User Data Policy
            </a>
            . We never sell your data, use it for advertising, or train generalized AI/ML models on your emails.
          </div>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">4. Encryption & Security Standards</h2>
          <p className="mt-3 leading-relaxed">
            All OAuth tokens are encrypted at rest using <strong>AES-256-GCM</strong> with hardware-isolated encryption keys. Sender identifiers in diagnostic logs are hashed with HMAC-SHA256.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">5. Complete Data Deletion</h2>
          <p className="mt-3 leading-relaxed">
            You can disconnect your Google account and trigger full data destruction anytime in the{" "}
            <Link href="/settings" className="text-[#f59e0b] underline">
              Settings page
            </Link>
            . This permanently wipes your connection, tokens, candidates, filters, and audit events from our database.
          </p>
        </section>
      </div>
    </main>
  );
}
