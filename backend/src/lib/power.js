import { loadFallback } from '../data/loadData.js';

export const POWER_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';

/**
 * T2M: mean air temperature at 2 m (°C).
 * PRECTOTCORR: bias-corrected precipitation (mm/day).
 * RH2M: relative humidity at 2 m (%).
 * GWETROOT: root-zone soil wetness (0 = dry, 1 = saturated), available for community=AG.
 */
export const POWER_PARAMETERS = ['T2M', 'PRECTOTCORR', 'RH2M', 'GWETROOT'];
export const FILL_VALUE = -999;
export const TIMEOUT_MS = 10_000;

const FIELD_BY_PARAMETER = {
  T2M: 'tempC',
  PRECTOTCORR: 'rainMm',
  RH2M: 'humidityPct',
  GWETROOT: 'soilMoisture',
};

/** Error raised for any NASA POWER failure; `status` is the HTTP code, 'timeout' or 'network'. */
export class PowerError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'PowerError';
    this.status = status;
  }
}

/** Last 10 complete calendar years before `today`, as YYYYMMDD strings. */
export function lastTenFullYears(today = new Date()) {
  const endYear = today.getUTCFullYear() - 1;
  return { start: `${endYear - 9}0101`, end: `${endYear}1231` };
}

/** Builds the POWER daily point URL for a zone and period. */
export function buildPowerUrl(zone, period = lastTenFullYears()) {
  const params = new URLSearchParams({
    parameters: POWER_PARAMETERS.join(','),
    community: 'AG',
    latitude: String(zone.lat),
    longitude: String(zone.lon),
    start: period.start,
    end: period.end,
    format: 'JSON',
  });
  return `${POWER_URL}?${params}`;
}

/** Human-readable message for a POWER HTTP error status. */
export function describeHttpError(status) {
  if (status === 422) return 'NASA POWER rejected the request (422): invalid parameter or date range.';
  if (status === 429) return 'NASA POWER usage limit reached (429): too many requests, try again later.';
  if (status === 500 || status === 503) return `NASA POWER is unavailable (${status}): server error.`;
  return `NASA POWER returned an unexpected status (${status}).`;
}

/** Downloads the raw POWER JSON for a zone. Throws PowerError on timeout, network or HTTP errors. */
export async function fetchPowerRaw(zone, { fetchImpl = globalThis.fetch, timeoutMs = TIMEOUT_MS, period } = {}) {
  let response;
  try {
    response = await fetchImpl(buildPowerUrl(zone, period), { signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      throw new PowerError(`NASA POWER did not respond within ${timeoutMs / 1000} s.`, 'timeout');
    }
    throw new PowerError(`Could not reach NASA POWER: ${error?.message ?? error}`, 'network');
  }
  if (!response.ok) {
    throw new PowerError(describeHttpError(response.status), response.status);
  }
  return response.json();
}

/** Converts a POWER value to a number, or null when it is the fill value (-999) or missing. */
function cleanValue(value, fillValue) {
  if (typeof value !== 'number' || Number.isNaN(value) || value === fillValue || value === FILL_VALUE) {
    return null;
  }
  return value;
}

/**
 * Turns the raw POWER response into daily records:
 * [{ date: 'YYYYMMDD', year, month, tempC, rainMm, humidityPct, soilMoisture }].
 * Missing values (-999) become null so every calculation can skip them.
 */
export function parsePowerResponse(raw) {
  const parameters = raw?.properties?.parameter;
  if (!parameters || !parameters.PRECTOTCORR) {
    throw new PowerError('NASA POWER response has no daily parameter data.', 'invalid-response');
  }
  const fillValue = raw?.header?.fill_value ?? FILL_VALUE;
  const dates = Object.keys(parameters.PRECTOTCORR).sort();
  const days = dates.map((date) => {
    const day = { date, year: Number(date.slice(0, 4)), month: Number(date.slice(4, 6)) };
    for (const [parameter, field] of Object.entries(FIELD_BY_PARAMETER)) {
      day[field] = cleanValue(parameters[parameter]?.[date], fillValue);
    }
    return day;
  });
  return {
    days,
    hasSoilMoisture: days.some((day) => day.soilMoisture !== null),
    period: { start: dates[0], end: dates[dates.length - 1] },
  };
}

/**
 * Daily climate for a zone: live POWER data, or the stored fallback when POWER fails.
 * Returns { days, hasSoilMoisture, period, fallback }.
 */
export async function getZoneDaily(zone, options = {}) {
  try {
    const raw = await fetchPowerRaw(zone, options);
    return { ...parsePowerResponse(raw), fallback: false };
  } catch (error) {
    console.warn(`[power] ${zone.id}: ${error.message} Using stored fallback data.`);
    const raw = await loadFallback(zone.id);
    return { ...parsePowerResponse(raw), fallback: true };
  }
}
