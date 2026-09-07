const fs = require('node:fs');
const path = require('node:path');
const { generateKeyPairSync, randomUUID, createHash } = require('node:crypto');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { startApi } = require('../apps/commerce-api/dist/application');
const { LocalIdentityVerifier, LOCAL_ISSUER, audience } = require('../apps/commerce-api/dist/identity/authentication');
const { bootstrapAdmin } = require('../apps/commerce-api/dist/identity/bootstrap');
const { readConfiguration, IDENTITY_HASH } = require('../packages/platform/dist');
const { applyMigrations } = require('../packages/platform/dist/migrations');
const { environment, databaseSettings } = require('./helpers.cjs');
const settings = databaseSettings();
const connection = { host: '127.0.0.1', port: settings.port, database: 'commerce_test', max: 1 };
const admin = new Pool({ ...connection, user: 'commerce_migrator', password: settings.passwords.migrator });
const runtime = new Pool({ ...connection, user: 'commerce_api', password: settings.passwords.api });
const worker = new Pool({ ...connection, user: 'commerce_worker', password: settings.passwords.worker });
const pair = generateKeyPairSync('rsa', { modulusLength: 2048 });
const wrong = generateKeyPairSync('rsa', { modulusLength: 2048 });
const publicKey = pair.publicKey.export({ type: 'spki', format: 'pem' });
const env = environment('api', { IDENTITY_PUBLIC_KEY: Buffer.from(publicKey).toString('base64') });
const verifier = new LocalIdentityVerifier(readConfiguration(env, 'api'), env.IDENTITY_PUBLIC_KEY);
const prefix = 'synthetic:b003-' + randomUUID();
const subject = name => prefix + '-' + name;
function token(name = 'alice', kind = 'customer', overrides = {}, key = pair.privateKey, options = {}) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { iss: LOCAL_ISSUER, sub: subject(name), aud: audience(kind), kind, synthetic: true,
    scope: kind + ':access', amr: kind === 'staff' ? ['mfa'] : ['pwd'], iat: now, nbf: now, exp: now + 300, ...overrides };
  for (const key of Object.keys(claims)) if (claims[key] === undefined) delete claims[key];
  return jwt.sign(claims,
  key, { algorithm: 'RS256', header: { kid: 'local-rsa-1', typ: 'JWT', ...options.header }, ...options });
}
const staffToken = name => token(name, 'staff');
const address = extra => ({ recipientName: 'Synthetic recipient', phoneE164: '+8801700000000', line1: 'Fictional road', city: 'Dhaka', countryCode: 'BD', ...extra });
let api, base, rootId, roleIds = [], safeToClean = false;
const logs = [];
async function request(route, bearer, method = 'GET', body, version) {
  const response = await fetch(base + '/api/v1/' + route, { method, headers: {
    ...(bearer ? { authorization: 'Bearer ' + bearer } : {}), ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    ...(version === undefined ? {} : { 'if-match': '"' + version + '"' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  const data = await response.json();
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(response.headers.get('x-correlation-id')).toMatch(/^[0-9a-f-]{36}$/);
  if (response.status >= 400) expect(data).toMatchObject({ status: response.status, correlationId: response.headers.get('x-correlation-id') });
  return { status: response.status, data, headers: response.headers };
}
async function createStaff(name, caller = staffToken('root')) {
  const result = await request('staff/access/accounts', caller, 'POST', { subject: subject(name), displayName: 'Synthetic staff', reason: 'Synthetic test setup' });
  expect(result.status).toBe(201); return result.data;
}
async function grant(staff, roleCode = 'access_admin', extra = {}) {
  return request('staff/access/accounts/' + staff.id + '/grants', staffToken('root'), 'POST', { roleCode, reason: 'Synthetic grant', ...extra }, staff.version);
}
beforeAll(async () => {
  await applyMigrations({ port: settings.port, database: 'commerce_test', password: settings.passwords.migrator }, path.join(__dirname, '../database/migrations'));
  // Do not reset user data. Bootstrap tests require unused IAM in the dedicated test DB.
  expect((await admin.query('SELECT count(*) FROM iam.staff_accounts')).rows[0].count).toBe('0');
  expect((await admin.query('SELECT count(*) FROM iam.roles')).rows[0].count).toBe('0');
  safeToClean = true;
  api = await startApi(env, event => logs.push(event)); base = 'http://127.0.0.1:' + api.port;
});
afterAll(async () => {
  if (api) await api.app.close();
  if (safeToClean) {
    // Migrator cleanup is limited to this run's synthetic identities and bootstrap definitions.
    await admin.query('DELETE FROM platform.audit_events WHERE actor_staff_id IN (SELECT id FROM iam.staff_accounts WHERE auth_subject LIKE $1)', [prefix + '%']);
    await admin.query('DELETE FROM iam.staff_role_assignments WHERE staff_account_id IN (SELECT id FROM iam.staff_accounts WHERE auth_subject LIKE $1)', [prefix + '%']);
    await admin.query('DELETE FROM iam.role_permissions WHERE granted_by_staff_id IN (SELECT id FROM iam.staff_accounts WHERE auth_subject LIKE $1)', [prefix + '%']);
    await admin.query('DELETE FROM iam.staff_accounts WHERE auth_subject LIKE $1', [prefix + '%']);
    await admin.query('DELETE FROM iam.customer_addresses WHERE customer_id IN (SELECT id FROM iam.customers WHERE auth_subject LIKE $1)', [prefix + '%']);
    await admin.query('DELETE FROM iam.customers WHERE auth_subject LIKE $1', [prefix + '%']);
    await admin.query('DELETE FROM iam.roles WHERE id=ANY($1::uuid[])', [roleIds]);
    if (rootId) await admin.query("DELETE FROM iam.permissions WHERE code=ANY($1::text[])", [['access.read', 'access.manage', 'catalog.edit', 'catalog.publish']]);
  }
  await Promise.all([admin.end(), runtime.end(), worker.end()]);
});

test('reviewed schema, deployment-only bootstrap, rollback, race, single marker and self-grant provenance', async () => {
  expect(createHash('sha256').update(fs.readFileSync(path.join(__dirname, '../database/migrations/0001_identity.sql'))).digest('hex')).toBe(IDENTITY_HASH);
  await expect(bootstrapAdmin(admin, verifier, token('root'))).rejects.toHaveProperty('code', 'UNAUTHORIZED');
  await expect(bootstrapAdmin(runtime, verifier, staffToken('root'))).rejects.toThrow('Deployment role required');
  await admin.query("CREATE FUNCTION platform.b003_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected failure'; END $$");
  await admin.query('CREATE TRIGGER b003_fail BEFORE INSERT ON platform.audit_events FOR EACH ROW EXECUTE FUNCTION platform.b003_fail_audit()');
  try { await expect(bootstrapAdmin(admin, verifier, staffToken('root'))).rejects.toThrow('injected failure'); }
  finally { await admin.query('DROP TRIGGER b003_fail ON platform.audit_events'); await admin.query('DROP FUNCTION platform.b003_fail_audit()'); }
  expect((await admin.query('SELECT count(*) FROM iam.staff_accounts')).rows[0].count).toBe('0');
  const other = new Pool({ ...connection, user: 'commerce_migrator', password: settings.passwords.migrator });
  let results;
  try { results = await Promise.allSettled([bootstrapAdmin(admin, verifier, staffToken('root')), bootstrapAdmin(other, verifier, staffToken('root'))]); }
  finally { await other.end(); }
  expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1);
  rootId = results.find(r => r.status === 'fulfilled').value;
  roleIds = (await admin.query('SELECT id FROM iam.roles')).rows.map(r => r.id);
  const audit = (await admin.query("SELECT * FROM platform.audit_events WHERE action='access.bootstrap'")).rows;
  expect(audit).toHaveLength(1);
  expect(audit[0]).toMatchObject({ actor_staff_id: rootId, target_id: rootId, summary: { mode: 'synthetic', verifiedMfa: true } });
  expect((await admin.query('SELECT staff_account_id,granted_by_staff_id FROM iam.staff_role_assignments')).rows).toEqual([{ staff_account_id: rootId, granted_by_staff_id: rootId }]);
  await expect(bootstrapAdmin(admin, verifier, staffToken('root'))).rejects.toThrow('closed');
  expect((await request('staff/access/bootstrap', undefined, 'POST', {})).status).toBe(404);
});
test.each([
  ['wrong signature', () => token('alice', 'customer', {}, wrong.privateKey)],
  ['wrong issuer', () => token('alice', 'customer', { iss: 'urn:wrong' })],
  ['wrong audience', () => token('alice', 'customer', { aud: audience('staff') })],
  ['multiple audiences', () => token('alice', 'customer', { aud: [audience('customer'), audience('staff')] })],
  ['expired', () => token('alice', 'customer', { exp: Math.floor(Date.now()/1000) - 1 })],
  ['not yet valid', () => token('alice', 'customer', { nbf: Math.floor(Date.now()/1000) + 60 })],
  ['future issued', () => token('alice', 'customer', { iat: Math.floor(Date.now()/1000) + 60 })],
  ['missing expiry', () => token('alice', 'customer', { exp: undefined })],
  ['missing nbf', () => token('alice', 'customer', { nbf: undefined })],
  ['missing iat', () => token('alice', 'customer', {}, pair.privateKey, { noTimestamp:true })],
  ['blank subject', () => token('alice', 'customer', { sub: '' })],
  ['real-looking subject', () => token('alice', 'customer', { sub: 'auth0|not-local' })],
  ['wrong scope', () => token('alice', 'customer', { scope: 'staff:access' })],
  ['wrong kind', () => token('alice', 'customer', { kind: 'workload' })],
  ['not synthetic', () => token('alice', 'customer', { synthetic: false })],
  ['excess lifetime', () => token('alice', 'customer', { exp: Math.floor(Date.now()/1000) + 3600 })],
  ['wrong key id', () => token('alice', 'customer', {}, pair.privateKey, { header: { kid: 'unknown', typ: 'JWT' } })],
  ['wrong token type', () => token('alice', 'customer', {}, pair.privateKey, { header: { kid: 'local-rsa-1', typ: 'ID' } })],
  ['algorithm confusion', () => token('alice', 'customer', {}, publicKey, { algorithm: 'HS256' })],
  ['unsigned', () => token('alice', 'customer', {}, null, { algorithm: 'none' })],
  ['malformed', () => 'not-a-token'],
])('%s rejected without identity mapping', async (_label, make) => {
  const result = await request('customer/profile', make());
  expect(result.status).toBe(401); expect(result.data.code).toBe('UNAUTHORIZED');
  expect(result.headers.get('www-authenticate')).toBe('Bearer');
});
test('missing credentials, caller role headers and missing staff MFA do not grant access', async () => {
  expect((await request('customer/profile')).status).toBe(401);
  expect((await request('staff/me', token('root', 'staff', { amr: ['pwd'] }))).status).toBe(401);
  expect((await request('staff/me', token())).status).toBe(401);
  expect((await request('customer/profile', staffToken('root'))).status).toBe(401);
  const r = await fetch(base + '/api/v1/staff/me', { headers: { 'x-staff-id': rootId, 'x-role': 'access_admin' } });
  expect(r.status).toBe(401);
});
test('missing verifier key denies tokens; malformed/private/weak keys fail composition', () => {
  expect(() => new LocalIdentityVerifier(readConfiguration(env, 'api')).verify('Bearer ' + token(), 'customer')).toThrow();
  for (const key of ['invalid!', Buffer.from(pair.privateKey.export({ type:'pkcs8', format:'pem' })).toString('base64')])
    expect(() => new LocalIdentityVerifier(readConfiguration(env, 'api'), key)).toThrow('Invalid runtime configuration');
});
test('parallel first authentication maps one issuer/subject; email never merges identities; projections are minimal', async () => {
  const responses = await Promise.all(Array.from({ length: 5 }, () => request('customer/profile', token('map', 'customer', { email:'same@example.invalid' }))));
  expect(responses.map(r => r.status)).toEqual([200,200,200,200,200]);
  expect(new Set(responses.map(r => r.data.id)).size).toBe(1);
  expect(Object.keys(responses[0].data).sort()).toEqual(['displayName','id','phoneE164','version']);
  const other = await request('customer/profile', token('different', 'customer', { email:'same@example.invalid' }));
  expect(other.data.id).not.toBe(responses[0].data.id);
  expect((await admin.query('SELECT count(*) FROM iam.customers WHERE auth_subject=$1', [subject('map')])).rows[0].count).toBe('1');
});
test('profile bounded edits, stale/missing versions, null clearing and blocked/anonymized accounts', async () => {
  const t = token('profile');
  const p = (await request('customer/profile', t)).data;
  expect((await request('customer/profile', t, 'PATCH', { displayName:'Fictional' })).status).toBe(428);
  for (const body of [{ status:'active' }, { authSubject:'root' }, { displayName:'x'.repeat(101) }, { phoneE164:'0170000' }, {}])
    expect((await request('customer/profile', t, 'PATCH', body, p.version)).status).toBe(400);
  const changed = await request('customer/profile', t, 'PATCH', { displayName:'Fictional', phoneE164:'+8801700000000' }, p.version);
  expect(changed.status).toBe(200); expect(changed.data.version).toBe('2'); expect(changed.headers.get('etag')).toBe('"2"');
  expect((await request('customer/profile', t, 'PATCH', { displayName:'stale' }, p.version)).status).toBe(412);
  expect((await request('customer/profile', t, 'PATCH', { displayName:null }, '2')).data.displayName).toBeNull();
  for (const status of ['blocked','anonymized']) {
    await admin.query('UPDATE iam.customers SET status=$2 WHERE id=$1', [p.id,status]);
    expect((await request('customer/profile', t)).status).toBe(403);
    expect((await request('customer/addresses', t, 'POST', address())).status).toBe(403);
  }
});
test('owned address CRUD hides cross-user targets and archives without exposing identity', async () => {
  const a = token('owner'), b = token('intruder');
  const created = await request('customer/addresses', a, 'POST', address());
  expect(created.status).toBe(201); expect(created.data).not.toHaveProperty('customer_id');
  for (const method of ['PATCH','DELETE']) expect((await request('customer/addresses/' + created.data.id, b, method, method === 'PATCH' ? {city:'Other'} : undefined, '1')).status).toBe(404);
  expect((await request('customer/addresses', b)).data).toEqual([]);
  expect((await request('customer/addresses/' + created.data.id, a, 'PATCH', {city:'Chattogram'}, '1')).data.version).toBe('2');
  expect((await request('customer/addresses/' + created.data.id, a, 'DELETE', undefined, '1')).status).toBe(412);
  expect((await request('customer/addresses/' + created.data.id, a, 'DELETE', undefined, '2')).status).toBe(200);
  expect((await request('customer/addresses', a)).data).toEqual([]);
  expect((await request('customer/addresses/' + created.data.id, a, 'PATCH', {city:'Other'}, '3')).status).toBe(404);
});
test('address validation rejects unknown, foreign country, empty required and oversized fields', async () => {
  for (const value of [address({customerId:rootId}), address({countryCode:'US'}), address({line1:''}), address({line1:'x'.repeat(201)}), address({isDefaultShipping:'true'}), address({phoneE164:'bad'}), {}])
    expect((await request('customer/addresses', token('invalid-address'), 'POST', value)).status).toBe(400);
});
test('racing creates enforce ten-address ceiling and one default; default switching invalidates previous version', async () => {
  const t = token('cap');
  for (let i=0;i<9;i++) expect((await request('customer/addresses', t, 'POST', address())).status).toBe(201);
  const race = await Promise.all([request('customer/addresses', t, 'POST', address({isDefaultShipping:true})), request('customer/addresses', t, 'POST', address({isDefaultShipping:true}))]);
  expect(race.map(r=>r.status).sort()).toEqual([201,409]);
  const all = (await request('customer/addresses', t)).data;
  expect(all).toHaveLength(10); expect(all.filter(a=>a.isDefaultShipping)).toHaveLength(1);
  const previous=all.find(a=>a.isDefaultShipping), next=all.find(a=>!a.isDefaultShipping);
  expect((await request('customer/addresses/'+next.id,t,'PATCH',{isDefaultShipping:true},next.version)).status).toBe(200);
  expect((await request('customer/addresses/'+previous.id,t,'PATCH',{city:'stale'},previous.version)).status).toBe(412);
  const twins = await Promise.all([request('customer/addresses',token('defaults'),'POST',address({isDefaultShipping:true,isDefaultBilling:true})), request('customer/addresses',token('defaults'),'POST',address({isDefaultShipping:true,isDefaultBilling:true}))]);
  expect(twins.map(r=>r.status)).toEqual([201,201]);
  const defaults=(await request('customer/addresses',token('defaults'))).data;
  expect(defaults.filter(a=>a.isDefaultShipping)).toHaveLength(1); expect(defaults.filter(a=>a.isDefaultBilling)).toHaveLength(1);
});
test('concurrent profile writes admit one expected version and preserve exact bigint', async () => {
  const t=token('versions'), p=(await request('customer/profile',t)).data;
  await admin.query('UPDATE iam.customers SET version=9007199254740993 WHERE id=$1',[p.id]);
  const race=await Promise.all(['one','two'].map(displayName=>request('customer/profile',t,'PATCH',{displayName},'9007199254740993')));
  expect(race.map(r=>r.status).sort()).toEqual([200,412]);
  expect(race.find(r=>r.status===200).data.version).toBe('9007199254740994');
});
test('unlinked staff is denied; app grants ignore role claims; administrator is not finance/catalog approver', async () => {
  expect((await request('staff/me',staffToken('unlinked'))).status).toBe(403);
  const editor=await createStaff('editor');
  expect((await request('staff/access/roles',token('editor','staff',{roles:['access_admin'],permissions:['access.manage']}))).status).toBe(403);
  const granted=await grant(editor,'catalog_editor'); expect(granted.status).toBe(201);
  expect((await request('staff/me',staffToken('editor'))).data.permissions).toEqual(['catalog.edit','catalog.publish']);
  expect((await request('staff/me',staffToken('root'))).data.permissions).toEqual(['access.manage','access.read']);
  expect((await request('staff/access/accounts',staffToken('editor'),'POST',{subject:subject('bad-create'),displayName:'Bad',reason:'Test'})).status).toBe(403);
  expect((await grant({...editor,version:granted.data.version},'catalog_editor')).status).toBe(409);
  expect((await grant(editor,'catalog_editor')).status).toBe(412);
  expect((await request('staff/access/accounts/'+rootId,staffToken('root'),'PATCH',{status:'disabled',reason:'Self'},'1')).status).toBe(403);
});
test('grant revoke and disable take effect on next request with same signed token; replay creates no audit', async () => {
  const s=await createStaff('revoked'), g=await grant(s), t=staffToken('revoked');
  expect(g.status).toBe(201); expect((await request('staff/access/roles',t)).status).toBe(200);
  const path='staff/access/accounts/'+s.id+'/grants/'+g.data.assignmentId+'/revocation';
  const revoked=await request(path,staffToken('root'),'POST',{reason:'Revoke test'},g.data.version);
  expect(revoked.status).toBe(201); expect((await request('staff/access/roles',t)).status).toBe(403);
  expect((await request(path,staffToken('root'),'POST',{reason:'Replay'},g.data.version)).status).toBe(412);
  const disabled=await request('staff/access/accounts/'+s.id,staffToken('root'),'PATCH',{status:'disabled',reason:'Disable'},revoked.data.version);
  expect(disabled.status).toBe(200); expect((await request('staff/me',t)).status).toBe(403);
  const audit=(await admin.query("SELECT action,summary FROM platform.audit_events WHERE target_id=$1 ORDER BY created_at",[s.id])).rows;
  expect(audit.map(a=>a.action)).toEqual(['access.staff.create','access.grant','access.revoke','access.status']);
});
test('audit failure rolls back grant, epoch and account version', async () => {
  const s=await createStaff('rollback');
  await admin.query("CREATE FUNCTION platform.b003_fail_audit() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'injected failure'; END $$");
  await admin.query('CREATE TRIGGER b003_fail BEFORE INSERT ON platform.audit_events FOR EACH ROW EXECUTE FUNCTION platform.b003_fail_audit()');
  try { expect((await grant(s)).status).toBe(503); }
  finally { await admin.query('DROP TRIGGER b003_fail ON platform.audit_events'); await admin.query('DROP FUNCTION platform.b003_fail_audit()'); }
  expect((await admin.query('SELECT version,permission_epoch FROM iam.staff_accounts WHERE id=$1',[s.id])).rows[0]).toEqual({version:'1',permission_epoch:'1'});
  expect((await admin.query('SELECT count(*) FROM iam.staff_role_assignments WHERE staff_account_id=$1',[s.id])).rows[0].count).toBe('0');
});
test('revocation queued before a privileged mutation prevents that mutation after the lock releases', async () => {
  const s=await createStaff('race-actor'), g=await grant(s), victim=await createStaff('race-target');
  const blocker=await admin.connect();
  await blocker.query('BEGIN'); await blocker.query('SELECT pg_advisory_xact_lock(2002,1)');
  const revoke=request('staff/access/accounts/'+s.id+'/grants/'+g.data.assignmentId+'/revocation',staffToken('root'),'POST',{reason:'Race revoke'},g.data.version);
  async function waiting(n) {
    for(let i=0;i<100;i++) {
      const r=await blocker.query("SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND classid=2002 AND objid=1 AND NOT granted");
      if(Number(r.rows[0].count)>=n) return;
      await new Promise(resolve=>setTimeout(resolve,1));
    }
    throw new Error('Lock waiter missing');
  }
  let mutation;
  try {
    await waiting(1);
    mutation=request('staff/access/accounts/'+victim.id+'/grants',staffToken('race-actor'),'POST',{roleCode:'access_admin',reason:'Race grant'},victim.version);
    await waiting(2);
  } finally { await blocker.query('COMMIT'); blocker.release(); }
  expect((await revoke).status).toBe(201); expect((await mutation).status).toBe(403);
  expect((await admin.query('SELECT count(*) FROM iam.staff_role_assignments WHERE staff_account_id=$1',[victim.id])).rows[0].count).toBe('0');
});
test('timed grants expire and cannot remove the last non-expiring administrator', async () => {
  const s=await createStaff('timed'), g=await grant(s,'access_admin',{endsAt:new Date(Date.now()+60000).toISOString()});
  expect(g.status).toBe(201);
  const result=await request('staff/access/accounts/'+rootId,staffToken('timed'),'PATCH',{status:'disabled',reason:'Last admin test'},'1');
  expect(result.status).toBe(409);
  await admin.query("UPDATE iam.staff_role_assignments SET starts_at=now()-interval '2 minutes',ends_at=now()-interval '1 minute' WHERE id=$1",[g.data.assignmentId]);
  expect((await request('staff/access/roles',staffToken('timed'))).status).toBe(403);
});
test('runtime cannot rewrite/read audit, insert bootstrap marker, mutate definitions or access IAM as worker', async () => {
  for(const sql of ['SELECT * FROM platform.audit_events','UPDATE platform.audit_events SET reason=reason','DELETE FROM platform.audit_events','TRUNCATE platform.audit_events','UPDATE iam.role_permissions SET granted_at=now()',"INSERT INTO iam.roles(code,name) VALUES('bad','bad')"])
    await expect(runtime.query(sql)).rejects.toHaveProperty('code','42501');
  await expect(runtime.query("INSERT INTO platform.audit_events(actor_staff_id,action,target_id,reason,correlation_id,summary) VALUES($1,'access.bootstrap',$1,'bad',$2,'{}')",[rootId,randomUUID()])).rejects.toHaveProperty('code','42501');
  await expect(worker.query('SELECT * FROM iam.customers')).rejects.toHaveProperty('code','42501');
  await expect(runtime.query('INSERT INTO iam.staff_role_assignments(staff_account_id,role_id,granted_by_staff_id,reason) VALUES($1,$2,$3,$4)',[randomUUID(),roleIds[0],rootId,'bad FK'])).rejects.toHaveProperty('code','23503');
});
test('database outage fails closed for protected access and telemetry omits token/PII', async () => {
  const outage=await startApi({...env,DB_PORT:'1'}, event=>logs.push(event));
  try {
    const response=await fetch('http://127.0.0.1:'+outage.port+'/api/v1/staff/access/roles',{headers:{authorization:'Bearer '+staffToken('root')}});
    expect(response.status).toBe(503);
  } finally { await outage.app.close(); }
  const serialized=JSON.stringify(logs);
  for(const secret of [prefix,'Fictional road','+8801700000000','same@example.invalid','Synthetic staff']) expect(serialized).not.toContain(secret);
  expect(serialized).not.toMatch(/eyJhbGci|BEGIN.*KEY|injected failure/);
});
