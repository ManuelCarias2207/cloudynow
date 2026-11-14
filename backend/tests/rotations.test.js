import { test } from 'node:test';
import assert from 'node:assert/strict';
import './helpers.js';
import { loadCrops } from '../src/data/loadData.js';
import { buildRotations, resolveCrops, pickCoverCrop, pickCropToReplace, pickDroughtSubstitute } from '../src/rotations/buildRotations.js';

const ids = (crops) => crops.map((crop) => crop.id);

test('buildRotations returns A, B and C from the current rotation', async () => {
  const [a, b, c] = buildRotations(['maize', 'bean'], await loadCrops());
  assert.deepEqual(ids(a.crops), ['maize', 'bean']);
  assert.deepEqual(ids(b.crops), ['maize', 'bean', 'jack-bean']);
  assert.equal(b.coversBareWindow, true);
  assert.equal(c.swap.from.id, 'maize');
  assert.equal(c.crops.length, 2);
  assert.ok(!ids(c.crops).includes('maize'));
});

test('cover crop fixes nitrogen and is not already planted', async () => {
  const crops = await loadCrops();
  const cover = pickCoverCrop(resolveCrops(['jack-bean'], crops), crops);
  assert.equal(cover.fixesNitrogen, true);
  assert.notEqual(cover.id, 'jack-bean');
});

test('C replaces the thirstiest crop with a more drought-tolerant one', async () => {
  const crops = await loadCrops();
  const current = resolveCrops(['bean', 'maize'], crops);
  const replaced = pickCropToReplace(current);
  assert.equal(replaced.id, 'maize');
  const substitute = pickDroughtSubstitute(current, crops, replaced, pickCoverCrop(current, crops));
  assert.equal(substitute.droughtTolerance, 'high');
  assert.ok(substitute.cycleMonths <= replaced.cycleMonths);
});

test('unknown crops are rejected', async () => {
  assert.throws(() => resolveCrops(['coffee'], []), /Unknown crop/);
});
