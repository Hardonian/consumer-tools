"use client";

import { useEffect } from "react";

const SHORTCUTS = [
  { key: "J / K", desc: "Navigate next / previous sender" },
  { key: "Space", desc: "Toggle sender exorcism selection" },
  { key: "W", desc: "Toggle personal allowlist (safe skip)" },
  { key: "I / Enter", desc: "Inspect candidate headers & reasons" },
  { key: "M", desc: "Mute / Unmute ritual audio" },
  { key: "Esc", desc: "Close inspect drawer / modals" },
  { key: "?", desc: "Toggle this shortcut guide" },
];

export function KeyboardShortcutsModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm">
      <div className="glass-card w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border-amber-500/20">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">⌨️</span>
            <h3 className="text-xl font-bold text-white">Power-User Shortcuts</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-white/10 p-2 text-zinc-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {SHORTCUTS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between rounded-xl bg-zinc-900/60 p-3 text-xs"
            >
              <span className="text-zinc-300">{item.desc}</span>
              <kbd className="rounded-lg border border-white/15 bg-zinc-800 px-2.5 py-1 font-mono font-bold text-amber-400 shadow-inner">
                {item.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl bg-amber-500 px-6 text-xs font-bold text-zinc-950 hover:bg-amber-400 transition"
          >
            Got it (Esc)
          </button>
        </div>
      </div>
    </div>
  );
}
