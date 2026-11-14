import { test } from 'node:test';
import assert from 'node:assert/strict';
import { offlineFetch } from './helpers.js';
import { loadFallback } from '../src/data/loadData.js';
import {
  buildPowerUrl, lastTenFullYears, describeHttpError, fetchPowerRaw, parsePowerResponse, getZoneDaily, PowerError,
} from '../src/lib/power.js';

const zone = { id: 'sonsonate', lat: 13.72, lon: -89.72 };

const quiet = async (fn) => {
  const original = console.warn;
  console.warn = () => {};
  try {
    return await fn();
  } finally {
    console.warn = original;
  }
};

test('lastTenFullYears covers the ten complete years before today', () => {
  assert.deepEqual(lastTenFullYears(new Date('2026-11-14')), { start: '20160101', end: '20251231' });
});

test('buildPowerUrl uses the daily point endpoint with AG community', () => {
  const url = new URL(buildPowerUrl(zone, { start: '20160101', end: '20251231' }));
  assert.equal(url.origin + url.pathname, 'https://power.larc.nasa.gov/api/temporal/daily/point');
  assert.equal(url.searchParams.get('parameters'), 'T2M,PRECTOTCORR,RH2M,GWETROOT');
  assert.equal(url.searchParams.get('community'), 'AG');
  assert.equal(url.searchParams.get('latitude'), '13.72');
  assert.equal(url.searchParams.get('start'), '20160101');
  assert.equal(url.searchParams.get('format'), 'JSON');
});

test('describeHttpError explains 422, 429, 500 and 503', () => {
  assert.match(describeHttpError(422), /invalid parameter/);
  assert.match(describeHttpError(429), /usage limit/);
  assert.match(describeHttpError(500), /server error/);
  assert.match(describeHttpError(503), /server error/);
});

test('fetchPowerRaw turns HTTP errors into PowerError with status', async () => {
  for (const status of [422, 429, 500, 503]) {
    const fetchImpl = async () => ({ ok: false, status });
    await assert.rejects(fetchPowerRaw(zone, { fetchImpl }), (error) => error instanceof PowerError && error.status === status);
  }
});

test('fetchPowerRaw reports timeouts', async () => {
  // AbortSignal.timeout timers do not keep Node alive, so a referenced timer holds the loop open.
  const fetchImpl = (url, { signal }) =>
    new Promise((resolve, reject) => {
      const keepAlive = setTimeout(() => {}, 1000);
      signal.addEventListener('abort', () => {
        clearTimeout(keepAlive);
        reject(signal.reason);
      });
    });
  await assert.rejects(fetchPowerRaw(zone, { fetchImpl, timeoutMs: 20 }), (error) => error.status === 'timeout');
});

test('fetchPowerRaw returns the JSON body on success', async () => {
  const raw = await loadFallback('sonsonate');
  const fetchImpl = async () => ({ ok: true, status: 200, json: async () => raw });
  assert.equal(await fetchPowerRaw(zone, { fetchImpl }), raw);
});

test('parsePowerResponse filters -999 fill values', () => {
  const raw = {
    header: { fill_value: -999 },
    properties: { parameter: {
      PRECTOTCORR: { 20200101: 2, 20200102: -999 },
      T2M: { 20200101: -999, 20200102: 30 },
      RH2M: { 20200101: 70, 20200102: 71 },
      GWETROOT: { 20200101: 0.5, 20200102: 0.4 },
    } },
  };
  const { days, hasSoilMoisture, period } = parsePowerResponse(raw);
  assert.equal(days[0].tempC, null);
  assert.equal(days[1].rainMm, null);
  assert.equal(days[1].month, 1);
  assert.equal(hasSoilMoisture, true);
  assert.deepEqual(period, { start: '20200101', end: '20200102' });
});

test('parsePowerResponse rejects responses without data', () => {
  assert.throws(() => parsePowerResponse({}), PowerError);
});

test('stored fallback parses to ten years of daily data', async () => {
  const { days } = parsePowerResponse(await loadFallback('usulutan'));
  assert.equal(days.length, 3653);
});

test('getZoneDaily uses the stored fallback and flags it when POWER fails', async () => {
  const result = await quiet(() => getZoneDaily(zone, { fetchImpl: offlineFetch }));
  assert.equal(result.fallback, true);
  assert.equal(result.days.length, 3653);
});

test('getZoneDaily flags live data as fallback:false', async () => {
  const raw = await loadFallback('sonsonate');
  const fetchImpl = async () => ({ ok: true, status: 200, json: async () => raw });
  assert.equal((await getZoneDaily(zone, { fetchImpl })).fallback, false);
});
