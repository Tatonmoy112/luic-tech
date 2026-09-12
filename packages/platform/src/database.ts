import { AsyncLocalStorage } from 'node:async_hooks';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { SpanStatusCode } from '@opentelemetry/api';
import type { RuntimeConfig } from './configuration';
import { Telemetry, requestContext, SafeCode } from './telemetry';

export class DatabaseFailure extends Error {
  constructor(readonly code: SafeCode) { super(code); }
}
export function databaseCode(error: unknown): SafeCode {
  const code = (error as { code?: string } | null)?.code;
  if (['23505', '23503', '23514', '23P01'].includes(code ?? '')) return 'CONFLICT';
  if (['40001', '40P01', '55P03', '57014', '25P03'].includes(code ?? '')) return 'DB_BUSY';
  if (['ECONNREFUSED', 'ECONNRESET', 'EPIPE', '57P01', '57P02', '57P03', '08006', '08003'].includes(code ?? '')) return 'UNAVAILABLE';
  return 'INTERNAL_ERROR';
}
const activeTransaction = new AsyncLocalStorage<boolean>();
export interface TransactionContext {
  readonly db: Omit<NodePgDatabase, 'transaction'>;
  query<R extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]): Promise<QueryResult<R>>;
}

export class Database {
  private readonly pool: Pool;
  private stopping = false;
  constructor(config: RuntimeConfig, private readonly telemetry: Telemetry) {
    this.pool = new Pool({ host: config.database.host, port: config.database.port,
      database: config.database.name, user: config.database.user, password: config.database.password,
      ssl: false, max: config.database.max, connectionTimeoutMillis: 750, idleTimeoutMillis: 1000,
      statement_timeout: 750, query_timeout: 1000, lock_timeout: 200, idle_in_transaction_session_timeout: 1000,
      application_name: 'commerce_' + config.role });
    this.pool.on('error', () => this.telemetry.emit('db_unavailable', 'UNAVAILABLE'));
  }
  stats(): { total: number; idle: number; waiting: number } {
    return { total: this.pool.totalCount, idle: this.pool.idleCount, waiting: this.pool.waitingCount };
  }
  async ready(): Promise<boolean> {
    if (this.stopping) return false;
    try {
      const result = await this.pool.query('SELECT hash FROM drizzle.__drizzle_migrations ORDER BY created_at');
      if (result.rows.length !== MIGRATION_HASHES.length || result.rows.some((row, index) => row.hash !== MIGRATION_HASHES[index])) return false;
      const schemas = await this.pool.query("SELECT count(*) FROM pg_namespace WHERE nspname = ANY($1::text[])",
        [['iam', 'catalog', 'pricing', 'inventory', 'sales', 'finance', 'fulfillment', 'platform']]);
      return schemas.rows[0].count === '8';
    } catch { return false; }
  }
  async transaction<T>(operation: (tx: TransactionContext) => Promise<T>): Promise<T> {
    if (this.stopping) throw new DatabaseFailure('DRAINING');
    if (activeTransaction.getStore()) throw new Error('Nested transactions require the existing explicit context');
    const span = this.telemetry.start('db.transaction');
    const parent = requestContext.getStore();
    const started = performance.now();
    let client: PoolClient | undefined;
    let open = false;
    let committing = false;
    let destroy = false;
    const connectionError = (): void => { destroy = true; this.telemetry.emit('db_unavailable', 'UNAVAILABLE'); };
    return requestContext.run({ correlationId: parent?.correlationId ?? 'local-database', span }, async () => {
      try {
        client = await this.pool.connect();
        client.on('error', connectionError);
        await client.query('BEGIN');
        open = true;
        const connection = client;
        let usable = true;
        const ensure = (): void => { if (!usable) throw new Error('Transaction context has expired'); };
        const guarded = new Proxy(connection, { get(target, property) {
          if (property === 'query') return (...args: unknown[]) => {
            ensure(); return (target.query as (...args: unknown[]) => unknown).apply(target, args);
          };
          return Reflect.get(target, property, target);
        } });
        const db = new Proxy(drizzle(guarded), { get(target, property, receiver) {
          if (property === 'transaction' || property === '$client') throw new Error('Use the explicit transaction context');
          return Reflect.get(target, property, receiver);
        } });
        const tx: TransactionContext = Object.freeze({ db,
          query: <R extends QueryResultRow>(text: string, values?: unknown[]) => {
            ensure(); return connection.query<R>(text, values);
          } });
        let result: T;
        try { result = await activeTransaction.run(true, () => operation(tx)); }
        finally { usable = false; }
        committing = true;
        const committed = await client.query('COMMIT');
        if (committed.command !== 'COMMIT') throw new DatabaseFailure('ROLLED_BACK');
        open = false;
        span.setStatus({ code: SpanStatusCode.OK });
        this.telemetry.emit('db_transaction', 'OK', 'unmatched', performance.now() - started);
        return result;
      } catch (error) {
        if (open && client) { try { await client.query('ROLLBACK'); } catch { destroy = true; } }
        const code = committing && !(error instanceof DatabaseFailure) ? 'COMMIT_UNKNOWN'
          : error instanceof DatabaseFailure ? error.code : databaseCode(error);
        if (committing) destroy = true;
        span.setStatus({ code: SpanStatusCode.ERROR });
        this.telemetry.emit('db_transaction', code, 'unmatched', performance.now() - started);
        // Never retry an uncertain commit, and never include SQL/driver error data.
        throw new DatabaseFailure(code);
      } finally { client?.release(destroy); client?.off('error', connectionError); span.end(); }
    });
  }
  stop(): void { this.stopping = true; }
  async close(): Promise<void> { this.stop(); await this.pool.end(); }
}

// Updated from the immutable reviewed migration; checked against the file in tests.
export const FOUNDATION_HASH = '699076c71a6da2cc4a7f2c88bbab2f5976fde815ac60fe978c236f8dc1f3a201';

export const IDENTITY_HASH = "9d7a5f5db79ab27e7d12034882a6e921baa01070d8a66a30319a691dff45177c";
export const CATALOG_HASH = '73076c93e0c9e0b55ac8da7a8cf9aec7bafbf2bf1baaa486d0a320aaa3d64117';
export const STOCK_CART_HASH = '3b3870573157727ecf20c6fbdc770f80f163eaabd6adecdf4cc9086f02aca329';
export const MIGRATION_HASHES = Object.freeze([FOUNDATION_HASH, IDENTITY_HASH, CATALOG_HASH, STOCK_CART_HASH]);
