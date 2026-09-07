const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { Pool } = require('pg');
const { sql } = require('drizzle-orm');
const { pgSchema, bigint, text } = require('drizzle-orm/pg-core');
const { Database, Telemetry, readConfiguration, FOUNDATION_HASH } = require('../packages/platform/dist');
const { applyMigrations } = require('../packages/platform/dist/migrations');
const { environment, databaseSettings } = require('./helpers.cjs');
const folder = path.join(__dirname, '../database/migrations');
const state = databaseSettings();
const connection = { port: state.port, database: 'commerce_test', password: state.passwords.migrator };
const admin = new Pool({ host: '127.0.0.1', port: state.port, database: 'commerce_test',
  user: 'commerce_migrator', password: state.passwords.migrator, max: 1 });
const events = [];
const telemetry = new Telemetry(readConfiguration(environment(), 'api'), event => events.push(event));
const database = new Database(readConfiguration(environment(), 'api'), telemetry);
const probe = pgSchema('b002_probe').table('exact_values', { id: text('id').primaryKey(), value: bigint('value', { mode: 'bigint' }).notNull() });
beforeAll(async () => {
  const initial = (await admin.query("SELECT to_regclass('drizzle.__drizzle_migrations') AS history")).rows[0].history;
  await applyMigrations(connection, folder);
  console.log('PostgreSQL migration entry: ' + (initial ? 'existing-history replay' : 'empty-database rebuild') + '; foundation applied.');
  // Test-owned schema only; application schemas and all their data are preserved.
  await admin.query('CREATE SCHEMA b002_probe');
  await admin.query('CREATE TABLE b002_probe.exact_values (id text PRIMARY KEY, value bigint NOT NULL CHECK(value >= 0))');
  await admin.query('GRANT USAGE ON SCHEMA b002_probe TO commerce_api, commerce_worker');
  await admin.query('GRANT SELECT, INSERT, UPDATE, DELETE ON b002_probe.exact_values TO commerce_api, commerce_worker');
});
afterAll(async () => {
  await database.close(); await telemetry.close();
  await admin.query('DROP SCHEMA b002_probe CASCADE'); await admin.end();
});
test('reviewed migration identity, replay and concurrent runners agree', async () => {
  expect(createHash('sha256').update(fs.readFileSync(path.join(folder, '0000_foundation.sql'))).digest('hex')).toBe(FOUNDATION_HASH);
  expect(await Promise.all([applyMigrations(connection, folder), applyMigrations(connection, folder)])).toEqual([1, 1]);
  const rows = (await admin.query('SELECT hash FROM drizzle.__drizzle_migrations')).rows;
  expect(rows).toEqual([{ hash: FOUNDATION_HASH }]);
  expect(await database.ready()).toBe(true);
});
test('migration drift is rejected and failed additive migration rolls back without history', async () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'b002-migrations-'));
  fs.cpSync(folder, temp, { recursive: true });
  fs.appendFileSync(path.join(temp, '0000_foundation.sql'), '\n-- drift\n');
  await expect(applyMigrations(connection, temp)).rejects.toThrow('Migration history mismatch');
  fs.copyFileSync(path.join(folder, '0000_foundation.sql'), path.join(temp, '0000_foundation.sql'));
  const journal = JSON.parse(fs.readFileSync(path.join(temp, 'meta/_journal.json')));
  journal.entries.push({ idx: 1, version: '7', when: 1788739200001, tag: '0001_failure', breakpoints: true });
  fs.writeFileSync(path.join(temp, 'meta/_journal.json'), JSON.stringify(journal));
  fs.writeFileSync(path.join(temp, '0001_failure.sql'), 'CREATE SCHEMA b002_failed;\n--> statement-breakpoint\nSELECT 1/0;');
  await expect(applyMigrations(connection, temp)).rejects.toThrow();
  expect((await admin.query("SELECT to_regnamespace('b002_failed') AS name")).rows[0].name).toBeNull();
  expect((await admin.query('SELECT count(*) FROM drizzle.__drizzle_migrations')).rows[0].count).toBe('1');
  // Repair only the never-applied test migration, then prove the lock was released.
  fs.writeFileSync(path.join(temp, '0001_failure.sql'), 'CREATE SCHEMA b002_failed;');
  expect(await applyMigrations(connection, temp)).toBe(2);
  expect(await database.ready()).toBe(false); // future history requires compatible code
  await admin.query('DROP SCHEMA b002_failed');
  await admin.query('DELETE FROM drizzle.__drizzle_migrations WHERE created_at = 1788739200001');
});
test('two repository operations commit once on one session, with exact bigint via pg and Drizzle', async () => {
  let saved;
  await database.transaction(async tx => {
    saved = tx;
    const pid = (await tx.query('SELECT pg_backend_pid() AS pid')).rows[0].pid;
    await tx.db.insert(probe).values({ id: 'exact', value: 9223372036854775807n });
    const raw = (await tx.query('SELECT value, pg_backend_pid() AS pid FROM b002_probe.exact_values WHERE id=$1', ['exact'])).rows[0];
    expect(raw.value).toBe('9223372036854775807');
    expect(raw.pid).toBe(pid);
    expect((await tx.db.select().from(probe))[0].value).toBe(9223372036854775807n);
    await tx.query('INSERT INTO b002_probe.exact_values VALUES ($1,$2)', ['above-number', '9007199254740993']);
  });
  expect((await admin.query('SELECT count(*) FROM b002_probe.exact_values')).rows[0].count).toBe('2');
  expect(() => saved.query('SELECT 1')).toThrow('expired');
  await expect(saved.db.execute(sql`SELECT 1`)).rejects.toThrow();
  expect(database.stats()).toMatchObject({ total: 1, idle: 1, waiting: 0 });
});
test('exception and constraint failures roll back all effects and release reusable connection', async () => {
  await expect(database.transaction(async tx => {
    await tx.query("INSERT INTO b002_probe.exact_values VALUES ('rollback',1)");
    throw new Error('synthetic private payload');
  })).rejects.toHaveProperty('code', 'INTERNAL_ERROR');
  await expect(database.transaction(async tx => {
    await tx.query("INSERT INTO b002_probe.exact_values VALUES ('partial',1)");
    await tx.query("INSERT INTO b002_probe.exact_values VALUES ('partial',2)");
  })).rejects.toHaveProperty('code', 'CONFLICT');
  expect((await admin.query("SELECT count(*) FROM b002_probe.exact_values WHERE id IN ('rollback','partial')")).rows[0].count).toBe('0');
  await database.transaction(async tx => expect((await tx.query('SELECT 1 AS ok')).rows[0].ok).toBe(1));
  expect(database.stats().waiting).toBe(0);
  expect(database.stats().total).toBe(database.stats().idle);
  expect(JSON.stringify(events)).not.toContain('synthetic private payload');
});
test('swallowed SQL failure cannot be reported as a committed success', async () => {
  await expect(database.transaction(async tx => {
    try { await tx.query('SELECT 1/0'); } catch {}
    return 'false success';
  })).rejects.toHaveProperty('code', 'ROLLED_BACK');
});
test('hidden nesting rejects and concurrent transactions use isolated sessions', async () => {
  await expect(database.transaction(() => database.transaction(async () => {}))).rejects.toThrow();
  const pids = await Promise.all(Array.from({ length: 3 }, () => database.transaction(async tx => {
    const result = await tx.query('SELECT pg_backend_pid() AS pid, pg_sleep(0.05)');
    return result.rows[0].pid;
  })));
  expect(new Set(pids).size).toBe(3);
  expect(database.stats().total).toBe(database.stats().idle);
});
test('contended row times out, whole unit rolls back, subsequent connection remains healthy', async () => {
  const holder = await admin.connect();
  try {
    await holder.query('BEGIN');
    await holder.query("SELECT * FROM b002_probe.exact_values WHERE id='exact' FOR UPDATE");
    await expect(database.transaction(async tx => {
      await tx.query("INSERT INTO b002_probe.exact_values VALUES ('lock-partial',1)");
      await tx.query("UPDATE b002_probe.exact_values SET value=1 WHERE id='exact'");
    })).rejects.toHaveProperty('code', 'DB_BUSY');
  } finally { await holder.query('ROLLBACK'); holder.release(); }
  expect((await admin.query("SELECT count(*) FROM b002_probe.exact_values WHERE id='lock-partial'")).rows[0].count).toBe('0');
  await expect(database.transaction(tx => tx.query('SELECT pg_sleep(2)'))).rejects.toHaveProperty('code', 'DB_BUSY');
  expect(await database.ready()).toBe(true);
});
test.each(['api', 'worker'])('%s role cannot execute DDL or mutate migration history', async role => {
  const db = new Database(readConfiguration(environment(role), role), telemetry);
  try {
    for (const statement of ['CREATE SCHEMA unauthorized', 'CREATE TABLE public.unauthorized(id int)',
      'CREATE TEMP TABLE unauthorized(id int)', 'DELETE FROM drizzle.__drizzle_migrations']) {
      await expect(db.transaction(tx => tx.query(statement))).rejects.toThrow();
    }
    expect(await db.ready()).toBe(true);
  } finally { await db.close(); }
});
test('lost connection releases the pool without replaying application work', async () => {
  let calls = 0;
  await expect(database.transaction(async tx => {
    calls++;
    await tx.query('SELECT pg_terminate_backend(pg_backend_pid())');
  })).rejects.toThrow();
  expect(calls).toBe(1);
  expect(await database.ready()).toBe(true);
});

test('loss of a commit reply is reported unknown; committed effect is retained and never retried', async () => {
  const { Client } = require('pg');
  const query = Client.prototype.query;
  let calls = 0;
  const fault = jest.spyOn(Client.prototype, 'query').mockImplementation(function (...args) {
    const result = query.apply(this, args);
    if (args[0] === 'COMMIT') return result.then(() => { throw new Error('synthetic lost reply'); });
    return result;
  });
  try {
    await expect(database.transaction(async tx => {
      calls++;
      await tx.query("INSERT INTO b002_probe.exact_values VALUES ('uncertain',9)");
    })).rejects.toHaveProperty('code', 'COMMIT_UNKNOWN');
  } finally { fault.mockRestore(); }
  expect(calls).toBe(1);
  expect((await admin.query("SELECT value FROM b002_probe.exact_values WHERE id='uncertain'")).rows[0].value).toBe('9');
  expect(await database.ready()).toBe(true);
});

test('missing live ownership schema fails readiness despite matching history', async () => {
  await admin.query('ALTER SCHEMA fulfillment RENAME TO b002_missing');
  try { expect(await database.ready()).toBe(false); }
  finally { await admin.query('ALTER SCHEMA b002_missing RENAME TO fulfillment'); }
  expect(await database.ready()).toBe(true);
});
