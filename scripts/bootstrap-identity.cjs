// Explicit deployment-only local command. Runtime credentials cannot bootstrap.
const fs = require('node:fs');
const path = require('node:path');
const { parseEnv } = require('node:util');
const { Pool } = require('pg');
const { readConfiguration } = require('../packages/platform/dist');
const { LocalIdentityVerifier } = require('../apps/commerce-api/dist/identity/authentication');
const { bootstrapAdmin } = require('../apps/commerce-api/dist/identity/bootstrap');
async function main() {
  if (process.argv.length !== 2) throw new Error();
  const dir=path.join(__dirname,'../.local');
  const env=parseEnv(fs.readFileSync(path.join(dir,'api.env'),'utf8'));
  const config=readConfiguration(env,'api');
  if(config.environment!=='local') throw new Error();
  const state=JSON.parse(fs.readFileSync(path.join(dir,'postgres.json')));
  if(state.port!==config.database.port) throw new Error();
  const verifier=new LocalIdentityVerifier(config,env.IDENTITY_PUBLIC_KEY);
  const token=fs.readFileSync(path.join(dir,'staff-token.txt'),'utf8');
  const pool=new Pool({host:'127.0.0.1',port:state.port,database:'commerce_local',user:'commerce_migrator',password:state.passwords.migrator,
    max:1,connectionTimeoutMillis:1000,statement_timeout:3000,lock_timeout:1000});
  try {
    const id=await bootstrapAdmin(pool,verifier,token);
    console.log(JSON.stringify({event:'synthetic_admin_bootstrapped',id}));
  } finally { await pool.end(); }
}
main().catch(()=>{console.error('Local bootstrap failed or already closed. No automatic retry; inspect protected audit through the local migrator.');process.exitCode=1;});
