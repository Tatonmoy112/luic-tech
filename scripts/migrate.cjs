const fs = require('node:fs');
const path = require('node:path');
const { applyMigrations } = require('../packages/platform/dist/migrations');
async function main() {
  const target = process.argv[2];
  if (!['local', 'test'].includes(target)) throw new Error('Choose local or test');
  const state = JSON.parse(fs.readFileSync(path.join(__dirname, '../.local/postgres.json')));
  const count = await applyMigrations({ port: state.port, password: state.passwords.migrator,
    database: 'commerce_' + target }, path.join(__dirname, '../database/migrations'));
  console.log(JSON.stringify({ event: 'migration_complete', target, count }));
}
main().catch(() => { console.error('{"event":"migration_failed"}'); process.exitCode = 1; });
