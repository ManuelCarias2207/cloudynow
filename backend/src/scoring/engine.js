const { getZone, getClimate } = require('../data/loadData');
const { buildRotations } = require('../rotations/buildRotations');
const { deriveIndicators, clamp, round, monthNames } = require('./indicators');
const { DIMENSIONS, weightsForPriority } = require('./weights');
const { assessConfidence, rankRotations } = require('./confidence');

const DISCLAIMER = 'This tool supports your decision; it does not replace your own judgment or the advice of your local agricultural technician.';
const ALWAYS_VALIDATE = [
  'Check your local soil type and fertility with a technician.',
  'Confirm current local market prices before changing crops.',
  'Watch for pests and diseases that satellites cannot see.',
];

const mean = (values) => values.reduce((sum, v) => sum + v, 0) / values.length;
const score = (value, reason, evidence) => ({ score: round(clamp(value)), reason, evidence });

function scoreRotation(rotation, ind) {
  const mains = rotation.crops.filter((c) => c.role !== 'cover');
  const cover = rotation.crops.find((c) => c.role === 'cover');
  const all = rotation.crops;
  const ws = ind.waterStress.value;
  const hs = ind.heatStress.value;
  const bareFraction = ind.bareField.months.length / 12;

  const waterNeed = mean(all.map((c) => c.waterNeed));
  const droughtTol = mean(all.map((c) => c.droughtTolerance));
  const water = score(
    1 - waterNeed * (0.5 + 0.5 * ws) + 0.25 * droughtTol * ws,
    `Average crop water need ${round(waterNeed, 2)} under water stress ${ws}.`,
    [ind.annualRain, ind.soilMoisture, ind.drySpell],
  );

  const maxSoil = Math.max(...all.map((c) => c.soilBenefit));
  const soil = score(
    0.6 * maxSoil + 0.2 * mean(all.map((c) => c.soilBenefit)) + (rotation.coverInBareWindow ? 0.2 : 0),
    rotation.coverInBareWindow
      ? `${cover.name} fixes nitrogen and adds organic matter during the bare months.`
      : `Best soil contribution in this rotation is ${maxSoil} (0-1).`,
    [ind.bareField, ind.soilMoistureAnomaly],
  );

  const protection = rotation.coverInBareWindow ? cover.erosionCover : 0.2 * Math.max(...mains.map((c) => c.erosionCover));
  const erosion = score(
    1 - bareFraction * (1 - protection) * 1.5,
    rotation.coverInBareWindow
      ? `Ground stays covered during ${monthNames(ind.bareField.months).join(', ')}.`
      : `Soil is exposed about ${ind.bareField.months.length} months per year.`,
    [ind.bareField, ind.annualRain],
  );

  const coverIncome = cover && cover.incomeValue > 0.3 ? 0.05 : 0;
  const income = score(
    mean(mains.map((c) => 0.6 * c.incomeValue + 0.4 * c.localMarket)) + coverIncome - rotation.novelty * 0.15,
    rotation.novelty ? 'Based on crop income traits, minus a learning-curve and market-uncertainty penalty for new crops.' : 'Based on crop income traits of the crops you already know and sell.',
    [{ key: 'cropTraits', label: 'Crop traits table (to validate locally)', value: 'incomeValue, localMarket', unit: null, source: 'crops.json' }],
  );

  const exposure = 0.5 * ws + 0.3 * hs + 0.2 * Math.min(1, ind.rainVariability.value / 0.4);
  const tolerance = mean(all.map((c) => 0.6 * c.droughtTolerance + 0.4 * c.heatTolerance));
  const risk = score(
    1 - exposure * (1 - tolerance) - rotation.novelty * 0.1,
    `Climate exposure ${round(exposure, 2)} vs. crop tolerance ${round(tolerance, 2)} (higher score = lower risk).`,
    [ind.rainVariability, ind.heatDays, ind.drySpell],
  );

  return { water, soil, erosion, income, risk };
}

function describe(rotation, scores, ind) {
  const benefits = [];
  const risks = [];
  const gaps = [];
  const validate = [];
  const newCrops = rotation.crops.filter((c) => c.role !== 'main');

  if (scores.water.score >= 0.7) benefits.push('Lower water demand for the expected rainfall.');
  if (scores.soil.score >= 0.7) benefits.push('Improves soil fertility (nitrogen and organic matter).');
  if (scores.erosion.score >= 0.8) benefits.push('Keeps soil covered and reduces erosion.');
  if (scores.income.score >= 0.65) benefits.push('Good income potential with known markets.');
  if (scores.risk.score >= 0.7) benefits.push('More resilient to dry spells and heat.');
  if (!benefits.length) benefits.push('Familiar crops: no new seeds, skills or buyers needed.');

  if (ind.waterStress.value >= 0.4 && scores.water.score < 0.6) risks.push('High water demand for a zone with water stress.');
  rotation.crops
    .filter((c) => ind.heatStress.value >= 0.4 && c.heatTolerance < 0.4)
    .forEach((c) => risks.push(`${c.name} is sensitive to the frequent hot days in this zone.`));
  if (rotation.coverInBareWindow) risks.push('The cover crop may compete for residual moisture if the dry season is severe.');
  if (scores.erosion.score < 0.6) risks.push('Bare soil in the dry season is exposed to erosion at the first heavy rains.');

  newCrops.forEach((c) => {
    risks.push(`${c.name} is new to the farm: seed access and know-how are needed.`);
    gaps.push(`Local market demand and price for ${c.name}.`);
    validate.push(`Confirm seed availability and planting dates for ${c.name} (${c.localName}) with a local technician.`);
  });
  if (!ind.ndviAvailable) gaps.push('Bare-field window estimated from rainfall (NDVI not yet processed).');

  return { benefits, risks, dataGaps: gaps, humanValidation: validate };
}

function evaluate(input) {
  const zone = getZone(input.zoneId);
  const climate = getClimate(input.zoneId);
  if (!climate) throw new Error(`No climate summary for zone ${input.zoneId}`);

  const indicators = deriveIndicators(climate, input.scenario);
  const weights = weightsForPriority(input.priority);
  const { rotations } = buildRotations(input, indicators);

  const scored = rotations.map((rotation) => {
    const scores = scoreRotation(rotation, indicators);
    const total = round(DIMENSIONS.reduce((sum, d) => sum + weights[d] * scores[d].score, 0));
    return {
      id: rotation.id,
      key: rotation.key,
      name: rotation.name,
      whySuggested: rotation.whySuggested,
      crops: rotation.crops.map(({ id, name, localName, role, cycleDays }) => ({ id, name, localName, role, cycleDays })),
      scores,
      total,
      ...describe(rotation, scores, indicators),
    };
  });

  const ranking = rankRotations(scored);
  scored.forEach((r) => { r.rank = ranking.order.indexOf(r.id) + 1; });

  return {
    zone: { id: zone.id, name: zone.name, department: zone.department },
    input,
    weights,
    indicators,
    rotations: scored,
    ranking,
    confidence: assessConfidence(indicators, input.scenario),
    dataGaps: climate.dataGaps,
    humanValidation: [...new Set([...scored.flatMap((r) => r.humanValidation), ...ALWAYS_VALIDATE])],
    sources: climate.sources,
    disclaimer: DISCLAIMER,
  };
}

module.exports = { DISCLAIMER, evaluate, scoreRotation };
