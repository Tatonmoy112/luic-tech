// Disposable synthetic local PostgreSQL. Credentials are random and stored only
// under ignored .local; no production env/connection strings are consumed.
const fs = require('node:fs');
const path = require('node:path');
const { randomBytes } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const directory = path.join(root, '.local');
const stateFile = path.join(directory, 'postgres.json');
const image = 'postgres:18.4-bookworm@sha256:882236b897e39051d2368c5ccc6cda944904723506b2dfc97f2a8f5bc9afa382';
function docker(args, input) {
  const result = spawnSync('docker', args, { encoding: 'utf8', windowsHide: true, input, timeout: 60000 });
  if (result.error || result.status !== 0) throw new Error('Local Docker command failed');
  return result.stdout.trim();
}
async function main() {
  fs.mkdirSync(directory, { recursive: true });
  if (fs.existsSync(stateFile)) {
    const saved = JSON.parse(fs.readFileSync(stateFile));
    if (!['api.env', 'worker.env'].every(file => fs.existsSync(path.join(directory, file))))
      throw new Error('Incomplete local bootstrap; preserve and inspect the recorded container');
    if (docker(['inspect', '--format', '{{.State.Running}}', saved.container]) !== 'true')
      throw new Error('Recorded local PostgreSQL is stopped; start the recorded container');
    console.log('Existing local PostgreSQL is running; preserved its databases.');
    return;
  }
  const secret = () => randomBytes(32).toString('hex');
  const passwords = { api: secret(), worker: secret(), migrator: secret() };
  const name = 'luic-b002-' + randomBytes(6).toString('hex');
  const container = docker(['run', '-d', '--name', name, '--label', 'luic.scope=b002-local',
    '-p', '127.0.0.1::5432', '-e', 'POSTGRES_PASSWORD=' + secret(), image]);
  // Save identity immediately so a bootstrap interruption never loses ownership.
  const port = Number(docker(['inspect', '--format', '{{(index (index .NetworkSettings.Ports "5432/tcp") 0).HostPort}}', container]));
  const state = { container, name, port, image, passwords };
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2), { mode: 0o600 });
  let ready = false;
  for (let i = 0; i < 60; i++) {
    const probe = spawnSync('docker', ['exec', container, 'pg_isready', '-U', 'postgres'], { windowsHide: true, timeout: 2000 });
    if (probe.status === 0) { ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!ready) throw new Error('Local PostgreSQL readiness timeout');
  const sql = `CREATE ROLE commerce_migrator LOGIN PASSWORD '${passwords.migrator}';
CREATE ROLE commerce_api LOGIN PASSWORD '${passwords.api}';
CREATE ROLE commerce_worker LOGIN PASSWORD '${passwords.worker}';
CREATE DATABASE commerce_local OWNER commerce_migrator;
CREATE DATABASE commerce_test OWNER commerce_migrator;
REVOKE ALL ON DATABASE commerce_local, commerce_test FROM PUBLIC;
GRANT CONNECT ON DATABASE commerce_local, commerce_test TO commerce_api, commerce_worker;
`;
  docker(['exec', '-i', container, 'psql', '-U', 'postgres', '-v', 'ON_ERROR_STOP=1'], sql);
  for (const role of ['api', 'worker']) {
    const example = fs.readFileSync(path.join(root, role === 'api' ? '.env.example' : '.env.worker.example'), 'utf8');
    fs.writeFileSync(path.join(directory, role + '.env'), example + `\nDB_PORT=${port}\nDB_PASSWORD=${passwords[role]}\n`, { mode: 0o600 });
  }
  console.log(JSON.stringify({ event: 'local_postgres_ready', name, port, image }));
}
main().catch(() => { console.error('Local PostgreSQL setup failed; inspect local Docker availability and the ignored state file.'); process.exitCode = 1; });
