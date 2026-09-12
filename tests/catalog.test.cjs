const fs=require('node:fs'),path=require('node:path');
const {generateKeyPairSync,randomUUID,createHash}=require('node:crypto');
const {Pool,Client}=require('pg');
const jwt=require('jsonwebtoken');
const {startApi}=require('../apps/commerce-api/dist/application');
const {readConfiguration,CATALOG_HASH,Foundation}=require('../packages/platform/dist');
const {applyMigrations}=require('../packages/platform/dist/migrations');
const {LocalIdentityVerifier,LOCAL_ISSUER,audience}=require('../apps/commerce-api/dist/identity/authentication');
const {bootstrapAdmin}=require('../apps/commerce-api/dist/identity/bootstrap');
const {seedCatalogFixture}=require('../apps/commerce-api/dist/catalog/fixture');
const {catalogOpenApi}=require('../apps/commerce-api/dist/catalog/openapi');
const {hash}=require('../apps/commerce-api/dist/catalog/validation');
const {environment,databaseSettings}=require('./helpers.cjs');
const settings=databaseSettings(),connection={host:'127.0.0.1',port:settings.port,database:'commerce_test',max:1};
const admin=new Pool({...connection,user:'commerce_migrator',password:settings.passwords.migrator});
const runtime=new Pool({...connection,user:'commerce_api',password:settings.passwords.api});
const worker=new Pool({...connection,user:'commerce_worker',password:settings.passwords.worker});
const keys=generateKeyPairSync('rsa',{modulusLength:2048});
const env=environment('api',{IDENTITY_PUBLIC_KEY:Buffer.from(keys.publicKey.export({type:'spki',format:'pem'})).toString('base64')});
const verifier=new LocalIdentityVerifier(readConfiguration(env,'api'),env.IDENTITY_PUBLIC_KEY);
const tag='b004-'+randomUUID(),subject=name=>'synthetic:'+tag+'-'+name;
const tok=(name='editor',kind='staff')=>{const now=Math.floor(Date.now()/1000);return jwt.sign({iss:LOCAL_ISSUER,sub:subject(name),aud:audience(kind),kind,synthetic:true,scope:kind+':access',amr:['mfa'],iat:now,nbf:now,exp:now+300},keys.privateKey,{algorithm:'RS256',header:{kid:'local-rsa-1',typ:'JWT'}});};
let api,base,rootId,editor,grantId,fixture,roles=[],permissionIds=[],clean=false;
const logs=[],products=new Set(),extraCategories=[],extraMedia=[],extraAttrs=[],extraEntries=[];
const root='/staff/catalog/products';
async function call(route,method='GET',body,options={}){
 const response=await fetch(base+'/api/v1'+route,{method,headers:{...(options.anonymous?{}:{authorization:'Bearer '+(options.token??tok())}),
  ...(body===undefined?{}:{'content-type':'application/json'}),...(options.key===null?{}:method==='GET'?{}:{'idempotency-key':options.key??randomUUID()}),
  ...(options.version===undefined?{}:{'if-match':'"'+options.version+'"'})},...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await response.json();expect(response.headers.get('cache-control')).toBe('no-store');
 if(response.status>=400){expect(data).toMatchObject({status:response.status,correlationId:response.headers.get('x-correlation-id')});expect(JSON.stringify(data)).not.toContain(subject('editor'));}
 return {status:response.status,data,headers:response.headers};
}
async function make(extra={}){const s=tag+'-'+randomUUID();const r=await call(root,'POST',{title:'Synthetic product',slug:s,description:'Plain synthetic description',categoryIds:[fixture.categoryId],...extra});expect(r.status).toBe(201);products.add(r.data.id);return r.data;}
async function detail(p){const r=await call(root+'/'+p.id);expect(r.status).toBe(200);return r.data;}
async function variant(p,extra={}){const r=await call(root+'/'+p.id+'/variants','POST',{sku:'TEST-'+randomUUID(),title:'Synthetic variant',...extra},{version:p.version});expect(r.status).toBe(201);p.version=r.data.productVersion;return r.data;}
async function price(p,v,extra={}){const r=await call(root+'/'+p.id+'/variants/'+v.id+'/prices','POST',{unitPriceMinor:'19900',validFrom:'2020-01-01T00:00:00.000Z',reason:'synthetic',...extra},{version:p.version});expect(r.status).toBe(201);p.version=r.data.productVersion;return r.data;}
async function media(p,extra={}){const r=await call(root+'/'+p.id+'/media','POST',{mediaAssetId:fixture.mediaAssetId,isPrimary:true,...extra},{version:p.version});expect(r.status).toBe(201);p.version=r.data.productVersion;return r.data;}
async function ready(){const p=await make(),v=await variant(p),pr=await price(p,v);await media(p);return {p,v,pr};}
async function transition(p,action='publication',options={}){const r=await call(root+'/'+p.id+'/'+action,'POST',{reasonCode:'synthetic'}, {version:p.version,...options});if(r.status===200)p.version=r.data.version;return r;}
async function counts(id){return (await admin.query(`SELECT (SELECT count(*) FROM platform.audit_events WHERE target_schema='catalog' AND target_id=$1) AS audit,
 (SELECT count(*) FROM platform.outbox_events WHERE aggregate_id=$1) AS events,
 (SELECT count(*) FROM platform.outbox_deliveries d JOIN platform.outbox_events e ON e.id=d.event_id WHERE e.aggregate_id=$1) AS deliveries`,[id])).rows[0];}
beforeAll(async()=>{
 await applyMigrations({port:settings.port,database:'commerce_test',password:settings.passwords.migrator},path.join(__dirname,'../database/migrations'));
 expect((await admin.query('SELECT count(*) FROM iam.staff_accounts')).rows[0].count).toBe('0');
 expect((await admin.query('SELECT count(*) FROM iam.roles')).rows[0].count).toBe('0');clean=true;
 rootId=await bootstrapAdmin(admin,verifier,tok('root'));
 roles=(await admin.query('SELECT id FROM iam.roles')).rows.map(r=>r.id);permissionIds=(await admin.query('SELECT id FROM iam.permissions')).rows.map(r=>r.id);
 fixture=await seedCatalogFixture(admin,verifier,tok('root'),tag);
 api=await startApi(env,e=>logs.push(e));base='http://127.0.0.1:'+api.port;
 const created=await call('/staff/access/accounts','POST',{subject:subject('editor'),displayName:'Synthetic editor',reason:'Fixture'},{token:tok('root')});expect(created.status).toBe(201);editor=created.data;
 const granted=await call('/staff/access/accounts/'+editor.id+'/grants','POST',{roleCode:'catalog_editor',reason:'Fixture'},{token:tok('root'),version:editor.version});expect(granted.status).toBe(201);editor.version=granted.data.version;grantId=granted.data.assignmentId;
});
afterAll(async()=>{
 if(api)await api.app.close();
 if(clean){
  // Cleanup only this run's actors, fixture tag and tracked products; never reset local DB.
  const ids=[...products];
  const found=(await admin.query('SELECT id FROM catalog.products WHERE slug LIKE $1',[tag+'%'])).rows.map(r=>r.id);ids.push(...found);
  await admin.query('DELETE FROM platform.outbox_deliveries WHERE event_id IN(SELECT id FROM platform.outbox_events WHERE aggregate_id=ANY($1::uuid[]))',[ids]);
  await admin.query('DELETE FROM platform.outbox_events WHERE aggregate_id=ANY($1::uuid[])',[ids]);
  await admin.query('DELETE FROM platform.idempotency_records WHERE actor_reference IN(SELECT id::text FROM iam.staff_accounts WHERE auth_subject LIKE $1)',[subject('')+'%']);
  await admin.query('DELETE FROM platform.audit_events WHERE actor_staff_id IN(SELECT id FROM iam.staff_accounts WHERE auth_subject LIKE $1)',[subject('')+'%']);
  await admin.query('DELETE FROM catalog.product_media WHERE product_id=ANY($1::uuid[])',[ids]);
  await admin.query('DELETE FROM catalog.price_records WHERE variant_id IN(SELECT id FROM catalog.product_variants WHERE product_id=ANY($1::uuid[]))',[ids]);
  await admin.query('DELETE FROM catalog.variant_attribute_values WHERE variant_id IN(SELECT id FROM catalog.product_variants WHERE product_id=ANY($1::uuid[]))',[ids]);
  await admin.query('DELETE FROM catalog.product_variants WHERE product_id=ANY($1::uuid[])',[ids]);
  await admin.query('DELETE FROM catalog.product_categories WHERE product_id=ANY($1::uuid[])',[ids]);
  await admin.query('DELETE FROM catalog.products WHERE id=ANY($1::uuid[])',[ids]);
  if(fixture){
   await admin.query('DELETE FROM catalog.content_revisions WHERE content_entry_id=ANY($1::uuid[])',[[fixture.contentEntryId,...extraEntries]]);
   await admin.query('DELETE FROM catalog.content_entries WHERE id=ANY($1::uuid[])',[[fixture.contentEntryId,...extraEntries]]);
   await admin.query('DELETE FROM catalog.media_assets WHERE id=ANY($1::uuid[])',[[fixture.mediaAssetId,...extraMedia]]);
   await admin.query('DELETE FROM catalog.attribute_values WHERE attribute_id=ANY($1::uuid[])',[[fixture.attributeId,...extraAttrs]]);
   await admin.query('DELETE FROM catalog.attributes WHERE id=ANY($1::uuid[])',[[fixture.attributeId,...extraAttrs]]);
   for(const id of extraCategories.reverse())await admin.query('DELETE FROM catalog.categories WHERE id=$1',[id]);
   await admin.query('DELETE FROM catalog.categories WHERE id=$1',[fixture.categoryId]);await admin.query('DELETE FROM catalog.brands WHERE id=$1',[fixture.brandId]);
  }
  await admin.query('DELETE FROM iam.staff_role_assignments WHERE staff_account_id IN(SELECT id FROM iam.staff_accounts WHERE auth_subject LIKE $1)',[subject('')+'%']);
  await admin.query('DELETE FROM iam.role_permissions WHERE role_id=ANY($1::uuid[])',[roles]);
  await admin.query('DELETE FROM iam.staff_accounts WHERE auth_subject LIKE $1',[subject('')+'%']);
  await admin.query('DELETE FROM iam.roles WHERE id=ANY($1::uuid[])',[roles]);await admin.query('DELETE FROM iam.permissions WHERE id=ANY($1::uuid[])',[permissionIds]);
 }
 await Promise.all([admin.end(),runtime.end(),worker.end()]);
});

test('migration identity, catalog table inventory, generic audit compatibility and guarded repeatable fixture',async()=>{
 expect(createHash('sha256').update(fs.readFileSync(path.join(__dirname,'../database/migrations/0002_catalog.sql'))).digest('hex')).toBe(CATALOG_HASH);
 expect((await admin.query("SELECT count(*) FROM information_schema.tables WHERE table_schema='catalog' AND table_type='BASE TABLE'")).rows[0].count).toBe('13');
 const original=(await admin.query("SELECT actor_type,target_schema,target_table,summary=change_summary AS same,reason=reason_code AS reason,created_at=occurred_at AS time FROM platform.audit_events WHERE action='access.bootstrap'")).rows[0];
 expect(original).toEqual({actor_type:'staff',target_schema:'iam',target_table:'staff_accounts',same:true,reason:true,time:true});
 expect(await seedCatalogFixture(admin,verifier,tok('root'),tag)).toEqual(fixture);
 await expect(seedCatalogFixture(runtime,verifier,tok('root'),tag)).rejects.toThrow('Deployment role');
 await expect(seedCatalogFixture(admin,verifier,tok('editor'),tag)).rejects.toThrow('access manager');
 expect((await call('/staff/catalog/media/approve','POST',{})).status).toBe(404);
});
test('authorization precedes resource disclosure and untrusted headers or role claims cannot grant access',async()=>{
 for(const options of [{anonymous:true},{token:tok('customer','customer')},{token:tok('root')},{token:tok('unlinked')}]){
  const r=await call(root,'GET',undefined,options);expect([401,403]).toContain(r.status);
 }
 expect((await call(root+'/'+randomUUID(),'GET',undefined,{token:tok('root')})).status).toBe(403);
 const r=await fetch(base+'/api/v1'+root,{headers:{'x-role':'catalog_editor','x-staff-id':editor.id}});expect(r.status).toBe(401);
});
test.each([
 {title:'x',slug:'UPPER'}, {title:'x',slug:'two--dashes'}, {title:'x',slug:'ok',status:'published'}, {title:'x'.repeat(201),slug:'ok'},
 {title:'x',slug:'ok',description:'<script>bad</script>'},{title:'x',slug:'ok',categoryIds:[randomUUID(),randomUUID(),...Array(20).fill(randomUUID())]},
 {title:'x',slug:'ok',categoryIds:['invalid']},{title:'x',slug:'ok',categoryIds:[fixture?.categoryId??'invalid',fixture?.categoryId??'invalid']},
])('invalid product command rejected before storage: %j',async(body)=>{expect((await call(root,'POST',body)).status).toBe(400);});
test('create needs a UUID key; references and empty patches are validated; stale and absent If-Match rejected',async()=>{
 const body={title:'Synthetic',slug:tag+'-'+randomUUID()};
 expect((await call(root,'POST',body,{key:null})).status).toBe(400);expect((await call(root,'POST',body,{key:'bad'})).status).toBe(400);
 expect((await call(root,'POST',{...body,brandId:randomUUID()})).status).toBe(422);
 expect((await call(root,'POST',{...body,categoryIds:[randomUUID()]})).status).toBe(422);
 const p=await make();
 expect((await call(root+'/'+p.id,'PATCH',{title:'next'})).status).toBe(428);
 expect((await call(root+'/'+p.id,'PATCH',{}, {version:p.version})).status).toBe(400);
 expect((await call(root+'/'+p.id,'PATCH',{title:'next'},{version:'9'})).status).toBe(412);
 expect((await call(root+'/'+p.id,'PATCH',{title:'next',version:'1'},{version:'1'})).status).toBe(400);
});
test('canonical concurrent create replay returns one stable result, audit/event/delivery and immutable snapshot',async()=>{
 const key=randomUUID(),body={title:'Synthetic race',slug:tag+'-'+randomUUID(),categoryIds:[fixture.categoryId]};
 const results=await Promise.all([call(root,'POST',body,{key}),call(root,'POST',{categoryIds:body.categoryIds,slug:body.slug,title:body.title},{key})]);
 expect(results.map(r=>r.status)).toEqual([201,201]);expect(results[0].data).toEqual(results[1].data);products.add(results[0].data.id);
 expect(results.filter(r=>r.headers.get('idempotency-replayed')==='true')).toHaveLength(1);
 expect(await counts(results[0].data.id)).toEqual({audit:'1',events:'1',deliveries:'1'});
 expect((await call(root,'POST',{...body,title:'tampered'},{key})).data.code).toBe('IDEMPOTENCY_MISMATCH');
 const record=(await admin.query('SELECT response_snapshot,response_fingerprint FROM platform.idempotency_records WHERE idempotency_key=$1',[key])).rows[0];
 expect(record.response_fingerprint).toBe(hash(record.response_snapshot));
 await expect(runtime.query('UPDATE platform.idempotency_records SET http_status=200 WHERE idempotency_key=$1',[key])).rejects.toHaveProperty('code','23514');
});
test('same key with different concurrent payload conflicts; key scopes differ by actor and operation',async()=>{
 const key=randomUUID(),s=tag+'-'+randomUUID();
 const results=await Promise.all(['one','two'].map(title=>call(root,'POST',{title,slug:s},{key})));expect(results.map(r=>r.status).sort()).toEqual([201,409]);
 const p=results.find(r=>r.status===201).data;products.add(p.id);
 const edit=await call(root+'/'+p.id,'PATCH',{title:'Edited'},{key,version:p.version});expect(edit.status).toBe(200);
 const replay=await call(root,'POST',{title:results.find(r=>r.status===201)===results[0]?'one':'two',slug:s},{key});expect(replay.data).toEqual(p);
});
test('draft hidden; missing content/category/variant/price/media prevents publication and stable failure replay',async()=>{
 const p=await make(),key=randomUUID();
 expect((await call('/store/products/'+p.slug,'GET',undefined,{anonymous:true})).status).toBe(404);
 const failed=await transition(p,'publication',{key});expect(failed.status).toBe(422);
 const v=await variant(p);await price(p,v);await media(p);
 const replay=await call(root+'/'+p.id+'/publication','POST',{reasonCode:'synthetic'},{key,version:'1'});
 expect(replay.status).toBe(422);expect(replay.headers.get('idempotency-replayed')).toBe('true');
 expect((await transition(p)).status).toBe(200);
 for(const missing of ['description','categories','price','media']){
  const q=await make(missing==='description'?{description:null}:missing==='categories'?{categoryIds:[]}:{}),w=await variant(q);
  if(missing!=='price')await price(q,w);if(missing!=='media')await media(q);
  expect((await transition(q)).status).toBe(422);
 }
});
test('anonymous published projection is current, minimal and exact; edit requires unpublish and archive hides without deleting history',async()=>{
 const {p,v}=await ready();expect((await transition(p)).status).toBe(200);
 const result=await call('/store/products/'+p.slug,'GET',undefined,{anonymous:true});expect(result.status).toBe(200);
 expect(result.data.variants[0]).toMatchObject({id:v.id,unitPriceMinor:'19900',currency:'BDT',indicativeAvailability:'unknown'});
 expect(JSON.stringify(result.data)).not.toMatch(/object_key|objectKey|created_by|actor|auth_subject|raw|stockCount|priceRecords/);
 expect((await call(root+'/'+p.id,'PATCH',{title:'Unsafe live edit'},{version:p.version})).status).toBe(409);
 expect((await transition(p,'unpublication')).status).toBe(200);
 expect((await call('/store/products/'+p.slug,'GET',undefined,{anonymous:true})).status).toBe(404);
 expect((await call(root+'/'+p.id,'PATCH',{slug:tag+'-changed-'+randomUUID()},{version:p.version})).status).toBe(409);
 expect((await transition(p)).status).toBe(200);expect((await transition(p,'archive')).status).toBe(200);
 expect((await call('/store/products/'+p.slug,'GET',undefined,{anonymous:true})).status).toBe(404);
 expect((await admin.query('SELECT count(*) FROM catalog.price_records WHERE variant_id=$1',[v.id])).rows[0].count).toBe('1');
 expect((await transition(p)).status).toBe(409);
});
test('lifetime normalized SKU cannot be reused after archive and variant identity is immutable',async()=>{
 const a=await make(),v=await variant(a,{sku:'mixed-'+randomUUID()});
 const b=await make();
 expect((await call(root+'/'+b.id+'/variants','POST',{sku:v.sku.toLowerCase(),title:'duplicate'},{version:b.version})).status).toBe(409);
 expect((await transition(a,'archive')).status).toBe(200);
 expect((await call(root+'/'+b.id+'/variants','POST',{sku:v.sku,title:'duplicate'},{version:b.version})).status).toBe(409);
 await expect(runtime.query('UPDATE catalog.product_variants SET sku=$2 WHERE id=$1',[v.id,'NEW'])).rejects.toHaveProperty('code','23514');
 await expect(runtime.query('DELETE FROM catalog.product_variants WHERE id=$1',[v.id])).rejects.toHaveProperty('code','42501');
});
test('variant attribute and media composite ownership constraints cannot be bypassed',async()=>{
 const a=await make(),v=await variant(a,{attributeValues:[{attributeId:fixture.attributeId,valueId:fixture.valueId}]}),b=await make();
 const attr=(await admin.query("INSERT INTO catalog.attributes(code,name) VALUES($1,'Other') RETURNING id",['a_'+randomUUID().replaceAll('-','')])).rows[0].id;extraAttrs.push(attr);
 await expect(runtime.query('INSERT INTO catalog.variant_attribute_values(variant_id,attribute_id,attribute_value_id) VALUES($1,$2,$3)',[v.id,attr,fixture.valueId])).rejects.toHaveProperty('code','23503');
 expect((await call(root+'/'+b.id+'/media','POST',{mediaAssetId:fixture.mediaAssetId,variantId:v.id},{version:b.version})).status).toBe(422);
 await expect(runtime.query('INSERT INTO catalog.product_media(product_id,variant_id,media_asset_id) VALUES($1,$2,$3)',[b.id,v.id,fixture.mediaAssetId])).rejects.toHaveProperty('code','23503');
});
test('media approval and private metadata are protected; pending fixture cannot publish',async()=>{
 const m=(await admin.query(`INSERT INTO catalog.media_assets(storage_class,object_key,content_sha256,mime_type,byte_size,width_px,height_px,created_by_staff_id)
  VALUES('synthetic-local',$1,$2,'image/png',1,1,1,$3) RETURNING id`,[tag+'-pending','a'.repeat(64),rootId])).rows[0].id;extraMedia.push(m);
 const p=await make();expect((await call(root+'/'+p.id+'/media','POST',{mediaAssetId:m},{version:p.version})).status).toBe(422);
 await expect(runtime.query("UPDATE catalog.media_assets SET state='approved' WHERE id=$1",[m])).rejects.toHaveProperty('code','42501');
 await expect(admin.query("UPDATE catalog.media_assets SET public_versioned_path='/synthetic-media/bad.png' WHERE id=$1",[m])).rejects.toHaveProperty('code','23514');
});
test('current price uses half-open intervals, retains exact bigint and rejects overlap even under direct concurrent inserts',async()=>{
 const p=await make(),v=await variant(p);
 await price(p,v,{unitPriceMinor:'9007199254740993',validFrom:'2020-01-01T00:00:00.000Z',validTo:'2030-01-01T00:00:00.000Z'});
 await price(p,v,{unitPriceMinor:'9223372036854775807',validFrom:'2030-01-01T00:00:00.000Z',validTo:'2040-01-01T00:00:00.000Z'});
 await media(p);expect((await transition(p)).status).toBe(200);
 const pub=await call('/store/products/'+p.slug,'GET',undefined,{anonymous:true});expect(pub.data.variants[0].unitPriceMinor).toBe('9007199254740993');
 const boundary=(await admin.query("SELECT unit_price_minor FROM catalog.price_records WHERE variant_id=$1 AND valid_from<='2030-01-01Z'::timestamptz AND (valid_to IS NULL OR valid_to>'2030-01-01Z'::timestamptz)",[v.id])).rows;expect(boundary).toEqual([{unit_price_minor:'9223372036854775807'}]);
 expect((await call(root+'/'+p.id+'/variants/'+v.id+'/prices','POST',{unitPriceMinor:'10',validFrom:'2029-01-01T00:00:00.000Z',reason:'overlap'},{version:p.version})).status).toBe(409);
 const other=new Pool({...connection,user:'commerce_migrator',password:settings.passwords.migrator});
 const sql="INSERT INTO catalog.price_records(variant_id,currency,unit_price_minor,valid_from,valid_to,reason,created_by_staff_id) VALUES($1,'BDT',1,'2041-01-01Z','2042-01-01Z','race',$2)";
 try{const races=await Promise.allSettled([admin.query(sql,[v.id,rootId]),other.query(sql,[v.id,rootId])]);expect(races.filter(r=>r.status==='fulfilled')).toHaveLength(1);expect(races.find(r=>r.status==='rejected').reason.code).toBe('23P01');}finally{await other.end();}
});
test.each([0,1.5,'0','-1','1.1','9223372036854775808','1e3'])('invalid money %s rejected without coercion',async(amount)=>{
 const p=await make(),v=await variant(p);
 expect((await call(root+'/'+p.id+'/variants/'+v.id+'/prices','POST',{unitPriceMinor:amount,validFrom:'2020-01-01T00:00:00.000Z',reason:'invalid'},{version:p.version})).status).toBe(400);
});
test('future/expired price cannot enable publication; price closure is versioned and cannot rewrite past commercial facts',async()=>{
 const p=await make(),v=await variant(p);await price(p,v,{validFrom:'2040-01-01T00:00:00.000Z'});await media(p);expect((await transition(p)).status).toBe(422);
 const q=await make(),w=await variant(q),pr=await price(q,w,{validFrom:'2020-01-01T00:00:00.000Z',validTo:'2021-01-01T00:00:00.000Z'});await media(q);expect((await transition(q)).status).toBe(422);
 await expect(runtime.query('UPDATE catalog.price_records SET unit_price_minor=1 WHERE id=$1',[pr.id])).rejects.toHaveProperty('code','42501');
 const {p:r,v:z,pr:open}=await ready();
 const close=await call(root+'/'+r.id+'/variants/'+z.id+'/prices/'+open.id+'/closure','POST',{validTo:'2030-01-01T00:00:00.000Z',reason:'close'},{version:r.version});expect(close.status).toBe(200);
 expect(close.data.unitPriceMinor).toBe('19900');r.version=close.data.productVersion;
 const invalid=await call(root+'/'+r.id+'/variants/'+z.id+'/prices/'+open.id+'/closure','POST',{validTo:'2020-02-01T00:00:00.000Z',reason:'retroactive'},{version:r.version});expect(invalid.status).toBe(409);
});
test('product version contention allows one writer, and the loser persists a replayable stale outcome',async()=>{
 const p=await make(),keys=[randomUUID(),randomUUID()];
 const results=await Promise.all(['a','b'].map((title,i)=>call(root+'/'+p.id,'PATCH',{title},{key:keys[i],version:p.version})));
 expect(results.map(r=>r.status).sort()).toEqual([200,412]);expect(await counts(p.id)).toEqual({audit:'2',events:'2',deliveries:'2'});
 const i=results.findIndex(r=>r.status===412);const replay=await call(root+'/'+p.id,'PATCH',{title:i===0?'a':'b'},{key:keys[i],version:p.version});expect(replay.status).toBe(412);expect(replay.headers.get('idempotency-replayed')).toBe('true');
});
test('product versions above Number precision remain exact; variant edits/archive and cross-product targets honor the product version',async()=>{
 const p=await make(),v=await variant(p),other=await make();
 const edit=await call(root+'/'+p.id+'/variants/'+v.id,'PATCH',{title:'Edited variant'},{version:p.version});expect(edit.status).toBe(200);p.version=edit.data.productVersion;
 expect((await call(root+'/'+other.id+'/variants/'+v.id,'PATCH',{title:'Cross product'},{version:other.version})).status).toBe(404);
 expect((await call(root+'/'+p.id+'/variants/'+v.id,'PATCH',{sku:'CHANGED'},{version:p.version})).status).toBe(409);
 const archived=await call(root+'/'+p.id+'/variants/'+v.id+'/archive','POST',{reasonCode:'synthetic'},{version:p.version});expect(archived.status).toBe(200);
 expect(archived.data.status).toBe('archived');
 await admin.query('UPDATE catalog.products SET version=9007199254740993 WHERE id=$1',[p.id]);
 const changed=await call(root+'/'+p.id,'PATCH',{title:'Exact version'},{version:'9007199254740993'});expect(changed.status).toBe(200);expect(changed.data.version).toBe('9007199254740994');
 expect(changed.headers.get('etag')).toBe('"9007199254740994"');
});
test('publication racing a draft edit admits one expected version and emits only its committed effect',async()=>{
 const {p}=await ready(),before=await counts(p.id);
 const race=await Promise.all([transition({...p}),call(root+'/'+p.id,'PATCH',{title:'Racing edit'},{version:p.version})]);
 expect(race.map(r=>r.status).sort()).toEqual([200,412]);
 expect((await counts(p.id)).events).toBe((BigInt(before.events)+1n).toString());
 const state=await detail(p),publicRead=await call('/store/products/'+p.slug,'GET',undefined,{anonymous:true});
 expect(publicRead.status).toBe(state.status==='published'?200:404);
});
test('idempotency is actor-scoped and expired stored outcomes never license a fresh mutation',async()=>{
 const assignment=(await admin.query(`INSERT INTO iam.staff_role_assignments(staff_account_id,role_id,granted_by_staff_id,reason)
  SELECT $1,id,$1,'synthetic test setup' FROM iam.roles WHERE code='catalog_editor' RETURNING id`,[rootId])).rows[0].id;
 const key=randomUUID(),a={title:'Actor one',slug:tag+'-'+randomUUID()},b={title:'Actor two',slug:tag+'-'+randomUUID()};
 try{
  const x=await call(root,'POST',a,{key}),y=await call(root,'POST',b,{key,token:tok('root')});expect([x.status,y.status]).toEqual([201,201]);expect(x.data.id).not.toBe(y.data.id);products.add(x.data.id);products.add(y.data.id);
 }finally{await admin.query('DELETE FROM iam.staff_role_assignments WHERE id=$1',[assignment]);}
 const expiredKey=randomUUID(),body={title:'Expired cannot create',slug:tag+'-'+randomUUID()};
 await admin.query(`INSERT INTO platform.idempotency_records(surface,actor_scope,actor_reference,operation,idempotency_key,request_hash,state,http_status,response_snapshot,response_fingerprint,response_schema_version,started_at,completed_at,expires_at)
  VALUES('staff','staff',$1,'product.create',$2,$3,'completed',409,'{"status":409,"body":{"code":"CONFLICT"}}',$4,1,now()-interval '9 days',now()-interval '9 days',now()-interval '2 days')`,[editor.id,expiredKey,hash(body),'a'.repeat(64)]);
 expect((await call(root,'POST',body,{key:expiredKey})).status).toBe(409);
 expect((await admin.query('SELECT count(*) FROM catalog.products WHERE slug=$1',[body.slug])).rows[0].count).toBe('0');
});
test('published content revisions are immutable and preserve their draft after a rollback-only verification',async()=>{
 const client=await admin.connect();await client.query('BEGIN');
 try{
  await client.query('UPDATE catalog.content_revisions SET approved_by_staff_id=$2,approved_at=now(),published_at=now() WHERE id=$1',[fixture.contentRevisionId,rootId]);
  await client.query('SAVEPOINT attempt');
  await expect(client.query("UPDATE catalog.content_revisions SET title='changed' WHERE id=$1",[fixture.contentRevisionId])).rejects.toHaveProperty('code','23514');
  await client.query('ROLLBACK TO SAVEPOINT attempt');
  await expect(client.query('DELETE FROM catalog.content_revisions WHERE id=$1',[fixture.contentRevisionId])).rejects.toHaveProperty('code','23514');
 }finally{await client.query('ROLLBACK');client.release();}
 expect((await admin.query('SELECT published_at FROM catalog.content_revisions WHERE id=$1',[fixture.contentRevisionId])).rows[0].published_at).toBeNull();
});
test.each(['audit_events','outbox_events','outbox_deliveries'])('%s failure rolls back aggregate, all evidence and command record',async(table)=>{
 const p=await make(),key=randomUUID(),before=await counts(p.id);
 await admin.query("CREATE FUNCTION platform.b004_failure() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'synthetic-injected'; END $$");
 await admin.query('CREATE TRIGGER b004_failure BEFORE INSERT ON platform.'+table+' FOR EACH ROW EXECUTE FUNCTION platform.b004_failure()');
 try{expect((await call(root+'/'+p.id,'PATCH',{title:'failed'},{key,version:p.version})).status).toBe(503);}finally{await admin.query('DROP TRIGGER b004_failure ON platform.'+table);await admin.query('DROP FUNCTION platform.b004_failure()');}
 expect((await detail(p)).version).toBe(p.version);expect(await counts(p.id)).toEqual(before);
 expect((await admin.query('SELECT count(*) FROM platform.idempotency_records WHERE idempotency_key=$1',[key])).rows[0].count).toBe('0');
 expect((await call(root+'/'+p.id,'PATCH',{title:'failed'},{key,version:p.version})).status).toBe(200);
});
test('lost COMMIT reply returns unknown; replay recovers one committed product/event without rerunning',async()=>{
 const original=Client.prototype.query;let lost=false;
 const fault=jest.spyOn(Client.prototype,'query').mockImplementation(function(...args){
  if(!lost && this.connectionParameters.user==='commerce_api' && args[0]==='COMMIT'){lost=true;return original.apply(this,args).then(()=>{throw Object.assign(new Error('lost synthetic reply'),{code:'ECONNRESET'});});}
  return original.apply(this,args);
 });
 const key=randomUUID(),body={title:'Unknown commit',slug:tag+'-'+randomUUID()};let first;
 try{first=await call(root,'POST',body,{key});}finally{fault.mockRestore();}
 expect(first.status).toBe(503);expect(first.data.code).toBe('COMMIT_UNKNOWN');
 const replay=await call(root,'POST',body,{key});expect(replay.status).toBe(201);expect(replay.headers.get('idempotency-replayed')).toBe('true');products.add(replay.data.id);
 expect(await counts(replay.data.id)).toEqual({audit:'1',events:'1',deliveries:'1'});
});
test('pagination is bounded, deterministic, filter-bound and rejects tampered cursors/unknown query fields',async()=>{
 for(let i=0;i<3;i++)await make();
 const first=await call(root+'?limit=2&status=draft');expect(first.status).toBe(200);expect(first.data.items).toHaveLength(2);expect(first.data.nextCursor).toBeTruthy();
 const second=await call(root+'?limit=2&status=draft&cursor='+first.data.nextCursor);expect(second.status).toBe(200);expect(second.data.items.every(r=>r.id>first.data.items[1].id)).toBe(true);
 for(const q of ['limit=101','limit=0','status=bad','sort=title','cursor=not-valid','limit=3&status=draft&cursor='+first.data.nextCursor,'limit=2&status=published&cursor='+first.data.nextCursor])expect((await call(root+'?'+q)).status).toBe(400);
});
test('source publication/approval loss hides public data despite prior successful publication',async()=>{
 const {p}=await ready();await transition(p);
 await admin.query("UPDATE catalog.categories SET status='draft' WHERE id=$1",[fixture.categoryId]);
 try{expect((await call('/store/products/'+p.slug,'GET',undefined,{anonymous:true})).status).toBe(404);}finally{await admin.query("UPDATE catalog.categories SET status='published' WHERE id=$1",[fixture.categoryId]);}
 await admin.query("UPDATE catalog.media_assets SET state='rejected',public_versioned_path=NULL WHERE id=$1",[fixture.mediaAssetId]);
 try{expect((await call('/store/products/'+p.slug,'GET',undefined,{anonymous:true})).status).toBe(404);}finally{await admin.query("UPDATE catalog.media_assets SET state='approved',public_versioned_path='/synthetic-media/test.png' WHERE id=$1",[fixture.mediaAssetId]);}
});
test('catalog hierarchy cannot cycle and runtime cannot modify fixtures, audit or outbox history',async()=>{
 const child=(await admin.query("INSERT INTO catalog.categories(slug,name,parent_id) VALUES($1,'Child',$2) RETURNING id",[tag+'-child',fixture.categoryId])).rows[0].id;extraCategories.push(child);
 await expect(admin.query('UPDATE catalog.categories SET parent_id=$2 WHERE id=$1',[fixture.categoryId,child])).rejects.toHaveProperty('code','23514');
 for(const sql of ['UPDATE platform.audit_events SET reason=reason','DELETE FROM platform.outbox_events','UPDATE platform.outbox_deliveries SET state=state','DELETE FROM platform.idempotency_records',"UPDATE catalog.categories SET status='published'",'UPDATE catalog.content_revisions SET title=title'])await expect(runtime.query(sql)).rejects.toHaveProperty('code','42501');
 await expect(worker.query('SELECT * FROM catalog.products')).rejects.toHaveProperty('code','42501');
 const p=await make();await expect(admin.query("INSERT INTO platform.audit_events(actor_type,actor_staff_id,action,target_id,reason,summary,correlation_id) VALUES('customer',$1,'bad',$2,'bad','{}',gen_random_uuid())",[editor.id,p.id])).rejects.toHaveProperty('code','23514');
});
test('outbox envelope and fixed destinations match every committed catalog version; capture stays pending',async()=>{
 const {p}=await ready();await transition(p);await transition(p,'archive');
 const rows=(await admin.query(`SELECT e.*,d.destination_key,d.state FROM platform.outbox_events e JOIN platform.outbox_deliveries d ON d.event_id=e.id WHERE e.aggregate_id=$1 ORDER BY e.aggregate_version`,[p.id])).rows;
 expect(rows).toHaveLength(Number(p.version));expect(rows.map(r=>r.event_type)).toContain('product.published');expect(rows.at(-1).event_type).toBe('product.archived');
 for(const r of rows){expect(r).toMatchObject({event_schema_version:1,routing_version:1,producer:'catalog',destination_key:'search-projection',state:'pending',published_at:null});expect(r.payload).toEqual({productId:p.id,version:r.aggregate_version,status:r.payload.status});}
 const audits=(await admin.query("SELECT change_summary FROM platform.audit_events WHERE target_schema='catalog' AND target_id=$1 ORDER BY occurred_at,id",[p.id])).rows;expect(audits).toHaveLength(rows.length);
});
test('OpenAPI paths/operations/security/local artifact and served contract agree',async()=>{
 const artifact=JSON.parse(fs.readFileSync(path.join(__dirname,'../backend/openapi/catalog-v1.json')));expect(artifact).toEqual(catalogOpenApi);
 const response=await call('/openapi.json','GET',undefined,{anonymous:true});expect(response.data).toEqual(artifact);expect(artifact.openapi).toBe('3.0.3');
 const ids=[];for(const [p,item]of Object.entries(artifact.paths))for(const [method,op]of Object.entries(item)){
  ids.push(op.operationId);expect(op.responses).toBeDefined();expect(op.security.length).toBe(p.startsWith('/staff/')?1:0);
  if(['post','patch'].includes(method))expect(op.parameters.find(p=>p.name==='Idempotency-Key')?.required).toBe(true);
  for(const m of p.matchAll(/\{([^}]+)\}/g))expect(op.parameters.some(p=>p.in==='path'&&p.name===m[1]&&p.required)).toBe(true);
 }
 expect(ids).toHaveLength(14);expect(new Set(ids).size).toBe(ids.length);
 for(const m of JSON.stringify(artifact).matchAll(/"\$ref":"#\/components\/schemas\/([^"/]+)"/g))expect(artifact.components.schemas[m[1]]).toBeDefined();
});
test('revoked caller cannot replay earlier result or mutate; revocation wins against a queued catalog command',async()=>{
 const key=randomUUID(),body={title:'Previously allowed',slug:tag+'-'+randomUUID()},old=await call(root,'POST',body,{key});expect(old.status).toBe(201);products.add(old.data.id);
 const blocker=await admin.connect();await blocker.query('BEGIN');await blocker.query('SELECT pg_advisory_xact_lock(2002,1)');
 const revoke=call('/staff/access/accounts/'+editor.id+'/grants/'+grantId+'/revocation','POST',{reason:'Race revoke'},{token:tok('root'),version:editor.version});
 async function waiting(n){for(let i=0;i<100;i++){if(Number((await blocker.query("SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND classid=2002 AND objid=1 AND NOT granted")).rows[0].count)>=n)return;await new Promise(r=>setTimeout(r,1));}throw new Error('Missing lock waiters');}
 let mutation;try{await waiting(1);mutation=call(root+'/'+old.data.id,'PATCH',{title:'should not commit'},{version:'1'});await waiting(2);}finally{await blocker.query('COMMIT');blocker.release();}
 expect((await revoke).status).toBe(201);expect((await mutation).status).toBe(403);
 expect((await call(root,'POST',body,{key})).status).toBe(403);expect(await counts(old.data.id)).toEqual({audit:'1',events:'1',deliveries:'1'});
});
test('database loss fails closed; logs contain no tokens, descriptions or SQL evidence',async()=>{
 const outage=await startApi({...env,DB_PORT:'1'},e=>logs.push(e));try{const r=await fetch('http://127.0.0.1:'+outage.port+'/api/v1'+root,{headers:{authorization:'Bearer '+tok()}});expect(r.status).toBe(503);}finally{await outage.app.close();}
 const value=JSON.stringify(logs);for(const secret of ['Plain synthetic description',subject('editor'),'synthetic-injected','lost synthetic reply','BEGIN PRIVATE KEY','eyJhbGci'])expect(value).not.toContain(secret);
});
