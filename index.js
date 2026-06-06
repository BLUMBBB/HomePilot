'use strict';

const { execFileSync, spawn } = require('child_process');
const http  = require('http');
const net   = require('net');
const fs    = require('fs');
const path  = require('path');

const UVICORN_PORT  = 8000;
const PORT          = parseInt(process.env.PORT || '3000', 10);
const BACKEND_DIR   = path.join(__dirname, 'backend');
const FRONTEND_DIST = path.join(__dirname, 'frontend', 'dist');
const DB_PATH       = path.join(BACKEND_DIR, 'homepilot.db');

// Routes that belong to the Python backend
const BACKEND_PREFIXES = [
  '/api/',
  '/docs',
  '/redoc',
  '/health',
  '/openapi.json',
  '/openapi-assets/',
  '/uploads/',
];

const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.js':    'application/javascript',
  '.mjs':   'application/javascript',
  '.css':   'text/css',
  '.json':  'application/json',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.webp':  'image/webp',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
};

// ---------------------------------------------------------------------------
// Auto-configure SQLite if DATABASE_URL is missing or is placeholder
// ---------------------------------------------------------------------------
function ensureDbEnv() {
  const url = process.env.DATABASE_URL || '';
  const isPlaceholder = !url || url.includes('USER:PASSWORD') || url.includes('user:pass') || url.includes('localhost/homepilot');
  if (isPlaceholder) {
    const sqliteUrl = `sqlite+aiosqlite:///${DB_PATH}`;
    const sqliteSync = `sqlite:///${DB_PATH}`;
    process.env.DATABASE_URL      = sqliteUrl;
    process.env.DATABASE_URL_SYNC = sqliteSync;
    console.log(`[db] using SQLite: ${DB_PATH}`);
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function findPython() {
  const candidates = [
    'python3', 'python',
    '/usr/bin/python3', '/usr/local/bin/python3',
    '/opt/alt/python39/bin/python3',
    '/opt/alt/python311/bin/python3',
  ];
  for (const cmd of candidates) {
    try {
      const out = execFileSync(cmd, ['--version'], { timeout: 5000 }).toString();
      if (out.includes('Python 3')) { console.log(`[python] ${cmd}: ${out.trim()}`); return cmd; }
    } catch (e) {
      const se = (e.stderr || Buffer.alloc(0)).toString();
      if (se.includes('Python 3')) { console.log(`[python] ${cmd}: ${se.trim()}`); return cmd; }
    }
  }
  throw new Error('Python 3 not found on this server.');
}

function packagesInstalled(python) {
  try {
    execFileSync(python, ['-c', 'import fastapi, uvicorn, sqlalchemy, aiosqlite'], {
      timeout: 5000, stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function installDeps(python) {
  // Skip if already installed (e.g. manually via pip --user)
  if (packagesInstalled(python)) {
    console.log('[pip] packages already installed, skipping.');
    return;
  }

  const req = path.join(BACKEND_DIR, 'requirements.txt');
  if (!fs.existsSync(req)) { console.warn('[pip] requirements.txt not found'); return; }

  // Try pip via ~/.local/bin/pip first (installed with --user)
  const userPip = path.join(process.env.HOME || '/root', '.local', 'bin', 'pip');
  const strategies = [
    { label: 'user pip',             cmd: userPip,  args: ['install', '-r', req, '--user'] },
    { label: '--user',               cmd: python,   args: ['-m', 'pip', 'install', '-r', req, '--user'] },
    { label: 'no flag',              cmd: python,   args: ['-m', 'pip', 'install', '-r', req] },
    { label: '--break-system-pkgs',  cmd: python,   args: ['-m', 'pip', 'install', '-r', req, '--break-system-packages'] },
  ];

  for (const s of strategies) {
    try {
      console.log(`[pip] trying ${s.label}…`);
      execFileSync(s.cmd, s.args, { cwd: BACKEND_DIR, stdio: 'inherit', timeout: 300_000 });
      console.log('[pip] done.');
      return;
    } catch {
      console.warn(`[pip] ${s.label} failed, trying next…`);
    }
  }
  throw new Error('[pip] install failed. Run manually: python3 -m pip install -r backend/requirements.txt --user');
}

function waitForPort(port, ms = 40_000) {
  return new Promise((resolve, reject) => {
    const stop = Date.now() + ms;
    const attempt = () => {
      const s = new net.Socket();
      s.setTimeout(1000);
      s.on('connect', () => { s.destroy(); resolve(); });
      s.on('error',   () => { s.destroy(); retry(); });
      s.on('timeout', () => { s.destroy(); retry(); });
      s.connect(port, '127.0.0.1');
    };
    const retry = () => Date.now() < stop ? setTimeout(attempt, 1000) : reject(new Error(`port ${port} not ready after ${ms}ms`));
    attempt();
  });
}

// ---------------------------------------------------------------------------
// Request routing
// ---------------------------------------------------------------------------
function isBackendRoute(reqUrl) {
  const p = reqUrl.split('?')[0];
  return BACKEND_PREFIXES.some(prefix => p === prefix.replace(/\/$/, '') || p.startsWith(prefix));
}

function proxyToBackend(req, res) {
  const upstream = http.request({
    hostname: '127.0.0.1', port: UVICORN_PORT,
    path: req.url, method: req.method,
    headers: { ...req.headers, host: `127.0.0.1:${UVICORN_PORT}` },
  }, (pr) => {
    res.writeHead(pr.statusCode, pr.headers);
    pr.pipe(res);
  });
  upstream.on('error', () => { if (!res.headersSent) { res.writeHead(502); res.end('Bad Gateway'); } });
  req.pipe(upstream);
}

function serveStatic(req, res) {
  let fp = path.join(FRONTEND_DIST, req.url.split('?')[0]);
  if (!fs.existsSync(fp) || fs.statSync(fp).isDirectory()) fp = path.join(FRONTEND_DIST, 'index.html');
  if (!fs.existsSync(fp)) { res.writeHead(404); res.end('Not Found'); return; }
  const mime = MIME[path.extname(fp)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(fp).pipe(res);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  ensureDbEnv();

  const python = findPython();
  installDeps(python);

  const uvicorn = spawn(python, [
    '-m', 'uvicorn', 'app.main:app',
    '--host', '127.0.0.1', '--port', String(UVICORN_PORT), '--workers', '1',
  ], {
    cwd: BACKEND_DIR,
    env: { ...process.env, PYTHONPATH: BACKEND_DIR + (process.env.PYTHONPATH ? ':' + process.env.PYTHONPATH : '') },
  });

  uvicorn.stdout.on('data', d => process.stdout.write(d));
  uvicorn.stderr.on('data', d => process.stderr.write(d));
  uvicorn.on('close', code => { console.error(`[uvicorn] exited: ${code}`); process.exit(code ?? 1); });

  console.log('[uvicorn] waiting for startup…');
  await waitForPort(UVICORN_PORT);
  console.log(`[uvicorn] ready on 127.0.0.1:${UVICORN_PORT}`);

  const server = http.createServer((req, res) =>
    isBackendRoute(req.url) ? proxyToBackend(req, res) : serveStatic(req, res)
  );
  server.listen(PORT, () => console.log(`[server] listening on port ${PORT}`));

  const shutdown = () => { uvicorn.kill('SIGTERM'); server.close(() => process.exit(0)); };
  process.on('SIGTERM', shutdown).on('SIGINT', shutdown);
}

main().catch(e => { console.error('[fatal]', e.message); process.exit(1); });
