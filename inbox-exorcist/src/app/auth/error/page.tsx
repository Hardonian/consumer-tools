import Link from "next/link";

const messages: Record<string, string> = {
  GOOGLE_OAUTH_NOT_CONFIGURED:
    "Google OAuth is not configured yet. Please configure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in your environment.",
  OAUTH_STATE_INVALID:
    "The Google OAuth sign-in state expired. Please restart the connection flow from the landing page.",
  INSUFFICIENT_SCOPES:
    "Gmail permissions were not fully granted. We require gmail.modify and gmail.settings.basic to create reversible filters.",
};

export const metadata = {
  title: "Authentication Paused | InboxExorcist",
  description: "OAuth connection issue resolution for InboxExorcist.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const params = await searchParams;
  const code = params.code || "AUTH_ERROR";

  return (
    <main className="mx-auto flex min-h-[80vh] max-w-3xl flex-col justify-center px-5 py-12 sm:px-8">
      <Link href="/" className="text-sm font-semibold text-amber-400 hover:underline">
        &larr; Return to InboxExorcist
      </Link>
      <div className="glass-card mt-6 rounded-3xl p-8 shadow-2xl border-amber-500/20">
        <div className="flex items-center gap-2 font-mono text-xs font-bold text-amber-400 uppercase">
          <span>⚠️</span> {code}
        </div>
        <h1 className="mt-3 text-3xl font-extrabold text-white sm:text-4xl">
          Gmail Connection Paused
        </h1>
        <p className="mt-3 text-base leading-relaxed text-zinc-300">
          {messages[code] || "Google OAuth did not complete. No inbox modifications were made."}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/api/auth/google/start"
            className="inline-flex h-11 items-center justify-center rounded-xl bg-amber-500 px-6 font-bold text-zinc-950 shadow-md hover:bg-amber-400 transition"
          >
            Try Connecting Again
          </Link>
          <Link
            href="/demo"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-white/20 bg-white/5 px-5 font-semibold text-white hover:bg-white/10 transition"
          >
            Try Demo Mode
          </Link>
        </div>
      </div>
    </main>
  );
}
