// Climate indicators computed from daily NASA POWER records
// ({ year, month, rainMm, tempC, humidityPct, soilMoisture }, null = missing).

/** A day is "dry" when it rains less than this (mm). */
export const DRY_DAY_MM = 1;
/**
 * Extreme heat threshold on T2M, which is the DAILY MEAN temperature.
 * A daily mean >= 29 °C usually means afternoon highs of ~34-35 °C, the range
 * where maize and bean flowering start to suffer.
 */
export const EXTREME_HEAT_C = 29;
/** Main rainy season (primera + postrera) in El Salvador: May to October. */
export const RAINY_SEASON_MONTHS = [5, 6, 7, 8, 9, 10];
/** A month is a bare-field candidate when its mean rainfall is below this (mm/month). */
export const BARE_MONTH_RAIN_MM = 50;

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Rounds to `digits` decimals; keeps null. */
export function round(value, digits = 2) {
  if (value === null || value === undefined) return null;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** Arithmetic mean of the non-null values, or null when there are none. */
export function mean(values) {
  const valid = values.filter((value) => value !== null && value !== undefined);
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

/** Population standard deviation of the non-null values. */
function stdDev(values) {
  const avg = mean(values);
  if (avg === null) return null;
  const valid = values.filter((value) => value !== null && value !== undefined);
  return Math.sqrt(valid.reduce((sum, value) => sum + (value - avg) ** 2, 0) / valid.length);
}

/**
 * Scenario adjustment applied to daily data BEFORE any indicator:
 * rainMm' = rainMm * (1 + rainDelta)   (rainDelta -0.2 = 20% less rain)
 * tempC'  = tempC + heatDelta          (heatDelta in °C)
 */
export function applyScenario(days, { rainDelta = 0, heatDelta = 0 } = {}) {
  return days.map((day) => ({
    ...day,
    rainMm: day.rainMm === null ? null : day.rainMm * (1 + rainDelta),
    tempC: day.tempC === null ? null : day.tempC + heatDelta,
  }));
}

/** Groups items by a key function into a Map. */
function groupBy(items, keyOf) {
  const groups = new Map();
  for (const item of items) {
    const key = keyOf(item);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  }
  return groups;
}

/**
 * Total of `field` over a period, filling missing days with the period's mean:
 * total = sum(valid values) * days / validDays. Null when every day is missing, so a gap in the
 * data is never read as a day without rain.
 */
function totalField(days, field) {
  const valid = days.map((day) => day[field]).filter((value) => value !== null && value !== undefined);
  if (valid.length === 0) return null;
  return (valid.reduce((sum, value) => sum + value, 0) * days.length) / valid.length;
}

/**
 * Monthly climatology (12 entries, one per calendar month):
 * - rainMm: mean over years of the monthly rainfall total (sum of daily mm; missing days filled with that month's mean).
 * - tempC, humidityPct, soilMoisture: mean of all valid daily values in that month.
 */
export function monthlyClimatology(days) {
  const byMonth = groupBy(days, (day) => day.month);
  return MONTH_LABELS.map((label, index) => {
    const monthDays = byMonth.get(index + 1) ?? [];
    const totalsPerYear = [...groupBy(monthDays, (day) => day.year).values()].map((yearDays) => totalField(yearDays, 'rainMm'));
    return {
      month: index + 1,
      label,
      rainMm: round(mean(totalsPerYear), 1),
      tempC: round(mean(monthDays.map((day) => day.tempC)), 1),
      humidityPct: round(mean(monthDays.map((day) => day.humidityPct)), 1),
      soilMoisture: round(mean(monthDays.map((day) => day.soilMoisture)), 2),
    };
  });
}

/**
 * Sum of the monthly rain totals of one year. Null when the year is incomplete:
 * - a month of `expectedMonths` has no record at all for this year (the dates are absent), or
 * - a month has records but every rain value is null.
 * `expectedMonths` are the calendar months seen in any year of the dataset, so a dataset that
 * only covers some months (e.g. tests) is still compared like with like.
 */
function yearlyRainTotal(yearDays, expectedMonths) {
  const byMonth = groupBy(yearDays, (day) => day.month);
  if ([...expectedMonths].some((month) => !byMonth.has(month))) return null;
  const monthTotals = [...byMonth.values()].map((monthDays) => totalField(monthDays, 'rainMm'));
  if (monthTotals.some((total) => total === null)) return null;
  return monthTotals.reduce((sum, total) => sum + total, 0);
}

/**
 * Rainfall variability between years:
 * meanAnnualMm = mean of the yearly rainfall totals.
 * cv (coefficient of variation) = standard deviation / mean of those totals.
 * A yearly total is the sum of its monthly totals (missing days filled within each month, so a
 * gap in the rainy season is not filled with dry-season rain); years with an absent or fully
 * null month are skipped.
 */
export function rainVariability(days) {
  const expectedMonths = new Set(days.map((day) => day.month));
  const totals = [...groupBy(days, (day) => day.year).values()].map((yearDays) => yearlyRainTotal(yearDays, expectedMonths));
  const avg = mean(totals);
  return { meanAnnualMm: avg, cv: avg ? stdDev(totals) / avg : null };
}

/** Longest run of consecutive dry days (rain < 1 mm) in a list of days; missing days break the run. */
export function longestRun(days) {
  let longest = 0;
  let current = 0;
  for (const day of days) {
    current = day.rainMm !== null && day.rainMm < DRY_DAY_MM ? current + 1 : 0;
    longest = Math.max(longest, current);
  }
  return longest;
}

/**
 * Longest dry spell: for each year, the longest run of consecutive days with rain < 1 mm
 * inside the rainy season (May-Oct, where it hurts crops); the result is the mean over years.
 * The dry season is excluded because it is dry every year and would hide the canícula.
 */
export function longestDrySpell(days) {
  const seasonDays = days.filter((day) => RAINY_SEASON_MONTHS.includes(day.month));
  const runs = [...groupBy(seasonDays, (day) => day.year).values()].map(longestRun);
  return mean(runs) ?? 0;
}

/** Extreme heat days per year = (days with daily mean T2M >= 29 °C) / number of years. */
export function extremeHeatDays(days) {
  const years = new Set(days.map((day) => day.year)).size;
  if (years === 0) return 0;
  return days.filter((day) => day.tempC !== null && day.tempC >= EXTREME_HEAT_C).length / years;
}

/**
 * Bare-field window: months where the soil is usually left exposed because it is too dry to farm.
 * A month qualifies when its mean rainfall < 50 mm AND (if soil moisture exists) its soil
 * moisture is below the annual mean soil moisture.
 */
export function bareWindow(monthly) {
  const annualSoil = mean(monthly.map((entry) => entry.soilMoisture));
  return monthly
    .filter((entry) => entry.rainMm !== null && entry.rainMm < BARE_MONTH_RAIN_MM)
    .filter((entry) => annualSoil === null || entry.soilMoisture === null || entry.soilMoisture < annualSoil)
    .map((entry) => entry.month);
}

/** All indicators used by the scoring engine and the charts. */
export function computeIndicators(days) {
  const monthly = monthlyClimatology(days);
  const { meanAnnualMm, cv } = rainVariability(days);
  const soilValues = monthly.map((entry) => entry.soilMoisture);
  return {
    meanAnnualRainMm: round(meanAnnualMm, 0),
    rainCV: round(cv, 3),
    longestDrySpellDays: round(longestDrySpell(days), 1),
    extremeHeatDaysPerYear: round(extremeHeatDays(days), 1),
    extremeHeatThresholdC: EXTREME_HEAT_C,
    meanSoilMoisture: round(mean(soilValues), 2),
    peakMonthlyRainMm: round(Math.max(...monthly.map((entry) => entry.rainMm ?? 0)), 0),
    bareWindowMonths: bareWindow(monthly),
    monthly,
  };
}

/** Month number (1-12) to short English label. */
export function monthLabel(month) {
  return MONTH_LABELS[month - 1];
}
