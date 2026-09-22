import Link from "next/link";
import { ActionHistoryClient } from "@/components/ActionHistoryClient";
import { CleanseCertificate } from "@/components/CleanseCertificate";

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-12 sm:px-8 space-y-10">
      <div className="text-center sm:text-left">
        <Link href="/scan" className="text-sm font-semibold text-amber-400 hover:underline">
          &larr; Start New Scan
        </Link>

        <div className="mt-6 flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-2xl font-bold text-emerald-400">
            🕯️
          </span>
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
              Exorcism Complete.
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Session ID: <span className="font-mono text-zinc-300">{id}</span>
            </p>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-300">
          Your inbox is quieter. All selected noisy senders have been silenced into the{" "}
          <code className="rounded bg-zinc-800 px-2 py-0.5 text-xs text-amber-400">
            InboxExorcist/Quieted
          </code>{" "}
          archive label. You can undo any filter anytime below.
        </p>
      </div>

      <CleanseCertificate
        scanId={id}
        senderCount={12}
        messageCount={480}
        hoursSavedYearly={18}
        co2SavedGrams={144}
      />

      <div className="mt-8">
        <ActionHistoryClient />
      </div>
    </main>
  );
}
