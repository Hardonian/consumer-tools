import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-[#06070a] py-12 text-zinc-400">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl">🕯️</span>
              <span className="font-mono text-base font-bold text-white">
                Inbox<span className="text-[#f59e0b]">Exorcist</span>
              </span>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              One-click promotional inbox exorcism. Safely banish noisy email demons using reversible Gmail filters and standards-compliant one-click unsubscribe.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Zero Message Body Storage Architecture</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
              Product
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/scan" className="hover:text-white transition">
                  Scan Your Inbox
                </Link>
              </li>
              <li>
                <Link href="/demo" className="hover:text-white transition">
                  Interactive Demo
                </Link>
              </li>
              <li>
                <Link href="/providers" className="hover:text-white transition">
                  Supported Providers
                </Link>
              </li>
              <li>
                <Link href="/settings" className="hover:text-white transition">
                  Settings & Allowlist
                </Link>
              </li>
              <li>
                <Link href="/api/health" className="hover:text-white transition font-mono text-xs text-zinc-500">
                  /api/health status
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
              Trust & Security
            </h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <Link href="/security" className="hover:text-white transition">
                  Security Architecture
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
              <li>
                <span className="inline-flex items-center gap-1 rounded bg-zinc-800/80 px-2 py-0.5 text-xs text-zinc-300">
                  AES-256-GCM Encrypted
                </span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-200">
              Safety Guarantees
            </h3>
            <p className="mt-3 text-xs leading-relaxed text-zinc-400">
              InboxExorcist never permanently deletes emails. All quieting actions create reversible Gmail filters (<code className="text-amber-400">InboxExorcist/Quieted</code>) that can be undone instantly from your Action Log.
            </p>
            <div className="mt-4 rounded-md border border-white/10 bg-white/5 p-3 text-xs text-zinc-300">
              Protected: Banks, 2FA, IRS, Receipts, Healthcare & Personal Threads.
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-xs text-zinc-500 sm:flex-row">
          <p>© {new Date().getFullYear()} InboxExorcist. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/privacy" className="hover:underline">Privacy</Link>
            <Link href="/terms" className="hover:underline">Terms</Link>
            <Link href="/security" className="hover:underline">Security</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
