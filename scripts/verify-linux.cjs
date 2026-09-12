// Run in the pinned disposable container with the repository mounted read-only.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');
const { spawnSync } = require('node:child_process');

if (process.platform !== 'linux') throw new Error('Run this verifier in the documented Linux image');
const source = path.resolve(__dirname, '..');
const workspace = fs.mkdtempSync(path.join(os.tmpdir(), 'b002-'));
for (const name of ['package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.base.json',
  'jest.config.cjs', '.npmrc', '.env.example', '.env.worker.example']) {
  fs.copyFileSync(path.join(source, name), path.join(workspace, name));
}
for (const name of ['apps', 'packages', 'scripts', 'tests', 'database/migrations', 'backend/openapi']) {
  fs.cpSync(path.join(source, name), path.join(workspace, name), {
    recursive: true,
    filter: file => !['node_modules', 'dist'].includes(path.basename(file)),
  });
}
function run(args) {
  const result = spawnSync('npm', args, { cwd: workspace, stdio: 'inherit' });
  if (result.error || result.status !== 0) process.exit(result.status || 1);
}
console.log(JSON.stringify({
  node: process.version, platform: process.platform, arch: process.arch,
  glibc: process.report.getReport().header.glibcVersionRuntime,
  lockSha256: createHash('sha256').update(fs.readFileSync(path.join(workspace, 'package-lock.json'))).digest('hex'),
}));
run(['--version']);
run(['ci', '--ignore-scripts', '--fetch-retries=2', '--fetch-timeout=120000']);
const graph = spawnSync('npm', ['ls', '--all', '--json'], { cwd: workspace, encoding: 'utf8' });
if (graph.status !== 0) {
  process.stderr.write(graph.stdout + graph.stderr);
  process.exit(1);
}
console.log('npm ls --all: no invalid or missing dependencies');
run(['run', 'check']);
run(['audit', '--audit-level=low']);
