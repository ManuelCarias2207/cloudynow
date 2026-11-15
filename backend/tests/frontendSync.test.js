// The frontend keeps its own copy of the crop ids and El Salvador bounds (it is deployed apart from
// the backend). This test fails when the two copies drift.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { loadCrops } from '../src/data/loadData.js';
import { EL_SALVADOR_BOUNDS, MAX_CURRENT_CROPS } from '../src/lib/validation.js';
import { PRIORITIES } from '../src/scoring/weights.js';

const frontendConstants = await readFile(new URL('../../frontend/src/lib/constants.js', import.meta.url), 'utf8');

test('frontend crop ids match backend/data/crops.json', async () => {
  const cropsBlock = frontendConstants.match(/export const CROPS = \[([\s\S]*?)\];/)[1];
  const frontendIds = [...cropsBlock.matchAll(/id: '([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(frontendIds.sort(), (await loadCrops()).map((crop) => crop.id).sort());
});

test('frontend priorities, crop limit and El Salvador bounds match the backend', () => {
  const prioritiesBlock = frontendConstants.match(/export const PRIORITIES = \[([\s\S]*?)\];/)[1];
  const frontendPriorities = [...prioritiesBlock.matchAll(/id: '([^']+)'/g)].map((match) => match[1]);
  assert.deepEqual(frontendPriorities.sort(), [...PRIORITIES].sort());
  assert.equal(Number(frontendConstants.match(/export const MAX_CROPS = (\d+);/)[1]), MAX_CURRENT_CROPS);
  for (const [key, value] of Object.entries(EL_SALVADOR_BOUNDS)) {
    assert.equal(Number(frontendConstants.match(new RegExp(`${key}: (-?[0-9.]+)`))[1]), value, key);
  }
});
