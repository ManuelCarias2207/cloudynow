// Orchestrates POST /api/recommend and GET /api/zones/[id].
import { loadCrops } from '../data/loadData.js';
import { getZoneDaily, POWER_PARAMETERS } from '../lib/power.js';
import { applyScenario, computeIndicators } from '../lib/indicators.js';
import { buildRotations } from '../rotations/buildRotations.js';
import { scoreRotation } from './engine.js';
import { weightsFor } from './weights.js';
import { isSimilar, confidenceLevel } from './confidence.js';
import {
  benefitsFor,
  confidenceNoteFor,
  cropName,
  disclaimerFor,
  evidenceFor,
  informationGapsFor,
  risksFor,
  rotationName,
} from '../explain/templates.js';

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
function presentRotation(rotation, indicators, climate, weights, zone, lang) {
  const { scores, evidence } = scoreRotation(rotation, indicators, weights);
  return {
    id: rotation.id,
    name: rotationName(rotation, lang),
    crops: rotation.crops.map((crop) => ({ id: crop.id, name: cropName(crop, lang) })),
    scores,
    evidence: evidenceFor(evidence, lang),
    benefits: benefitsFor(rotation, scores, indicators, lang),
    risks: risksFor(rotation, scores, indicators, lang),
    informationGaps: informationGapsFor(rotation, climate, zone, lang),
  };
}

/** Full recommendation for validated input { zone, currentCrops, priority, rainDelta, heatDelta, lang }. */
export async function recommend(input, options = {}) {
  const crops = await loadCrops();
  const climate = await getZoneDaily(input.zone, options);
  const days = applyScenario(climate.days, { rainDelta: input.rainDelta, heatDelta: input.heatDelta });
  const { monthly, ...indicators } = computeIndicators(days);
  const weights = weightsFor(input.priority);
  const rotations = buildRotations(input.currentCrops, crops).map((rotation) =>
    presentRotation(rotation, indicators, climate, weights, input.zone, input.lang),
  );
  return {
    zone: input.zone,
    priority: input.priority,
    lang: input.lang,
    weights,
    scenario: { rainDelta: input.rainDelta, heatDelta: input.heatDelta },
    indicators,
    rotations,
    similar: isSimilar(rotations.map((rotation) => rotation.scores.total)),
    confidenceNote: confidenceNoteFor(confidenceLevel(indicators), indicators, input.lang),
    fallback: climate.fallback,
    disclaimer: disclaimerFor(input.lang),
    dataSource: dataSource(climate),
  };
}
