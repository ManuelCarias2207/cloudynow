const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const POWER = 'NASA POWER';
const HEAT_DAYS_PER_DEGREE = 12;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const round = (value, digits = 3) => Number(value.toFixed(digits));
const monthNames = (months) => months.map((m) => MONTHS[m - 1]);

function indicator(key, label, value, unit, source) {
  return { key, label, value, unit, source };
}

function deriveIndicators(climate, scenario = {}) {
  const base = climate.indicators;
  const rainFactor = 1 + (scenario.rainfallChangePct || 0) / 100;
  const tempDelta = scenario.temperatureChangeC || 0;
  const drierFactor = rainFactor < 1 ? 1 + (1 - rainFactor) : 1;
  const ndviAvailable = climate.monthly.some((m) => m.ndvi !== null);
  const bareMonths = base.bareFieldWindow.months;

  const annualRainMm = round(base.annualRainMm * rainFactor, 0);
  const soilMoistureMean = round(clamp(base.soilMoistureMean * (1 - (1 - rainFactor) * 0.5)), 3);
  const longestDrySpellDays = round(base.longestDrySpellDays * drierFactor, 1);
  const extremeHeatDaysPerYear = round(base.extremeHeatDaysPerYear + tempDelta * HEAT_DAYS_PER_DEGREE, 1);

  const rainDeficit = clamp((1600 - annualRainMm) / 1000);
  const drySoil = clamp((0.7 - soilMoistureMean) / 0.4);
  const drySpell = clamp(longestDrySpellDays / 20);
  const waterStress = round(0.5 * rainDeficit + 0.3 * drySoil + 0.2 * drySpell);
  const heatStress = round(clamp(extremeHeatDaysPerYear / 120));

  return {
    annualRain: indicator('annualRainMm', 'Average annual rainfall', annualRainMm, 'mm/year', `${POWER} PRECTOTCORR`),
    rainVariability: indicator('rainVariabilityCv', 'Rainy-season rainfall variability (CV)', base.rainVariabilityCv, 'ratio', `${POWER} PRECTOTCORR`),
    drySpell: indicator('longestDrySpellDays', 'Longest dry spell in rainy season', longestDrySpellDays, 'days', `${POWER} PRECTOTCORR`),
    soilMoisture: indicator('soilMoistureMean', 'Average root-zone soil moisture', soilMoistureMean, '0-1', `${POWER} GWETROOT`),
    soilMoistureAnomaly: indicator('soilMoistureAnomaly', 'Soil moisture anomaly (latest year vs. average)', base.soilMoistureAnomaly, '0-1', `${POWER} GWETROOT`),
    heatDays: indicator('extremeHeatDaysPerYear', 'Days above 35 °C per year', extremeHeatDaysPerYear, 'days/year', `${POWER} T2M_MAX`),
    bareField: {
      ...indicator('bareFieldMonths', 'Bare-field window', monthNames(bareMonths).join(', ') || 'none', 'months', ndviAvailable ? 'MODIS NDVI' : `${POWER} (rain proxy)`),
      months: bareMonths,
      method: base.bareFieldWindow.method,
    },
    waterStress: indicator('waterStress', 'Water stress index', waterStress, '0-1', 'Derived from rainfall, soil moisture and dry spell'),
    heatStress: indicator('heatStress', 'Heat stress index', heatStress, '0-1', 'Derived from days above 35 °C'),
    ndviAvailable,
  };
}

module.exports = { MONTHS, clamp, round, monthNames, deriveIndicators };
