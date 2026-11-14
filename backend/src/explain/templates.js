// Plain-English explanations built with templates from the evidence JSON (no LLM calls).
import { LEVEL } from '../scoring/engine.js';
import { monthLabel } from '../lib/indicators.js';

export const DISCLAIMER =
  'This tool supports your decision; it does not replace your own judgment or the advice of local agricultural technicians. Validate every suggestion locally before planting.';

/** Comma-separated crop names. */
function names(crops) {
  return crops.map((crop) => crop.name).join(', ');
}

/** Picks the singular or plural verb for a crop list ("Maize is" / "Maize, Bean are"). */
function verb(crops, singular, plural) {
  return crops.length === 1 ? singular : plural;
}

/** "Jan, Feb, Dec" or "no clear months". */
function monthList(months) {
  return months.length > 0 ? months.map(monthLabel).join(', ') : 'no clear months';
}

/** Benefits of a rotation, each one tied to a trait or NASA number. */
export function benefitsFor(rotation, scores, indicators) {
  const benefits = [];
  if (rotation.id === 'A') benefits.push('Keeps the crops you already know, with no new seed or learning cost.');
  const fixers = rotation.crops.filter((crop) => crop.fixesNitrogen);
  if (fixers.length > 0) benefits.push(`${names(fixers)} ${verb(fixers, 'fixes', 'fix')} nitrogen in the soil, which can lower fertilizer needs.`);
  if (rotation.coversBareWindow) {
    benefits.push(`${rotation.added.name} keeps the soil covered in the bare-field months (${monthList(indicators.bareWindowMonths)}).`);
  }
  if (rotation.swap) {
    benefits.push(`${rotation.swap.to.name} needs less water than ${rotation.swap.from.name} and tolerates dry spells (about ${indicators.longestDrySpellDays} days in the rainy season here).`);
  }
  if (scores.water >= 0.75) benefits.push(`Water needs fit the zone: about ${indicators.meanAnnualRainMm} mm of rain per year.`);
  const earners = rotation.crops.filter((crop) => crop.incomePotential === 'high');
  if (earners.length > 0) benefits.push(`${names(earners)} ${verb(earners, 'has', 'have')} high income potential (draft estimate).`);
  return benefits;
}

/** Risks of a rotation that need local validation, each tied to a trait or NASA number. */
export function risksFor(rotation, scores, indicators) {
  const risks = [];
  const thirsty = rotation.crops.filter((crop) => LEVEL[crop.droughtTolerance] === 0);
  if (thirsty.length > 0 && indicators.longestDrySpellDays >= 5) {
    risks.push(`${names(thirsty)} ${verb(thirsty, 'is', 'are')} sensitive to drought; the longest rainy-season dry spell averages ${indicators.longestDrySpellDays} days.`);
  }
  if (scores.water < 0.6) risks.push(`Water demand may be high for about ${indicators.meanAnnualRainMm} mm of rain per year.`);
  if (indicators.extremeHeatDaysPerYear >= 30) {
    risks.push(`About ${indicators.extremeHeatDaysPerYear} days per year have a daily mean of ${indicators.extremeHeatThresholdC} °C or more; heat can hurt flowering.`);
  }
  if (rotation.coversBareWindow) {
    risks.push(`${rotation.added.name} has to grow in the driest months (${monthList(indicators.bareWindowMonths)}); it may need leftover soil moisture or earlier planting.`);
  }
  if (rotation.swap) risks.push(`${rotation.swap.to.name} is new to this rotation: seed access, know-how and a local buyer are not guaranteed.`);
  if (scores.erosion < 0.6) risks.push(`Soil is poorly covered when rain peaks at about ${indicators.peakMonthlyRainMm} mm per month, so erosion is likely.`);
  if (!rotation.crops.some((crop) => crop.fixesNitrogen)) risks.push('No crop in this rotation adds nitrogen, so soil nutrients may decline over time.');
  return risks;
}

/** What NASA POWER and this tool do not know. */
export function informationGapsFor(rotation, { fallback, fallbackZone, hasSoilMoisture, period }, zone = {}) {
  const gaps = [
    'Local soil type and fertility are not measured by NASA POWER.',
    'Market prices are not included; income potential is a rough estimate.',
    'Pests and diseases are not covered by the data.',
    'NASA POWER data covers a grid cell of roughly 50 km; your farm may differ.',
  ];
  const drafts = rotation.crops.filter((crop) => crop.needsValidation);
  if (drafts.length > 0) gaps.push(`Crop traits for ${names(drafts)} are draft values pending validation by a local technician.`);
  if (!hasSoilMoisture) gaps.push('Soil moisture data is not available for this zone.');
  if (fallback && fallbackZone && fallbackZone.id !== zone.id) {
    gaps.push(`Live NASA POWER data was unavailable; stored data from the nearest pilot zone (${fallbackZone.name}, ${period.start}-${period.end}) was used instead of your location.`);
  } else if (fallback) {
    gaps.push(`Live NASA POWER data was unavailable; stored data for ${period.start}-${period.end} was used.`);
  }
  return gaps;
}

/** Confidence note based on year-to-year rainfall variability. */
export function confidenceNoteFor(level, indicators) {
  if (level === 'low') {
    return `Rainfall changes a lot from year to year here (CV ${indicators.rainCV}), so these scores carry lower confidence.`;
  }
  return `Rainfall is fairly stable from year to year here (CV ${indicators.rainCV}); scores still need local validation.`;
}
