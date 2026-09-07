const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { createHash } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const sha256 = value => createHash('sha256').update(value).digest('hex');
const read = file => fs.readFileSync(path.join(root, file));
const lock = JSON.parse(read('package-lock.json'));
const rootPackage = JSON.parse(read('package.json'));
const manifests = ['package.json', 'apps/commerce-api/package.json',
  'apps/commerce-worker/package.json', 'packages/platform/package.json'];
const dependencies = new Map();
for (const file of manifests) {
  const manifest = JSON.parse(read(file));
  for (const [name, declaredVersion] of Object.entries({ ...manifest.dependencies, ...manifest.devDependencies })) {
    if (name.startsWith('@luic/')) continue;
    const entry = lock.packages['node_modules/' + name];
    dependencies.set(name, {
      name, declaredVersion, resolvedVersion: entry.version,
      integrity: entry.integrity, registryArtifact: entry.resolved,
    });
  }
}
function walk(directory) {
  return fs.readdirSync(path.join(root, directory), { withFileTypes: true }).flatMap(entry => {
    if (['node_modules', 'dist'].includes(entry.name)) return [];
    const file = directory + '/' + entry.name;
    return entry.isDirectory() ? walk(file) : [file];
  });
}
const files = ['.gitignore', '.gitattributes', '.npmrc', '.node-version', '.env.example', '.env.worker.example',
  'package.json', 'package-lock.json', 'tsconfig.json', 'tsconfig.base.json', 'jest.config.cjs',
  ...['apps', 'packages', 'scripts', 'tests', 'database/migrations'].flatMap(walk)].sort();
const artifacts = files.map(file => ({ file, sha256: sha256(read(file)) }));
const inventory = {
  bolt: 'B002', profile: 'DEV-PHYSICAL-BD', profileRevision: 1, configVersion: 2,
  schema: { revision: '0000_foundation', sha256: sha256(read('database/migrations/0000_foundation.sql')) },
  observedHost: { node: process.version, platform: process.platform, arch: process.arch,
    osRelease: os.release(), nodeExecutableSha256: sha256(fs.readFileSync(process.execPath)) },
  packageManager: rootPackage.packageManager,
  lockSha256: sha256(read('package-lock.json')),
  artifactSetSha256: sha256(JSON.stringify(artifacts)),
  dependencies: [...dependencies.values()].sort((a, b) => a.name.localeCompare(b.name)),
  artifacts,
};
const output = JSON.stringify(inventory, null, 2) + '\n';
if (process.argv.includes('--write')) {
  const directory = path.join(root, 'context/aidlc/evidence');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'B002-manifest.json'), output);
  console.log(JSON.stringify({ lockSha256: inventory.lockSha256,
    artifactSetSha256: inventory.artifactSetSha256, artifacts: artifacts.length }));
} else process.stdout.write(output);
