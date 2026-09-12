import { createHash } from 'node:crypto';
import { Database, DatabaseFailure, databaseCode, TransactionContext } from './database';
import type { SafeCode } from './telemetry';

export interface CommandResult { status: number; body: Record<string, unknown>; location?: string; replayed?: boolean }
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value !== null && typeof value === 'object') return '{' + Object.keys(value).sort().map(key =>
    JSON.stringify(key) + ':' + canonical((value as Record<string, unknown>)[key])).join(',') + '}';
  return JSON.stringify(value);
}
export const commandHash = (value: unknown): string => createHash('sha256').update(canonical(value)).digest('hex');
export async function commandLock(tx: TransactionContext, scope: unknown): Promise<void> {
  await tx.query('SELECT pg_advisory_xact_lock($1::bigint)', [BigInt.asIntN(64, BigInt('0x' + commandHash(scope).slice(0, 16))).toString()]);
}
const errors: Partial<Record<SafeCode, number>> = { BAD_REQUEST: 400, NOT_FOUND: 404, CONFLICT: 409,
  PRECONDITION_FAILED: 412, UNPROCESSABLE: 422, IDEMPOTENCY_MISMATCH: 409 };
export interface CommandOptions {
  surface: string; actorScope: string; lockIdentity: string; operation: string; key: string; input: unknown;
  authorize(tx: TransactionContext): Promise<string>;
  guard?(tx: TransactionContext, actor: string): Promise<CommandResult | void>;
  execute(tx: TransactionContext, actor: string): Promise<CommandResult>;
}
export class Commands {
  constructor(private readonly database: Database) {}
  run(options: CommandOptions): Promise<CommandResult> {
    const digest = commandHash(options.input);
    return this.database.transaction(async tx => {
      await commandLock(tx, [options.surface, options.actorScope, options.lockIdentity, options.operation, options.key]);
      const actor = await options.authorize(tx);
      const scope = [options.surface, options.actorScope, actor, options.operation, options.key];
      const old = (await tx.query(`SELECT id,request_hash,state,response_snapshot,expires_at<=clock_timestamp() AS expired
        FROM platform.idempotency_records WHERE surface=$1 AND actor_scope=$2 AND actor_reference=$3 AND operation=$4 AND idempotency_key=$5 FOR UPDATE`, scope)).rows[0];
      // Guard precedes replay and runs outside the effect savepoint, so observed cart expiry can commit.
      const denial = await options.guard?.(tx, actor);
      if (denial) return denial;
      if (old) {
        if (old.request_hash !== digest) return { status: 409, body: { code: 'IDEMPOTENCY_MISMATCH' } };
        if (old.expired || old.state !== 'completed') return { status: 409, body: { code: 'CONFLICT' } };
        return { ...old.response_snapshot as CommandResult, replayed: true };
      }
      const id = (await tx.query(`INSERT INTO platform.idempotency_records(surface,actor_scope,actor_reference,operation,idempotency_key,request_hash,state)
        VALUES($1,$2,$3,$4,$5,$6,'started') RETURNING id`, [...scope, digest])).rows[0]!.id;
      await tx.query('SAVEPOINT command_effect');
      let result: CommandResult;
      try { result = await options.execute(tx, actor); }
      catch (error) {
        const code = error instanceof DatabaseFailure ? error.code : databaseCode(error);
        if (!errors[code]) throw error;
        await tx.query('ROLLBACK TO SAVEPOINT command_effect');
        result = { status: errors[code]!, body: { code } };
      }
      await tx.query('RELEASE SAVEPOINT command_effect');
      const snapshot = JSON.stringify(result);
      await tx.query(`UPDATE platform.idempotency_records SET state='completed',completed_at=now(),updated_at=now(),version=version+1,
        http_status=$2,response_snapshot=$3,response_fingerprint=$4,response_schema_version=1 WHERE id=$1`,
      [id, result.status, snapshot, commandHash(JSON.parse(snapshot))]);
      return result;
    });
  }
}
