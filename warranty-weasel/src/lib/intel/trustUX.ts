export interface TrustMessage {
  type: 'UNKNOWN' | 'CAUTION' | 'AVOID' | 'SAFE' | 'LIMITATION';
  messages: string[];
}

export const trustUX: TrustMessage[] = [
  {
    type: 'UNKNOWN',
    messages: [
      "We found the product, but the reviews are too new for a solid trust score.",
      "Insufficient data to form a reliable verdict. We prefer accuracy over guessing.",
      "Analysis pending: Review history is unusually thin for this category.",
      "Waiting for more verified data to confirm product legitimacy."
    ]
  },
  {
    type: 'CAUTION',
    messages: [
      "High conflict detected in recent reviews (mixed signals).",
      "Noticeable patterns of incentivized feedback detected.",
      "Recent sentiment shift: Reviews were positive, now increasingly critical.",
      "Listing history shows signs of repurposing or category drift."
    ]
  },
  {
    type: 'AVOID',
    messages: [
      "Extremely high suspicion of review manipulation.",
      "Detected identical review text across multiple retailers.",
      "Synthetic review burst detected: 50+ reviews in under 12 hours.",
      "Warning: Price and trust data show significant discrepancies."
    ]
  },
  {
    type: 'LIMITATION',
    messages: [
      "ReviewGhost analyzes patterns, not individuals.",
      "Verdicts are probabilistic assessments, not legal facts.",
      "We cannot guarantee a specific product will meet your expectations.",
      "Data availability depends on the platform's current security posture."
    ]
  }
];
