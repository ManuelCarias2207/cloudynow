import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mockRes } from './helpers.js';
import { createHandler, sendJson } from '../src/lib/http.js';

const ok = createHandler(['GET'], async (req, res) => sendJson(res, 200, { ok: true }));

test('adds CORS headers and answers preflight', async () => {
  const res = mockRes();
  await ok({ method: 'OPTIONS' }, res);
  assert.equal(res.statusCode, 204);
  assert.equal(res.headers['access-control-allow-origin'], '*');
});

test('sends JSON and rejects other methods with 405', async () => {
  const good = mockRes();
  await ok({ method: 'GET' }, good);
  assert.deepEqual(good.body, { ok: true });
  assert.match(good.headers['content-type'], /application\/json/);
  const res = mockRes();
  await ok({ method: 'DELETE' }, res);
  assert.equal(res.statusCode, 405);
});

test('maps errors to status codes', async () => {
  const withStatus = createHandler(['GET'], async () => {
    throw Object.assign(new Error('Bad input.'), { status: 400 });
  });
  const res = mockRes();
  await withStatus({ method: 'GET' }, res);
  assert.deepEqual([res.statusCode, res.body.error], [400, 'Bad input.']);
  const crash = createHandler(['GET'], async () => {
    throw new Error('boom');
  });
  const res2 = mockRes();
  const original = console.error;
  console.error = () => {};
  await crash({ method: 'GET' }, res2);
  console.error = original;
  assert.deepEqual([res2.statusCode, res2.body.error], [500, 'Internal server error.']);
});
