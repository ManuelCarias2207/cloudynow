const test = require('node:test');
const assert = require('node:assert/strict');

const { evaluate } = require('../src/scoring/engine');
const { weightsForPriority } = require('../src/scoring/weights');
const { rankRotations } = require('../src/scoring/confidence');
const { validateRecommendInput } = require('../src/lib/validation');
const { renderExplanation } = require('../src/explain/templates');
const { MAX_WORDS } = require('../src/explain/prompt');
const { createServer } = require('../src/server');

const baseInput = (overrides = {}) => validateRecommendInput({
  zoneId: 'chalatenango',
  currentCrop: 'maize-bean',
  priority: 'save-water',
  ...overrides,
});

test('weights sum to 1 and favor the chosen priority', () => {
  for (const priority of ['save-water', 'extra-income', 'improve-soil']) {
    const weights = weightsForPriority(priority);
    const sum = Object.values(weights).reduce((a, b) => a + b, 0);
    assert.ok(Math.abs(sum - 1) < 1e-3);
    assert.equal(Math.max(...Object.values(weights)), 0.4);
  }
  assert.equal(weightsForPriority('save-water').water, 0.4);
});

test('always returns three rotations A, B, C with scores between 0 and 1', () => {
  for (const currentCrop of ['maize-bean', 'coffee', 'vegetables']) {
    const result = evaluate(baseInput({ currentCrop }));
    assert.deepEqual(result.rotations.map((r) => r.id), ['A', 'B', 'C']);
    for (const rotation of result.rotations) {
      for (const { score, evidence } of Object.values(rotation.scores)) {
        assert.ok(score >= 0 && score <= 1);
        assert.ok(evidence.length > 0);
      }
    }
    assert.ok(result.disclaimer.includes('does not replace'));
    assert.ok(result.dataGaps.some((g) => g.key === 'market_prices'));
  }
});

test('respects avoided crops', () => {
  const result = evaluate(baseInput({ constraints: { avoidCrops: ['jack-bean', 'sorghum'] } }));
  const cropIds = result.rotations.flatMap((r) => r.crops.map((c) => c.id));
  assert.ok(!cropIds.includes('jack-bean'));
  assert.ok(!cropIds.includes('sorghum'));
});

test('less rain lowers the water score of the current rotation', () => {
  const normal = evaluate(baseInput());
  const dry = evaluate(baseInput({ scenario: { rainfallChangePct: -40 } }));
  assert.ok(dry.rotations[0].scores.water.score < normal.rotations[0].scores.water.score);
});

test('marks top options as similar when the gap is below 0.05', () => {
  const ranking = rankRotations([
    { id: 'A', name: 'A', total: 0.6 },
    { id: 'B', name: 'B', total: 0.63 },
    { id: 'C', name: 'C', total: 0.5 },
  ]);
  assert.equal(ranking.similar, true);
  assert.equal(ranking.best, null);
});

test('rejects invalid input', () => {
  assert.throws(() => validateRecommendInput({ zoneId: 'nope', currentCrop: 'maize-bean', priority: 'save-water' }), /Invalid request body/);
  assert.throws(() => baseInput({ scenario: { rainfallChangePct: -90 } }), /Invalid request body/);
});

test('template explanations stay within the word limit', () => {
  const result = evaluate(baseInput());
  for (const rotation of result.rotations) {
    assert.ok(renderExplanation(rotation, result).split(/\s+/).length <= MAX_WORDS + 1);
  }
});

test('HTTP API serves health, zones, climate, recommend and explain', async (t) => {
  delete process.env.LLM_API_KEY;
  const server = createServer().listen(0);
  t.after(() => server.close());
  const base = `http://localhost:${server.address().port}/api`;
  const post = (path, body) => fetch(`${base}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  assert.equal((await (await fetch(`${base}/health`)).json()).status, 'ok');
  assert.equal((await (await fetch(`${base}/zones`)).json()).zones.length, 3);
  assert.equal((await (await fetch(`${base}/zones/morazan/climate`)).json()).monthly.length, 12);
  assert.equal((await fetch(`${base}/zones/unknown/climate`)).status, 404);

  const body = { zoneId: 'la-union', currentCrop: 'maize-bean', priority: 'improve-soil' };
  assert.equal((await (await post('/recommend', body)).json()).rotations.length, 3);
  assert.equal((await post('/recommend', {})).status, 400);
  const explained = await (await post('/explain', { ...body, strategyId: 'B' })).json();
  assert.equal(explained.explanations[0].source, 'template');
});
