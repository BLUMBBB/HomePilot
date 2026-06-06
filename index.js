'use strict';

// Node.js launcher for HomePilot on Hostinger.
// Finds Python 3 on the server, installs pip deps, spawns uvicorn on an
// internal port, then proxies all backend routes there and serves the
// pre-built React SPA for everything else.

const { execFileSync, spawn } = require('child_process');
const http  = require('http');
const net   = require('net');
const fs    = require('fs');
const path  = require('path');

const UVICORN_PORT = 8000;
const PORT         = parseInt(process.env.PORT || '3000', 10);
const BACKEND_DIR  = path.join(__dirname, 'backend');
const FRONTEND_DIST = path.join(__dirname, 'frontend', 'dist');

// Paths that belong to the Python backend
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
// Helpers
// ---------------------------------------------------------------------------

function findPython() {
  const candidates = [
    'python3',
    'python',
    '/usr/bin/python3',
    '/usr/local/bin/python3',
    '/opt/alt/python311/bin/python3',  // cPanel alternative Python
  ];
  for (const cmd of candidates) {
    try {
      const out = execFileSync(cmd, ['--version'], { timeout: 5000 }).toString();
      if (out.includes('Python 3')) {
        console.log(`[python] ${cmd}: ${out.trim()}`);
        return cmd;
      }
    } catch (e) {
      // some systems print version to stderr
      const se = (e.stderr || Buffer.alloc(0)).toString();
      if (se.includes('Python 3')) {
        console.log(`[python] ${cmd}: ${se.trim()}`);
        return cmd;
      }
    }
  }
  throw new Error(
    'Python 3 not found. Check that it is installed on this server.\n' +
    'On Hostinger VPS: apt install python3 python3-pip'
  );
}

function installDeps(python) {
  const req = path.join(BACKEND_DIR, 'requirements.txt');
  if (!fs.existsSync(req)) {
    console.warn('[pip] requirements.txt not found, skipping install');
    return;
  }
  console.log('[pip] installing backend dependencies...');
  execFileSync(
    python,
    ['-m', 'pip', 'install', '-r', req, '--user', '-q'],
    { cwd: BACKEND_DIR, stdio: 'inherit', timeout: 180_000 }
  );
  console.log('[pip] done.');
}

function waitForPort(port, timeoutMs = 40_000) {
  return new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;
    const attempt  = () => {
      const s = new net.Socket();
      s.setTimeout(1000);
      s.on('connect', () => { s.destroy(); resolve(); });
      s.on('error',   () => { s.destroy(); retry(); });
      s.on('timeout', () => { s.destroy(); retry(); });
      s.connect(port, '127.0.0.1');
    };
    const retry = () =>
      Date.now() < deadline
        ? setTimeout(attempt, 1000)
        : reject(new Error(`port ${port} not ready after ${timeoutMs}ms`));
    attempt();
  });
}

// ---------------------------------------------------------------------------
// Request routing
// ---------------------------------------------------------------------------

function isBackendRoute(reqUrl) {
  const p = reqUrl.split('?')[0];
  return BACKEND_PREFIXES.some(
    prefix => p === prefix.replace(/\/$/, '') || p.startsWith(prefix)
  );
}

function proxyToBackend(req, res) {
  const upstream = http.request(
    {
      hostname: '127.0.0.1',
      port:     UVICORN_PORT,
      path:     req.url,
      method:   req.method,
      headers:  { ...req.headers, host: `127.0.0.1:${UVICORN_PORT}` },
    },
    (pr) => {
      res.writeHead(pr.statusCode, pr.headers);
      pr.pipe(res);
    }
  );
  upstream.on('error', () => {
    if (!res.headersSent) { res.writeHead(502); res.end('Bad Gateway'); }
  });
  req.pipe(upstream);
}

function serveStatic(req, res) {
  let filePath = path.join(FRONTEND_DIST, req.url.split('?')[0]);

  // SPA fallback: unknown paths → index.html
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(FRONTEND_DIST, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    res.writeHead(404); res.end('Not Found'); return;
  }

  const mime = MIME[path.extname(filePath)] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const python = findPython();
  installDeps(python);

  // Spawn uvicorn
  const uvicorn = spawn(
    python,
    [
      '-m', 'uvicorn', 'app.main:app',
      '--host', '127.0.0.1',
      '--port', String(UVICORN_PORT),
      '--workers', '1',
    ],
    {
      cwd: BACKEND_DIR,
      env: { ...process.env, PYTHONPATH: BACKEND_DIR },
    }
  );

  uvicorn.stdout.on('data', d => process.stdout.write(d));
  uvicorn.stderr.on('data', d => process.stderr.write(d));
  uvicorn.on('close', code => {
    console.error(`[uvicorn] exited with code ${code}`);
    process.exit(code ?? 1);
  });

  console.log('[uvicorn] waiting for startup...');
  await waitForPort(UVICORN_PORT);
  console.log(`[uvicorn] ready on 127.0.0.1:${UVICORN_PORT}`);

  // HTTP server: proxy backend routes, serve SPA for the rest
  const server = http.createServer((req, res) => {
    if (isBackendRoute(req.url)) {
      proxyToBackend(req, res);
    } else {
      serveStatic(req, res);
    }
  });

  server.listen(PORT, () => console.log(`[server] listening on port ${PORT}`));

  const shutdown = () => {
    uvicorn.kill('SIGTERM');
    server.close(() => process.exit(0));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT',  shutdown);
}

main().catch(e => { console.error('[fatal]', e.message); process.exit(1); });
