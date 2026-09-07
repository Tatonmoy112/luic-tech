const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'b002-kit-'));
const schema = path.join(temp, 'schema.ts').replaceAll('\\', '/');
fs.writeFileSync(schema, 'import { pgTable, bigint } from ' + JSON.stringify(path.join(root, 'node_modules/drizzle-orm/pg-core/index.cjs')) +
  '; export const probe = pgTable("synthetic_probe", { value: bigint("value", { mode: "bigint" }).notNull() });');
const args = [path.join(root, 'node_modules/drizzle-kit/bin.cjs'), 'generate', '--dialect', 'postgresql',
  '--schema', schema, '--out', path.join(temp, 'migrations').replaceAll('\\', '/'), '--name', 'probe'];
for (let pass = 0; pass < 2; pass++) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: 'utf8', windowsHide: true, timeout: 30000 });
  if (result.status !== 0) { process.stderr.write(result.stdout + result.stderr); process.exit(1); }
}
const files = fs.readdirSync(path.join(temp, 'migrations')).filter(file => file.endsWith('.sql'));
if (files.length !== 1 || !fs.readFileSync(path.join(temp, 'migrations', files[0]), 'utf8').includes('bigint NOT NULL'))
  throw new Error('Migration generation/replay mismatch');
console.log('Drizzle Kit TypeScript generation and unchanged-schema replay passed.');
