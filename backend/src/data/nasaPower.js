const MONTH_KEYS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const DAYS_IN_MONTH = [31, 28.25, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map();

function config() {
  return {
    enabled: process.env.NASA_POWER_LIVE !== 'false',
    baseUrl: process.env.NASA_POWER_BASE_URL || 'https://power.larc.nasa.gov/api',
    timeoutMs: Number(process.env.NASA_POWER_TIMEOUT_MS) || 8000,
  };
}

async function fetchClimatology(zone) {
  const { enabled, baseUrl, timeoutMs } = config();
  if (!enabled) throw new Error('NASA POWER live requests are disabled (NASA_POWER_LIVE=false)');

  const cached = cache.get(zone.id);
  if (cached && Date.now() - cached.fetchedAtMs < CACHE_TTL_MS) return cached.value;

  const url = new URL(`${baseUrl}/temporal/climatology/point`);
  url.search = new URLSearchParams({
    parameters: 'PRECTOTCORR,T2M_MAX,GWETROOT',
    community: 'AG',
    latitude: String(zone.lat),
    longitude: String(zone.lon),
    format: 'JSON',
  });
  const response = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
  if (!response.ok) throw new Error(`NASA POWER responded ${response.status}`);
  const { properties } = await response.json();
  const p = properties.parameter;

  const value = {
    source: 'NASA POWER climatology API (community=AG)',
    fetchedAt: new Date().toISOString(),
    monthly: MONTH_KEYS.map((key, i) => ({
      month: i + 1,
      rainMm: round(p.PRECTOTCORR[key] * DAYS_IN_MONTH[i], 1),
      tMaxC: round(p.T2M_MAX[key], 1),
      soilMoisture: round(p.GWETROOT[key], 3),
    })),
  };
  cache.set(zone.id, { value, fetchedAtMs: Date.now() });
  return value;
}

function round(value, digits) {
  return typeof value === 'number' && value > -900 ? Number(value.toFixed(digits)) : null;
}

module.exports = { fetchClimatology, nasaPowerConfig: config };
