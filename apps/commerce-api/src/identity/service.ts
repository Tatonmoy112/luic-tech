import { randomUUID } from 'node:crypto';
import { Database, TransactionContext, requestContext } from '@luic/platform';
import { VerifiedIdentity } from './authentication';
import { addressColumns, addressInput, fail, object, string, uuid, version } from './validation';

const profileProjection = 'id, display_name AS "displayName", phone_e164 AS "phoneE164", version';
const addressProjection = 'id, label, recipient_name AS "recipientName", phone_e164 AS "phoneE164", line_1 AS "line1", line_2 AS "line2", area, city, postal_code AS "postalCode", country_code AS "countryCode", is_default_shipping AS "isDefaultShipping", is_default_billing AS "isDefaultBilling", version';
const staffProjection = 'id, display_name AS "displayName", status, permission_epoch AS "permissionEpoch", version';
type Row = Record<string, any>;

// Every access write takes this lock BEFORE reading authorization. Small local fixture;
// future scaling can replace it only with equivalent revocation/lock-order evidence.
export async function lockAccess(tx: TransactionContext): Promise<void> { await tx.query('SELECT pg_advisory_xact_lock(2002, 1)'); }
export async function audit(tx: TransactionContext, actor: string, action: string, target: string, reason: string, summary: Record<string, unknown>): Promise<void> {
  await tx.query('INSERT INTO platform.audit_events(actor_staff_id,action,target_id,reason,correlation_id,summary) VALUES($1,$2,$3,$4,$5,$6)',
    [actor, action, target, reason, requestContext.getStore()?.correlationId ?? randomUUID(), JSON.stringify(summary)]);
}
export async function permissions(tx: TransactionContext, staff: string): Promise<string[]> {
  return (await tx.query(`SELECT DISTINCT p.code FROM iam.staff_role_assignments a
    JOIN iam.roles r ON r.id=a.role_id AND r.status='active'
    JOIN iam.role_permissions rp ON rp.role_id=r.id JOIN iam.permissions p ON p.id=rp.permission_id
    WHERE a.staff_account_id=$1 AND a.revoked_at IS NULL AND a.starts_at<=clock_timestamp()
    AND (a.ends_at IS NULL OR a.ends_at>clock_timestamp()) ORDER BY p.code`, [staff])).rows.map(r => r.code as string);
}

export class IdentityService {
  constructor(private readonly db: Database) {}
  private async customer(tx: TransactionContext, identity: VerifiedIdentity): Promise<Row> {
    if (identity.kind !== 'customer') return fail('FORBIDDEN');
    await tx.query(`INSERT INTO iam.customers(auth_issuer,auth_subject,last_authenticated_at) VALUES($1,$2,now())
      ON CONFLICT(auth_issuer,auth_subject) DO NOTHING`, [identity.issuer, identity.subject]);
    const row = (await tx.query(`SELECT ${profileProjection}, status FROM iam.customers
      WHERE auth_issuer=$1 AND auth_subject=$2 FOR UPDATE`, [identity.issuer, identity.subject])).rows[0]!;
    if (row.status !== 'active') return fail('FORBIDDEN');
    return row;
  }
  async profile(identity: VerifiedIdentity, body?: unknown, match?: string): Promise<Row> {
    let changes: Record<string, unknown> | undefined;
    let expected: string | undefined;
    if (body !== undefined) {
      changes = object(body, ['displayName', 'phoneE164']);
      if (!Object.keys(changes).length) return fail('BAD_REQUEST');
      for (const [key, value] of Object.entries(changes)) if (value !== null)
        string(value, key === 'displayName' ? 100 : 16, key === 'phoneE164' ? /^\+[1-9][0-9]{7,14}$/ : undefined);
      expected = version(match);
    }
    return this.db.transaction(async tx => {
      const customer = await this.customer(tx, identity);
      if (!changes) { const { status: _status, ...safe } = customer; return safe; }
      if (customer.version !== expected) return fail('PRECONDITION_FAILED');
      return (await tx.query(`UPDATE iam.customers SET display_name=$2,phone_e164=$3,version=version+1,updated_at=now()
        WHERE id=$1 RETURNING ${profileProjection}`, [customer.id,
        changes.displayName === undefined ? customer.displayName : changes.displayName,
        changes.phoneE164 === undefined ? customer.phoneE164 : changes.phoneE164])).rows[0]!;
    });
  }
  async addresses(identity: VerifiedIdentity, method: 'list' | 'create' | 'patch' | 'delete', body?: unknown, id?: string, match?: string): Promise<Row | Row[]> {
    const target = method === 'patch' || method === 'delete' ? uuid(id) : undefined;
    const input = method === 'create' || method === 'patch' ? addressInput(body, method === 'create') : undefined;
    const expected = target ? version(match) : undefined;
    return this.db.transaction(async tx => {
      const customer = await this.customer(tx, identity); // serializes cap/default changes per owner
      if (method === 'list') return (await tx.query(`SELECT ${addressProjection} FROM iam.customer_addresses
        WHERE customer_id=$1 AND archived_at IS NULL ORDER BY id LIMIT 10`, [customer.id])).rows;
      if (target) {
        const row = (await tx.query('SELECT version FROM iam.customer_addresses WHERE id=$1 AND customer_id=$2 AND archived_at IS NULL FOR UPDATE', [target, customer.id])).rows[0];
        if (!row) return fail('NOT_FOUND');
        if (row.version !== expected) return fail('PRECONDITION_FAILED');
      }
      if (method === 'delete') return (await tx.query(`UPDATE iam.customer_addresses SET archived_at=now(),updated_at=now(),
        version=version+1,is_default_shipping=false,is_default_billing=false WHERE id=$1 AND customer_id=$2 RETURNING id,version`, [target, customer.id])).rows[0]!;
      if (method === 'create' && Number((await tx.query('SELECT count(*) FROM iam.customer_addresses WHERE customer_id=$1 AND archived_at IS NULL', [customer.id])).rows[0]!.count) >= 10) return fail('CONFLICT');
      for (const key of ['isDefaultShipping', 'isDefaultBilling']) if (input![key] === true) {
        const column = addressColumns[key]!; // server-owned identifiers only
        await tx.query(`UPDATE iam.customer_addresses SET ${column}=false,version=version+1,updated_at=now()
          WHERE customer_id=$1 AND archived_at IS NULL AND ${column}=true AND id IS DISTINCT FROM $2::uuid`, [customer.id, target ?? null]);
      }
      const entries = Object.entries(input!);
      if (method === 'create') return (await tx.query(`INSERT INTO iam.customer_addresses(customer_id,${entries.map(([key]) => addressColumns[key]).join(',')})
        VALUES($1,${entries.map((_, i) => '$' + (i + 2)).join(',')}) RETURNING ${addressProjection}`, [customer.id, ...entries.map(([, value]) => value)])).rows[0]!;
      return (await tx.query(`UPDATE iam.customer_addresses SET ${entries.map(([key], i) => addressColumns[key] + '=$' + (i + 3)).join(',')},
        version=version+1,updated_at=now() WHERE id=$1 AND customer_id=$2 RETURNING ${addressProjection}`, [target, customer.id, ...entries.map(([, value]) => value)])).rows[0]!;
    });
  }
  private async staff(tx: TransactionContext, identity: VerifiedIdentity, permission?: string): Promise<Row> {
    if (identity.kind !== 'staff') return fail('FORBIDDEN');
    const row = (await tx.query(`SELECT ${staffProjection} FROM iam.staff_accounts WHERE auth_issuer=$1 AND auth_subject=$2`, [identity.issuer, identity.subject])).rows[0];
    if (!row || row.status !== 'active') return fail('FORBIDDEN');
    const grants = await permissions(tx, row.id);
    if (permission && !grants.includes(permission)) return fail('FORBIDDEN');
    return { ...row, permissions: grants };
  }
  async me(identity: VerifiedIdentity): Promise<Row> {
    return this.db.transaction(async tx => { await lockAccess(tx); return this.staff(tx, identity); });
  }
  async access(identity: VerifiedIdentity, action: 'roles' | 'detail' | 'create' | 'grant' | 'revoke' | 'status', body?: unknown, id?: string, assignmentId?: string, match?: string): Promise<Row | Row[]> {
    const target = id === undefined ? undefined : uuid(id);
    const assignment = assignmentId === undefined ? undefined : uuid(assignmentId);
    const fields = action === 'create' ? ['subject', 'displayName', 'reason'] : action === 'grant' ? ['roleCode', 'reason', 'endsAt'] : action === 'status' ? ['status', 'reason'] : ['reason'];
    const input = ['roles', 'detail'].includes(action) ? undefined : object(body, fields);
    const reason = input ? string(input.reason, 200) : '';
    if (action === 'create') { string(input!.subject, 110, /^synthetic:[A-Za-z0-9._-]{1,100}$/); string(input!.displayName, 100); }
    if (action === 'grant') {
      string(input!.roleCode, 64, /^[a-z][a-z._]{0,63}$/);
      if (input!.endsAt !== undefined && (typeof input!.endsAt !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(input!.endsAt) ||
        !Number.isFinite(Date.parse(input!.endsAt)) || Date.parse(input!.endsAt) <= Date.now())) return fail('BAD_REQUEST');
    }
    if (action === 'status' && !['active', 'disabled'].includes(input!.status as string)) return fail('BAD_REQUEST');
    const expected = ['grant', 'revoke', 'status'].includes(action) ? version(match) : undefined;
    return this.db.transaction(async tx => {
      await lockAccess(tx);
      const actor = await this.staff(tx, identity, ['roles', 'detail'].includes(action) ? 'access.read' : 'access.manage');
      if (action === 'roles') return (await tx.query('SELECT code,name FROM iam.roles WHERE status=$1 ORDER BY code LIMIT 100', ['active'])).rows;
      if (action === 'create') {
        const row = (await tx.query(`INSERT INTO iam.staff_accounts(auth_issuer,auth_subject,display_name) VALUES($1,$2,$3) RETURNING ${staffProjection}`, [identity.issuer, input!.subject, input!.displayName])).rows[0]!;
        await audit(tx, actor.id, 'access.staff.create', row.id, reason, { status: 'active' });
        return row;
      }
      const row = (await tx.query(`SELECT ${staffProjection} FROM iam.staff_accounts WHERE id=$1 FOR UPDATE`, [target])).rows[0];
      if (!row) return fail('NOT_FOUND');
      if (action === 'detail') return { ...row, assignments: (await tx.query(`SELECT a.id,r.code AS "roleCode",a.starts_at AS "startsAt",a.ends_at AS "endsAt",a.revoked_at AS "revokedAt"
        FROM iam.staff_role_assignments a JOIN iam.roles r ON r.id=a.role_id WHERE a.staff_account_id=$1 ORDER BY a.created_at DESC,a.id LIMIT 100`, [target])).rows };
      if (actor.id === target) return fail('FORBIDDEN'); // no self escalation/revocation/status changes
      if (row.version !== expected) return fail('PRECONDITION_FAILED');
      let changedAssignment: string | undefined;
      if (action === 'grant') {
        if (row.status !== 'active') return fail('CONFLICT');
        const role = (await tx.query('SELECT id FROM iam.roles WHERE code=$1 AND status=$2', [input!.roleCode, 'active'])).rows[0];
        if (!role) return fail('BAD_REQUEST');
        changedAssignment = (await tx.query(`INSERT INTO iam.staff_role_assignments(staff_account_id,role_id,granted_by_staff_id,reason,ends_at)
          VALUES($1,$2,$3,$4,$5) RETURNING id`, [target, role.id, actor.id, reason, input!.endsAt ?? null])).rows[0]!.id;
      } else if (action === 'revoke') {
        const revoked = await tx.query(`UPDATE iam.staff_role_assignments SET revoked_at=now(),revoked_by_staff_id=$3,version=version+1,updated_at=now()
          WHERE id=$1 AND staff_account_id=$2 AND revoked_at IS NULL RETURNING id`, [assignment, target, actor.id]);
        if (!revoked.rowCount) return fail('NOT_FOUND');
        changedAssignment = assignment;
      } else {
        if (row.status === input!.status) return fail('CONFLICT');
        await tx.query(`UPDATE iam.staff_accounts SET status=$2,revoked_at=CASE WHEN $2='disabled' THEN now() ELSE NULL END WHERE id=$1`, [target, input!.status]);
      }
      // Preserve a non-expiring active access manager, including when the caller has a timed grant.
      const remaining = await tx.query(`SELECT 1 FROM iam.staff_accounts s JOIN iam.staff_role_assignments a ON a.staff_account_id=s.id
        JOIN iam.roles r ON r.id=a.role_id JOIN iam.role_permissions rp ON rp.role_id=r.id JOIN iam.permissions p ON p.id=rp.permission_id
        WHERE s.status='active' AND r.status='active' AND p.code='access.manage' AND a.revoked_at IS NULL
        AND a.starts_at<=clock_timestamp() AND a.ends_at IS NULL LIMIT 1`);
      if (!remaining.rowCount) return fail('CONFLICT');
      const updated = (await tx.query(`UPDATE iam.staff_accounts SET version=version+1,permission_epoch=permission_epoch+1,updated_at=now()
        WHERE id=$1 RETURNING ${staffProjection}`, [target])).rows[0]!;
      await audit(tx, actor.id, 'access.' + action, target!, reason, { beforeVersion: row.version, afterVersion: updated.version,
        ...(changedAssignment ? { assignmentId: changedAssignment } : { beforeStatus: row.status, afterStatus: updated.status }) });
      return { ...updated, ...(changedAssignment ? { assignmentId: changedAssignment } : {}) };
    });
  }
}
