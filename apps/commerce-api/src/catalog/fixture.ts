import { createHash } from 'node:crypto';
import { Pool } from 'pg';
import { IdentityVerifier } from '../identity/authentication';
// No runtime import or HTTP route. Explicit deployment fixture, with signed local MFA.
export async function seedCatalogFixture(pool:Pool,verifier:IdentityVerifier,token:string,tag='dev-catalog-v1'):Promise<Record<string,string>> {
  if(!/^[a-z0-9-]{1,60}$/.test(tag))throw new Error('Invalid fixture tag');
  const identity=verifier.verify('Bearer '+token,'staff'),client=await pool.connect();
  try {
    await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(2002,1)');
    if((await client.query('SELECT current_user AS name')).rows[0].name!=='commerce_migrator')throw new Error('Deployment role required');
    const actor=(await client.query("SELECT id FROM iam.staff_accounts WHERE auth_issuer=$1 AND auth_subject=$2 AND status='active'",[identity.issuer,identity.subject])).rows[0];
    if(!actor)throw new Error('Mapped staff required');
    const grant=await client.query(`SELECT 1 FROM iam.staff_role_assignments a JOIN iam.roles r ON r.id=a.role_id AND r.status='active'
      JOIN iam.role_permissions rp ON rp.role_id=r.id JOIN iam.permissions p ON p.id=rp.permission_id WHERE a.staff_account_id=$1
      AND a.revoked_at IS NULL AND a.starts_at<=clock_timestamp() AND (a.ends_at IS NULL OR a.ends_at>clock_timestamp()) AND p.code='access.manage'`,[actor.id]);
    if(!grant.rowCount)throw new Error('Current access manager required');
    const existing=(await client.query('SELECT summary FROM platform.audit_events WHERE action=$1 AND target_reference=$2',['catalog.fixture',tag])).rows[0];
    if(existing){await client.query('COMMIT');return existing.summary as Record<string,string>;}
    const category=(await client.query("INSERT INTO catalog.categories(slug,name,status,published_at) VALUES($1,'Synthetic category','published',now()) RETURNING id",[tag])).rows[0].id;
    const brand=(await client.query("INSERT INTO catalog.brands(slug,name) VALUES($1,'Synthetic brand') RETURNING id",[tag])).rows[0].id;
    const attribute=(await client.query("INSERT INTO catalog.attributes(code,name) VALUES($1,'Synthetic color') RETURNING id",[tag.replaceAll('-','_')])).rows[0].id;
    const value=(await client.query("INSERT INTO catalog.attribute_values(attribute_id,code,display_value) VALUES($1,'blue','Synthetic blue') RETURNING id",[attribute])).rows[0].id;
    // Known one-pixel PNG is fixture evidence, not a scan/approval implementation or public media service.
    const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0t8AAAAASUVORK5CYII=','base64');
    const hash=createHash('sha256').update(png).digest('hex');
    const media=(await client.query(`INSERT INTO catalog.media_assets(storage_class,object_key,content_sha256,mime_type,byte_size,width_px,height_px,default_alt_text,state,public_versioned_path,created_by_staff_id,approved_by_staff_id,approved_at)
      VALUES('synthetic-local',$1,$2,'image/png',$3,1,1,'Synthetic fixture pixel','approved',$4,$5,$5,now()) RETURNING id`,[tag+'.png',hash,png.length,'/synthetic-media/'+hash+'.png',actor.id])).rows[0].id;
    const entry=(await client.query("INSERT INTO catalog.content_entries(entry_key,content_type) VALUES($1,'synthetic-banner') RETURNING id",[tag])).rows[0].id;
    const revision=(await client.query(`INSERT INTO catalog.content_revisions(content_entry_id,revision_number,title,content_payload,created_by_staff_id)
      VALUES($1,1,'Synthetic draft banner','{"schemaVersion":1,"text":"Synthetic only"}',$2) RETURNING id`,[entry,actor.id])).rows[0].id;
    const result={categoryId:category,brandId:brand,attributeId:attribute,valueId:value,mediaAssetId:media,contentEntryId:entry,contentRevisionId:revision};
    await client.query(`INSERT INTO platform.audit_events(actor_staff_id,action,target_schema,target_table,target_id,target_reference,reason,summary,correlation_id)
      VALUES($1,'catalog.fixture','catalog','categories',$2,$3,'synthetic_only',$4,gen_random_uuid())`,[actor.id,category,tag,JSON.stringify(result)]);
    await client.query('COMMIT');return result;
  } catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
