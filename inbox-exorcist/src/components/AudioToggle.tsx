"use client";

import { useState } from "react";
import { ritualAudio } from "@/lib/audio/ritual-audio";

export function AudioToggle() {
  const [muted, setMuted] = useState(() => (typeof window !== "undefined" ? ritualAudio.muted : false));

  function toggle() {
    const next = ritualAudio.toggleMute();
    setMuted(next);
    if (!next) {
      ritualAudio.playCandleIgnite();
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={muted ? "Enable Ritual Sound" : "Mute Ritual Sound"}
      className={`inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition ${
        muted
          ? "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
          : "border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-sm"
      }`}
    >
      <span>{muted ? "🔇" : "🔔"}</span>
      <span className="hidden sm:inline">{muted ? "Muted" : "Ritual Audio"}</span>
    </button>
  );
}
