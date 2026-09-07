import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { IdentityVerifier } from './authentication';

// Deployment command only. Not imported by the HTTP composition or exposed as a route.
export async function bootstrapAdmin(pool: Pool, verifier: IdentityVerifier, token: string): Promise<string> {
  const identity = verifier.verify('Bearer ' + token, 'staff');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock(2002, 1)');
    const role = (await client.query('SELECT current_user AS name')).rows[0].name;
    if (role !== 'commerce_migrator') throw new Error('Deployment role required');
    if ((await client.query("SELECT 1 FROM platform.audit_events WHERE action='access.bootstrap'")).rowCount ||
      (await client.query('SELECT 1 FROM iam.staff_accounts LIMIT 1')).rowCount) throw new Error('Bootstrap already closed');
    const id = (await client.query(`INSERT INTO iam.staff_accounts(auth_issuer,auth_subject,display_name,last_authenticated_at)
      VALUES($1,$2,'Synthetic initial administrator',now()) RETURNING id`, [identity.issuer, identity.subject])).rows[0].id;
    const roleCodes = ['access_admin', 'catalog_editor'];
    for (const code of roleCodes) await client.query('INSERT INTO iam.roles(code,name) VALUES($1,$2)', [code, code === 'access_admin' ? 'Synthetic access administrator' : 'Synthetic catalog editor']);
    for (const code of ['access.read', 'access.manage', 'catalog.edit', 'catalog.publish']) {
      const [resource, action] = code.split('.');
      await client.query('INSERT INTO iam.permissions(code,resource,action,risk_level) VALUES($1,$2,$3,$4)', [code, resource, action, action === 'read' ? 'ordinary' : 'sensitive']);
      await client.query(`INSERT INTO iam.role_permissions(role_id,permission_id,granted_by_staff_id)
        SELECT r.id,p.id,$3 FROM iam.roles r,iam.permissions p WHERE r.code=$1 AND p.code=$2`, [resource === 'access' ? 'access_admin' : 'catalog_editor', code, id]);
    }
    await client.query(`INSERT INTO iam.staff_role_assignments(staff_account_id,role_id,granted_by_staff_id,reason)
      SELECT $1,id,$1,'Synthetic deployment bootstrap' FROM iam.roles WHERE code='access_admin'`, [id]);
    await client.query(`INSERT INTO platform.audit_events(actor_staff_id,action,target_id,reason,correlation_id,summary)
      VALUES($1,'access.bootstrap',$1,'Synthetic deployment bootstrap',$2,$3)`, [id, randomUUID(), JSON.stringify({ profile: 'DEV-PHYSICAL-BD', revision: 1, mode: 'synthetic', verifiedMfa: true, deploymentRole: 'commerce_migrator', role: 'access_admin' })]);
    await client.query('COMMIT');
    return id;
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
