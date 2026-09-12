// Read-only bounded synthetic outbox capture. Does not publish or mark deliveries.
const fs=require('node:fs'),path=require('node:path');
const {Pool}=require('pg');
async function main(){
 if(process.argv.length!==2)throw new Error();
 const dir=path.join(__dirname,'../.local'),state=JSON.parse(fs.readFileSync(path.join(dir,'postgres.json')));
 const pool=new Pool({host:'127.0.0.1',port:state.port,database:'commerce_local',user:'commerce_migrator',password:state.passwords.migrator,max:1,connectionTimeoutMillis:1000,statement_timeout:3000});
 try {
  const rows=(await pool.query(`SELECT e.id,e.aggregate_id,e.aggregate_version,e.event_type,e.event_schema_version,e.payload,e.correlation_id,e.occurred_at,e.routing_version,d.destination_key,d.state
    FROM platform.outbox_events e JOIN platform.outbox_deliveries d ON d.event_id=e.id WHERE e.aggregate_type='product' ORDER BY e.occurred_at DESC,e.id LIMIT 100`)).rows;
  fs.writeFileSync(path.join(dir,'catalog-events.json'),JSON.stringify(rows,null,2)+'\n',{mode:0o600});console.log(JSON.stringify({event:'catalog_events_captured',rows:rows.length,published:false}));
 }finally{await pool.end();}
}
main().catch(()=>{console.error('Local event capture failed.');process.exitCode=1;});
