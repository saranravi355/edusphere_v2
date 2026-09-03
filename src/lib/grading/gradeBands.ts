export type Band = 'good' | 'moderate' | 'weak';

export function getBand(score: number, maxScore: number): Band {
  if (maxScore <= 0) return 'weak';
  const pct = score / maxScore;
  if (pct >= 0.7) return 'good';
  if (pct >= 0.4) return 'moderate';
  return 'weak';
}

export const BAND_LABELS: Record<Band, string> = {
  good: 'Good',
  moderate: 'Moderate',
  weak: 'Needs work'
};

/** Hex values (not Tailwind class names) for use inside recharts fill/stroke props, which
 *  can't resolve Tailwind's CSS-variable-backed classes. Picked to match this app's semantic
 *  emerald/amber/red badge palette used everywhere else (see STATUS_STYLE in AIGraderClient). */
export const BAND_HEX: Record<Band, string> = {
  good: '#10b981',
  moderate: '#f59e0b',
  weak: '#ef4444'
};
