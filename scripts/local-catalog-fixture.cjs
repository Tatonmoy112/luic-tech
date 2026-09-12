const fs=require('node:fs'),path=require('node:path');
const {parseEnv}=require('node:util');
const {Pool}=require('pg');
const {readConfiguration}=require('../packages/platform/dist');
const {LocalIdentityVerifier}=require('../apps/commerce-api/dist/identity/authentication');
const {seedCatalogFixture}=require('../apps/commerce-api/dist/catalog/fixture');
async function main(){
 if(process.argv.length!==2)throw new Error();
 const dir=path.join(__dirname,'../.local'),env=parseEnv(fs.readFileSync(path.join(dir,'api.env'),'utf8')),config=readConfiguration(env,'api');
 if(config.environment!=='local')throw new Error();
 const state=JSON.parse(fs.readFileSync(path.join(dir,'postgres.json')));if(state.port!==config.database.port)throw new Error();
 const pool=new Pool({host:'127.0.0.1',port:state.port,database:'commerce_local',user:'commerce_migrator',password:state.passwords.migrator,max:1,connectionTimeoutMillis:1000,statement_timeout:3000,lock_timeout:1000});
 try {
  const fixture=await seedCatalogFixture(pool,new LocalIdentityVerifier(config,env.IDENTITY_PUBLIC_KEY),fs.readFileSync(path.join(dir,'staff-token.txt'),'utf8'));
  fs.writeFileSync(path.join(dir,'catalog-fixture.json'),JSON.stringify(fixture,null,2)+'\n',{mode:0o600});
  console.log('Synthetic catalog references/media metadata ready; IDs saved to .local/catalog-fixture.json. Existing fixture preserved.');
 }finally{await pool.end();}
}
main().catch(()=>{console.error('Local catalog fixture failed; requires local migrator and a fresh signed token for the active access manager.');process.exitCode=1;});
