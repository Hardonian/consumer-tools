"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AudioToggle } from "@/components/AudioToggle";

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: "/demo", label: "Interactive Demo" },
    { href: "/providers", label: "Supported Providers" },
    { href: "/scan", label: "Scan Inbox" },
    { href: "/settings", label: "Settings & Allowlist" },
    { href: "/security", label: "Security" },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-[#090a0f]/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-300 shadow-md shadow-amber-500/20">
            <span className="text-lg">🕯️</span>
          </div>
          <span className="font-mono text-lg font-bold tracking-tight text-white">
            Inbox<span className="text-[#f59e0b]">Exorcist</span>
          </span>
          <span className="hidden rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300 sm:inline-block">
            BETA
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-white/10 text-white shadow-sm"
                    : "text-zinc-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2.5">
          <AudioToggle />

          <Link
            href="/demo"
            className="hidden rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/10 hover:text-white sm:inline-block"
          >
            Try Demo
          </Link>
          <a
            href="/api/auth/google/start"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-2 text-xs font-bold text-zinc-950 shadow-sm shadow-amber-500/25 transition hover:from-amber-400 hover:to-amber-500"
          >
            Connect Gmail
          </a>
        </div>
      </div>
    </header>
  );
}
