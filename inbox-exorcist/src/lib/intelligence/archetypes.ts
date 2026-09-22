import type { SenderCandidate } from "@/lib/domain";

export interface DemonArchetypeInfo {
  id: "vampire" | "shapeshifter" | "zombie" | "phantasm" | "guardian";
  name: string;
  emoji: string;
  tagline: string;
  description: string;
  threatLevel: "CRITICAL" | "HIGH" | "MODERATE" | "BENIGN";
  countermeasure: string;
  badgeClass: string;
}

export const ARCHETYPES: Record<string, DemonArchetypeInfo> = {
  vampire: {
    id: "vampire",
    name: "The Inbox Vampire",
    emoji: "🧛",
    tagline: "Relentless daily bloodsucker",
    description: "Sends high-frequency promotional blasts flooding your inbox daily.",
    threatLevel: "CRITICAL",
    countermeasure: "Silence into Quiet Archive label & block notification bells.",
    badgeClass: "bg-red-500/20 text-red-300 border-red-500/30",
  },
  shapeshifter: {
    id: "shapeshifter",
    name: "The Shape-Shifter",
    emoji: "🧙",
    tagline: "Disguised promotional mimic",
    description: "Mimics personal or urgent messages using fake prefixes or deceptive display names.",
    threatLevel: "HIGH",
    countermeasure: "Header provenance verification & automated filter silencing.",
    badgeClass: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  zombie: {
    id: "zombie",
    name: "The Zombie Sub",
    emoji: "🧟",
    tagline: "Relic from past accounts",
    description: "Dormant marketing lists from services you haven't touched in years.",
    threatLevel: "MODERATE",
    countermeasure: "RFC-8058 HTTPS 1-click unsubscribe & quiet archive.",
    badgeClass: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  },
  phantasm: {
    id: "phantasm",
    name: "The Phantasm",
    emoji: "👻",
    tagline: "Ghost blast opportunist",
    description: "Occasional promotional senders that stay just under standard spam filters.",
    threatLevel: "MODERATE",
    countermeasure: "Continuous background shield monitor.",
    badgeClass: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  },
  guardian: {
    id: "guardian",
    name: "Guardian Angel",
    emoji: "🛡️",
    tagline: "Protected vital sender",
    description: "Critical transactional sender (Banking, 2FA, Security, Taxes, Travel).",
    threatLevel: "BENIGN",
    countermeasure: "Immutable Safe Skip protection. Never filtered or silenced.",
    badgeClass: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  },
};

export function classifyDemonArchetype(candidate: SenderCandidate): DemonArchetypeInfo {
  // If candidate is protected, always return Guardian Angel
  if (candidate.protectedReason || candidate.proposedAction === "SKIP") {
    return ARCHETYPES.guardian;
  }

  const reasonsLower = candidate.reasons.map((r) => r.toLowerCase());
  const hasPromo = reasonsLower.some((r) => r.includes("promotional") || r.includes("marketing") || r.includes("bulk") || r.includes("promo"));

  // Check for Vampire first: high message volume in scan window
  if (candidate.messageCount >= 4 || reasonsLower.some((r) => r.includes("daily") || r.includes("high-frequency"))) {
    return ARCHETYPES.vampire;
  }

  // Check for Shape-Shifter signals (personal name disguise, fake urgent subjects)
  if (reasonsLower.some((r) => r.includes("urgent") || r.includes("disguise") || r.includes("fwd:") || r.includes("re:"))) {
    return ARCHETYPES.shapeshifter;
  }

  // Check for Zombie (has unsubscribe header, legacy inactive list)
  if (candidate.unsubscribeMethods.length > 0 && candidate.messageCount <= 2 && hasPromo) {
    return ARCHETYPES.zombie;
  }

  // Default promotional archetype
  return ARCHETYPES.phantasm;
}
