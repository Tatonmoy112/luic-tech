import { Pool } from 'pg';
import type { IdentityVerifier } from '../identity/authentication';
import { authorizeStaff } from '../identity/service';
import { uuid } from '../identity/validation';

// Deployment-only fixture. Never mounted as HTTP, never repeats bootstrap or grants staff roles.
export async function seedInventoryFixture(pool: Pool, verifier: IdentityVerifier, token: string, variants: string[]): Promise<{ locationId: string; positions: { id: string; variantId: string; version: string }[] }> {
  const ids = [...new Set(variants.map(uuid))].sort();
  if (ids.length > 50) throw new Error('Fixture bound');
  const identity = verifier.verify('Bearer ' + token, 'staff'), client = await pool.connect();
  try {
    await client.query('BEGIN');
    if ((await client.query('SELECT current_user AS name')).rows[0].name !== 'commerce_migrator') throw new Error('Deployment role required');
    const actor = await authorizeStaff({ query: client.query.bind(client) }, identity, 'access.manage');
    const location = (await client.query(`INSERT INTO inventory.stock_locations(code,name) VALUES('TEST-WH','Synthetic warehouse') ON CONFLICT(code) DO UPDATE SET name=inventory.stock_locations.name RETURNING id`)).rows[0].id;
    const role = (await client.query(`INSERT INTO iam.roles(code,name) VALUES('inventory.manager','Synthetic inventory manager') ON CONFLICT(code) DO UPDATE SET name=iam.roles.name RETURNING id`)).rows[0].id;
    for (const action of ['read', 'adjust']) {
      const permission = (await client.query(`INSERT INTO iam.permissions(code,resource,action,risk_level) VALUES($1,'inventory',$2,$3)
        ON CONFLICT(code) DO UPDATE SET resource=iam.permissions.resource RETURNING id`, ['inventory.' + action, action, action === 'read' ? 'ordinary' : 'sensitive'])).rows[0].id;
      await client.query('INSERT INTO iam.role_permissions(role_id,permission_id,granted_by_staff_id) VALUES($1,$2,$3) ON CONFLICT DO NOTHING', [role, permission, actor]);
    }
    const positions = [];
    for (const variant of ids) {
      await client.query('INSERT INTO inventory.stock_positions(variant_id,stock_location_id) VALUES($1,$2) ON CONFLICT DO NOTHING', [variant, location]);
      positions.push((await client.query('SELECT id,variant_id AS "variantId",version FROM inventory.stock_positions WHERE variant_id=$1 AND stock_location_id=$2', [variant, location])).rows[0]);
    }
    const marker = await client.query("SELECT 1 FROM platform.audit_events WHERE action='inventory.fixture' AND target_id=$1", [location]);
    if (!marker.rowCount) await client.query(`INSERT INTO platform.audit_events(actor_staff_id,action,target_schema,target_table,target_id,reason,summary,correlation_id)
      VALUES($1,'inventory.fixture','inventory','stock_locations',$2,'synthetic_only',$3,gen_random_uuid())`, [actor, location, JSON.stringify({ role: 'inventory.manager', profile: 'DEV-PHYSICAL-BD', revision: 1 })]);
    await client.query('COMMIT'); return { locationId: location, positions };
  } catch (error) { await client.query('ROLLBACK'); throw error; } finally { client.release(); }
}
