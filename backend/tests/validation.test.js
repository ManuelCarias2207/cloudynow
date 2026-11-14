import { test } from 'node:test';
import assert from 'node:assert/strict';
import './helpers.js';
import { loadZones, loadCrops } from '../src/data/loadData.js';
import { validateRecommendBody, ValidationError } from '../src/lib/validation.js';

const context = async () => ({ zones: await loadZones(), crops: await loadCrops() });

test('accepts a single crop or a list, and defaults deltas to 0', async () => {
  const ctx = await context();
  const single = validateRecommendBody({ zone: 'sonsonate', currentCrop: 'maize', priority: 'water' }, ctx);
  assert.deepEqual(single.currentCrops, ['maize']);
  assert.equal(single.rainDelta, 0);
  assert.equal(single.zone.id, 'sonsonate');
  const list = validateRecommendBody(JSON.stringify({ zone: 'usulutan', currentCrop: ['maize', 'bean'], priority: 'soil', rainDelta: -0.2, heatDelta: 2 }), ctx);
  assert.deepEqual(list.currentCrops, ['maize', 'bean']);
  assert.equal(list.heatDelta, 2);
});

test('rejects invalid input with clear 400 errors', async () => {
  const ctx = await context();
  const bad = [
    [{ zone: 'mars', currentCrop: 'maize', priority: 'water' }, /zone/],
    [{ zone: 'sonsonate', currentCrop: 'coffee', priority: 'water' }, /Unknown crop/],
    [{ zone: 'sonsonate', currentCrop: ['maize', 'maize'], priority: 'water' }, /repeat/],
    [{ zone: 'sonsonate', currentCrop: 'maize', priority: 'yield' }, /priority/],
    [{ zone: 'sonsonate', currentCrop: 'maize', priority: 'water', rainDelta: -2 }, /rainDelta/],
    [{ zone: 'sonsonate', currentCrop: 'maize', priority: 'water', heatDelta: '2' }, /heatDelta/],
    ['{not json', /valid JSON/],
  ];
  for (const [body, message] of bad) {
    assert.throws(() => validateRecommendBody(body, ctx), (error) => error instanceof ValidationError && error.status === 400 && message.test(error.message));
  }
});
