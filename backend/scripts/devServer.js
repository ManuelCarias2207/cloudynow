// Local development server that runs the Vercel functions in /api without the Vercel CLI.
// Usage: npm run dev  (http://localhost:3001). On Vercel this file is not used.
import { createServer } from 'node:http';
import zonesHandler from '../api/zones/index.js';
import zoneHandler from '../api/zones/[id].js';
import recommendHandler from '../api/recommend.js';

const PORT = Number(process.env.PORT ?? 3001);

/** Matches a path to a handler and the dynamic query values Vercel would add. */
function route(pathname) {
  if (pathname === '/api/zones') return { handler: zonesHandler, params: {} };
  if (pathname === '/api/recommend') return { handler: recommendHandler, params: {} };
  const match = pathname.match(/^\/api\/zones\/([^/]+)$/);
  if (match) return { handler: zoneHandler, params: { id: decodeURIComponent(match[1]) } };
  return null;
}

/** Reads the request body and parses JSON like Vercel does. */
async function readBody(req) {
  let text = '';
  for await (const chunk of req) text += chunk;
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const found = route(url.pathname);
  if (!found) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found.' }));
    return;
  }
  req.query = { ...Object.fromEntries(url.searchParams), ...found.params };
  req.body = await readBody(req);
  await found.handler(req, res);
}).listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
