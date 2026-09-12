// Synthetic local fixture/demo. Preserves bootstrap and previous catalog/stock facts.
const fs=require('node:fs'),path=require('node:path'),{parseEnv}=require('node:util');
const {randomUUID}=require('node:crypto'),{Pool}=require('pg'),jwt=require('jsonwebtoken');
const {startApi}=require('../apps/commerce-api/dist/application');
const {readConfiguration,Foundation}=require('../packages/platform/dist');
const {LocalIdentityVerifier,LOCAL_ISSUER,audience}=require('../apps/commerce-api/dist/identity/authentication');
const {seedInventoryFixture}=require('../apps/commerce-api/dist/inventory/fixture');
const {InventoryService}=require('../apps/commerce-api/dist/inventory/service');
async function main(){
 if(process.argv.length!==2)throw Error('No arguments allowed');
 const dir=path.join(__dirname,'../.local'),env=parseEnv(fs.readFileSync(path.join(dir,'api.env'),'utf8')),config=readConfiguration(env,'api');
 if(config.environment!=='local')throw Error('Local only');
 const state=JSON.parse(fs.readFileSync(path.join(dir,'postgres.json'))),keys=JSON.parse(fs.readFileSync(path.join(dir,'identity.json')));
 if(state.port!==config.database.port)throw Error('Port mismatch');
 const pool=new Pool({host:'127.0.0.1',port:state.port,user:'commerce_migrator',password:state.passwords.migrator,database:'commerce_local',max:1,statement_timeout:3000,connectionTimeoutMillis:1000});
 let api;
 const token=(subject,kind='staff')=>{const now=Math.floor(Date.now()/1000);return jwt.sign({iss:LOCAL_ISSUER,sub:subject,aud:audience(kind),kind,scope:kind+':access',synthetic:true,amr:['mfa'],iat:now,nbf:now,exp:now+300},keys.privateKey,{algorithm:'RS256',header:{kid:'local-rsa-1',typ:'JWT'}});};
 try{
  const root=(await pool.query("SELECT s.auth_subject FROM iam.staff_accounts s JOIN platform.audit_events a ON a.actor_staff_id=s.id WHERE a.action='access.bootstrap' AND s.status='active'")).rows[0];if(!root)throw Error('Existing bootstrap required');
  const rootToken=token(root.auth_subject),verifier=new LocalIdentityVerifier(config,env.IDENTITY_PUBLIC_KEY);
  // Choose the preserved B004 demo product, never overwrite its accepted catalog history.
  const catalogDemo=JSON.parse(fs.readFileSync(path.join(dir,'catalog-demo.json')));
  const variant=(await pool.query("SELECT id FROM catalog.product_variants WHERE product_id=$1 AND status='published' ORDER BY id LIMIT 1",[catalogDemo.productId])).rows[0];if(!variant)throw Error('Published catalog fixture required');
  const fixture=await seedInventoryFixture(pool,verifier,rootToken,[variant.id]);
  const repeat=await seedInventoryFixture(pool,verifier,rootToken,[variant.id]);if(JSON.stringify(repeat)!==JSON.stringify(fixture))throw Error('Fixture replay differs');
  const position=fixture.positions[0],before=(await pool.query('SELECT sellable_on_hand FROM inventory.stock_positions WHERE id=$1',[position.id])).rows[0].sellable_on_hand;
  api=await startApi({...env,API_PORT:'0'},()=>{});let base='http://127.0.0.1:'+api.port+'/api/v1';
  const request=async(route,method='GET',body,opts={})=>{const r=await fetch(base+route,{method,headers:{...(opts.token?{authorization:'Bearer '+opts.token}:{}),...(opts.guest?{'x-guest-cart-token':opts.guest}:{}),...(body?{'content-type':'application/json'}:{}),...(opts.version?{'if-match':'"'+opts.version+'"'}:{}),'idempotency-key':opts.key??randomUUID()},...(body?{body:JSON.stringify(body)}:{})});return{status:r.status,data:await r.json(),replayed:r.headers.get('idempotency-replayed')==='true'};};
  const assert=(r,status)=>{if(r.status!==status)throw Error('Unexpected local response '+r.status);return r.data;};
  const marker=randomUUID(),staffSubject='synthetic:stock-demo-'+marker;
  const staff=assert(await request('/staff/access/accounts','POST',{subject:staffSubject,displayName:'Synthetic stock operator',reason:'B005 demo'},{token:rootToken}),201);
  assert(await request('/staff/access/accounts/'+staff.id+'/grants','POST',{roleCode:'inventory.manager',reason:'B005 demo'},{token:rootToken,version:staff.version}),201);
  const staffToken=token(staffSubject),customerToken=token('synthetic:cart-demo-'+marker,'customer');
  const foundation=new Foundation(config,()=>{}),key=randomUUID(),operationKey=randomUUID();let opening;
  try{const service=new InventoryService(foundation.database),identity=verifier.verify('Bearer '+staffToken,'staff');
   const body={positionId:position.id,deltaSellable:10,operationKey,reasonCode:'synthetic_opening'};
   const openingResult=await service.adjust(identity,body,key,'"'+position.version+'"',position.version==='1');
   if(openingResult.status!==201)throw Error('Unexpected local response '+openingResult.status);opening=openingResult.body;
   const replay=await service.adjust(identity,body,key,'"'+position.version+'"',position.version==='1');if(!replay.replayed||replay.body.movementId!==opening.movementId)throw Error('Opening replay mismatch');
  }finally{await foundation.database.close();await foundation.telemetry.close();}
  const adjusted=assert(await request('/staff/inventory/adjustments','POST',{positionId:position.id,deltaSellable:-3,operationKey:randomUUID(),reasonCode:'synthetic_adjustment'},{token:staffToken,version:opening.version}),201);
  assert(await request('/staff/inventory/positions/'+position.id,'GET',undefined,{token:rootToken}),403);
  const guest=assert(await request('/guest/carts','POST',{}),201),customer=assert(await request('/customer/cart','POST',{}, {token:customerToken}),200);
  const s=assert(await request('/customer/cart/items','POST',{cartId:guest.id,variantId:variant.id,quantity:15},{guest:guest.guestToken,version:guest.version}),200);
  const t=assert(await request('/customer/cart/items','POST',{cartId:customer.id,variantId:variant.id,quantity:10},{token:customerToken,version:customer.version}),200);
  const mergeKey=randomUUID(),mergeBody={sourceCartId:s.id,targetCartId:t.id,sourceVersion:s.version},mergeOpts={token:customerToken,guest:guest.guestToken,version:t.version,key:mergeKey};
  const merged=assert(await request('/customer/cart/merge','POST',mergeBody,mergeOpts),200);const replay=await request('/customer/cart/merge','POST',mergeBody,mergeOpts);assert(replay,200);
  if(!replay.replayed||merged.items[0].quantity!==20||merged.adjustments[0].requestedQuantity!==25)throw Error('Merge mismatch');
  await api.app.close();api=await startApi({...env,API_PORT:'0'},()=>{});base='http://127.0.0.1:'+api.port+'/api/v1';
  const persisted=assert(await request('/customer/cart','GET',undefined,{token:customerToken}),200);if(persisted.version!==merged.version||persisted.items[0].quantity!==20)throw Error('Persistence mismatch');
  assert(await request('/customer/cart','GET',undefined,{guest:guest.guestToken}),404);
  const balance=(await pool.query('SELECT sellable_on_hand FROM inventory.stock_positions WHERE id=$1',[position.id])).rows[0].sellable_on_hand;
  const total=(await pool.query('SELECT sum(delta_sellable)::text AS total FROM inventory.stock_movements WHERE stock_position_id=$1',[position.id])).rows[0].total;
  if(balance!==total||BigInt(balance)!==BigInt(before)+7n||balance!==adjusted.sellableOnHand)throw Error('Stock reconciliation mismatch');
  const deliveries=(await pool.query(`SELECT e.id AS "eventId",d.state FROM platform.outbox_events e JOIN platform.outbox_deliveries d ON d.event_id=e.id WHERE e.aggregate_id=$1 ORDER BY e.aggregate_version`,[position.id])).rows;
  if(deliveries.some(d=>d.state!=='pending'))throw Error('Unexpected dispatch');
  const result={event:'local_stock_cart_demo_passed',profile:'DEV-PHYSICAL-BD',profileRevision:1,positionId:position.id,stockBefore:before,stockAfter:balance,ledgerTotal:total,customerCartId:customer.id,guestCartId:guest.id,mergeRequested:25,mergeAccepted:20,replay:true,restartPersistence:true,wrongRoleDenied:true,terminalGuestDenied:true,cartStockNonEffect:true,deliveries};
  fs.writeFileSync(path.join(dir,'stock-cart-demo.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});console.log(JSON.stringify(result));
 }finally{if(api)await api.app.close();await pool.end();}
}
main().catch(error=>{console.error('Synthetic stock/cart demo failed: '+(error.message.startsWith('Unexpected local response')?error.message:'preserve data and inspect local fixture/migration readiness'));process.exitCode=1;});
