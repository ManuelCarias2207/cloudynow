import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storedIndicators } from './helpers.js';
import { loadCrops } from '../src/data/loadData.js';
import { buildRotations } from '../src/rotations/buildRotations.js';
import { DISCLAIMER, benefitsFor, risksFor, informationGapsFor, confidenceNoteFor } from '../src/explain/templates.js';

const lowScores = { water: 0.5, soil: 0.5, erosion: 0.5, income: 0.5, risk: 0.5 };

test('disclaimer says the tool supports and does not replace judgment', () => {
  assert.match(DISCLAIMER, /supports/);
  assert.match(DISCLAIMER, /does not replace/);
  assert.match(DISCLAIMER, /technicians/);
});

test('benefits and risks quote NASA numbers', async () => {
  const indicators = await storedIndicators('usulutan');
  const [a, b, c] = buildRotations(['maize', 'bean'], await loadCrops());
  assert.ok(benefitsFor(b, lowScores, indicators).some((text) => text.includes('Jan, Feb, Mar')));
  assert.ok(benefitsFor(c, lowScores, indicators).some((text) => text.includes(String(indicators.longestDrySpellDays))));
  assert.ok(risksFor(a, lowScores, indicators).some((text) => text.includes('1559 mm')));
  assert.ok(risksFor(c, lowScores, indicators).some((text) => text.includes('new to this rotation')));
});

test('information gaps always list soil, prices and pests, plus fallback note', async () => {
  const [a] = buildRotations(['maize'], await loadCrops());
  const gaps = informationGapsFor(a, { fallback: true, hasSoilMoisture: false, period: { start: '20160101', end: '20251231' } });
  for (const word of ['soil type', 'prices', 'Pests', 'draft values', 'Soil moisture data', 'stored data']) {
    assert.ok(gaps.some((text) => text.includes(word)), word);
  }
});

test('confidence note mentions the rainfall CV', () => {
  assert.match(confidenceNoteFor('low', { rainCV: 0.25 }), /CV 0\.25.*lower confidence/);
  assert.match(confidenceNoteFor('normal', { rainCV: 0.1 }), /CV 0\.1/);
});

test('swap and no-swap benefits only claim real advantages', async () => {
  const indicators = await storedIndicators('usulutan');
  const crops = await loadCrops();
  const [, , squashSwap] = buildRotations(['squash'], crops);
  const text = benefitsFor(squashSwap, lowScores, indicators).find((line) => line.startsWith(squashSwap.swap.to.name));
  assert.match(text, /needs less water than Squash/);
  assert.match(text, /tolerates dry spells better than Squash/);
  const [, , noSwap] = buildRotations(['sorghum', 'sesame', 'cowpea', 'jack-bean'], crops);
  assert.ok(benefitsFor(noSwap, lowScores, indicators).some((line) => line.includes('no swap is suggested')));
  assert.ok(!risksFor(noSwap, lowScores, indicators).some((line) => line.includes('new to this rotation')));
});
