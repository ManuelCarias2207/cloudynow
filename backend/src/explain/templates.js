// Plain-language explanations built with templates from the evidence JSON (no LLM calls).
// Every function takes `lang` ('en' | 'es'); English is the default.
import { LEVEL } from '../scoring/engine.js';
import { monthLabel } from '../lib/indicators.js';

export const LANGUAGES = ['en', 'es'];

const DISCLAIMERS = {
  en: 'This tool supports your decision; it does not replace your own judgment or the advice of local agricultural technicians. Validate every suggestion locally before planting.',
  es: 'Esta herramienta apoya tu decisión; no reemplaza tu propio criterio ni la asesoría de los técnicos agrícolas locales. Valida cada sugerencia localmente antes de sembrar.',
};

export const DISCLAIMER = DISCLAIMERS.en;

const MONTHS_ES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const ROTATION_NAMES = {
  en: { A: 'Current rotation', B: 'Current rotation + cover crop', C: 'Drought-tolerant swap' },
  es: { A: 'Rotación actual', B: 'Rotación actual + cultivo de cobertura', C: 'Cambio a cultivo tolerante a la sequía' },
};

export function disclaimerFor(lang = 'en') {
  return DISCLAIMERS[lang];
}

export function rotationName(rotation, lang = 'en') {
  return ROTATION_NAMES[lang][rotation.id];
}

export function cropName(crop, lang = 'en') {
  return lang === 'es' ? (crop.nameEs ?? crop.name) : crop.name;
}

/** Comma-separated crop names. */
function names(crops, lang) {
  return crops.map((crop) => cropName(crop, lang)).join(', ');
}

/** Picks the singular or plural form for a crop list ("Maize is" / "Maize, Bean are"). */
function verb(crops, singular, plural) {
  return crops.length === 1 ? singular : plural;
}

/** "Jan, Feb, Dec" or "no clear months". */
function monthList(months, lang) {
  if (months.length === 0) return lang === 'es' ? 'sin meses claros' : 'no clear months';
  return months.map((month) => (lang === 'es' ? MONTHS_ES[month - 1] : monthLabel(month))).join(', ');
}

/** Benefits of a rotation, each one tied to a trait or NASA number. */
export function benefitsFor(rotation, scores, indicators, lang = 'en') {
  const es = lang === 'es';
  const n = (crops) => names(crops, lang);
  const benefits = [];
  if (rotation.id === 'A') {
    benefits.push(es ? 'Mantiene los cultivos que ya conoces, sin costo de semilla nueva ni de aprendizaje.' : 'Keeps the crops you already know, with no new seed or learning cost.');
  }
  const fixers = rotation.crops.filter((crop) => crop.fixesNitrogen);
  if (fixers.length > 0) {
    benefits.push(
      es
        ? `${n(fixers)} ${verb(fixers, 'fija', 'fijan')} nitrógeno en el suelo, lo que puede reducir el uso de fertilizante.`
        : `${n(fixers)} ${verb(fixers, 'fixes', 'fix')} nitrogen in the soil, which can lower fertilizer needs.`,
    );
  }
  if (rotation.coversBareWindow) {
    const months = monthList(indicators.bareWindowMonths, lang);
    const added = cropName(rotation.added, lang);
    benefits.push(es ? `${added} mantiene el suelo cubierto en los meses de suelo desnudo (${months}).` : `${added} keeps the soil covered in the bare-field months (${months}).`);
  }
  if (rotation.swap) {
    const to = cropName(rotation.swap.to, lang);
    const from = cropName(rotation.swap.from, lang);
    const days = indicators.longestDrySpellDays;
    benefits.push(
      es
        ? `${to} necesita menos agua que ${from} y tolera las rachas secas (unos ${days} días en la época de lluvias aquí).`
        : `${to} needs less water than ${from} and tolerates dry spells (about ${days} days in the rainy season here).`,
    );
  }
  if (scores.water >= 0.75) {
    const rain = indicators.meanAnnualRainMm;
    benefits.push(es ? `La necesidad de agua se ajusta a la zona: unos ${rain} mm de lluvia al año.` : `Water needs fit the zone: about ${rain} mm of rain per year.`);
  }
  const earners = rotation.crops.filter((crop) => crop.incomePotential === 'high');
  if (earners.length > 0) {
    benefits.push(
      es
        ? `${n(earners)} ${verb(earners, 'tiene', 'tienen')} alto potencial de ingreso (estimación preliminar).`
        : `${n(earners)} ${verb(earners, 'has', 'have')} high income potential (draft estimate).`,
    );
  }
  return benefits;
}

/** Risks of a rotation that need local validation, each tied to a trait or NASA number. */
export function risksFor(rotation, scores, indicators, lang = 'en') {
  const es = lang === 'es';
  const n = (crops) => names(crops, lang);
  const risks = [];
  const thirsty = rotation.crops.filter((crop) => LEVEL[crop.droughtTolerance] === 0);
  const days = indicators.longestDrySpellDays;
  if (thirsty.length > 0 && days >= 5) {
    risks.push(
      es
        ? `${n(thirsty)} ${verb(thirsty, 'es sensible', 'son sensibles')} a la sequía; la racha seca más larga de la época de lluvias promedia ${days} días.`
        : `${n(thirsty)} ${verb(thirsty, 'is', 'are')} sensitive to drought; the longest rainy-season dry spell averages ${days} days.`,
    );
  }
  const rain = indicators.meanAnnualRainMm;
  if (scores.water < 0.6) {
    risks.push(es ? `La demanda de agua puede ser alta para unos ${rain} mm de lluvia al año.` : `Water demand may be high for about ${rain} mm of rain per year.`);
  }
  if (indicators.extremeHeatDaysPerYear >= 30) {
    const heatDays = indicators.extremeHeatDaysPerYear;
    const threshold = indicators.extremeHeatThresholdC;
    risks.push(
      es
        ? `Unos ${heatDays} días al año tienen una temperatura media diaria de ${threshold} °C o más; el calor puede dañar la floración.`
        : `About ${heatDays} days per year have a daily mean of ${threshold} °C or more; heat can hurt flowering.`,
    );
  }
  if (rotation.coversBareWindow) {
    const added = cropName(rotation.added, lang);
    const months = monthList(indicators.bareWindowMonths, lang);
    risks.push(
      es
        ? `${added} tiene que crecer en los meses más secos (${months}); puede necesitar humedad residual del suelo o una siembra más temprana.`
        : `${added} has to grow in the driest months (${months}); it may need leftover soil moisture or earlier planting.`,
    );
  }
  if (rotation.swap) {
    const to = cropName(rotation.swap.to, lang);
    risks.push(
      es
        ? `${to} es nuevo en esta rotación: no están garantizados el acceso a semilla, el conocimiento ni un comprador local.`
        : `${to} is new to this rotation: seed access, know-how and a local buyer are not guaranteed.`,
    );
  }
  if (scores.erosion < 0.6) {
    const peak = indicators.peakMonthlyRainMm;
    risks.push(
      es
        ? `El suelo queda poco cubierto cuando la lluvia llega a unos ${peak} mm al mes, así que la erosión es probable.`
        : `Soil is poorly covered when rain peaks at about ${peak} mm per month, so erosion is likely.`,
    );
  }
  if (!rotation.crops.some((crop) => crop.fixesNitrogen)) {
    risks.push(
      es
        ? 'Ningún cultivo de esta rotación aporta nitrógeno, así que los nutrientes del suelo pueden disminuir con el tiempo.'
        : 'No crop in this rotation adds nitrogen, so soil nutrients may decline over time.',
    );
  }
  return risks;
}

/** What NASA POWER and this tool do not know. */
export function informationGapsFor(rotation, { fallback, fallbackZone, hasSoilMoisture, period }, zone = {}, lang = 'en') {
  const es = lang === 'es';
  const gaps = es
    ? [
        'NASA POWER no mide el tipo de suelo ni su fertilidad local.',
        'No se incluyen precios de mercado; el potencial de ingreso es una estimación aproximada.',
        'Los datos no cubren plagas ni enfermedades.',
        'Los datos de NASA POWER cubren una celda de unos 50 km; tu finca puede ser distinta.',
      ]
    : [
        'Local soil type and fertility are not measured by NASA POWER.',
        'Market prices are not included; income potential is a rough estimate.',
        'Pests and diseases are not covered by the data.',
        'NASA POWER data covers a grid cell of roughly 50 km; your farm may differ.',
      ];
  const drafts = rotation.crops.filter((crop) => crop.needsValidation);
  if (drafts.length > 0) {
    const list = names(drafts, lang);
    gaps.push(
      es
        ? `Las características de ${list} son valores preliminares pendientes de validar con un técnico local.`
        : `Crop traits for ${list} are draft values pending validation by a local technician.`,
    );
  }
  if (!hasSoilMoisture) gaps.push(es ? 'No hay datos de humedad del suelo para esta zona.' : 'Soil moisture data is not available for this zone.');
  if (fallback && fallbackZone && fallbackZone.id !== zone.id) {
    gaps.push(
      es
        ? `Los datos en vivo de NASA POWER no estaban disponibles; se usaron datos guardados de la zona piloto más cercana (${fallbackZone.name}, ${period.start}-${period.end}) en lugar de tu ubicación.`
        : `Live NASA POWER data was unavailable; stored data from the nearest pilot zone (${fallbackZone.name}, ${period.start}-${period.end}) was used instead of your location.`,
    );
  } else if (fallback) {
    gaps.push(
      es
        ? `Los datos en vivo de NASA POWER no estaban disponibles; se usaron datos guardados de ${period.start}-${period.end}.`
        : `Live NASA POWER data was unavailable; stored data for ${period.start}-${period.end} was used.`,
    );
  }
  return gaps;
}

/** Confidence note based on year-to-year rainfall variability. */
export function confidenceNoteFor(level, indicators, lang = 'en') {
  const cv = indicators.rainCV;
  if (lang === 'es') {
    return level === 'low'
      ? `La lluvia cambia mucho de un año a otro aquí (CV ${cv}), así que estos puntajes tienen menor confianza.`
      : `La lluvia es bastante estable de un año a otro aquí (CV ${cv}); los puntajes igual necesitan validación local.`;
  }
  return level === 'low'
    ? `Rainfall changes a lot from year to year here (CV ${cv}), so these scores carry lower confidence.`
    : `Rainfall is fairly stable from year to year here (CV ${cv}); scores still need local validation.`;
}

const SOURCE_NOTES_ES = { 'income potential is a draft crop trait': 'el potencial de ingreso es un dato preliminar del cultivo' };

/** Evidence with its `source` note translated; NASA parameter names stay as-is. */
export function evidenceFor(evidence, lang = 'en') {
  if (lang !== 'es') return evidence;
  return Object.fromEntries(
    Object.entries(evidence).map(([criterion, item]) => [
      criterion,
      { ...item, source: Object.entries(SOURCE_NOTES_ES).reduce((text, [en, es]) => text.replace(en, es), item.source) },
    ]),
  );
}
