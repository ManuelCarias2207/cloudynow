// Orchestrates POST /api/recommend and GET /api/zones/[id].
import { loadCrops } from '../data/loadData.js';
import { getZoneDaily, POWER_PARAMETERS } from '../lib/power.js';
import { applyScenario, computeIndicators } from '../lib/indicators.js';
import { buildRotations } from '../rotations/buildRotations.js';
import { scoreRotation } from './engine.js';
import { weightsFor } from './weights.js';
import { isSimilar, confidenceLevel } from './confidence.js';
import { DISCLAIMER, benefitsFor, risksFor, informationGapsFor, confidenceNoteFor } from '../explain/templates.js';

/** Source description returned with every response. */
function dataSource(climate) {
  return { name: 'NASA POWER Daily API (community AG)', parameters: POWER_PARAMETERS, period: climate.period };
}

/** Zone info plus monthly series for charts. */
export async function zoneDetail(zone, options = {}) {
  const climate = await getZoneDaily(zone, options);
  const { monthly, ...indicators } = computeIndicators(climate.days);
  return {
    zone,
    monthly,
    indicators,
    hasSoilMoisture: climate.hasSoilMoisture,
    fallback: climate.fallback,
    dataSource: dataSource(climate),
  };
}

/** Converts a scored rotation into the public response shape. */
function presentRotation(rotation, indicators, climate, weights, zone) {
  const { scores, evidence } = scoreRotation(rotation, indicators, weights);
  return {
    id: rotation.id,
    name: rotation.name,
    crops: rotation.crops.map((crop) => ({ id: crop.id, name: crop.name })),
    scores,
    evidence,
    benefits: benefitsFor(rotation, scores, indicators),
    risks: risksFor(rotation, scores, indicators),
    informationGaps: informationGapsFor(rotation, climate, zone),
  };
}

/** Full recommendation for validated input { zone, currentCrops, priority, rainDelta, heatDelta }. */
export async function recommend(input, options = {}) {
  const crops = await loadCrops();
  const climate = await getZoneDaily(input.zone, options);
  const days = applyScenario(climate.days, { rainDelta: input.rainDelta, heatDelta: input.heatDelta });
  const { monthly, ...indicators } = computeIndicators(days);
  const weights = weightsFor(input.priority);
  const rotations = buildRotations(input.currentCrops, crops).map((rotation) =>
    presentRotation(rotation, indicators, climate, weights, input.zone),
  );
  return {
    zone: input.zone,
    priority: input.priority,
    weights,
    scenario: { rainDelta: input.rainDelta, heatDelta: input.heatDelta },
    indicators,
    monthly,
    hasSoilMoisture: climate.hasSoilMoisture,
    rotations,
    similar: isSimilar(rotations.map((rotation) => rotation.scores.total)),
    confidenceNote: confidenceNoteFor(confidenceLevel(indicators), indicators),
    fallback: climate.fallback,
    disclaimer: DISCLAIMER,
    dataSource: dataSource(climate),
  };
}
