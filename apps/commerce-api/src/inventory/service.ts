import { randomUUID } from 'node:crypto';
import { Commands, CommandResult, Database, TransactionContext, commandHash, requestContext } from '@luic/platform';
import { VerifiedIdentity } from '../identity/authentication';
import { authorizeStaff } from '../identity/service';
import { fail, object, string, uuid, version } from '../identity/validation';

export type Availability = 'unknown' | 'in_stock' | 'out_of_stock';
export interface AvailabilityPort { observe(tx: TransactionContext, variants: string[]): Promise<Map<string, Availability>> }
export class InventoryObservation implements AvailabilityPort {
  async observe(tx: TransactionContext, variants: string[]): Promise<Map<string, Availability>> {
    const rows = (await tx.query(`SELECT p.variant_id,CASE WHEN p.sellable_on_hand-p.reserved_quantity>0 THEN 'in_stock' ELSE 'out_of_stock' END AS availability
      FROM inventory.stock_positions p JOIN inventory.stock_locations l ON l.id=p.stock_location_id
      WHERE p.variant_id=ANY($1::uuid[]) AND l.status='active' AND l.is_sellable`, [variants])).rows;
    return new Map(rows.map(row => [row.variant_id as string, row.availability as Availability]));
  }
}
export function inventoryPage(query: unknown, filter: unknown): { limit: number; after: string | null } {
  const q = object(query, ['limit', 'cursor', 'variantId']);
  const limit = q.limit === undefined ? 20 : Number(string(q.limit, 3, /^[1-9][0-9]{0,2}$/));
  if (limit > 100) return fail('BAD_REQUEST');
  let after: string | null = null;
  if (q.cursor !== undefined) {
    try {
      const raw = string(q.cursor, 512, /^[A-Za-z0-9_-]+$/), value = object(JSON.parse(Buffer.from(raw, 'base64url').toString()), ['after', 'filter']);
      if (value.filter !== commandHash({ filter, limit })) return fail('BAD_REQUEST');
      after = uuid(value.after);
    } catch { return fail('BAD_REQUEST'); }
  }
  return { limit, after };
}
const columns = 'id,variant_id AS "variantId",stock_location_id AS "stockLocationId",sellable_on_hand AS "sellableOnHand",reserved_quantity AS "reservedQuantity",(sellable_on_hand-reserved_quantity) AS available,version';
export class InventoryService {
  private readonly commands: Commands;
  constructor(private readonly db: Database) { this.commands = new Commands(db); }
  async read(identity: VerifiedIdentity, idValue?: unknown, query: unknown = {}, ledger = false): Promise<Record<string, unknown>> {
    const id = idValue === undefined ? null : uuid(idValue), q = object(query, ['limit', 'cursor', 'variantId']);
    const variantId = q.variantId === undefined ? null : uuid(q.variantId);
    if (id && variantId) return fail('BAD_REQUEST');
    const filter = { id, variantId, ledger }, page = inventoryPage(q, filter);
    return this.db.transaction(async tx => {
      await authorizeStaff(tx, identity, 'inventory.read');
      if (id && !ledger) {
        const row = (await tx.query(`SELECT ${columns} FROM inventory.stock_positions WHERE id=$1`, [id])).rows[0];
        return row ?? fail('NOT_FOUND');
      }
      if (id && !(await tx.query('SELECT 1 FROM inventory.stock_positions WHERE id=$1', [id])).rowCount) return fail('NOT_FOUND');
      const rows = ledger ? (await tx.query(`SELECT id,stock_position_id AS "stockPositionId",movement_type AS "movementType",delta_sellable AS "deltaSellable",delta_reserved AS "deltaReserved",
        sellable_after AS "sellableAfter",reserved_after AS "reservedAfter",position_version AS "positionVersion",operation_key AS "operationKey",reason_code AS "reasonCode",occurred_at AS "occurredAt"
        FROM inventory.stock_movements WHERE stock_position_id=$1 AND ($2::uuid IS NULL OR id>$2) ORDER BY id LIMIT $3`, [id, page.after, page.limit + 1])).rows
        : (await tx.query(`SELECT ${columns} FROM inventory.stock_positions WHERE ($1::uuid IS NULL OR variant_id=$1) AND ($2::uuid IS NULL OR id>$2) ORDER BY id LIMIT $3`, [variantId, page.after, page.limit + 1])).rows;
      const items = rows.slice(0, page.limit);
      return { items, nextCursor: rows.length > page.limit ? Buffer.from(JSON.stringify({ after: items.at(-1)!.id, filter: commandHash({ filter, limit: page.limit }) })).toString('base64url') : null };
    });
  }
  adjust(identity: VerifiedIdentity, body: unknown, key: unknown, match: unknown, opening = false): Promise<CommandResult> {
    const input = object(body, ['positionId', 'deltaSellable', 'operationKey', 'reasonCode', 'reasonNote']);
    const positionId = uuid(input.positionId), operationKey = uuid(input.operationKey), expected = version(match);
    const delta = input.deltaSellable;
    if (typeof delta !== 'number' || !Number.isInteger(delta) || delta === 0 || Math.abs(delta) > 1000) return fail('BAD_REQUEST');
    const reason = string(input.reasonCode, 64, /^[a-z][a-z0-9_]*$/), note = input.reasonNote === undefined ? null : string(input.reasonNote, 200);
    return this.commands.run({ surface: 'staff', actorScope: 'staff', lockIdentity: identity.issuer + ':' + identity.subject,
      operation: opening ? 'inventory.opening' : 'inventory.adjust', key: uuid(key), input: { positionId, operationKey, delta, expected, reason, note },
      authorize: tx => authorizeStaff(tx, identity, 'inventory.adjust'), execute: async (tx, actor) => {
        const p = (await tx.query(`SELECT ${columns} FROM inventory.stock_positions WHERE id=$1 ORDER BY stock_location_id,variant_id FOR UPDATE`, [positionId])).rows[0];
        if (!p) return fail('NOT_FOUND');
        if (p.version !== expected) return fail('PRECONDITION_FAILED');
        const after = BigInt(p.sellableOnHand) + BigInt(delta);
        if (after < BigInt(p.reservedQuantity) || after > 9223372036854775807n) return fail('CONFLICT');
        const correlation = requestContext.getStore()?.correlationId;
        const correlationId = correlation && /^[0-9a-f-]{36}$/i.test(correlation) ? correlation : randomUUID();
        const next = (BigInt(p.version) + 1n).toString(), movementId = randomUUID();
        await tx.query(`INSERT INTO inventory.stock_movements(id,stock_position_id,movement_type,delta_sellable,sellable_after,reserved_after,position_version,operation_key,actor_staff_id,reason_code,reason_note,correlation_id)
          VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`, [movementId, positionId, opening ? 'opening' : 'adjustment', delta, after.toString(), p.reservedQuantity, next, operationKey, actor, reason, note, correlationId]);
        const productId = (await tx.query('SELECT product_id FROM catalog.product_variants WHERE id=$1', [p.variantId])).rows[0]!.product_id;
        await tx.query(`INSERT INTO platform.audit_events(actor_staff_id,action,target_schema,target_table,target_id,reason,summary,correlation_id)
          VALUES($1,'inventory.adjust','inventory','stock_positions',$2,$3,$4,$5)`, [actor, positionId, reason, JSON.stringify({ movementId, deltaSellable: delta, sellableAfter: after.toString(), version: next }), correlationId]);
        const eventId = randomUUID();
        await tx.query(`INSERT INTO platform.outbox_events(id,aggregate_type,aggregate_id,aggregate_version,event_type,event_schema_version,payload,correlation_id,producer,routing_version)
          VALUES($1,'stock_position',$2,$3,'stock.position.changed',1,$4,$5,'inventory',1)`,
        [eventId, positionId, next, JSON.stringify({ stockPositionId: positionId, variantId: p.variantId, productId, version: next }), correlationId]);
        await tx.query("INSERT INTO platform.outbox_deliveries(event_id,destination_key) VALUES($1,'search-projection')", [eventId]);
        return { status: 201, body: { ...p, sellableOnHand: after.toString(), available: (after - BigInt(p.reservedQuantity)).toString(), version: next, movementId } };
      } });
  }
}
