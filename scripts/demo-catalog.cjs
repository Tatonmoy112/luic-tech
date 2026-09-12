// Synthetic local API-client demo. Creates a new fictional editor/product each run.
const fs=require('node:fs'),path=require('node:path');
const {parseEnv}=require('node:util');
const {randomUUID}=require('node:crypto');
const jwt=require('jsonwebtoken');
const {readConfiguration}=require('../packages/platform/dist');
const {startApi}=require('../apps/commerce-api/dist/application');
const {LOCAL_ISSUER,audience}=require('../apps/commerce-api/dist/identity/authentication');
async function main(){
 if(process.argv.length!==2)throw new Error();
 const dir=path.join(__dirname,'../.local'),env=parseEnv(fs.readFileSync(path.join(dir,'api.env'),'utf8'));
 if(readConfiguration(env,'api').environment!=='local')throw new Error();
 const adminToken=fs.readFileSync(path.join(dir,'staff-token.txt'),'utf8'),keys=JSON.parse(fs.readFileSync(path.join(dir,'identity.json'))),fixture=JSON.parse(fs.readFileSync(path.join(dir,'catalog-fixture.json')));
 const api=await startApi({...env,API_PORT:'0'},()=>{}),base='http://127.0.0.1:'+api.port+'/api/v1';
 async function request(route,token,method='GET',body,version,key=randomUUID()){
  const response=await fetch(base+route,{method,headers:{...(token?{authorization:'Bearer '+token}:{}),...(body?{'content-type':'application/json','idempotency-key':key}:{}),...(version?{'if-match':'"'+version+'"'}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return {status:response.status,data:await response.json(),replayed:response.headers.get('idempotency-replayed')==='true'};
 }
 const assert=(r,status)=>{if(r.status!==status)throw new Error();return r.data;};
 try{
  const marker=randomUUID(),subject='synthetic:demo-editor-'+marker;
  const staff=assert(await request('/staff/access/accounts',adminToken,'POST',{subject,displayName:'Synthetic catalog editor',reason:'Local catalog demo'}),201);
  assert(await request('/staff/access/accounts/'+staff.id+'/grants',adminToken,'POST',{roleCode:'catalog_editor',reason:'Local catalog demo'},staff.version),201);
  const now=Math.floor(Date.now()/1000),token=jwt.sign({iss:LOCAL_ISSUER,sub:subject,aud:audience('staff'),kind:'staff',scope:'staff:access',synthetic:true,amr:['mfa'],iat:now,nbf:now,exp:now+300},keys.privateKey,{algorithm:'RS256',header:{kid:'local-rsa-1',typ:'JWT'}});
  const route='/staff/catalog/products',key=randomUUID(),input={title:'Synthetic demonstration product',slug:'demo-'+marker,description:'Local synthetic physical item.',categoryIds:[fixture.categoryId],brandId:fixture.brandId};
  const product=assert(await request(route,token,'POST',input,undefined,key),201);
  const replay=await request(route,token,'POST',input,undefined,key);assert(replay,201);if(!replay.replayed || replay.data.id!==product.id)throw new Error();
  assert(await request('/store/products/'+product.slug,null),404);
  const prefix=route+'/'+product.id;
  const variant=assert(await request(prefix+'/variants',token,'POST',{sku:'DEMO-'+marker,title:'Synthetic blue',attributeValues:[{attributeId:fixture.attributeId,valueId:fixture.valueId}]},product.version),201);
  const price=assert(await request(prefix+'/variants/'+variant.id+'/prices',token,'POST',{unitPriceMinor:'19900',validFrom:'2020-01-01T00:00:00.000Z',reason:'Synthetic demo price'},variant.productVersion),201);
  const media=assert(await request(prefix+'/media',token,'POST',{mediaAssetId:fixture.mediaAssetId,isPrimary:true,altText:'Synthetic fixture pixel'},price.productVersion),201);
  assert(await request(prefix+'/publication',token,'POST',{reasonCode:'synthetic_demo'},media.productVersion),200);
  const publicData=assert(await request('/store/products/'+product.slug,null),200);
  assert(await request(prefix,adminToken),403);
  const result={event:'local_catalog_demo_passed',productId:product.id,slug:product.slug,staffId:staff.id,unitPriceMinor:publicData.variants[0].unitPriceMinor,replay:true,anonymousPublishedRead:true,wrongRoleDenied:true};
  fs.writeFileSync(path.join(dir,'catalog-demo.json'),JSON.stringify(result,null,2)+'\n',{mode:0o600});console.log(JSON.stringify(result));
 }finally{await api.app.close();}
}
main().catch(()=>{console.error('Local catalog demo failed. Preserve existing data; check the fresh admin token, fixture setup and migration.');process.exitCode=1;});
