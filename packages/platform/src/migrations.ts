import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { readMigrationFiles } from 'drizzle-orm/migrator';

export interface MigrationConnection { port: number; database: 'commerce_local' | 'commerce_test'; password: string }
// Explicit separate command, never an API/worker startup side effect. The lock and
// Drizzle runner share one session. Immutable hash history is checked before use.
export async function applyMigrations(connection: MigrationConnection, folder: string): Promise<number> {
  const migrations = readMigrationFiles({ migrationsFolder: folder });
  const pool = new Pool({ host: '127.0.0.1', port: connection.port, database: connection.database,
    user: 'commerce_migrator', password: connection.password, ssl: false, max: 1,
    connectionTimeoutMillis: 1000, statement_timeout: 3000, lock_timeout: 1000 });
  let client;
  try {
    client = await pool.connect();
    await client.query('SELECT pg_advisory_lock(2001, 2)');
    const exists = await client.query("SELECT to_regclass('drizzle.__drizzle_migrations') AS name");
    if (exists.rows[0].name) {
      const history = await client.query('SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at');
      if (history.rows.length > migrations.length || history.rows.some((row, index) =>
        row.hash !== migrations[index]?.hash || String(row.created_at) !== String(migrations[index]?.folderMillis))) {
        throw new Error('Migration history mismatch');
      }
    }
    await migrate(drizzle(client), { migrationsFolder: folder });
    return migrations.length;
  } finally {
    // Destroy the dedicated session to release its advisory lock even on failure.
    client?.release(true);
    await pool.end();
  }
}
