import { round } from '../lib/indicators.js';

/** Two best totals closer than this are reported as "similar" instead of forcing a winner. */
export const SIMILAR_THRESHOLD = 0.05;
/** Year-to-year rainfall CV above this lowers confidence. */
export const HIGH_VARIABILITY_CV = 0.2;

/** true when the two highest totals differ by less than 0.05 (gap rounded to 3 decimals to avoid float noise). */
export function isSimilar(totals) {
  const [first, second] = [...totals].sort((a, b) => b - a);
  if (second === undefined) return false;
  return round(first - second, 3) < SIMILAR_THRESHOLD;
}

/** "low" confidence when rainfall CV is high, otherwise "normal". */
export function confidenceLevel(indicators) {
  return indicators.rainCV !== null && indicators.rainCV > HIGH_VARIABILITY_CV ? 'low' : 'normal';
}
