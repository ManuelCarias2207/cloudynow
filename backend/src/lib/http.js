// Small helpers for Vercel Node functions (req/res are Node http objects).

/** Adds CORS headers so the frontend can call the API from any origin. */
export function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

/** Sends a JSON response. */
export function sendJson(res, status, data) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(data));
}

/** Sends { error: message }. */
export function sendError(res, status, message) {
  sendJson(res, status, { error: message });
}

/**
 * Wraps a handler with CORS, OPTIONS preflight, allowed methods and error handling.
 * Errors with a numeric `status` (e.g. ValidationError) keep their status and message.
 */
export function createHandler(methods, handler) {
  return async function wrapped(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }
    if (!methods.includes(req.method)) {
      res.setHeader('Allow', methods.join(','));
      sendError(res, 405, `Method ${req.method} not allowed.`);
      return;
    }
    try {
      await handler(req, res);
    } catch (error) {
      if (typeof error.status === 'number') {
        sendError(res, error.status, error.message);
        return;
      }
      console.error(error);
      sendError(res, 500, 'Internal server error.');
    }
  };
}
