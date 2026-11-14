const MAX_BODY_BYTES = 100 * 1024;

class HttpError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function resolveAllowedOrigin(requestOrigin) {
  const configured = (process.env.CORS_ORIGIN || '*').split(',').map((o) => o.trim()).filter(Boolean);
  if (configured.includes('*')) return '*';
  return configured.includes(requestOrigin) ? requestOrigin : configured[0];
}

function applyCors(req, res, methods) {
  res.setHeader('Access-Control-Allow-Origin', resolveAllowedOrigin(req.headers.origin));
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', [...methods, 'OPTIONS'].join(','));
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function sendError(res, status, code, message, details) {
  sendJson(res, status, { error: { code, message, ...(details ? { details } : {}) } });
}

function getQuery(req) {
  if (req.query) return req.query;
  const { searchParams } = new URL(req.url, 'http://localhost');
  return Object.fromEntries(searchParams);
}

async function readJsonBody(req) {
  if (req.body !== undefined && req.body !== null && req.body !== '') {
    if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) return req.body;
    return parseJson(req.body.toString());
  }
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) throw new HttpError(413, 'payload_too_large', 'Request body is too large');
    chunks.push(chunk);
  }
  return chunks.length ? parseJson(Buffer.concat(chunks).toString()) : {};
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'invalid_json', 'Request body must be valid JSON');
  }
}

function createHandler({ methods, handle }) {
  return async function handler(req, res) {
    applyCors(req, res, methods);
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      return res.end();
    }
    if (!methods.includes(req.method)) {
      res.setHeader('Allow', methods.join(','));
      return sendError(res, 405, 'method_not_allowed', `Use ${methods.join(' or ')}`);
    }
    try {
      const result = await handle(req, res);
      if (!res.writableEnded) sendJson(res, 200, result);
    } catch (error) {
      if (error instanceof HttpError) return sendError(res, error.status, error.code, error.message, error.details);
      console.error(error);
      sendError(res, 500, 'internal_error', 'Unexpected server error');
    }
  };
}

module.exports = { HttpError, createHandler, getQuery, readJsonBody, sendJson, sendError };
