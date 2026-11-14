import { test } from 'node:test';
import assert from 'node:assert/strict';
import './helpers.js';
import { loadZones, findZone, loadCrops, loadFallback } from '../src/data/loadData.js';

test('zones have id, name, lat, lon', async () => {
  const zones = await loadZones();
  assert.deepEqual(zones.map((zone) => zone.id), ['sonsonate', 'usulutan', 'san-miguel']);
  for (const zone of zones) assert.deepEqual(Object.keys(zone), ['id', 'name', 'lat', 'lon']);
});

test('findZone returns null for unknown ids', async () => {
  assert.equal((await findZone('sonsonate')).lat, 13.72);
  assert.equal(await findZone('nowhere'), null);
});

test('crops carry all draft traits and need validation', async () => {
  const crops = await loadCrops();
  assert.equal(crops.length, 8);
  for (const crop of crops) {
    assert.equal(crop.needsValidation, true);
    for (const trait of ['waterDemand', 'droughtTolerance', 'soilCover', 'incomePotential']) {
      assert.ok(['low', 'medium', 'high'].includes(crop[trait]), `${crop.id}.${trait}`);
    }
    assert.equal(typeof crop.fixesNitrogen, 'boolean');
    assert.ok(crop.cycleMonths > 0);
  }
});

test('every zone has a stored NASA POWER fallback', async () => {
  for (const zone of await loadZones()) {
    const raw = await loadFallback(zone.id);
    for (const parameter of ['T2M', 'PRECTOTCORR', 'RH2M', 'GWETROOT']) assert.ok(raw.properties.parameter[parameter]);
  }
});

test('loadFallback rejects unsafe ids', async () => {
  await assert.rejects(loadFallback('../zones'), /Invalid zone id/);
});
