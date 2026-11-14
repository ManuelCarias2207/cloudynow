// Transparent rule-based scoring (no machine learning). Every score is 0..1 where 1 is best,
// and keeps the NASA indicators that produced it in `evidence`.
import { round, mean } from '../lib/indicators.js';
import { weightedTotal } from './weights.js';

/** Crop trait levels mapped to numbers. */
export const LEVEL = { low: 0, medium: 0.5, high: 1 };

/** Reference values used to normalise indicators to 0..1 (documented, editable by the team). */
export const REFERENCE = {
  comfortableRainMm: 2000, // annual rain at or above this = no rainfall stress
  rainStressRangeMm: 1000, // stress reaches 1 at 1000 mm/year
  okDrySpellDays: 3, // rainy-season dry spells up to 3 days are normal
  drySpellRangeDays: 12, // stress reaches 1 at a 15-day dry spell
  heavyRainMonthMm: 400, // a month with 400 mm or more = maximum erosion pressure
  highRainCV: 0.4, // CV at or above this = maximum variability risk
  manyHeatDays: 90, // 90 extreme heat days per year = maximum heat risk
};

/** Limits a value to the 0..1 range. */
export function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

/**
 * Water stress of the zone (0 = none, 1 = severe):
 * 0.5 * clamp((2000 - meanAnnualRainMm) / 1000) + 0.5 * clamp((longestDrySpellDays - 3) / 12)
 */
export function waterStress(indicators) {
  const rainPart = clamp01((REFERENCE.comfortableRainMm - indicators.meanAnnualRainMm) / REFERENCE.rainStressRangeMm);
  const spellPart = clamp01((indicators.longestDrySpellDays - REFERENCE.okDrySpellDays) / REFERENCE.drySpellRangeDays);
  return 0.5 * rainPart + 0.5 * spellPart;
}

/** Mean of a numeric crop trait over the rotation. */
function traitMean(crops, valueOf) {
  return mean(crops.map(valueOf));
}

/**
 * water = mean over crops of 1 - stress * (demand + (1 - droughtTolerance)) / 2
 * Thirsty, drought-sensitive crops lose points in dry zones; nothing is lost when stress = 0.
 */
export function scoreWater(crops, indicators) {
  const stress = waterStress(indicators);
  const score = traitMean(crops, (crop) => 1 - (stress * (LEVEL[crop.waterDemand] + 1 - LEVEL[crop.droughtTolerance])) / 2);
  return {
    score,
    evidence: {
      indicators: { meanAnnualRainMm: indicators.meanAnnualRainMm, longestDrySpellDays: indicators.longestDrySpellDays },
      waterStress: round(stress),
      source: 'NASA POWER PRECTOTCORR',
    },
  };
}

/**
 * soil = 0.7 * mean(0.5 * fixesNitrogen + 0.5 * soilCover) + 0.3 * (1 - bareExposure)
 * bareExposure = bareWindowMonths / 12, or 0 when the rotation covers the bare window.
 */
export function scoreSoil(crops, indicators, coversBareWindow) {
  const traits = traitMean(crops, (crop) => 0.5 * (crop.fixesNitrogen ? 1 : 0) + 0.5 * LEVEL[crop.soilCover]);
  const bareExposure = coversBareWindow ? 0 : indicators.bareWindowMonths.length / 12;
  return {
    score: 0.7 * traits + 0.3 * (1 - bareExposure),
    evidence: {
      indicators: { bareWindowMonths: indicators.bareWindowMonths, meanSoilMoisture: indicators.meanSoilMoisture },
      bareExposure: round(bareExposure),
      coversBareWindow,
      source: 'NASA POWER PRECTOTCORR, GWETROOT',
    },
  };
}

/**
 * erosion (protection) = 1 - clamp(peakMonthlyRainMm / 400) * (1 - meanSoilCover)
 * Heavy rain on poorly covered soil = low score.
 */
export function scoreErosion(crops, indicators) {
  const rainPressure = clamp01(indicators.peakMonthlyRainMm / REFERENCE.heavyRainMonthMm);
  const cover = traitMean(crops, (crop) => LEVEL[crop.soilCover]);
  return {
    score: 1 - rainPressure * (1 - cover),
    evidence: {
      indicators: { peakMonthlyRainMm: indicators.peakMonthlyRainMm },
      rainPressure: round(rainPressure),
      meanSoilCover: round(cover),
      source: 'NASA POWER PRECTOTCORR',
    },
  };
}

/**
 * income = mean(incomePotential) * (1 - 0.5 * waterStress * (1 - meanDroughtTolerance))
 * Income potential is discounted when the climate threatens drought-sensitive harvests.
 */
export function scoreIncome(crops, indicators) {
  const stress = waterStress(indicators);
  const tolerance = traitMean(crops, (crop) => LEVEL[crop.droughtTolerance]);
  const potential = traitMean(crops, (crop) => LEVEL[crop.incomePotential]);
  return {
    score: potential * (1 - 0.5 * stress * (1 - tolerance)),
    evidence: {
      indicators: { meanAnnualRainMm: indicators.meanAnnualRainMm, longestDrySpellDays: indicators.longestDrySpellDays },
      waterStress: round(stress),
      meanIncomePotential: round(potential),
      source: 'NASA POWER PRECTOTCORR; income potential is a draft crop trait',
    },
  };
}

/**
 * risk (safety, 1 = lowest risk) = 1 - climateRisk * (1 - 0.5 * meanDroughtTolerance)
 * climateRisk = 0.4 * clamp(rainCV / 0.4) + 0.3 * clamp(extremeHeatDaysPerYear / 90) + 0.3 * waterStress
 */
export function scoreRisk(crops, indicators) {
  const climateRisk =
    0.4 * clamp01(indicators.rainCV / REFERENCE.highRainCV) +
    0.3 * clamp01(indicators.extremeHeatDaysPerYear / REFERENCE.manyHeatDays) +
    0.3 * waterStress(indicators);
  const tolerance = traitMean(crops, (crop) => LEVEL[crop.droughtTolerance]);
  return {
    score: 1 - climateRisk * (1 - 0.5 * tolerance),
    evidence: {
      indicators: {
        rainCV: indicators.rainCV,
        extremeHeatDaysPerYear: indicators.extremeHeatDaysPerYear,
        extremeHeatThresholdC: indicators.extremeHeatThresholdC,
      },
      climateRisk: round(climateRisk),
      source: 'NASA POWER PRECTOTCORR, T2M',
    },
  };
}

/**
 * Scores one rotation ({ crops, coversBareWindow }) against the zone indicators.
 * Returns { scores: { water, soil, erosion, income, risk, total }, evidence }.
 */
export function scoreRotation(rotation, indicators, weights) {
  const results = {
    water: scoreWater(rotation.crops, indicators),
    soil: scoreSoil(rotation.crops, indicators, rotation.coversBareWindow),
    erosion: scoreErosion(rotation.crops, indicators),
    income: scoreIncome(rotation.crops, indicators),
    risk: scoreRisk(rotation.crops, indicators),
  };
  const scores = {};
  const evidence = {};
  for (const [criterion, result] of Object.entries(results)) {
    scores[criterion] = round(clamp01(result.score), 3);
    evidence[criterion] = result.evidence;
  }
  scores.total = round(weightedTotal(scores, weights), 3);
  return { scores, evidence };
}
