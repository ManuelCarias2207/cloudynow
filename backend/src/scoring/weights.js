/** Criterion weights per farmer priority. Each set sums to 1. */
export const WEIGHTS = {
  water: { water: 0.4, soil: 0.15, erosion: 0.15, income: 0.1, risk: 0.2 },
  soil: { soil: 0.35, erosion: 0.25, water: 0.15, income: 0.1, risk: 0.15 },
  income: { income: 0.4, water: 0.15, soil: 0.1, erosion: 0.1, risk: 0.25 },
};

export const PRIORITIES = Object.keys(WEIGHTS);

/** Weights for a priority ("water" | "soil" | "income"). */
export function weightsFor(priority) {
  const weights = WEIGHTS[priority];
  if (!weights) throw new Error(`Unknown priority: ${priority}`);
  return weights;
}

/** total = sum(weight * score) over the five criteria. */
export function weightedTotal(scores, weights) {
  return Object.entries(weights).reduce((sum, [criterion, weight]) => sum + weight * scores[criterion], 0);
}
