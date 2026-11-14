import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storedIndicators, cropsById } from './helpers.js';
import { WEIGHTS, weightsFor, weightedTotal } from '../src/scoring/weights.js';
import { clamp01, waterStress, scoreWater, scoreSoil, scoreErosion, scoreIncome, scoreRisk, scoreRotation } from '../src/scoring/engine.js';
import { isSimilar, confidenceLevel } from '../src/scoring/confidence.js';

const CRITERIA = ['water', 'soil', 'erosion', 'income', 'risk'];

test('weights match the agreed table and sum to 1', () => {
  assert.deepEqual(WEIGHTS.water, { water: 0.4, soil: 0.15, erosion: 0.15, income: 0.1, risk: 0.2 });
  assert.deepEqual(WEIGHTS.soil, { soil: 0.35, erosion: 0.25, water: 0.15, income: 0.1, risk: 0.15 });
  assert.deepEqual(WEIGHTS.income, { income: 0.4, water: 0.15, soil: 0.1, erosion: 0.1, risk: 0.25 });
  for (const weights of Object.values(WEIGHTS)) assert.ok(Math.abs(Object.values(weights).reduce((a, b) => a + b) - 1) < 1e-9);
  assert.throws(() => weightsFor('yield'), /Unknown priority/);
});

test('weightedTotal = sum(weight * score)', () => {
  const scores = { water: 1, soil: 0, erosion: 0, income: 0, risk: 0.5 };
  assert.ok(Math.abs(weightedTotal(scores, WEIGHTS.water) - 0.5) < 1e-9);
});

test('clamp01 and waterStress stay in 0..1', () => {
  assert.equal(clamp01(-1), 0);
  assert.equal(clamp01(2), 1);
  assert.equal(waterStress({ meanAnnualRainMm: 2500, longestDrySpellDays: 2 }), 0);
  assert.equal(waterStress({ meanAnnualRainMm: 500, longestDrySpellDays: 30 }), 1);
});

test('drought-tolerant crops score better on water in a drier zone', async () => {
  const indicators = await storedIndicators('usulutan');
  const [maize, sorghum] = await cropsById('maize', 'sorghum');
  assert.ok(scoreWater([sorghum], indicators).score > scoreWater([maize], indicators).score);
  assert.equal(scoreWater([maize], indicators).evidence.indicators.meanAnnualRainMm, 1559);
});

test('covering the bare window and fixing nitrogen raise soil score', async () => {
  const indicators = await storedIndicators('usulutan');
  const [maize, jackBean] = await cropsById('maize', 'jack-bean');
  assert.ok(scoreSoil([maize], indicators, true).score > scoreSoil([maize], indicators, false).score);
  assert.ok(scoreSoil([jackBean], indicators, false).score > scoreSoil([maize], indicators, false).score);
});

test('more soil cover gives more erosion protection', async () => {
  const indicators = await storedIndicators('sonsonate');
  const [sesame, squash] = await cropsById('sesame', 'squash');
  assert.ok(scoreErosion([squash], indicators).score > scoreErosion([sesame], indicators).score);
});

test('income and risk scores use crop traits and climate', async () => {
  const indicators = await storedIndicators('san-miguel');
  const [sorghum, sesame, bean] = await cropsById('sorghum', 'sesame', 'bean');
  assert.ok(scoreIncome([sesame], indicators).score > scoreIncome([sorghum], indicators).score);
  assert.ok(scoreRisk([sorghum], indicators).score > scoreRisk([bean], indicators).score);
  assert.equal(scoreRisk([bean], indicators).evidence.indicators.rainCV, 0.212);
});

test('scoreRotation returns five criteria plus total, all 0..1, with evidence', async () => {
  const indicators = await storedIndicators('sonsonate');
  const crops = await cropsById('maize', 'bean');
  const { scores, evidence } = scoreRotation({ crops, coversBareWindow: false }, indicators, WEIGHTS.soil);
  for (const key of [...CRITERIA, 'total']) assert.ok(scores[key] >= 0 && scores[key] <= 1, key);
  for (const key of CRITERIA) assert.ok(evidence[key].source.includes('NASA POWER'), key);
  const expected = CRITERIA.reduce((sum, key) => sum + WEIGHTS.soil[key] * scores[key], 0);
  assert.ok(Math.abs(scores.total - expected) < 0.002);
});

test('isSimilar uses the 0.05 gap between the two best totals', () => {
  assert.equal(isSimilar([0.7, 0.66, 0.2]), true);
  assert.equal(isSimilar([0.7, 0.6, 0.65]), false);
  assert.equal(isSimilar([0.7, 0.6, 0.64]), false);
  assert.equal(isSimilar([0.7]), false);
});

test('confidence is low when rainfall CV is above 0.2', async () => {
  assert.equal(confidenceLevel(await storedIndicators('sonsonate')), 'normal');
  assert.equal(confidenceLevel(await storedIndicators('usulutan')), 'low');
});
