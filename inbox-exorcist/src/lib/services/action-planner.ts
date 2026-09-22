import type { SenderCandidate } from "../domain.ts";

export function selectedQuietCandidates(
  candidates: SenderCandidate[],
  candidateIds?: string[],
) {
  const selected = new Set(candidateIds || []);
  return candidates.filter((candidate) => {
    const requested = candidateIds ? selected.has(candidate.id) : candidate.selectedByDefault;
    return (
      requested &&
      candidate.score >= 80 &&
      !candidate.protectedReason &&
      (candidate.classification === "PROMOTIONAL_HIGH_CONFIDENCE" ||
        candidate.classification === "NEWSLETTER_HIGH_CONFIDENCE")
    );
  });
}

export function skippedCandidateCount(
  candidates: SenderCandidate[],
  candidateIds?: string[],
) {
  const requested = new Set(candidateIds || candidates.map((candidate) => candidate.id));
  return candidates.filter(
    (candidate) =>
      requested.has(candidate.id) &&
      (Boolean(candidate.protectedReason) || candidate.score < 80),
  ).length;
}
