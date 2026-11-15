import { test } from 'node:test';
import assert from 'node:assert/strict';
import { offlineFetch, mockRes } from './helpers.js';
import { findZone } from '../src/data/loadData.js';
import { recommend, zoneDetail } from '../src/scoring/recommend.js';
import zonesHandler from '../api/zones/index.js';
import zoneHandler from '../api/zones/[id].js';
import recommendHandler from '../api/recommend.js';

const quiet = async (fn) => {
  const original = console.warn;
  console.warn = () => {};
  try {
    return await fn();
  } finally {
    console.warn = original;
  }
};

test('recommend returns exactly three complete rotations from stored data', async () => {
  const zone = await findZone('usulutan');
  const result = await quiet(() => recommend({ zone, currentCrops: ['maize', 'bean'], priority: 'water', rainDelta: 0, heatDelta: 0 }, { fetchImpl: offlineFetch }));
  assert.equal(result.rotations.length, 3);
  assert.deepEqual(result.rotations.map((rotation) => rotation.id), ['A', 'B', 'C']);
  for (const rotation of result.rotations) {
    for (const key of ['name', 'crops', 'scores', 'evidence', 'benefits', 'risks', 'informationGaps']) assert.ok(rotation[key], key);
    for (const value of Object.values(rotation.scores)) assert.ok(value >= 0 && value <= 1);
  }
  assert.equal(result.fallback, true);
  assert.equal(typeof result.similar, 'boolean');
  assert.match(result.confidenceNote, /lower confidence/);
  assert.match(result.disclaimer, /does not replace/);
});

test('drier, hotter scenario lowers the current rotation water score', async () => {
  const zone = await findZone('san-miguel');
  const input = { zone, currentCrops: ['maize'], priority: 'income' };
  const base = await quiet(() => recommend({ ...input, rainDelta: 0, heatDelta: 0 }, { fetchImpl: offlineFetch }));
  const dry = await quiet(() => recommend({ ...input, rainDelta: -0.3, heatDelta: 2 }, { fetchImpl: offlineFetch }));
  assert.ok(dry.rotations[0].scores.water < base.rotations[0].scores.water);
  assert.deepEqual(dry.scenario, { rainDelta: -0.3, heatDelta: 2 });
});

test('zoneDetail returns twelve monthly values for charts', async () => {
  const detail = await quiet(async () => zoneDetail(await findZone('sonsonate'), { fetchImpl: offlineFetch }));
  assert.equal(detail.monthly.length, 12);
  assert.deepEqual(Object.keys(detail.monthly[0]), ['month', 'label', 'rainMm', 'tempC', 'humidityPct', 'soilMoisture']);
  assert.equal(detail.hasSoilMoisture, true);
});

test('API handlers answer with CORS and JSON (offline, using fallbacks)', async () => {
  const zones = mockRes();
  await zonesHandler({ method: 'GET' }, zones);
  assert.equal(zones.body.length, 3);
  assert.equal(zones.headers['access-control-allow-origin'], '*');

  const missing = mockRes();
  await zoneHandler({ method: 'GET', query: { id: 'mars' } }, missing);
  assert.equal(missing.statusCode, 404);

  const zone = mockRes();
  await quiet(() => zoneHandler({ method: 'GET', query: { id: 'sonsonate' } }, zone));
  assert.equal(zone.body.fallback, true);

  const bad = mockRes();
  await recommendHandler({ method: 'POST', body: { zone: 'sonsonate' } }, bad);
  assert.equal(bad.statusCode, 400);

  const good = mockRes();
  await quiet(() => recommendHandler({ method: 'POST', body: { zone: 'sonsonate', currentCrop: 'maize', priority: 'soil' } }, good));
  assert.equal(good.statusCode, 200);
  assert.equal(good.body.rotations.length, 3);
});

test('a map point uses its nearest pilot zone data when NASA POWER fails', async () => {
  const zone = { id: 'custom', name: 'Selected location', lat: 13.4, lon: -88.3, fallbackZone: { id: 'san-miguel', name: 'San Miguel' } };
  const result = await quiet(() => recommend({ zone, currentCrops: ['maize'], priority: 'soil', rainDelta: 0, heatDelta: 0 }, { fetchImpl: offlineFetch }));
  assert.equal(result.fallback, true);
  assert.equal(result.indicators.meanAnnualRainMm, 1506);
  assert.ok(result.rotations[0].informationGaps.some((text) => text.includes('nearest pilot zone (San Miguel')));
});

test('lang=es translates texts but keeps ids, scores and NASA numbers', async () => {
  const base = { zone: await findZone('usulutan'), currentCrops: ['maize', 'bean'], priority: 'water', rainDelta: 0, heatDelta: 0 };
  const en = await quiet(() => recommend({ ...base, lang: 'en' }, { fetchImpl: offlineFetch }));
  const es = await quiet(() => recommend({ ...base, lang: 'es' }, { fetchImpl: offlineFetch }));
  assert.equal(es.lang, 'es');
  assert.deepEqual(es.rotations.map((r) => r.scores), en.rotations.map((r) => r.scores));
  assert.deepEqual(es.indicators, en.indicators);
  assert.equal(es.rotations[0].crops[0].name, 'Maíz');
  assert.equal(es.rotations[0].crops[0].id, 'maize');
  assert.match(es.disclaimer, /no reemplaza/);
  assert.match(es.rotations[0].evidence.income.source, /dato preliminar/);
  assert.notEqual(es.rotations[0].benefits.join(), en.rotations[0].benefits.join());
});
