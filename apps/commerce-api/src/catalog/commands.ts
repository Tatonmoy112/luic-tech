import { Commands, CommandResult, Database, TransactionContext, requestContext } from '@luic/platform';
import { randomUUID } from 'node:crypto';
import { VerifiedIdentity } from '../identity/authentication';
import { authorizeStaff } from '../identity/service';
import { uuid } from './validation';
export type { CommandResult } from '@luic/platform';
export class CatalogCommands {
  private readonly commands: Commands;
  constructor(database: Database) { this.commands = new Commands(database); }
  run(identity: VerifiedIdentity, permission: string, operation: string, key: unknown, input: unknown,
    execute: (tx: TransactionContext, actor: string) => Promise<CommandResult>): Promise<CommandResult> {
    return this.commands.run({ surface: 'staff', actorScope: 'staff', lockIdentity: identity.issuer + ':' + identity.subject,
      operation, key: uuid(key), input, authorize: tx => authorizeStaff(tx, identity, permission), execute });
  }
}
export async function catalogEvidence(tx:TransactionContext,actor:string,product:{id:string;version:string;status:string},action:string,reason:string,extra:Record<string,unknown>={}):Promise<void> {
  const correlation=requestContext.getStore()?.correlationId;
  const correlationId=correlation && /^[0-9a-f-]{36}$/i.test(correlation)?correlation:randomUUID();
  await tx.query(`INSERT INTO platform.audit_events(actor_staff_id,action,target_schema,target_table,target_id,reason,summary,correlation_id)
    VALUES($1,$2,'catalog','products',$3,$4,$5,$6)`,[actor,action,product.id,reason,JSON.stringify({version:product.version,status:product.status,...extra}),correlationId]);
  const event=randomUUID();
  await tx.query(`INSERT INTO platform.outbox_events(id,aggregate_type,aggregate_id,aggregate_version,event_type,event_schema_version,payload,correlation_id,producer,routing_version)
    VALUES($1,'product',$2,$3,$4,1,$5,$6,'catalog',1)`,[event,product.id,product.version,action,JSON.stringify({productId:product.id,version:product.version,status:product.status}),correlationId]);
  await tx.query(`INSERT INTO platform.outbox_deliveries(event_id,destination_key) VALUES($1,'search-projection')`,[event]);
}
