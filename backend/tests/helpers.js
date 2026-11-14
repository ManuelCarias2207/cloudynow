// Shared test helpers. Tests never call NASA POWER: any real fetch fails loudly.
import { loadFallback, loadCrops } from '../src/data/loadData.js';
import { parsePowerResponse } from '../src/lib/power.js';
import { computeIndicators } from '../src/lib/indicators.js';

globalThis.fetch = async () => {
  throw new Error('Tests must not call the real NASA POWER API.');
};

/** A fetch stub that always fails, forcing the stored fallback. */
export const offlineFetch = async () => {
  throw new Error('offline');
};

/** Parsed daily data from the stored fallback of a zone. */
export async function storedDays(zoneId) {
  return parsePowerResponse(await loadFallback(zoneId)).days;
}

/** Indicators computed from the stored fallback of a zone. */
export async function storedIndicators(zoneId) {
  return computeIndicators(await storedDays(zoneId));
}

/** Crop objects by id. */
export async function cropsById(...ids) {
  const crops = await loadCrops();
  return ids.map((id) => crops.find((crop) => crop.id === id));
}

/** Minimal mock of a Node http response. */
export function mockRes() {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(body) {
      this.body = body === undefined ? undefined : JSON.parse(body);
    },
  };
}
