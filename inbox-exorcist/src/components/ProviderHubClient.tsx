"use client";

import { useState } from "react";
import { getDemoScan } from "@/lib/demo-data";
import {
  exportGmailFilterXml,
  exportSieveScript,
  exportAppleMailScript,
  exportOutlookRuleJson,
  type ProviderExporterResult,
} from "@/lib/providers/exporters";

type ProviderId = "gmail" | "outlook" | "apple" | "proton" | "yahoo" | "fastmail";

interface ProviderConfig {
  id: ProviderId;
  name: string;
  badge: string;
  icon: string;
  color: string;
  description: string;
  setupTime: string;
  method: string;
}

const PROVIDERS: ProviderConfig[] = [
  {
    id: "gmail",
    name: "Google Gmail & Workspace",
    badge: "Native OAuth & Automated",
    icon: "🔴",
    color: "from-red-500/20 to-amber-500/20 border-red-500/30",
    description: "Automated scan, header scoring, and instant label + reversible filter creation via official Google OAuth API.",
    setupTime: "Instant (1-Click)",
    method: "OAuth 2.0 API",
  },
  {
    id: "outlook",
    name: "Microsoft Outlook & 365",
    badge: "Rules Recipe & Web Sweep",
    icon: "🔵",
    color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30",
    description: "Generates custom sweep rules for Outlook Web, Desktop Outlook, and Microsoft 365 Exchange policies.",
    setupTime: "30 Seconds",
    method: "Universal Rule Recipe",
  },
  {
    id: "apple",
    name: "Apple Mail & iCloud",
    badge: "1-Click AppleScript & .mailrules",
    icon: "🍏",
    color: "from-emerald-500/20 to-teal-500/20 border-emerald-500/30",
    description: "Native macOS Mail AppleScript automation and iCloud web rules to silence noisy marketing senders across all Apple devices.",
    setupTime: "1-Click Script",
    method: "AppleScript & Mailrules",
  },
  {
    id: "proton",
    name: "ProtonMail & Tuta",
    badge: "Zero-Access Sieve Filter",
    icon: "🛡️",
    color: "from-violet-500/20 to-purple-500/20 border-violet-500/30",
    description: "100% Client-side RFC-5228 Sieve script for end-to-end encrypted mailboxes without revealing private keys or account credentials.",
    setupTime: "Copy & Paste",
    method: "Sieve Script Engine",
  },
  {
    id: "yahoo",
    name: "Yahoo Mail & AOL",
    badge: "Automated Filter Blueprint",
    icon: "🟣",
    color: "from-purple-500/20 to-pink-500/20 border-purple-500/30",
    description: "Step-by-step custom filter rules tailored to Yahoo Mail's modern interface to bypass the primary inbox.",
    setupTime: "1 Minute",
    method: "Web Filter Recipe",
  },
  {
    id: "fastmail",
    name: "Fastmail, Hey & Superhuman",
    badge: "JMAP & Sieve Compatible",
    icon: "⚡",
    color: "from-amber-500/20 to-yellow-500/20 border-amber-500/30",
    description: "Full JMAP and standard Sieve script compatibility for power users on Fastmail, Hey, and Posteo.",
    setupTime: "1-Click Paste",
    method: "JMAP / Sieve",
  },
];

export function ProviderHubClient() {
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>("gmail");
  const [copied, setCopied] = useState(false);

  const demoScan = getDemoScan();
  const candidates = demoScan.candidates;

  function getExporterResult(): ProviderExporterResult {
    switch (selectedProvider) {
      case "gmail":
        return exportGmailFilterXml(candidates);
      case "proton":
      case "fastmail":
        return exportSieveScript(candidates);
      case "apple":
        return exportAppleMailScript(candidates);
      case "outlook":
      case "yahoo":
      default:
        return exportOutlookRuleJson(candidates);
    }
  }

  const currentResult = getExporterResult();

  function handleDownload() {
    const blob = new Blob([currentResult.content], { type: currentResult.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = currentResult.filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleCopy() {
    navigator.clipboard.writeText(currentResult.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-10">
      {/* Provider Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PROVIDERS.map((p) => {
          const isSelected = selectedProvider === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedProvider(p.id)}
              className={`text-left rounded-3xl p-6 transition-all relative overflow-hidden flex flex-col justify-between border ${
                isSelected
                  ? `glass-card ring-2 ring-amber-400 bg-gradient-to-br ${p.color} shadow-lg shadow-amber-500/10`
                  : "glass-card hover:border-white/20 opacity-80 hover:opacity-100"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-3xl">{p.icon}</span>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold text-zinc-300">
                    {p.setupTime}
                  </span>
                </div>
                <h3 className="mt-3 text-lg font-bold text-white">{p.name}</h3>
                <span className="inline-block mt-1 text-xs font-semibold text-amber-400">
                  {p.badge}
                </span>
                <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                  {p.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[11px] font-medium text-zinc-400">
                <span>Method: {p.method}</span>
                <span className={isSelected ? "text-amber-400 font-bold" : "text-zinc-500"}>
                  {isSelected ? "● Selected" : "Select &rarr;"}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Provider Details & Exporter Panel */}
      <div className="glass-card rounded-3xl p-6 sm:p-10 space-y-6 border border-amber-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">
                {PROVIDERS.find((p) => p.id === selectedProvider)?.icon}
              </span>
              <h2 className="text-xl font-bold text-white">
                {PROVIDERS.find((p) => p.id === selectedProvider)?.name} Setup & Rule Generator
              </h2>
            </div>
            <p className="mt-1 text-xs text-zinc-400">
              {currentResult.instructions}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {selectedProvider === "gmail" && (
              <a
                href="/api/auth/google/start"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-amber-500 px-4 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition"
              >
                <span>🔴</span> 1-Click Google OAuth
              </a>
            )}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-xs font-semibold text-white hover:bg-white/10 transition"
            >
              {copied ? "✓ Copied!" : "Copy Code"}
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-amber-500 px-4 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition"
            >
              Download {currentResult.filename}
            </button>
          </div>
        </div>

        {/* Live Code Preview */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400 mb-2">
            <span>Generated File: <strong className="text-amber-400">{currentResult.filename}</strong></span>
            <span>MIME: {currentResult.mimeType}</span>
          </div>
          <pre className="max-h-72 overflow-x-auto rounded-2xl bg-black/70 p-4 font-mono text-xs text-amber-300 border border-white/10">
            {currentResult.content}
          </pre>
        </div>
      </div>
    </div>
  );
}
