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

/** true for a real calendar date written as YYYYMMDD (POWER also uses keys like "ANN" in other endpoints). */
function isValidDate(key) {
  if (!/^\d{8}$/.test(key)) return false;
  const [year, month, day] = [key.slice(0, 4), key.slice(4, 6), key.slice(6, 8)].map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/**
 * Turns the raw POWER response into daily records (invalid date keys are ignored; a response
 * with no valid date or no valid rainfall value throws PowerError so the caller uses the fallback):
 * [{ date: 'YYYYMMDD', year, month, tempC, rainMm, humidityPct, soilMoisture }].
 * Missing values (-999) become null so every calculation can skip them.
 */
export function parsePowerResponse(raw) {
  const parameters = raw?.properties?.parameter;
  if (!parameters || !parameters.PRECTOTCORR) {
    throw new PowerError('NASA POWER response has no daily parameter data.', 'invalid-response');
  }
  const fillValue = raw?.header?.fill_value ?? FILL_VALUE;
  const dates = Object.keys(parameters.PRECTOTCORR).filter(isValidDate).sort();
  if (dates.length === 0) {
    throw new PowerError('NASA POWER response has no valid dates.', 'invalid-response');
  }
  const days = dates.map((date) => {
    const day = { date, year: Number(date.slice(0, 4)), month: Number(date.slice(4, 6)) };
    for (const [parameter, field] of Object.entries(FIELD_BY_PARAMETER)) {
      day[field] = cleanValue(parameters[parameter]?.[date], fillValue);
    }
    return day;
  });
  if (!days.some((day) => day.rainMm !== null)) {
    throw new PowerError('NASA POWER response has no valid rainfall values (all missing).', 'invalid-response');
  }
  return {
    days,
    hasSoilMoisture: days.some((day) => day.soilMoisture !== null),
    period: { start: dates[0], end: dates[dates.length - 1] },
  };
}

/** Live POWER responses are kept this long per warm server instance (the data changes once a year). */
export const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** Most map points kept in the cache; the oldest entry is dropped first. */
export const CACHE_MAX_ENTRIES = 200;

/** In-memory cache of parsed live data, keyed by the POWER URL (point + period). */
export function createPowerCache({ ttlMs = CACHE_TTL_MS, maxEntries = CACHE_MAX_ENTRIES, now = Date.now } = {}) {
  const entries = new Map();
  return {
    get(key) {
      const entry = entries.get(key);
      if (!entry) return undefined;
      if (now() - entry.storedAt > ttlMs) {
        entries.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key, value) {
      entries.delete(key);
      entries.set(key, { value, storedAt: now() });
      if (entries.size > maxEntries) entries.delete(entries.keys().next().value);
    },
    get size() {
      return entries.size;
    },
  };
}

const sharedCache = createPowerCache();

/** Error raised when neither NASA POWER nor stored data can provide climate data (HTTP 503). */
export class ClimateUnavailableError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ClimateUnavailableError';
    this.status = 503;
  }
}

/**
 * Daily climate for a zone: { days, hasSoilMoisture, period, fallback, fallbackZone? }.
 * Live POWER data is cached (only successful responses). On any live failure it uses the stored
 * fallback of the zone (or, for a custom map point, of its nearest pilot zone) with fallback: true.
 * When that also fails it throws ClimateUnavailableError.
 * An injected `fetchImpl` (tests) skips the shared cache unless a `cache` is passed explicitly.
 */
export async function getZoneDaily(zone, options = {}) {
  const { cache = options.fetchImpl ? null : sharedCache, ...fetchOptions } = options;
  const key = buildPowerUrl(zone, fetchOptions.period);
  const cached = cache?.get(key);
  if (cached) return cached;
  try {
    const raw = await fetchPowerRaw(zone, fetchOptions);
    const live = { ...parsePowerResponse(raw), fallback: false };
    cache?.set(key, live);
    return live;
  } catch (error) {
    const fallbackZone = zone.fallbackZone ?? { id: zone.id, name: zone.name };
    console.warn(`[power] ${zone.id}: ${error.message} Using stored fallback data of ${fallbackZone.id}.`);
    try {
      const raw = await loadFallback(fallbackZone.id);
      return { ...parsePowerResponse(raw), fallback: true, fallbackZone };
    } catch (fallbackError) {
      console.error(`[power] ${zone.id}: stored fallback ${fallbackZone.id} failed: ${fallbackError.message}`);
      throw new ClimateUnavailableError('Climate data is unavailable right now: NASA POWER did not respond and no stored data exists for this location. Try again later.');
    }
  }
}
