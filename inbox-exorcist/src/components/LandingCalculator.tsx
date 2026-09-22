"use client";

import { useState } from "react";

export function LandingCalculator() {
  const [dailyEmails, setDailyEmails] = useState(45);

  const promoEmailsPerDay = Math.round(dailyEmails * 0.65);
  const minutesSavedPerDay = Math.round(promoEmailsPerDay * 0.75);
  const hoursSavedPerMonth = Math.round((minutesSavedPerDay * 30) / 60);
  const hoursSavedPerYear = hoursSavedPerMonth * 12;
  const promoCountYearly = promoEmailsPerDay * 365;
  const co2GramsSavedYearly = Math.round(promoCountYearly * 0.3); // ~0.3g CO2 per marketing email energy lifecycle
  const distractionsPreventedYearly = promoCountYearly * 2;

  return (
    <div className="glass-card rounded-3xl p-8 sm:p-12">
      <div className="grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">
            Inbox ROI & Cognitive Focus Calculator
          </span>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            How much time are promo demons costing you?
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300">
            The average Gmail inbox is 60-70% automated marketing noise. Adjust the slider to estimate how many hours, cognitive interruptions, and environmental waste you will reclaim with InboxExorcist.
          </p>

          <div className="mt-8">
            <div className="flex items-center justify-between text-sm font-semibold">
              <span className="text-zinc-300">Total emails received per day:</span>
              <span className="font-mono text-xl font-bold text-amber-400">
                {dailyEmails} emails/day
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="200"
              step="5"
              value={dailyEmails}
              onChange={(e) => setDailyEmails(Number(e.target.value))}
              className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-lg bg-zinc-700 accent-amber-500"
            />
            <div className="mt-2 flex justify-between text-xs text-zinc-500">
              <span>Light (10)</span>
              <span>Average (50)</span>
              <span>Heavy (100)</span>
              <span>Demonic (200+)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-5">
            <div className="text-xs font-medium text-zinc-400">Hours Saved / Month</div>
            <div className="mt-2 font-mono text-3xl sm:text-4xl font-extrabold text-amber-400">
              {hoursSavedPerMonth} hrs
            </div>
            <div className="mt-1 text-xs text-zinc-400">~{hoursSavedPerYear}h reclaimed/year</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-5">
            <div className="text-xs font-medium text-zinc-400">Promos Silenced / Year</div>
            <div className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-cyan-400">
              {promoCountYearly.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-zinc-400">Bypasses main inbox safely</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-5">
            <div className="text-xs font-medium text-zinc-400">Focus Distractions Spared</div>
            <div className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-emerald-400">
              {distractionsPreventedYearly.toLocaleString()}
            </div>
            <div className="mt-1 text-xs text-zinc-400">Phone buzzes & tabs spared</div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-zinc-900/90 p-5">
            <div className="text-xs font-medium text-zinc-400">CO2 Footprint Avoided</div>
            <div className="mt-2 font-mono text-2xl sm:text-3xl font-extrabold text-violet-400">
              {(co2GramsSavedYearly / 1000).toFixed(1)} kg
            </div>
            <div className="mt-1 text-xs text-zinc-400">Reduced server storage energy</div>
          </div>
        </div>
      </div>
    </div>
  );
}
