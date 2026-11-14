import { test } from 'node:test';
import assert from 'node:assert/strict';
import { storedDays } from './helpers.js';
import {
  applyScenario, monthlyClimatology, rainVariability, longestRun, longestDrySpell, extremeHeatDays, bareWindow,
  computeIndicators, mean, round, monthLabel,
} from '../src/lib/indicators.js';

const day = (year, month, rainMm, tempC = 25, soilMoisture = 0.5) => ({ year, month, rainMm, tempC, humidityPct: 70, soilMoisture });

test('mean ignores nulls and round keeps null', () => {
  assert.equal(mean([1, null, 3]), 2);
  assert.equal(mean([null]), null);
  assert.equal(round(1.234, 1), 1.2);
  assert.equal(round(null), null);
  assert.equal(monthLabel(12), 'Dec');
});

test('applyScenario scales rain and shifts temperature', () => {
  const [adjusted] = applyScenario([day(2020, 1, 10, 25)], { rainDelta: -0.2, heatDelta: 2 });
  assert.equal(adjusted.rainMm, 8);
  assert.equal(adjusted.tempC, 27);
  assert.equal(applyScenario([day(2020, 1, null, null)])[0].rainMm, null);
});

test('monthlyClimatology averages monthly totals over years', () => {
  const monthly = monthlyClimatology([day(2020, 1, 10), day(2020, 1, 20), day(2021, 1, 10)]);
  assert.equal(monthly.length, 12);
  assert.equal(monthly[0].rainMm, 20);
  assert.equal(monthly[0].soilMoisture, 0.5);
  assert.equal(monthly[1].rainMm, null);
});

test('rainVariability computes the coefficient of variation of yearly totals', () => {
  const { meanAnnualMm, cv } = rainVariability([day(2020, 1, 100), day(2021, 1, 300)]);
  assert.equal(meanAnnualMm, 200);
  assert.equal(cv, 0.5);
});

test('longestRun counts consecutive days under 1 mm', () => {
  assert.equal(longestRun([0, 0.5, 2, 0, 0, 0, null, 0].map((rain) => day(2020, 6, rain))), 3);
});

test('longestDrySpell only uses the May-October season, averaged by year', () => {
  const days = [day(2020, 1, 0), day(2020, 1, 0), day(2020, 6, 0), day(2021, 6, 0), day(2021, 6, 0), day(2021, 6, 0)];
  assert.equal(longestDrySpell(days), 2);
});

test('extremeHeatDays counts days with mean T2M >= 29 °C per year', () => {
  assert.equal(extremeHeatDays([day(2020, 4, 0, 29), day(2020, 4, 0, 28.9), day(2021, 4, 0, 31)]), 1);
});

test('bareWindow picks dry months with below-average soil moisture', () => {
  const monthly = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, rainMm: i < 3 ? 10 : 200, soilMoisture: i === 2 ? 0.9 : 0.5 }));
  assert.deepEqual(bareWindow(monthly), [1, 2]);
});

test('Sonsonate indicators from stored NASA POWER data', async () => {
  const indicators = computeIndicators(await storedDays('sonsonate'));
  assert.equal(indicators.meanAnnualRainMm, 2292);
  assert.equal(indicators.rainCV, 0.163);
  assert.deepEqual(indicators.bareWindowMonths, [1, 2, 12]);
  assert.equal(indicators.monthly.length, 12);
  assert.ok(indicators.extremeHeatDaysPerYear > 0);
});

test('less rain in the scenario lowers rainfall and lengthens dry spells', async () => {
  const days = await storedDays('san-miguel');
  const base = computeIndicators(days);
  const drier = computeIndicators(applyScenario(days, { rainDelta: -0.3, heatDelta: 2 }));
  assert.ok(drier.meanAnnualRainMm < base.meanAnnualRainMm);
  assert.ok(drier.longestDrySpellDays >= base.longestDrySpellDays);
  assert.ok(drier.extremeHeatDaysPerYear > base.extremeHeatDaysPerYear);
});
