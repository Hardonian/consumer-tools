import Link from "next/link";
import { LandingCalculator } from "@/components/LandingCalculator";

export default function Home() {
  return (
    <main className="relative min-h-screen text-zinc-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-white/10 py-16 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3.5 py-1 text-xs font-semibold text-amber-300 backdrop-blur">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              Standards-First Gmail Exorcism
            </div>

            <h1 className="mt-6 text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
              Your inbox has demons. <br />
              <span className="gradient-text-flame">Exorcise them.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-300 sm:text-xl">
              InboxExorcist detects promotional noise, applies reversible Gmail labels and filters in one click, and keeps proof of every action. <strong>No deleting by default. Undo anytime.</strong>
            </p>

            <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
              <a
                href="/api/auth/google/start"
                className="inline-flex h-13 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 px-7 text-base font-bold text-zinc-950 shadow-lg shadow-amber-500/25 transition hover:scale-[1.02] hover:shadow-amber-500/40"
              >
                <span>🕯️</span> Exorcise My Inbox Free
              </a>
              <Link
                href="/demo"
                className="inline-flex h-13 items-center justify-center rounded-lg border border-white/20 bg-white/5 px-6 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10 hover:border-white/30"
              >
                Interactive Demo
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-2.5 text-xs text-zinc-400">
              {[
                "🛡️ Zero Message Bodies Stored",
                "↩️ 100% Reversible Filters",
                "🚫 Never Deletes Emails",
                "🔒 AES-256-GCM Encryption",
              ].map((badge) => (
                <span
                  key={badge}
                  className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-zinc-300"
                >
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Interactive Hero Visual */}
          <div className="relative">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-amber-500/20 via-violet-500/20 to-cyan-500/20 blur-xl opacity-75" />
            <div className="glass-card relative overflow-hidden rounded-2xl p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-red-500/80" />
                  <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                  <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  <span className="ml-2 font-mono text-xs font-semibold text-zinc-400">
                    GMAIL_PURGE_PROTOCOL_V1
                  </span>
                </div>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                  REVERSIBLE
                </span>
              </div>

              <div className="mt-5 space-y-3">
                {[
                  { count: "143", label: "Promo Demons Detected", highlight: "text-amber-400", sub: "Marketing newsletters & spam" },
                  { count: "8,014", label: "Messages Silenced to Archive", highlight: "text-cyan-400", sub: "Bypasses inbox, preserved safely" },
                  { count: "27", label: "Protected Senders Skipped", highlight: "text-emerald-400", sub: "Banks, 2FA, IRS, Receipts" },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-xl border border-white/5 bg-zinc-900/80 p-4 transition hover:border-white/15"
                  >
                    <div>
                      <div className="text-sm font-semibold text-zinc-100">{item.label}</div>
                      <div className="text-xs text-zinc-400">{item.sub}</div>
                    </div>
                    <span className={`font-mono text-2xl font-bold ${item.highlight}`}>
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs font-medium text-emerald-200">
                ✨ <strong>Zero Risk:</strong> If you ever change your mind, undoing any sender restores your original inbox layout instantly.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works (3 Steps) */}
      <section className="py-20 border-b border-white/10 bg-[#06070a]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Simple 3-Step Process
            </span>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              How the Exorcism Ritual Works
            </h2>
            <p className="mt-3 text-zinc-400">
              Minimum permissions. Total transparency. Zero permanent deletion.
            </p>
          </div>

          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Scan Headers Only",
                desc: "We analyze recent Gmail headers (From, Subject, List-Unsubscribe). We never inspect or store message bodies, attachments, or passwords.",
                icon: "📡",
              },
              {
                step: "02",
                title: "Review & Custom Filter",
                desc: "Preview every detected sender categorized into High-Confidence, Review, and Protected Skips. Easily whitelist your favorite senders.",
                icon: "⚖️",
              },
              {
                step: "03",
                title: "One-Click Quieting",
                desc: "We create a reversible Gmail filter (InboxExorcist/Quieted) and send RFC-compliant one-click unsubscribes where available.",
                icon: "🕯️",
              },
            ].map((card) => (
              <div
                key={card.step}
                className="glass-card glass-card-hover rounded-2xl p-7 relative"
              >
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{card.icon}</span>
                  <span className="font-mono text-xs font-bold text-amber-400">
                    STEP {card.step}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{card.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demon Archetypes Threat Showcase */}
      <section className="py-20 border-b border-white/10 bg-[#06070a]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Threat Intelligence
            </span>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Meet the Demons Haunting Your Inbox
            </h2>
            <p className="mt-3 text-zinc-400">
              InboxExorcist automatically classifies noisy senders into distinct behavioral archetypes with targeted countermeasures.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                emoji: "🧛",
                name: "The Inbox Vampire",
                tagline: "Relentless daily bloodsucker",
                desc: "Sends 5+ promotional emails every week. Drains your phone battery and focus with flash sale discounts and product pushes.",
                badge: "CRITICAL THREAT",
                badgeClass: "bg-red-500/20 text-red-300 border-red-500/30",
                spell: "Automated archive & notification silencing",
              },
              {
                emoji: "🧙",
                name: "The Shape-Shifter",
                tagline: "Disguised promotional mimic",
                desc: "Uses sneaky subject lines like 'Fwd: Your invoice' or 'Re: quick question' to trick you into opening sales pitches.",
                badge: "HIGH THREAT",
                badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/30",
                spell: "Header provenance & SPF/DKIM verification",
              },
              {
                emoji: "🧟",
                name: "The Zombie Sub",
                tagline: "Relic from past accounts",
                desc: "Dormant marketing lists from services you signed up for in 2019 that suddenly re-animate during holiday campaigns.",
                badge: "MODERATE THREAT",
                badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                spell: "RFC-8058 one-click unsubscribe ritual",
              },
              {
                emoji: "👻",
                name: "The Phantasm",
                tagline: "Ghost blast opportunist",
                desc: "Senders that email once every 3 months just often enough to avoid unsubscribes while staying under standard spam thresholds.",
                badge: "MODERATE THREAT",
                badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
                spell: "Continuous background shield monitor",
              },
              {
                emoji: "🛡️",
                name: "Guardian Angel",
                tagline: "Protected vital sender",
                desc: "Banks (Chase, Citi), 2FA security codes, flight boarding passes, IRS/taxes, and doctor receipts. 100% immune from quieting.",
                badge: "IMMUNE (SAFE SKIP)",
                badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                spell: "Immutable Safe-Skip protection",
              },
              {
                emoji: "⚖️",
                name: "The Reversible Seal",
                tagline: "Total peace of mind",
                desc: "Every single filter created by InboxExorcist can be reversed with a single click from your action history log.",
                badge: "ZERO RISK GUARANTEE",
                badgeClass: "bg-white/10 text-white border-white/20",
                spell: "1-Click complete state restoration",
              },
            ].map((arch) => (
              <div key={arch.name} className="glass-card glass-card-hover rounded-2xl p-6 relative flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl">{arch.emoji}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${arch.badgeClass}`}>
                      {arch.badge}
                    </span>
                  </div>
                  <h3 className="mt-4 text-lg font-bold text-white">{arch.name}</h3>
                  <p className="text-xs text-amber-400/90 font-medium">{arch.tagline}</p>
                  <p className="mt-3 text-xs leading-relaxed text-zinc-300">{arch.desc}</p>
                </div>

                <div className="mt-6 border-t border-white/10 pt-3 text-[11px] text-zinc-400">
                  🪄 <span className="font-semibold text-zinc-200">Countermeasure:</span> {arch.spell}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Safety Protection Matrix */}
      <section className="py-20 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Bulletproof Safety Rules
            </span>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Protected Senders are NEVER Quieted
            </h2>
            <p className="mt-3 text-zinc-400">
              Our multi-pass Intelligence Engine enforces strict Fail-Keep overrides.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-red-900/30 bg-red-950/10 p-6">
              <div className="flex items-center gap-2 font-semibold text-red-400">
                <span>🔥</span> What We Quiet (With Your Approval)
              </div>
              <ul className="mt-4 space-y-2.5 text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✕</span> Daily retail flash sales and promotional discount blasts
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✕</span> Automated marketing newsletters with unsubscribe links
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✕</span> Product update digests and promotional drip campaigns
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-400">✕</span> Social media notifications and automated digest spam
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-emerald-900/30 bg-emerald-950/10 p-6">
              <div className="flex items-center gap-2 font-semibold text-emerald-400">
                <span>🛡️</span> What We ALWAYS Protect (100% Safe Skips)
              </div>
              <ul className="mt-4 space-y-2.5 text-sm text-zinc-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Banks, credit cards, invoices & tax documents (IRS, Chase, PayPal)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Two-factor authentication (2FA) & password reset alerts
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Flight changes, airline boarding passes & order delivery updates
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">✓</span> Doctor appointments, prescriptions & direct 1:1 human replies
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Noise & Time Saved Calculator */}
      <section className="py-20 border-b border-white/10 bg-[#06070a]">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <LandingCalculator />
        </div>
      </section>

      {/* Transparent Pricing Table */}
      <section className="py-20 border-b border-white/10">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
              Honest & Transparent
            </span>
            <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Simple, Fair Pricing
            </h2>
            <p className="mt-3 text-zinc-400">
              Start with a 100% free scan. Upgrade only when you are ready.
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {/* Free Tier */}
            <div className="glass-card rounded-2xl p-7 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Free Scan</h3>
                <p className="mt-1 text-xs text-zinc-400">Full header scan & noise preview</p>
                <div className="mt-6 font-mono text-4xl font-extrabold text-white">$0</div>
                <ul className="mt-6 space-y-3 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Scan up to 250 recent messages
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Group & classify noisy senders
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-emerald-400">✓</span> Complete safety skip report
                  </li>
                </ul>
              </div>
              <Link
                href="/scan"
                className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/20 bg-white/5 font-semibold text-white transition hover:bg-white/10"
              >
                Scan Now
              </Link>
            </div>

            {/* $5 One-Time Clean */}
            <div className="glass-card glow-amber relative rounded-2xl border-amber-500/40 p-7 flex flex-col justify-between">
              <div className="absolute -top-3 right-6 rounded-full bg-amber-500 px-3 py-0.5 text-[10px] font-bold uppercase text-zinc-950">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-amber-300">One-Time Clean</h3>
                <p className="mt-1 text-xs text-zinc-400">Complete inbox exorcism</p>
                <div className="mt-6 font-mono text-4xl font-extrabold text-white">
                  $5 <span className="text-sm font-normal text-zinc-400">one-time</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="text-amber-400">✓</span> Everything in Free Scan
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-400">✓</span> One-click quiet all chosen senders
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-400">✓</span> Automatic Gmail filter creation
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-amber-400">✓</span> Full reversible action log & undo
                  </li>
                </ul>
              </div>
              <a
                href="/api/auth/google/start"
                className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg bg-amber-500 font-bold text-zinc-950 transition hover:bg-amber-400"
              >
                Start $5 Exorcism
              </a>
            </div>

            {/* $3/mo Shield */}
            <div className="glass-card rounded-2xl p-7 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Ongoing Shield</h3>
                <p className="mt-1 text-xs text-zinc-400">Continuous background protection</p>
                <div className="mt-6 font-mono text-4xl font-extrabold text-white">
                  $3 <span className="text-sm font-normal text-zinc-400">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Continuous noise suppression
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Custom personal allowlist
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="text-cyan-400">✓</span> Priority support & auto-cleanup
                  </li>
                </ul>
              </div>
              <a
                href="/api/auth/google/start"
                className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-lg border border-white/20 bg-white/5 font-semibold text-white transition hover:bg-white/10"
              >
                Activate Shield
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Bottom Banner */}
      <section className="py-20 text-center">
        <div className="mx-auto max-w-4xl px-5 sm:px-8">
          <div className="glass-card glow-amber rounded-3xl p-10 sm:p-14">
            <span className="text-4xl">🕯️</span>
            <h2 className="mt-4 text-3xl font-extrabold text-white sm:text-5xl">
              Ready to take back your inbox?
            </h2>
            <p className="mt-4 text-lg text-zinc-300">
              Join thousands who purged promo noise without deleting a single important email.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <a
                href="/api/auth/google/start"
                className="inline-flex h-13 items-center justify-center rounded-lg bg-amber-500 px-8 text-base font-bold text-zinc-950 shadow-md transition hover:bg-amber-400"
              >
                Connect Gmail & Exorcise Noise
              </a>
              <Link
                href="/demo"
                className="inline-flex h-13 items-center justify-center rounded-lg border border-white/20 bg-white/5 px-6 text-base font-semibold text-white backdrop-blur transition hover:bg-white/10"
              >
                Explore Interactive Demo
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
