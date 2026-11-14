const { getCrop, getCurrentSystem, getStrategyCandidates } = require('../data/loadData');

function pickBest(candidateIds, excluded, scoreFn) {
  return candidateIds
    .filter((id) => !excluded.includes(id))
    .map(getCrop)
    .sort((a, b) => scoreFn(b) - scoreFn(a))[0] || null;
}

function coverScore(crop, priority) {
  const incomeBoost = priority === 'extra-income' ? 0.3 * crop.incomeValue : 0;
  return 0.5 * crop.soilBenefit + 0.3 * crop.droughtTolerance + 0.2 * crop.erosionCover + incomeBoost;
}

function droughtScore(crop, priority, heatStress) {
  const incomeWeight = priority === 'extra-income' ? 0.35 : 0.15;
  const soilWeight = priority === 'improve-soil' ? 0.25 : 0.05;
  return 0.4 * crop.droughtTolerance + 0.2 * heatStress * crop.heatTolerance + 0.2 * (1 - crop.waterNeed)
    + incomeWeight * crop.incomeValue + soilWeight * crop.soilBenefit;
}

function buildRotations({ currentCrop, priority, constraints }, indicators) {
  const system = getCurrentSystem(currentCrop);
  const current = system.crops.map(getCrop);
  const excluded = [...constraints.avoidCrops, ...system.crops];
  const candidates = getStrategyCandidates();
  const bareMonths = indicators.bareField.months;

  const cover = pickBest(candidates.cover, excluded, (c) => coverScore(c, priority));
  const tolerant = pickBest(candidates.droughtTolerant, [...excluded, cover?.id], (c) => droughtScore(c, priority, indicators.heatStress.value));
  const thirstiest = [...current].sort((a, b) => b.waterNeed - a.waterNeed)[0];
  const replaces = current.length > 1 ? thirstiest : null;

  const rotations = [{
    id: 'A',
    key: 'current',
    name: `Current: ${system.name}`,
    crops: current.map((c) => ({ ...c, role: 'main' })),
    coverInBareWindow: false,
    novelty: 0,
    whySuggested: 'Baseline: what you plant today, scored with the same rules for a fair comparison.',
  }];

  if (cover) {
    rotations.push({
      id: 'B',
      key: 'cover',
      name: `${system.name} + ${cover.name} cover`,
      crops: [...current.map((c) => ({ ...c, role: 'main' })), { ...cover, role: 'cover' }],
      coverCrop: cover.id,
      coverInBareWindow: true,
      novelty: 0.3,
      whySuggested: `Keeps your crops and adds ${cover.name} (${cover.localName}) during the bare-field window to protect and feed the soil.`,
    });
  }

  if (tolerant) {
    const mains = replaces ? current.filter((c) => c.id !== replaces.id) : current;
    rotations.push({
      id: 'C',
      key: 'drought-tolerant',
      name: replaces ? `${tolerant.name} instead of ${replaces.name}` : `${system.name} + ${tolerant.name} on part of the plot`,
      crops: [...mains.map((c) => ({ ...c, role: 'main' })), { ...tolerant, role: 'drought-tolerant' }],
      replaces: replaces?.id || null,
      coverInBareWindow: false,
      novelty: 0.5,
      whySuggested: replaces
        ? `Replaces ${replaces.name}, your most water-demanding crop, with ${tolerant.name} (${tolerant.localName}), which tolerates dry spells better.`
        : `Diversifies part of the plot with ${tolerant.name} (${tolerant.localName}), which tolerates dry spells better.`,
    });
  }

  return { rotations, bareMonths };
}

module.exports = { buildRotations };
