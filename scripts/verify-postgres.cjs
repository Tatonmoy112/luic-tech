// Fresh Linux + fresh PostgreSQL acceptance. Both containers are disposable;
 // no published ports, cloud services, host dependencies or build outputs.
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { spawnSync, spawn } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const pgImage = 'postgres:18.4-bookworm@sha256:882236b897e39051d2368c5ccc6cda944904723506b2dfc97f2a8f5bc9afa382';
const nodeImage = 'node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df';
function docker(args, input) {
  const result = spawnSync('docker', args, { encoding: 'utf8', input, windowsHide: true, timeout: 60000 });
  if (result.error || result.status !== 0) throw new Error('Local verification Docker operation failed');
  return result.stdout.trim();
}
async function main() {
  const id = randomBytes(6).toString('hex');
  const pgName = 'luic-b002-verify-pg-' + id;
  const nodeName = 'luic-b002-verify-node-' + id;
  const envFile = path.join(root, '.local', 'verify-' + id + '.env');
  fs.mkdirSync(path.dirname(envFile), { recursive: true });
  const secret = () => randomBytes(32).toString('hex');
  const passwords = { api: secret(), worker: secret(), migrator: secret() };
  let created = false;
  try {
    docker(['run', '--rm', '-d', '--name', pgName, '--label', 'luic.scope=b002-verification',
      '-e', 'POSTGRES_PASSWORD=' + secret(), pgImage]); created = true;
    let ready = false;
    for (let i = 0; i < 60; i++) {
      const probe = spawnSync('docker', ['exec', pgName, 'pg_isready', '-U', 'postgres'], { windowsHide: true, timeout: 2000 });
      if (probe.status === 0) { ready = true; break; }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (!ready) throw new Error('PostgreSQL readiness timeout');
    docker(['exec', '-i', pgName, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1'],
      Object.entries(passwords).map(([role, password]) => "CREATE ROLE commerce_" + role + " LOGIN PASSWORD '" + password + "';").join('\n') +
      '\nCREATE DATABASE commerce_test OWNER commerce_migrator;\nREVOKE ALL ON DATABASE commerce_test FROM PUBLIC;\nGRANT CONNECT ON DATABASE commerce_test TO commerce_api, commerce_worker;');
    console.log(docker(['exec', pgName, 'psql', '-U', 'postgres', '-Atc', 'SELECT version()']));
    fs.writeFileSync(envFile, 'B002_DB_PORT=5432\nB002_API_PASSWORD=' + passwords.api +
      '\nB002_WORKER_PASSWORD=' + passwords.worker + '\nB002_MIGRATOR_PASSWORD=' + passwords.migrator + '\n', { mode: 0o600 });
    const code = await new Promise((resolve, reject) => {
      const child = spawn('docker', ['run', '--rm', '--name', nodeName, '--network', 'container:' + pgName,
        '--env-file', envFile, '--mount', 'type=bind,source=' + root + ',target=/source,readonly',
        nodeImage, 'node', '/source/scripts/verify-linux.cjs'], { stdio: 'inherit', windowsHide: true });
      child.on('error', reject); child.on('exit', resolve);
    });
    if (code !== 0) throw new Error('Clean Linux verification failed');
  } finally {
    // Names are generated above exclusively for this run; never enumerate others.
    spawnSync('docker', ['rm', '-f', nodeName], { windowsHide: true, stdio: 'ignore' });
    if (created) docker(['rm', '-f', pgName]);
    if (fs.existsSync(envFile)) fs.unlinkSync(envFile);
  }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
