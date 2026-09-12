const fs=require('node:fs'),path=require('node:path');
const {generateKeyPairSync,randomUUID,randomBytes,createHash}=require('node:crypto');
const {Pool,Client}=require('pg'),jwt=require('jsonwebtoken');
const {startApi}=require('../apps/commerce-api/dist/application');
const {readConfiguration,STOCK_CART_HASH,Foundation}=require('../packages/platform/dist');
const {applyMigrations}=require('../packages/platform/dist/migrations');
const {LocalIdentityVerifier,LOCAL_ISSUER,audience}=require('../apps/commerce-api/dist/identity/authentication');
const {bootstrapAdmin}=require('../apps/commerce-api/dist/identity/bootstrap');
const {seedCatalogFixture}=require('../apps/commerce-api/dist/catalog/fixture');
const {seedInventoryFixture}=require('../apps/commerce-api/dist/inventory/fixture');
const {InventoryService}=require('../apps/commerce-api/dist/inventory/service');
const {stockCartOpenApi}=require('../apps/commerce-api/dist/cart/openapi');
const {environment,databaseSettings}=require('./helpers.cjs');
const settings=databaseSettings(),connection={host:'127.0.0.1',port:settings.port,database:'commerce_test',max:1};
const admin=new Pool({...connection,user:'commerce_migrator',password:settings.passwords.migrator});
const runtime=new Pool({...connection,user:'commerce_api',password:settings.passwords.api});
const worker=new Pool({...connection,user:'commerce_worker',password:settings.passwords.worker});
const keys=generateKeyPairSync('rsa',{modulusLength:2048});
const env=environment('api',{IDENTITY_PUBLIC_KEY:Buffer.from(keys.publicKey.export({type:'spki',format:'pem'})).toString('base64')});
const verifier=new LocalIdentityVerifier(readConfiguration(env,'api'),env.IDENTITY_PUBLIC_KEY);
const tag='b005-'+randomUUID(),subject=name=>'synthetic:'+tag+'-'+name;
const tok=(name='stock',kind='staff')=>{const now=Math.floor(Date.now()/1000);return jwt.sign({iss:LOCAL_ISSUER,sub:subject(name),aud:audience(kind),kind,synthetic:true,scope:kind+':access',amr:['mfa'],iat:now,nbf:now,exp:now+300},keys.privateKey,{algorithm:'RS256',header:{kid:'local-rsa-1',typ:'JWT'}});};
let api,base,rootId,stock,stockGrant,fixture,locationId,clean=false;
const logs=[],products=[],cartIds=[],guestTokens=[];
async function call(route,method='GET',body,options={}){
 const response=await fetch(base+'/api/v1'+route,{method,headers:{...(options.anonymous||options.guest?{}:{authorization:'Bearer '+(options.token??tok())}),
  ...(options.guest?{'x-guest-cart-token':options.guest}:{}),...(body===undefined?{}:{'content-type':'application/json'}),
  ...(options.key===null||method==='GET'?{}:{'idempotency-key':options.key??randomUUID()}),...(options.version===undefined?{}:{'if-match':'"'+options.version+'"'}),...options.headers},
  ...(body===undefined?{}:{body:JSON.stringify(body)})});
 const data=await response.json();expect(response.headers.get('cache-control')).toBe('no-store');
 return {status:response.status,data,headers:response.headers};
}
async function variant({cap=20,price='19900'}={}){
 const p=(await admin.query("INSERT INTO catalog.products(slug,title,description,status) VALUES($1,'Synthetic stock/cart product','Synthetic only','published') RETURNING id",[tag+'-'+randomUUID()])).rows[0].id;products.push(p);
 await admin.query('INSERT INTO catalog.product_categories(product_id,category_id,is_primary) VALUES($1,$2,true)',[p,fixture.categoryId]);
 await admin.query('INSERT INTO catalog.product_media(product_id,media_asset_id,is_primary) VALUES($1,$2,true)',[p,fixture.mediaAssetId]);
 const v=(await admin.query("INSERT INTO catalog.product_variants(product_id,sku,title,status,max_order_quantity) VALUES($1,$2,'Synthetic variant','published',$3) RETURNING id",[p,'B005-'+randomUUID(),cap])).rows[0].id;
 await admin.query("INSERT INTO catalog.price_records(variant_id,currency,unit_price_minor,valid_from,reason,created_by_staff_id) VALUES($1,'BDT',$2,'2020-01-01Z','fixture',$3)",[v,price,rootId]);
 const position=(await admin.query('INSERT INTO inventory.stock_positions(variant_id,stock_location_id) VALUES($1,$2) RETURNING id,version',[v,locationId])).rows[0];
 return {id:v,productId:p,positionId:position.id,version:position.version};
}
async function adjust(v,delta=10,options={}){return call('/staff/inventory/adjustments','POST',{positionId:v.positionId,deltaSellable:delta,operationKey:options.operationKey??randomUUID(),reasonCode:'synthetic',...options.body},{version:options.version??v.version,...options});}
async function customer(name=randomUUID()){const token=tok(name,'customer'),r=await call('/customer/cart','POST',{}, {token});expect(r.status).toBe(200);cartIds.push(r.data.id);return {...r.data,token};}
async function guest(){const r=await call('/guest/carts','POST',{}, {anonymous:true});expect(r.status).toBe(201);cartIds.push(r.data.id);guestTokens.push(r.data.guestToken);return {...r.data,guest:r.data.guestToken};}
const owner=c=>c.guest?{guest:c.guest}:{token:c.token};
async function add(c,v,n=1,extra={}){const r=await call('/customer/cart/items','POST',{cartId:c.id,variantId:v.id,quantity:n},{...owner(c),version:c.version,...extra});if(r.status===200)c.version=r.data.version;return r;}
async function merge(s,t,extra={}){return call('/customer/cart/merge','POST',{sourceCartId:s.id,targetCartId:t.id,sourceVersion:s.version},{token:t.token,headers:{authorization:'Bearer '+t.token},guest:s.guest,version:t.version,...extra});}
async function evidence(position){return (await admin.query(`SELECT (SELECT count(*) FROM inventory.stock_movements WHERE stock_position_id=$1) AS movements,
 (SELECT count(*) FROM platform.audit_events WHERE target_schema='inventory' AND target_id=$1) AS audit,
 (SELECT count(*) FROM platform.outbox_events WHERE aggregate_id=$1) AS events,
 (SELECT count(*) FROM platform.outbox_deliveries d JOIN platform.outbox_events e ON e.id=d.event_id WHERE e.aggregate_id=$1) AS deliveries`,[position])).rows[0];}
async function faultOnce(fragment,operation,commit=false){const original=Client.prototype.query;let hit=false;
 const spy=jest.spyOn(Client.prototype,'query').mockImplementation(function(...args){if(!hit&&this.connectionParameters.user==='commerce_api'&&typeof args[0]==='string'&&args[0].includes(fragment)){hit=true;if(commit)return original.apply(this,args).then(()=>{throw Object.assign(new Error('synthetic lost reply'),{code:'ECONNRESET'});});return Promise.reject(new Error('synthetic injected private payload'));}return original.apply(this,args);});
 try{return await operation();}finally{spy.mockRestore();expect(hit).toBe(true);}}
beforeAll(async()=>{
 await applyMigrations({port:settings.port,database:'commerce_test',password:settings.passwords.migrator},path.join(__dirname,'../database/migrations'));
 expect((await admin.query('SELECT count(*) FROM iam.staff_accounts')).rows[0].count).toBe('0');clean=true;
 rootId=await bootstrapAdmin(admin,verifier,tok('root'));fixture=await seedCatalogFixture(admin,verifier,tok('root'),tag);
 locationId=(await seedInventoryFixture(admin,verifier,tok('root'),[])).locationId;
 api=await startApi(env,e=>logs.push(e));base='http://127.0.0.1:'+api.port;
 stock=(await call('/staff/access/accounts','POST',{subject:subject('stock'),displayName:'Synthetic stock operator',reason:'fixture'},{token:tok('root')})).data;
 const grant=await call('/staff/access/accounts/'+stock.id+'/grants','POST',{roleCode:'inventory.manager',reason:'fixture'},{token:tok('root'),version:stock.version});expect(grant.status).toBe(201);stock.version=grant.data.version;stockGrant=grant.data.assignmentId;
});
afterAll(async()=>{
 if(api)await api.app.close();
 if(clean){
  const customers=(await admin.query('SELECT id FROM iam.customers WHERE auth_subject LIKE $1',[subject('')+'%'])).rows.map(r=>r.id);
  const positions=(await admin.query('SELECT id FROM inventory.stock_positions WHERE stock_location_id=$1',[locationId])).rows.map(r=>r.id);
  await admin.query('DELETE FROM platform.outbox_deliveries WHERE event_id IN(SELECT id FROM platform.outbox_events WHERE aggregate_id=ANY($1::uuid[]))',[positions]);
  await admin.query('DELETE FROM platform.outbox_events WHERE aggregate_id=ANY($1::uuid[])',[positions]);
  await admin.query('DELETE FROM inventory.stock_movements WHERE stock_position_id=ANY($1::uuid[])',[positions]);
  await admin.query('DELETE FROM inventory.stock_positions WHERE id=ANY($1::uuid[])',[positions]);
  await admin.query('DELETE FROM sales.cart_lines WHERE cart_id=ANY($1::uuid[]) OR cart_id IN(SELECT id FROM sales.carts WHERE customer_id=ANY($2::uuid[]))',[cartIds,customers]);
  await admin.query("DELETE FROM sales.carts WHERE state='merged' AND id=ANY($1::uuid[])",[cartIds]);
  await admin.query('DELETE FROM sales.carts WHERE id=ANY($1::uuid[]) OR customer_id=ANY($2::uuid[])',[cartIds,customers]);
  await admin.query("DELETE FROM platform.idempotency_records WHERE actor_reference IN(SELECT id::text FROM iam.staff_accounts WHERE auth_subject LIKE $1) OR actor_reference=ANY($2::text[]) OR actor_scope='guest' AND actor_reference=ANY($3::text[])",[subject('')+'%',customers,guestTokens.map(t=>createHash('sha256').update(Buffer.from(t,'base64url')).digest('hex'))]);
  await admin.query('DELETE FROM platform.audit_events WHERE actor_staff_id IN(SELECT id FROM iam.staff_accounts WHERE auth_subject LIKE $1)',[subject('')+'%']);
  await admin.query('DELETE FROM inventory.stock_locations WHERE id=$1',[locationId]);
  await admin.query('DELETE FROM catalog.product_media WHERE product_id=ANY($1::uuid[])',[products]);
  await admin.query('DELETE FROM catalog.price_records WHERE variant_id IN(SELECT id FROM catalog.product_variants WHERE product_id=ANY($1::uuid[]))',[products]);
  await admin.query('DELETE FROM catalog.product_variants WHERE product_id=ANY($1::uuid[])',[products]);
  await admin.query('DELETE FROM catalog.product_categories WHERE product_id=ANY($1::uuid[])',[products]);await admin.query('DELETE FROM catalog.products WHERE id=ANY($1::uuid[])',[products]);
  if(fixture){await admin.query('DELETE FROM catalog.content_revisions WHERE content_entry_id=$1',[fixture.contentEntryId]);await admin.query('DELETE FROM catalog.content_entries WHERE id=$1',[fixture.contentEntryId]);await admin.query('DELETE FROM catalog.media_assets WHERE id=$1',[fixture.mediaAssetId]);await admin.query('DELETE FROM catalog.attribute_values WHERE attribute_id=$1',[fixture.attributeId]);await admin.query('DELETE FROM catalog.attributes WHERE id=$1',[fixture.attributeId]);await admin.query('DELETE FROM catalog.categories WHERE id=$1',[fixture.categoryId]);await admin.query('DELETE FROM catalog.brands WHERE id=$1',[fixture.brandId]);}
  await admin.query('DELETE FROM iam.customers WHERE id=ANY($1::uuid[])',[customers]);
  await admin.query('DELETE FROM iam.staff_role_assignments WHERE staff_account_id IN(SELECT id FROM iam.staff_accounts WHERE auth_subject LIKE $1)',[subject('')+'%']);
  await admin.query('DELETE FROM iam.role_permissions WHERE granted_by_staff_id=$1',[rootId]);await admin.query('DELETE FROM iam.staff_accounts WHERE auth_subject LIKE $1',[subject('')+'%']);
  await admin.query("DELETE FROM iam.roles WHERE code IN ('access_admin','catalog_editor','inventory.manager')");await admin.query("DELETE FROM iam.permissions WHERE resource IN ('access','catalog','inventory')");
 }
 await Promise.all([admin.end(),runtime.end(),worker.end()]);
});

test('five-table migration identity, guarded fixture and no unrelated parent tables',async()=>{
 expect(createHash('sha256').update(fs.readFileSync('database/migrations/0003_stock_cart.sql')).digest('hex')).toBe(STOCK_CART_HASH);
 expect((await admin.query("SELECT count(*) FROM information_schema.tables WHERE table_schema IN ('inventory','sales') AND table_type='BASE TABLE'")).rows[0].count).toBe('5');
 expect((await seedInventoryFixture(admin,verifier,tok('root'),[])).locationId).toBe(locationId);
 await expect(seedInventoryFixture(runtime,verifier,tok('root'),[])).rejects.toThrow('Deployment role');
 await expect(seedInventoryFixture(admin,verifier,tok(),[])).rejects.toThrow();
 await expect(worker.query('SELECT * FROM inventory.stock_positions')).rejects.toHaveProperty('code','42501');
});
test('opening and adjustment reconcile append-only ledger and atomic evidence',async()=>{
 const v=await variant(),foundation=new Foundation(readConfiguration(env,'api'),()=>{});
 try{const service=new InventoryService(foundation.database),r=await service.adjust(verifier.verify('Bearer '+tok(),'staff'),{positionId:v.positionId,deltaSellable:10,operationKey:randomUUID(),reasonCode:'opening'},randomUUID(),'"1"',true);expect(r.status).toBe(201);}finally{await foundation.database.close();await foundation.telemetry.close();}
 const r=await adjust(v,-3,{version:'2'});expect(r.status).toBe(201);expect(r.data).toMatchObject({sellableOnHand:'7',reservedQuantity:'0',available:'7',version:'3'});
 expect(await evidence(v.positionId)).toEqual({movements:'2',audit:'2',events:'2',deliveries:'2'});
 expect((await admin.query('SELECT sum(delta_sellable)::text AS total FROM inventory.stock_movements WHERE stock_position_id=$1',[v.positionId])).rows[0].total).toBe('7');
 const event=(await admin.query('SELECT payload FROM platform.outbox_events WHERE aggregate_id=$1 LIMIT 1',[v.positionId])).rows[0].payload;expect(event).toMatchObject({stockPositionId:v.positionId,variantId:v.id,productId:v.productId});
});
test('stock negative guards: wrong role, missing/stale version, invalid delta and insufficient stock',async()=>{
 const v=await variant();expect((await adjust(v,10,{token:tok('root')})).status).toBe(403);
 expect((await call('/staff/inventory/adjustments','POST',{positionId:v.positionId,deltaSellable:1,operationKey:randomUUID(),reasonCode:'test'})).status).toBe(428);
 for(const delta of [0,0.5,1001,-1001,'1'])expect((await adjust(v,delta)).status).toBe(400);
 expect((await adjust(v,-1)).status).toBe(409);expect((await adjust(v,1,{version:'99'})).status).toBe(412);
 expect(await evidence(v.positionId)).toEqual({movements:'0',audit:'0',events:'0',deliveries:'0'});
});
test('same version race and same-key replay give one movement; duplicate business operation conflicts',async()=>{
 const v=await variant(),results=await Promise.all([adjust(v,1),adjust(v,2)]);expect(results.map(r=>r.status).sort()).toEqual([201,412]);
 const w=await variant(),key=randomUUID(),operationKey=randomUUID(),a=await Promise.all([adjust(w,3,{key,operationKey}),adjust(w,3,{key,operationKey})]);expect(a.map(r=>r.status)).toEqual([201,201]);expect(a[0].data).toEqual(a[1].data);
 expect((await adjust(w,4,{key,operationKey})).status).toBe(409);
 expect((await adjust(w,3,{operationKey,version:'2'})).status).toBe(409);
 expect(await evidence(w.positionId)).toEqual({movements:'1',audit:'1',events:'1',deliveries:'1'});
});
test('reserved floor and exact large counters are protected without implementing reservations',async()=>{
 const v=await variant(),c=await admin.connect();try{await c.query('BEGIN');await c.query('UPDATE inventory.stock_positions SET sellable_on_hand=10,reserved_quantity=4 WHERE id=$1',[v.positionId]);
 await c.query('SAVEPOINT invalid');await expect(c.query("INSERT INTO inventory.stock_movements(stock_position_id,movement_type,delta_sellable,sellable_after,reserved_after,position_version,operation_key,actor_staff_id,reason_code,correlation_id) VALUES($1,'adjustment',-7,3,4,2,$2,$3,'test',$4)",[v.positionId,randomUUID(),stock.id,randomUUID()])).rejects.toHaveProperty('code','23514');await c.query('ROLLBACK TO SAVEPOINT invalid');
 await c.query("INSERT INTO inventory.stock_movements(stock_position_id,movement_type,delta_sellable,sellable_after,reserved_after,position_version,operation_key,actor_staff_id,reason_code,correlation_id) VALUES($1,'adjustment',-6,4,4,2,$2,$3,'test',$4)",[v.positionId,randomUUID(),stock.id,randomUUID()]);expect((await c.query('SELECT sellable_on_hand-reserved_quantity AS available FROM inventory.stock_positions WHERE id=$1',[v.positionId])).rows[0].available).toBe('0');}finally{await c.query('ROLLBACK');c.release();}
 await admin.query('UPDATE inventory.stock_positions SET sellable_on_hand=9007199254740993,version=9007199254740993 WHERE id=$1',[v.positionId]);
 const r=await adjust(v,1,{version:'9007199254740993'});expect(r.data.sellableOnHand).toBe('9007199254740994');expect(r.data.version).toBe('9007199254740994');
});
test('runtime cannot replace counters or rewrite/delete/truncate movements',async()=>{
 const v=await variant();await adjust(v);
 for(const sql of ['UPDATE inventory.stock_positions SET sellable_on_hand=99 WHERE id=$1','UPDATE inventory.stock_positions SET version=version+1 WHERE id=$1'])await expect(runtime.query(sql,[v.positionId])).rejects.toHaveProperty('code','42501');
 for(const sql of ['UPDATE inventory.stock_movements SET delta_sellable=2','DELETE FROM inventory.stock_movements','TRUNCATE inventory.stock_movements'])await expect(runtime.query(sql)).rejects.toHaveProperty('code','42501');
});
test.each(['INSERT INTO inventory.stock_movements','INSERT INTO platform.audit_events','INSERT INTO platform.outbox_events','INSERT INTO platform.outbox_deliveries','UPDATE platform.idempotency_records'])('stock rolls back on %s failure',async(fragment)=>{
 const v=await variant(),key=randomUUID(),operationKey=randomUUID();const r=await faultOnce(fragment,()=>adjust(v,5,{key,operationKey}));expect(r.status).toBe(503);
 expect(await evidence(v.positionId)).toEqual({movements:'0',audit:'0',events:'0',deliveries:'0'});
 expect((await admin.query('SELECT sellable_on_hand FROM inventory.stock_positions WHERE id=$1',[v.positionId])).rows[0].sellable_on_hand).toBe('0');
 expect((await adjust(v,5,{key,operationKey})).status).toBe(201);
});
test('lost actual stock COMMIT reply resolves through exact retry',async()=>{const v=await variant(),key=randomUUID(),operationKey=randomUUID();
 const first=await faultOnce('COMMIT',()=>adjust(v,7,{key,operationKey}),true);expect(first.data.code).toBe('COMMIT_UNKNOWN');
 const retry=await adjust(v,7,{key,operationKey});expect(retry.status).toBe(201);expect(retry.headers.get('idempotency-replayed')).toBe('true');expect((await evidence(v.positionId)).movements).toBe('1');});
test('inventory reads have bounded filter-bound keyset and hide raw counts from cart observations',async()=>{
 const v=await variant();await adjust(v);
 const r=await call('/staff/inventory/positions?limit=1');expect(r.status).toBe(200);expect(r.data.items).toHaveLength(1);expect(r.data.nextCursor).toBeTruthy();
 expect((await call('/staff/inventory/positions?limit=2&cursor='+r.data.nextCursor)).status).toBe(400);
 expect((await call('/staff/inventory/positions/'+v.positionId+'/movements?limit=1')).data.items).toHaveLength(1);
 expect((await call('/staff/inventory/positions?limit=101')).status).toBe(400);
});
test('customer create races return one active cart; guest secret never stored raw',async()=>{
 const token=tok('same-owner','customer'),rs=await Promise.all([call('/customer/cart','POST',{}, {token}),call('/customer/cart','POST',{}, {token})]);expect(rs.map(r=>r.status)).toEqual([200,200]);expect(rs[0].data.id).toBe(rs[1].data.id);cartIds.push(rs[0].data.id);
 const g=await guest();const row=(await admin.query('SELECT guest_owner_hash,customer_id FROM sales.carts WHERE id=$1',[g.id])).rows[0];expect(row.guest_owner_hash).toBe(createHash('sha256').update(Buffer.from(g.guest,'base64url')).digest('hex'));expect(row.customer_id).toBeNull();
 expect((await call('/customer/cart','GET',undefined,{guest:g.guest})).data).not.toHaveProperty('guestToken');
});
test('owner-only reads/mutations and replay reject guessed or foreign references and mixed credentials',async()=>{
 const a=await customer(),b=await customer(),g=await guest(),h=await guest(),v=await variant(),key=randomUUID();
 expect((await add(a,v,1,{key})).status).toBe(200);
 expect((await add({...a,token:b.token},v,1,{key,version:'1'})).status).toBe(404);
 expect((await add({...g,guest:h.guest},v)).status).toBe(404);
 expect((await call('/customer/cart','GET',undefined,{guest:randomBytes(32).toString('base64url')})).status).toBe(404);
 expect((await call('/customer/cart','GET',undefined,{guest:'bad'})).status).toBe(401);
 expect((await call('/customer/cart','GET',undefined,{guest:g.guest,headers:{authorization:'Bearer '+a.token}})).status).toBe(400);
 expect((await call('/customer/cart?customerId='+b.id,'GET',undefined,owner(a))).status).toBe(400);
});
test('blocked customer cannot mutate or replay old success',async()=>{
 const c=await customer('blocked'),v=await variant(),key=randomUUID();expect((await add(c,v,1,{key})).status).toBe(200);
 await admin.query("UPDATE iam.customers SET status='blocked' WHERE auth_subject=$1",[subject('blocked')]);expect((await add(c,v,1,{key,version:'1'})).status).toBe(403);
});
test('item lifecycle, idempotent add, quantity and cap validation',async()=>{
 const c=await customer(),v=await variant(),key=randomUUID();expect((await add(c,v,2,{key})).data.items[0].quantity).toBe(2);
 const repeat=await add(c,v,2,{key,version:'1'});expect(repeat.data.items[0].quantity).toBe(2);expect(repeat.headers.get('idempotency-replayed')).toBe('true');
 for(const n of [0,21,1.5,'2'])expect((await add(c,v,n)).status).toBe(400);
 const changed=await call('/customer/cart/items/'+v.id,'PATCH',{cartId:c.id,quantity:4},{...owner(c),version:c.version});expect(changed.status).toBe(200);c.version=changed.data.version;
 const removed=await call('/customer/cart/items/'+v.id,'DELETE',{cartId:c.id},{...owner(c),version:c.version});expect(removed.data.items).toEqual([]);c.version=removed.data.version;
 expect((await add(c,v,20)).status).toBe(200);expect((await add(c,v,1)).status).toBe(409);
 expect((await call('/customer/cart/items','DELETE',{cartId:c.id},{...owner(c),version:c.version})).data.items).toEqual([]);
 const limited=await variant({cap:2});expect((await add(await customer(),limited,3)).status).toBe(409);
});
test('missing/stale cart version, missing key and mass-assigned price/owner rejected',async()=>{
 const c=await customer(),v=await variant(),body={cartId:c.id,variantId:v.id,quantity:1};
 expect((await call('/customer/cart/items','POST',body,owner(c))).status).toBe(428);
 expect((await add(c,v,1,{version:'99'})).status).toBe(412);expect((await add(c,v,1,{key:null})).status).toBe(400);
 expect((await call('/customer/cart/items','POST',{...body,unitPriceMinor:'1'},{...owner(c),version:c.version})).status).toBe(400);
});
test('exact observations explain price, publication and stock changes without stock effects',async()=>{
 const c=await customer(),v=await variant({price:'9007199254740993'});const before=await evidence(v.positionId);
 const a=await add(c,v,2);expect(a.data.merchandiseEstimateMinor).toBe('18014398509481986');expect(a.data.items[0].warnings).toContain('OUT_OF_STOCK');
 expect(JSON.stringify(a.data)).not.toMatch(/sellableOnHand|reservedQuantity|guest_owner_hash/);expect(await evidence(v.positionId)).toEqual(before);
 await admin.query("UPDATE catalog.products SET status='archived' WHERE id=$1",[v.productId]);
 const read=await call('/customer/cart','GET',undefined,owner(c));expect(read.data.items[0].warnings).toContain('UNAVAILABLE');expect(read.data.merchandiseEstimateMinor).toBeNull();
 expect((await add(c,v)).status).toBe(422);
 expect((await call('/customer/cart/items/'+v.id,'DELETE',{cartId:c.id},{...owner(c),version:c.version})).status).toBe(200);
});
test('merge sums and explains clamps, retains unavailable lines and replays terminal source safely',async()=>{
 const s=await guest(),t=await customer(),v=await variant();await add(s,v,15);await add(t,v,10);const key=randomUUID(),inputVersions={s:s.version,t:t.version};
 await admin.query("UPDATE catalog.products SET status='archived' WHERE id=$1",[v.productId]);
 const r=await merge(s,t,{key});expect(r.status).toBe(200);expect(r.data.items[0].quantity).toBe(20);expect(r.data.adjustments).toEqual([{variantId:v.id,requestedQuantity:25,acceptedQuantity:20,reason:'QUANTITY_LIMIT'}]);expect(r.data.items[0].warnings).toContain('UNAVAILABLE');
 const repeat=await merge(s,t,{key});expect(repeat.data).toEqual(r.data);expect(repeat.headers.get('idempotency-replayed')).toBe('true');
 expect((await merge(s,{...t,version:r.data.version})).status).toBe(409);expect((await add(s,v)).status).toBe(404);
 const other=await customer();expect((await merge(s,other,{key})).status).toBe(404);
 expect(await evidence(v.positionId)).toEqual({movements:'0',audit:'0',events:'0',deliveries:'0'});
});
test('same-cart mutation race, duplicate merge and two customers claiming source serialize',async()=>{
 const c=await customer(),v=await variant(),a=await Promise.all([add({...c},v),add({...c},v)]);expect(a.map(r=>r.status).sort()).toEqual([200,412]);
 const s=await guest(),t=await customer(),u=await customer();await add(s,v);const r=await Promise.all([merge(s,t),merge(s,u)]);expect(r.map(x=>x.status).sort()).toEqual([200,404]);
 const x=await guest(),y=await customer();await add(x,v);const key=randomUUID(),rs=await Promise.all([merge(x,y,{key}),merge(x,y,{key})]);expect(rs.map(r=>r.status)).toEqual([200,200]);expect(rs[0].data).toEqual(rs[1].data);
});
test('50-line cap rejects 51-line merge atomically and denies a 51st insert',async()=>{
 const s=await guest(),t=await customer(),variants=[];for(let i=0;i<51;i++)variants.push(await variant());
 for(const v of variants.slice(0,50))await admin.query("INSERT INTO sales.cart_lines(cart_id,variant_id,quantity,observed_unit_price_minor,observed_currency) VALUES($1,$2,1,19900,'BDT')",[t.id,v.id]);
 await add(s,variants[50]);expect((await merge(s,t)).status).toBe(409);expect((await add(t,variants[50])).status).toBe(409);
 expect((await admin.query('SELECT state,version FROM sales.carts WHERE id=$1',[s.id])).rows[0]).toEqual({state:'active',version:s.version});
 expect((await admin.query('SELECT count(*) FROM sales.cart_lines WHERE cart_id=$1',[t.id])).rows[0].count).toBe('50');
});
test('expiry denies old guest replay, retains terminal history and allows customer replacement',async()=>{
 const g=await guest(),v=await variant(),key=randomUUID();await add(g,v,1,{key});
 await admin.query("UPDATE sales.carts SET last_activity_at=now()-interval '31 days',expires_at=now()-interval '1 day',version=version+1 WHERE id=$1",[g.id]);
 expect((await add(g,v,1,{key,version:'1'})).status).toBe(404);expect((await admin.query('SELECT state FROM sales.carts WHERE id=$1',[g.id])).rows[0].state).toBe('expired');
 const c=await customer();await admin.query("UPDATE sales.carts SET last_activity_at=now()-interval '31 days',expires_at=now()-interval '1 day',version=version+1 WHERE id=$1",[c.id]);
 const next=await call('/customer/cart','POST',{},owner(c));expect(next.status).toBe(200);expect(next.data.id).not.toBe(c.id);cartIds.push(next.data.id);
});
test.each(["UPDATE sales.carts SET state='merged'",'UPDATE platform.idempotency_records'])('merge rollback on %s preserves both carts',async(fragment)=>{
 const s=await guest(),t=await customer(),v=await variant();await add(s,v,3);const key=randomUUID();
 const r=await faultOnce(fragment,()=>merge(s,t,{key}));expect(r.status).toBe(503);expect((await call('/customer/cart','GET',undefined,owner(t))).data.items).toEqual([]);
 expect((await admin.query('SELECT state,version FROM sales.carts WHERE id=$1',[s.id])).rows[0]).toEqual({state:'active',version:s.version});expect((await merge(s,t,{key})).status).toBe(200);
});
test('lost merge COMMIT returns uncertainty and exact retry returns one stable target',async()=>{
 const s=await guest(),t=await customer(),v=await variant();await add(s,v,3);const key=randomUUID();
 const r=await faultOnce('COMMIT',()=>merge(s,t,{key}),true);expect(r.data.code).toBe('COMMIT_UNKNOWN');
 const retry=await merge(s,t,{key});expect(retry.status).toBe(200);expect(retry.headers.get('idempotency-replayed')).toBe('true');expect(retry.data.items[0].quantity).toBe(3);
});
test('API restart preserves owned cart with no cache dependency',async()=>{
 const c=await customer(),v=await variant();await add(c,v,4);await api.app.close();api=await startApi(env,e=>logs.push(e));base='http://127.0.0.1:'+api.port;
 const r=await call('/customer/cart','GET',undefined,owner(c));expect(r.data.items[0].quantity).toBe(4);expect(r.data.version).toBe(c.version);
});
test('database loss fails closed without token/private error leakage; OpenAPI artifact matches 12 operations',async()=>{
 const c=await customer();const r=await faultOnce('SELECT * FROM sales.carts',()=>call('/customer/cart','GET',undefined,owner(c)));expect(r.status).toBe(503);
 const spec=(await call('/openapi-stock-cart.json','GET',undefined,{anonymous:true})).data;expect(spec).toEqual(stockCartOpenApi);expect(JSON.parse(fs.readFileSync('backend/openapi/stock-cart-v1.json'))).toEqual(spec);
 expect(Object.values(spec.paths).flatMap(v=>Object.values(v)).map(v=>v.operationId)).toHaveLength(12);
 const snapshots=(await admin.query("SELECT response_snapshot FROM platform.idempotency_records WHERE surface='cart'")).rows;
 const dump=JSON.stringify({logs,snapshots});for(const token of guestTokens)expect(dump).not.toContain(token);expect(dump).not.toContain('synthetic injected private payload');
});
test('revoked inventory grant denies both new adjustment and prior replay',async()=>{
  const v=await variant(),key=randomUUID(),operationKey=randomUUID();expect((await adjust(v,1,{key,operationKey})).status).toBe(201);
 const blocker=await admin.connect();await blocker.query('BEGIN');await blocker.query('SELECT pg_advisory_xact_lock(2002,1)');
 const revoke=call('/staff/access/accounts/'+stock.id+'/grants/'+stockGrant+'/revocation','POST',{reason:'fixture revocation'},{token:tok('root'),version:stock.version});
 async function waiting(n){for(let i=0;i<100;i++){if(Number((await blocker.query("SELECT count(*) FROM pg_locks WHERE locktype='advisory' AND classid=2002 AND objid=1 AND NOT granted")).rows[0].count)>=n)return;await new Promise(r=>setTimeout(r,1));}throw Error('Missing inventory waiters');}
 let mutation;try{await waiting(1);mutation=adjust(v,1,{version:'2'});await waiting(2);}finally{await blocker.query('COMMIT');blocker.release();}
 expect((await revoke).status).toBe(201);expect((await mutation).status).toBe(403);
 expect((await adjust(v,1,{key,operationKey})).status).toBe(403);expect((await adjust(v,1,{version:'2'})).status).toBe(403);
});

test('cart database connection loss denies reads and writes without cache fallback',async()=>{
 const c=await customer(),outage=await startApi({...env,DB_PORT:'1'},e=>logs.push(e));
 try{for(const method of ['GET','POST']){const r=await fetch('http://127.0.0.1:'+outage.port+'/api/v1/customer/cart',{method,headers:{authorization:'Bearer '+c.token,...(method==='POST'?{'content-type':'application/json'}:{})},...(method==='POST'?{body:'{}'}:{})});expect(r.status).toBe(503);}}finally{await outage.app.close();}
});
test('cart price changes use exact current estimates and report stale stored observation',async()=>{
 const c=await customer(),v=await variant();await add(c,v,2);
 // Deployment-only source fixture change: replace price row rather than weaken immutable-price runtime guards.
 await admin.query('DELETE FROM catalog.price_records WHERE variant_id=$1',[v.id]);
 await admin.query("INSERT INTO catalog.price_records(variant_id,currency,unit_price_minor,valid_from,reason,created_by_staff_id) VALUES($1,'BDT',25000,'2020-01-01Z','fixture',$2)",[v.id,rootId]);
 const r=await call('/customer/cart','GET',undefined,owner(c));expect(r.data.merchandiseEstimateMinor).toBe('50000');expect(r.data.items[0]).toMatchObject({observedUnitPriceMinor:'19900',currentUnitPriceMinor:'25000'});expect(r.data.items[0].warnings).toContain('PRICE_CHANGED');
});
test('merge versus source edit has no lost updates and both lock carts in UUID order',async()=>{
 const source=await guest(),target=await customer(),v=await variant();await add(source,v);
 const original=Client.prototype.query,locks=[];
 const spy=jest.spyOn(Client.prototype,'query').mockImplementation(function(...args){if(this.connectionParameters.user==='commerce_api'&&typeof args[0]==='string'&&args[0].includes('SELECT * FROM sales.carts')&&args[0].includes('ANY'))locks.push(args[0]);return original.apply(this,args);});
 let rs;try{rs=await Promise.all([merge(source,target),add({...source},v)]);}finally{spy.mockRestore();}
 expect(locks.length).toBeGreaterThan(0);expect(locks.every(sql=>sql.includes('ORDER BY id FOR UPDATE'))).toBe(true);
 if(rs[0].status===200){expect(rs[1].status).toBe(404);expect(rs[0].data.items[0].quantity).toBe(1);}else{expect(rs[0].status).toBe(412);expect(rs[1].status).toBe(200);expect(rs[1].data.items[0].quantity).toBe(2);}
});
test('expiry committed while merge waits is rechecked after source lock',async()=>{
 const s=await guest(),t=await customer(),v=await variant();await add(s,v);
 const blocker=await admin.connect();await blocker.query('BEGIN');await blocker.query('SELECT id FROM sales.carts WHERE id=$1 FOR UPDATE',[s.id]);
 const pending=merge(s,t);
 try{let seen=false;for(let i=0;i<100;i++){const rows=await blocker.query("SELECT count(*) FROM pg_locks WHERE locktype='transactionid' AND NOT granted");if(Number(rows.rows[0].count)>0){seen=true;break;}await new Promise(r=>setTimeout(r,1));}expect(seen).toBe(true);
 await blocker.query("UPDATE sales.carts SET last_activity_at=now()-interval '31 days',expires_at=now()-interval '1 day',version=version+1 WHERE id=$1",[s.id]);}finally{await blocker.query('COMMIT');blocker.release();}
 expect((await pending).status).toBe(404);expect((await call('/customer/cart','GET',undefined,owner(t))).data.items).toEqual([]);
});
