const LEVELS = ['low', 'medium', 'high'];
const SIMILAR_THRESHOLD = 0.05;

function assessConfidence(indicators, scenario) {
  let level = 2;
  const reasons = [];
  const cv = indicators.rainVariability.value;

  if (cv > 0.3) {
    level = 0;
    reasons.push(`Rainfall varies a lot between years (CV ${cv}); results are less certain.`);
  } else if (cv > 0.2) {
    level = 1;
    reasons.push(`Rainfall varies moderately between years (CV ${cv}).`);
  }
  if (!indicators.ndviAvailable) {
    level = Math.min(level, 1);
    reasons.push('Bare-field window is estimated from rainfall because NDVI is not available.');
  }
  if (scenario.rainfallChangePct || scenario.temperatureChangeC) {
    reasons.push('Scenario values are a simplified what-if, not a forecast.');
  }
  if (!reasons.length) reasons.push('Stable rainfall and complete NASA data for this zone.');
  return { level: LEVELS[level], reasons };
}

function rankRotations(rotations) {
  const sorted = [...rotations].sort((a, b) => b.total - a.total);
  const [first, second] = sorted;
  const gap = Number((first.total - second.total).toFixed(3));
  const similar = gap < SIMILAR_THRESHOLD;
  return {
    order: sorted.map((r) => r.id),
    best: similar ? null : first.id,
    similar,
    gap,
    message: similar
      ? `Options ${first.id} and ${second.id} score within ${SIMILAR_THRESHOLD} of each other: treat them as similar and decide with local knowledge.`
      : `Option ${first.id} (${first.name}) scores highest for your priority.`,
  };
}

module.exports = { SIMILAR_THRESHOLD, assessConfidence, rankRotations };
