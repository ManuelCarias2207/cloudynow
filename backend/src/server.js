const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');

const BACKEND_DIR = path.join(__dirname, '..');
const API_DIR = path.join(BACKEND_DIR, 'api');
const ENV_FILE = path.join(BACKEND_DIR, '.env');

if (fs.existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

function discoverRoutes(dir, prefix = '/api') {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return discoverRoutes(full, `${prefix}/${entry.name}`);
    if (!entry.name.endsWith('.js')) return [];
    const name = entry.name.slice(0, -3);
    const route = name === 'index' ? prefix : `${prefix}/${name}`;
    const params = [];
    const pattern = route.split('/').map((segment) => {
      const match = segment.match(/^\[(.+)\]$/);
      if (!match) return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      params.push(match[1]);
      return '([^/]+)';
    }).join('/');
    return [{ route, params, regex: new RegExp(`^${pattern}/?$`), handler: require(full) }];
  });
}

function createServer() {
  const routes = discoverRoutes(API_DIR);
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/' || url.pathname === '/api') {
      res.setHeader('Content-Type', 'application/json');
      return res.end(JSON.stringify({ service: 'siembra-satelital-api', routes: routes.map((r) => r.route) }));
    }
    for (const { regex, params, handler } of routes) {
      const match = url.pathname.match(regex);
      if (!match) continue;
      req.query = Object.fromEntries(url.searchParams);
      params.forEach((name, i) => { req.query[name] = decodeURIComponent(match[i + 1]); });
      return handler(req, res);
    }
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: { code: 'not_found', message: `No route for ${url.pathname}` } }));
  });
}

if (require.main === module) {
  const port = Number(process.env.PORT) || 3001;
  const server = createServer();
  server.on('request', (req, res) => {
    const start = Date.now();
    res.on('finish', () => console.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - start}ms`));
  });
  server.listen(port, () => console.log(`Siembra Satelital API listening on http://localhost:${port}/api`));
}

module.exports = { createServer };
