const path = require('node:path');
const { spawn } = require('node:child_process');

const root = path.resolve(__dirname, '..');
function databaseSettings() {
  if (process.env.B002_DB_PORT) return { port: Number(process.env.B002_DB_PORT), passwords: {
    api: process.env.B002_API_PASSWORD, worker: process.env.B002_WORKER_PASSWORD, migrator: process.env.B002_MIGRATOR_PASSWORD } };
  const fs = require('node:fs');
  const file = path.join(root, '.local/postgres.json');
  if (!fs.existsSync(file)) throw new Error('Run npm run db:local before verifying B002');
  return JSON.parse(fs.readFileSync(file));
}
function environment(role = 'api', overrides = {}) {
  // Do not inherit developer credentials, NODE_OPTIONS or provider configuration.
  const env = {};
  for (const key of ['PATH', 'SystemRoot', 'SYSTEMROOT', 'WINDIR', 'TEMP', 'TMP']) {
    if (process.env[key]) env[key] = process.env[key];
  }
  return {
    ...env, SERVICE_NAME: 'commerce', RUNTIME_ROLE: role, APP_ENV: 'test',
    NODE_ENV: 'test', RELEASE_ID: 'b001-test', DATA_MODE: 'synthetic',
    COMMERCE_PROFILE: 'DEV-PHYSICAL-BD', PROFILE_REVISION: '1',
    IDENTITY_MODE: 'synthetic', PAYMENT_MODE: 'simulated',
    DB_PORT: String(databaseSettings().port), DB_PASSWORD: databaseSettings().passwords[role],
    ...(role === 'api' ? { API_PORT: '0' } : {}), ...overrides,
  };
}
function launch(role, env, entrypoint = 'apps/commerce-' + role + '/dist/main.js') {
  const child = spawn(process.execPath, [path.join(root, entrypoint)], {
    cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  let output = '';
  const listeners = new Set();
  const append = chunk => {
    output += chunk.toString();
    for (const listener of listeners) listener();
  };
  child.stdout.on('data', append);
  child.stderr.on('data', append);
  const exit = new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => resolve({ code, signal, output }));
  });
  // Ensure a failed test cannot leave the child process running indefinitely.
  const watchdog = setTimeout(() => child.kill('SIGKILL'), 10000);
  exit.finally(() => clearTimeout(watchdog));
  const started = () => new Promise((resolve, reject) => {
    const read = () => {
      const line = output.split('\n').find(value => value.includes('"event":"started"'));
      if (line) { listeners.delete(read); resolve(JSON.parse(line)); }
    };
    listeners.add(read);
    read();
    exit.then(() => { listeners.delete(read); reject(new Error('Process exited before startup')); }, reject);
  });
  return { child, exit, started };
}
module.exports = { environment, launch, databaseSettings };
