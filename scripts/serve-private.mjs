import crypto from 'crypto';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

loadDotEnv(path.join(rootDir, '.env'));

const PORT = Number(process.env.PORT || 8085);
const STORE_USER = process.env.STORE_USER || 'jaeseok';
const STORE_PASS = process.env.STORE_PASS || 'jaeseok';
const SESSION_SECRET = process.env.STORE_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const DOWNLOAD_TOKEN = process.env.STORE_DOWNLOAD_TOKEN || crypto.randomBytes(24).toString('hex');
const COOKIE_NAME = 'ios_store_session';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ipa': 'application/octet-stream',
  '.md': 'text/markdown; charset=utf-8'
};

function loadDotEnv(envPath) {
  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function sign(value) {
  return crypto.createHmac('sha256', SESSION_SECRET).update(value).digest('hex');
}

function createSessionValue() {
  const payload = `${STORE_USER}:${Date.now()}`;
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
}

function parseCookies(req) {
  const cookies = {};
  for (const part of (req.headers.cookie || '').split(';')) {
    const [key, ...valueParts] = part.trim().split('=');
    if (key) cookies[key] = decodeURIComponent(valueParts.join('='));
  }
  return cookies;
}

function hasValidSession(req) {
  const cookie = parseCookies(req)[COOKIE_NAME];
  if (!cookie || !cookie.includes('.')) return false;

  const [payloadBase64, signature] = cookie.split('.');
  try {
    const payload = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const expected = sign(payload);
    return signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

function hasValidToken(reqUrl) {
  const token = reqUrl.searchParams.get('token');
  return token && token.length === DOWNLOAD_TOKEN.length && crypto.timingSafeEqual(Buffer.from(token), Buffer.from(DOWNLOAD_TOKEN));
}

function requireAccess(req, res, reqUrl) {
  if (hasValidSession(req) || hasValidToken(reqUrl)) return true;

  if (req.method === 'GET') {
    redirect(res, '/login');
  } else {
    send(res, 401, '로그인이 필요합니다.', 'text/plain; charset=utf-8');
  }
  return false;
}

function send(res, status, body, contentType = 'text/html; charset=utf-8', headers = {}) {
  const buffer = Buffer.isBuffer(body) ? body : Buffer.from(body);
  res.writeHead(status, {
    'Content-Type': contentType,
    'Content-Length': buffer.length,
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(buffer);
}

function redirect(res, location) {
  res.writeHead(302, { Location: location, 'Cache-Control': 'no-store' });
  res.end();
}

function tokenizedUrl(rawUrl) {
  const url = new URL(rawUrl);
  url.searchParams.set('token', DOWNLOAD_TOKEN);
  return url.toString();
}

function serveAppsJson(req, res) {
  const appsPath = path.join(rootDir, 'apps.json');
  const data = JSON.parse(fs.readFileSync(appsPath, 'utf-8'));

  data.sourceURL = tokenizedUrl(data.sourceURL);
  data.iconURL = tokenizedUrl(data.iconURL);
  data.apps = data.apps.map(app => ({
    ...app,
    iconURL: tokenizedUrl(app.iconURL),
    versions: app.versions.map(version => ({
      ...version,
      downloadURL: tokenizedUrl(version.downloadURL)
    }))
  }));

  send(res, 200, JSON.stringify(data, null, 2), 'application/json; charset=utf-8');
}

function serveIndex(res) {
  const html = fs
    .readFileSync(path.join(rootDir, 'index.html'), 'utf-8')
    .replace('const STORE_TOKEN = "";', `const STORE_TOKEN = "${DOWNLOAD_TOKEN}";`);
  send(res, 200, html);
}

function serveLogin(req, res) {
  if (req.method === 'GET') {
    send(res, 200, loginPage());
    return;
  }

  let body = '';
  req.on('data', chunk => {
    body += chunk;
    if (body.length > 8192) req.destroy();
  });
  req.on('end', () => {
    const params = new URLSearchParams(body);
    const username = params.get('username') || '';
    const password = params.get('password') || '';

    if (username === STORE_USER && password === STORE_PASS) {
      const cookie = `${COOKIE_NAME}=${encodeURIComponent(createSessionValue())}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400`;
      res.writeHead(302, { Location: '/', 'Set-Cookie': cookie, 'Cache-Control': 'no-store' });
      res.end();
      return;
    }

    send(res, 401, loginPage('아이디 또는 비밀번호가 맞지 않습니다.'));
  });
}

function serveStatic(req, res, pathname) {
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.resolve(rootDir, `.${decodeURIComponent(requestedPath)}`);

  if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    send(res, 404, '파일을 찾을 수 없습니다.', 'text/plain; charset=utf-8');
    return;
  }

  const contentType = mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  send(res, 200, fs.readFileSync(filePath), contentType);
}

function loginPage(error = '') {
  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>로그인 - JaeSeok Private Store</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; display: grid; place-items: center; background: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #111827; }
    main { width: min(420px, calc(100vw - 32px)); background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 28px; box-shadow: 0 18px 50px rgba(15, 23, 42, 0.08); }
    h1 { margin: 0 0 8px; font-size: 24px; }
    p { margin: 0 0 24px; color: #6b7280; font-size: 14px; }
    label { display: block; margin-bottom: 8px; font-size: 13px; font-weight: 700; }
    input { width: 100%; height: 44px; border: 1px solid #d1d5db; border-radius: 10px; padding: 0 12px; margin-bottom: 16px; font-size: 16px; }
    button { width: 100%; height: 46px; border: 0; border-radius: 10px; background: #0f766e; color: #fff; font-weight: 800; font-size: 15px; cursor: pointer; }
    .error { margin-bottom: 16px; padding: 10px 12px; border-radius: 10px; background: #fef2f2; color: #b91c1c; font-size: 13px; }
  </style>
</head>
<body>
  <main>
    <h1>Private iOS Store</h1>
    <p>앱 목록과 IPA 다운로드는 로그인 후 사용할 수 있습니다.</p>
    ${error ? `<div class="error">${error}</div>` : ''}
    <form method="post" action="/login">
      <label for="username">아이디</label>
      <input id="username" name="username" autocomplete="username" required>
      <label for="password">비밀번호</label>
      <input id="password" name="password" type="password" autocomplete="current-password" required>
      <button type="submit">로그인</button>
    </form>
  </main>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const reqUrl = new URL(req.url, `http://${req.headers.host || `localhost:${PORT}`}`);
  const pathname = reqUrl.pathname;

  if (pathname === '/login') {
    serveLogin(req, res);
    return;
  }

  if (pathname === '/logout') {
    res.writeHead(302, {
      Location: '/login',
      'Set-Cookie': `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`,
      'Cache-Control': 'no-store'
    });
    res.end();
    return;
  }

  if (!requireAccess(req, res, reqUrl)) return;

  if (pathname === '/' || pathname === '/index.html') {
    serveIndex(res);
    return;
  }

  if (pathname === '/apps.json') {
    serveAppsJson(req, res);
    return;
  }

  serveStatic(req, res, pathname);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Private iOS Store running: http://localhost:${PORT}`);
  console.log(`Login user: ${STORE_USER}`);
  if (!process.env.STORE_PASS) {
    console.log('Default password is "jaeseok". Set STORE_PASS or .env before sharing this server.');
  }
  console.log('Keep this terminal open while downloading through SideStore.');
});
