import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const logsDir = path.join(rootDir, 'logs');
const publicUrlPath = path.join(rootDir, 'public-url.txt');
const port = process.env.PORT || '8085';

fs.mkdirSync(logsDir, { recursive: true });

let serverProcess = null;
let tunnelProcess = null;
let currentUrl = '';
let isStopping = false;

function log(message) {
  const line = `[${new Date().toISOString()}] ${message}\n`;
  fs.appendFileSync(path.join(logsDir, 'external-daemon.log'), line);
  process.stdout.write(line);
}

function startServer() {
  if (serverProcess && !serverProcess.killed) return;

  serverProcess = spawn('/opt/homebrew/bin/node', ['scripts/serve-private.mjs'], {
    cwd: rootDir,
    env: { ...process.env, PORT: port },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  pipeLogs(serverProcess, 'server.log');
  log(`private server started with pid ${serverProcess.pid}`);

  serverProcess.on('exit', (code, signal) => {
    log(`private server exited code=${code} signal=${signal}`);
    serverProcess = null;
    if (!isStopping) setTimeout(startServer, 3000);
  });
}

function startTunnel() {
  if (tunnelProcess && !tunnelProcess.killed) return;

  tunnelProcess = spawn('/opt/homebrew/bin/cloudflared', [
    'tunnel',
    '--no-autoupdate',
    '--protocol',
    'http2',
    '--url',
    `http://localhost:${port}`
  ], {
    cwd: rootDir,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  pipeLogs(tunnelProcess, 'cloudflared.log', detectTunnelUrl);
  log(`cloudflared tunnel started with pid ${tunnelProcess.pid}`);

  tunnelProcess.on('exit', (code, signal) => {
    log(`cloudflared exited code=${code} signal=${signal}`);
    tunnelProcess = null;
    if (!isStopping) setTimeout(startTunnel, 5000);
  });
}

function pipeLogs(child, fileName, onChunk = () => {}) {
  const logPath = path.join(logsDir, fileName);
  const write = chunk => {
    const text = chunk.toString();
    fs.appendFileSync(logPath, text);
    onChunk(text);
  };

  child.stdout.on('data', write);
  child.stderr.on('data', write);
}

function detectTunnelUrl(text) {
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (!match || match[0] === currentUrl) return;

  currentUrl = match[0];
  fs.writeFileSync(publicUrlPath, `${currentUrl}\n`, 'utf-8');
  log(`public URL detected: ${currentUrl}`);

  const updater = spawn('/opt/homebrew/bin/node', ['scripts/update-base-url.mjs', currentUrl], {
    cwd: rootDir,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  pipeLogs(updater, 'update-url.log');
  updater.on('exit', (code, signal) => {
    log(`URL update finished code=${code} signal=${signal}`);
  });
}

function stop() {
  isStopping = true;
  log('stopping external daemon');
  if (tunnelProcess) tunnelProcess.kill('SIGTERM');
  if (serverProcess) serverProcess.kill('SIGTERM');
  setTimeout(() => process.exit(0), 1000);
}

process.on('SIGTERM', stop);
process.on('SIGINT', stop);

log('external daemon booting');
startServer();
setTimeout(startTunnel, 1500);
