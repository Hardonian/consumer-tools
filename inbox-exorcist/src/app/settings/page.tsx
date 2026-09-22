import Link from "next/link";
import { SettingsClient } from "@/components/SettingsClient";

export const metadata = {
  title: "Account & Settings | InboxExorcist",
  description: "Manage your Gmail connection, personal allowlist, reversible actions, and privacy data.",
};

export default function SettingsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-12 sm:px-8">
      <div className="mb-8">
        <Link href="/" className="text-sm font-semibold text-amber-400 hover:underline">
          &larr; InboxExorcist Home
        </Link>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          Account & Reversibility Hub
        </h1>
        <p className="mt-2 text-sm text-zinc-400">
          Manage your Gmail connection, personal trusted allowlist, reversible filter history, and data privacy.
        </p>
      </div>

      <SettingsClient />
    </main>
  );
}
