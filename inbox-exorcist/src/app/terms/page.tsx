import React from "react";
import Link from "next/link";

export const metadata = {
  title: "Terms of Service | InboxExorcist",
  description: "Terms of Service and User Agreement for InboxExorcist.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-12 sm:px-8">
      <div className="mb-8">
        <Link href="/" className="text-sm font-semibold text-[#f59e0b] hover:underline">
          &larr; Back to InboxExorcist
        </Link>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Terms of Service
        </h1>
        <p className="mt-2 text-sm text-zinc-400">Last updated: August 2026</p>
      </div>

      <div className="space-y-8 text-zinc-300">
        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">1. Introduction & Acceptance</h2>
          <p className="mt-3 leading-relaxed">
            By accessing or using <strong>InboxExorcist</strong> (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you disagree with any part of the terms, you must not access the Service.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">2. Scope of Service & Safe Invariants</h2>
          <p className="mt-3 leading-relaxed">
            InboxExorcist is a utility designed to help users identify bulk and promotional email senders and apply reversible organization actions in their Gmail accounts.
          </p>
          <ul className="mt-3 list-disc space-y-2 pl-6 text-sm text-zinc-300">
            <li>
              <strong>No-Delete Guarantee:</strong> InboxExorcist never requests Gmail delete permissions and is incapable of permanently deleting your emails.
            </li>
            <li>
              <strong>Reversibility:</strong> Organization actions create tracked Gmail filters and labels that can be reversed at any time via your Action Log.
            </li>
            <li>
              <strong>Standards-First Unsubscribe:</strong> Unsubscribe requests are attempted via RFC 8058 standard one-click headers. We do not guarantee third-party sender compliance.
            </li>
          </ul>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">3. User Responsibilities & Review</h2>
          <p className="mt-3 leading-relaxed">
            You maintain full control over which senders are selected for quieting. Before applying actions, you are provided an interactive preview of detected senders. You remain responsible for reviewing proposed actions.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">4. Google API User Data Policy Compliance</h2>
          <p className="mt-3 leading-relaxed">
            InboxExorcist&apos;s use and transfer of information received from Google APIs to any other app will adhere to the{" "}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f59e0b] underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">5. Data Retention & Account Termination</h2>
          <p className="mt-3 leading-relaxed">
            You may disconnect your Google account and purge all associated metadata at any time from the Settings dashboard. Upon request, all tokens, filters, and action history are permanently deleted.
          </p>
        </section>

        <section className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 backdrop-blur">
          <h2 className="text-xl font-semibold text-white">6. Limitation of Liability</h2>
          <p className="mt-3 leading-relaxed">
            The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, whether express or implied.
          </p>
        </section>
      </div>
    </main>
  );
}
