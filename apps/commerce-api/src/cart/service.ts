import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Commands, CommandResult, Database, TransactionContext } from '@luic/platform';
import type { VerifiedIdentity } from '../identity/authentication';
import { authorizeCustomer } from '../identity/service';
import { fail, object, uuid, version } from '../identity/validation';
import type { CatalogObservationPort } from '../catalog/observation';
import type { AvailabilityPort } from '../inventory/service';

export type CartOwner = { identity: VerifiedIdentity; guestHash?: never } | { guestHash: string; identity?: never };
type Row = Record<string, any>;
export function guestHash(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{43}$/.test(value) || Buffer.from(value, 'base64url').toString('base64url') !== value) return fail('UNAUTHORIZED');
  return createHash('sha256').update(Buffer.from(value, 'base64url')).digest('hex');
}
const sameHash = (a: unknown, b: string): boolean => typeof a === 'string' && a.length === b.length && timingSafeEqual(Buffer.from(a), Buffer.from(b));
const denial = (): CommandResult => ({ status: 404, body: { code: 'NOT_FOUND' } });
const quantity = (value: unknown): number => typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 20 ? value : fail('BAD_REQUEST');
export class CartService {
  private readonly commands: Commands;
  constructor(private readonly db: Database, private readonly catalog: CatalogObservationPort, private readonly inventory: AvailabilityPort) { this.commands = new Commands(db); }
  private authorize(tx: TransactionContext, owner: CartOwner): Promise<string> {
    return owner.identity ? authorizeCustomer(tx, owner.identity) : Promise.resolve(owner.guestHash);
  }
  private owns(row: Row, owner: CartOwner, actor: string): boolean {
    return owner.identity ? row.customer_id === actor : row.customer_id === null && sameHash(row.guest_owner_hash, owner.guestHash);
  }
  private async expire(tx: TransactionContext, row: Row): Promise<boolean> {
    // Database time is reread after acquiring the lock, not before a possible wait.
    const expired = (await tx.query('SELECT expires_at<=clock_timestamp() AS expired FROM sales.carts WHERE id=$1', [row.id])).rows[0]!.expired;
    if (expired && row.state === 'active') {
      await tx.query("UPDATE sales.carts SET state='expired',version=version+1,updated_at=now() WHERE id=$1", [row.id]);
      row.state = 'expired';
    }
    return expired;
  }
  private async projection(tx: TransactionContext, cart: Row): Promise<Record<string, unknown>> {
    const lines = (await tx.query('SELECT id,variant_id,quantity,observed_unit_price_minor FROM sales.cart_lines WHERE cart_id=$1 ORDER BY variant_id LIMIT 50', [cart.id])).rows;
    const ids = lines.map(r => r.variant_id as string), catalog = await this.catalog.observe(tx, ids), stock = await this.inventory.observe(tx, ids);
    let total = 0n, complete = true;
    const items = lines.map(line => {
      const current = catalog.get(line.variant_id), warnings: string[] = [];
      if (!current?.eligible) warnings.push('UNAVAILABLE');
      if (current?.unitPriceMinor !== line.observed_unit_price_minor) warnings.push('PRICE_CHANGED');
      if (line.quantity > (current?.maxQuantity ?? 20)) warnings.push('QUANTITY_LIMIT_CHANGED');
      const availability = stock.get(line.variant_id) ?? 'unknown';
      if (availability === 'out_of_stock') warnings.push('OUT_OF_STOCK');
      if (!current?.eligible || !current.unitPriceMinor) complete = false;
      else total += BigInt(current.unitPriceMinor) * BigInt(line.quantity);
      return { id: line.id, variantId: line.variant_id, quantity: line.quantity, title: current?.title ?? null,
        observedUnitPriceMinor: line.observed_unit_price_minor, currentUnitPriceMinor: current?.unitPriceMinor ?? null,
        indicativeAvailability: availability, warnings };
    });
    return { id: cart.id, version: cart.version, state: cart.state, currency: 'BDT', expiresAt: cart.expires_at,
      items, merchandiseEstimateMinor: complete ? total.toString() : null };
  }
  async guestCreate(body: unknown): Promise<CommandResult> {
    object(body, []);
    const token = randomBytes(32).toString('base64url');
    return this.db.transaction(async tx => {
      const row = (await tx.query('INSERT INTO sales.carts(guest_owner_hash) VALUES($1) RETURNING *', [guestHash(token)])).rows[0]!;
      return { status: 201, body: { ...await this.projection(tx, row), guestToken: token } };
    });
  }
  async get(owner: CartOwner, create = false, body: unknown = {}): Promise<CommandResult> {
    object(body, []);
    if (create && !owner.identity) return fail('UNAUTHORIZED');
    return this.db.transaction(async tx => {
      const actor = await this.authorize(tx, owner);
      let row = (await tx.query(`SELECT * FROM sales.carts WHERE ${owner.identity ? "customer_id=$1 AND state='active'" : 'guest_owner_hash=$1'} ORDER BY id FOR UPDATE`, [actor])).rows[0];
      if (row && (await this.expire(tx, row) || row.state !== 'active')) row = undefined;
      if (!row && create) row = (await tx.query('INSERT INTO sales.carts(customer_id) VALUES($1) RETURNING *', [actor])).rows[0];
      if (!row) return denial();
      return { status: 200, body: await this.projection(tx, row) };
    });
  }
  mutate(owner: CartOwner, action: 'add' | 'change' | 'remove' | 'clear', body: unknown, key: unknown, match: unknown, variantValue?: unknown): Promise<CommandResult> {
    const fields = action === 'add' ? ['cartId', 'variantId', 'quantity'] : action === 'change' ? ['cartId', 'quantity'] : ['cartId'];
    const input = object(body, fields), cartId = uuid(input.cartId), expected = version(match);
    const variantId = action === 'clear' ? null : uuid(action === 'add' ? input.variantId : variantValue);
    const requested = action === 'add' || action === 'change' ? quantity(input.quantity) : null;
    let cart: Row;
    return this.commands.run({ surface: 'cart', actorScope: owner.identity ? 'customer' : 'guest',
      lockIdentity: owner.identity ? owner.identity.issuer + ':' + owner.identity.subject : owner.guestHash,
      operation: 'cart.' + action, key: uuid(key), input: { cartId, variantId, requested, expected },
      authorize: tx => this.authorize(tx, owner), guard: async (tx, actor) => {
        const row = (await tx.query('SELECT * FROM sales.carts WHERE id=$1 FOR UPDATE', [cartId])).rows[0];
        if (!row || !this.owns(row, owner, actor)) return denial();
        cart = row;
        if (await this.expire(tx, row) || row.state !== 'active') return denial();
      }, execute: async tx => {
        if (cart.version !== expected) return fail('PRECONDITION_FAILED');
        if (action === 'clear') await tx.query('DELETE FROM sales.cart_lines WHERE cart_id=$1', [cartId]);
        else {
          const line = (await tx.query('SELECT * FROM sales.cart_lines WHERE cart_id=$1 AND variant_id=$2', [cartId, variantId])).rows[0];
          if (action !== 'add' && !line) return fail('NOT_FOUND');
          if (action === 'remove') await tx.query('DELETE FROM sales.cart_lines WHERE cart_id=$1 AND variant_id=$2', [cartId, variantId]);
          else {
            const next = action === 'add' ? (line?.quantity ?? 0) + requested! : requested!;
            const current = (await this.catalog.observe(tx, [variantId!])).get(variantId!);
            if (!current || next > Math.min(20, current.maxQuantity)) return fail('CONFLICT');
            if ((!line || next > line.quantity) && !current.eligible) return fail('UNPROCESSABLE');
            const price = current.eligible ? current.unitPriceMinor : line?.observed_unit_price_minor ?? null;
            await tx.query(`INSERT INTO sales.cart_lines(cart_id,variant_id,quantity,observed_unit_price_minor,observed_currency)
              VALUES($1,$2,$3,$4,$5) ON CONFLICT(cart_id,variant_id) DO UPDATE SET quantity=$3,observed_unit_price_minor=$4,observed_currency=$5,version=sales.cart_lines.version+1,updated_at=now()`,
            [cartId, variantId, next, price, price === null ? null : 'BDT']);
          }
        }
        const updated = (await tx.query(`UPDATE sales.carts SET version=version+1,updated_at=now(),last_activity_at=clock_timestamp(),expires_at=clock_timestamp()+interval '30 days'
          WHERE id=$1 RETURNING *`, [cartId])).rows[0]!;
        return { status: 200, body: await this.projection(tx, updated) };
      } });
  }
  merge(identity: VerifiedIdentity, capability: string, body: unknown, key: unknown, match: unknown): Promise<CommandResult> {
    const input = object(body, ['sourceCartId', 'targetCartId', 'sourceVersion']);
    const sourceId = uuid(input.sourceCartId), targetId = uuid(input.targetCartId), expected = version(match), sourceVersion = version('"' + String(input.sourceVersion) + '"');
    if (typeof input.sourceVersion !== 'string' || sourceId === targetId) return fail('BAD_REQUEST');
    const hash = guestHash(capability);
    let source: Row, target: Row;
    return this.commands.run({ surface: 'cart', actorScope: 'customer', lockIdentity: identity.issuer + ':' + identity.subject,
      operation: 'cart.merge', key: uuid(key), input: { sourceId, targetId, expected, sourceVersion }, authorize: tx => authorizeCustomer(tx, identity),
      guard: async (tx, actor) => {
        const rows = (await tx.query('SELECT * FROM sales.carts WHERE id=ANY($1::uuid[]) ORDER BY id FOR UPDATE', [[sourceId, targetId]])).rows;
        const s = rows.find(row => row.id === sourceId), t = rows.find(row => row.id === targetId);
        if (!s || !t || s.customer_id !== null || !sameHash(s.guest_owner_hash, hash) || t.customer_id !== actor) return denial();
        source = s; target = t;
        if (await this.expire(tx, s) || await this.expire(tx, t) || t.state !== 'active') return denial();
        if (s.state !== 'active' && !(s.state === 'merged' && s.merged_into_cart_id === targetId)) return denial();
      }, execute: async tx => {
        if (source.state !== 'active') return fail('CONFLICT');
        if (source.version !== sourceVersion || target.version !== expected) return fail('PRECONDITION_FAILED');
        const lines = (await tx.query('SELECT * FROM sales.cart_lines WHERE cart_id=ANY($1::uuid[]) ORDER BY variant_id,cart_id', [[sourceId, targetId]])).rows;
        const desired = new Map<string, { quantity: number; price: string | null }>();
        // Target observation wins for duplicates; stable result independent of insertion order.
        for (const line of lines.filter(row => row.cart_id === targetId).concat(lines.filter(row => row.cart_id === sourceId))) {
          const old = desired.get(line.variant_id);
          desired.set(line.variant_id, { quantity: (old?.quantity ?? 0) + line.quantity, price: old ? old.price : line.observed_unit_price_minor });
        }
        if (desired.size > 50) return fail('CONFLICT');
        const observations = await this.catalog.observe(tx, [...desired.keys()]);
        const adjustments: Record<string, unknown>[] = [];
        for (const [variantId, line] of [...desired].sort(([a], [b]) => a.localeCompare(b))) {
          const accepted = Math.min(line.quantity, 20, observations.get(variantId)?.maxQuantity ?? 20);
          if (accepted !== line.quantity) adjustments.push({ variantId, requestedQuantity: line.quantity, acceptedQuantity: accepted, reason: 'QUANTITY_LIMIT' });
          await tx.query(`INSERT INTO sales.cart_lines(cart_id,variant_id,quantity,observed_unit_price_minor,observed_currency)
            VALUES($1,$2,$3,$4,$5) ON CONFLICT(cart_id,variant_id) DO UPDATE SET quantity=$3,version=sales.cart_lines.version+1,updated_at=now()`,
          [targetId, variantId, accepted, line.price, line.price === null ? null : 'BDT']);
        }
        // Retain the source lines as terminal history, not an independently mutable cart.
        await tx.query("UPDATE sales.carts SET state='merged',merged_into_cart_id=$2,version=version+1,updated_at=now() WHERE id=$1", [sourceId, targetId]);
        const updated = (await tx.query(`UPDATE sales.carts SET version=version+1,updated_at=now(),last_activity_at=clock_timestamp(),expires_at=clock_timestamp()+interval '30 days'
          WHERE id=$1 RETURNING *`, [targetId])).rows[0]!;
        return { status: 200, body: { ...await this.projection(tx, updated), sourceCartId: sourceId, sourceVersion: (BigInt(source.version) + 1n).toString(), adjustments } };
      } });
  }
}
