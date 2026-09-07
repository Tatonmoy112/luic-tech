# Development database, environments and migration plan

## Environment model

Each environment uses a separate PostgreSQL database and separate credentials. Development never connects to staging/production by changing only a schema search path.

| Environment | Purpose | Data rule | Availability/recovery expectation |
| --- | --- | --- | --- |
| Developer local | Fast schema/migration and component work | Synthetic fixtures only; disposable | Recreate from migrations and seeds |
| Shared development | Team integration and contract validation | Synthetic shared scenarios | Daily backup optional by team need; rebuild documented |
| Test/CI | Isolated automated verification per run/worker | Deterministic synthetic fixtures | Ephemeral and recreated often |
| Staging | Production-like integration, load, migration and restore rehearsal | Generated volume plus approved redacted samples only | Protected; restore/release rehearsals recorded |
| Production | Live merchant authority | Real operational data | RDS Multi-AZ, approved backup/PITR, controlled access and recovery |
| Recovery rehearsal | Clean restore/failover proof | Restored protected copy with restricted access | Temporary, isolated and destroyed under policy after evidence |

Suggested logical database names are `commerce_local`, `commerce_dev`, `commerce_test`, `commerce_stage` and `commerce_prod`. Actual names and AWS account boundaries belong to platform configuration and must never be inferred from a connection string copied into source control.

## Database access roles

| Role | Capability | Prohibited |
| --- | --- | --- |
| Database owner | Own database/schema objects through controlled platform process | Routine application traffic and shared human use |
| Migrator | Create/alter approved objects during release window | Reading arbitrary production customer data or serving requests |
| API runtime | Required selects/inserts/guarded updates for synchronous domains | DDL, role grants, broad audit/export reads, destructive history edits |
| Worker runtime | Outbox/consumer/payment/notification/import/export operations needed by assigned worker | DDL and unrelated staff/customer access |
| Reporting runtime | Approved read views/read models and bounded export job writes | Transaction correction or unrestricted raw PII |
| Operations read-only | Health/reconciliation queries through controlled tooling | Business-data changes |
| Break-glass operator | Time-bounded incident action with named approval and full audit | Permanent daily use |

Use separate secrets and rotation per environment and workload. Humans use federated/temporary access where available. No shared `postgres`-style credential is an application secret.

## Development database contents

The development database contains the same schemas, tables, constraints and migration history as the target release. Environment differences are configuration values and external endpoints, not weakened integrity.

Synthetic seed packs must be deterministic and independently loadable:

| Pack | Minimum records/scenarios |
| --- | --- |
| Identity/access | Guest, customer A/B, active/revoked staff, each proposed role, forbidden role combinations |
| Catalog | Draft/published/archived products, multi-variant product, missing-publication requirement, approved/quarantined media |
| Pricing | Current/future/expired price, supported/unsupported zone, fixed/percentage/expired/capped coupon |
| Inventory | Zero stock, one final unit, healthy quantity, active/expired reservation, damaged return, compensating adjustment |
| Orders | Pending, held, confirmed, cancelled and completed order with immutable snapshots |
| Payments | Created/pending/succeeded/failed/unknown/late and two-success excess-payment case |
| Fulfillment/returns | Picking/packed/shipped/delivered/failed cases; partial return and damaged inspection |
| Refunds | Requested/approved/processing/completed/failed/unknown and concurrent near-limit case |
| Async | Unpublished outbox, duplicate consumer delivery, failed notification and stale search projection |
| Finance | Matched, unmatched, partially matched payment/refund settlement entries |

Synthetic values must look clearly fictional. Never copy a live email, phone, address, provider payload, transaction identifier, token, settlement file or media object into local/shared development. Performance datasets use generated distributions and stable random seeds.

## Migration artifact rules

B002 now supplies the reviewed local foundation migration in migrations/0000_foundation.sql and a separate Drizzle runner. Future domain slices extend that history. Each artifact must be immutable after shared use and include a unique ordered identifier, concise purpose, requirement/decision references, compatibility expectation and verification evidence.

Do not rely on ORM automatic synchronization in any shared or production environment. The reviewed migration history is the schema authority. Detect drift between declared ORM schema, migration result and live database before promotion.

## Expand, migrate, switch, contract

1. **Expand:** add nullable columns, new tables, compatible indexes or non-enforced validation aids without breaking the current application.
2. **Dual compatibility:** deploy code that can tolerate both old and new shapes; write both only when the migration plan explicitly requires it.
3. **Backfill:** process bounded resumable batches using stable keys, short transactions and observable progress.
4. **Verify:** reconcile counts, nulls, sums, hashes, orphan checks and representative query behavior.
5. **Constrain:** add/validate required constraints with a reviewed lock and scan plan.
6. **Switch reads:** move the application to the new representation behind a measurable release step.
7. **Observe:** keep the compatibility window until errors, lag and reconciliation are acceptable.
8. **Contract:** remove old columns/indexes/paths in a later release after rollback no longer depends on them.

For a small safe additive migration, some stages can be immediate, but the review must still state why.

## Migration classes

| Class | Examples | Required handling |
| --- | --- | --- |
| A — additive metadata | New nullable field or small lookup | Compatibility and basic schema verification |
| B — indexed additive | New index, FK or validated check | Lock/scan estimate, timeout, representative rehearsal |
| C — backfill/shape change | Snapshot split, normalized key, new relation | Batch/resume design, dual compatibility, count/hash reconciliation |
| D — hot transactional | Stock, order, payment/refund columns or constraint | Concurrency suite, release window, forward repair and rollback decision |
| E — destructive | Drop/rename/type narrowing/history rewrite | Separate later contract release, backup evidence and explicit approval |

## First migration sequence

The initial empty-database build should follow dependency order:

1. create logical schemas and restricted database roles;
2. create the seven identity/access tables without order references and protected audit storage; record bootstrap provenance after the staff parent exists;
3. create catalog base, category, attribute, variant, media and price tables;
4. create delivery, coupon and tax-policy reference tables without cross-domain checkout links;
5. create stock location/position base;
6. create platform idempotency/outbox/delivery/consumer/workflow controls, then cart, checkout and order snapshot tables; insert nullable checkout/order back-references in FK-safe order;
7. add guest order access, coupon holds/redemptions, order cancellation requests/history, and inventory reservation/allocation relationships after their order/idempotency parents exist;
8. create payment evidence, attempt and exception tables;
9. create shipment, return and inspection tables;
10. create refund and settlement tables;
11. create remaining platform import/export/notification/projection tables after their business parents; reuse foundation tables already created in steps 2 and 6;
12. add approved cross-schema foreign keys and secondary indexes;
13. load permission codes and synthetic reference fixtures;
14. execute schema, constraint, transaction and query-plan acceptance;
15. record a clean rebuild from zero and a migration from the immediately prior supported release.

Circular references such as an inspection pointing to its resulting stock movement are added after both tables exist. They do not justify disabling foreign-key validation permanently.

This sequence describes parent dependencies, not permission to run incomplete feature schemas in shared environments. A BUILD slice creates only its named tables and all applicable constraints before exposing its endpoints. For example, early catalog fixtures require media metadata tables, but do not require the later S3 adapter; coupon calculation can be developed before checkout, but persisted coupon-hold acceptance requires its checkout/order parents. The final release schema contains all 78 tables. Record any deliberately deferred relationship and validate it before its capability is accepted.

## Production migration controls

Before promotion, record row counts, relation/index size, estimated scan/lock duration, expected WAL, replication impact, timeout, required free space, connection/pool behavior, monitoring owner and abort threshold. Test with production-like scale in staging.

Create indexes using the least disruptive approved method when a table is live. Validate large constraints separately where supported. Never bundle an unbounded backfill with a latency-sensitive deployment transaction. Prevent multiple migrators through one deployment lock/lease and database migration-history guard.

## Rollback and forward repair

Application rollback is allowed only while the old version understands the expanded schema and no incompatible contract step has occurred. Data rollback through snapshot restoration is unsafe after new real orders/payments because it discards live facts. For post-write failures, prefer forward repair with compensating records, replay and reconciliation.

Every hot migration states:

- last compatible application version;
- point after which artifact rollback is unsafe;
- whether writes pause during any step;
- how in-flight checkout/callback/worker activity is drained or tolerated;
- verification and abort thresholds;
- forward-repair owner and procedure.

## Backup and restore evidence

The production baseline proposes encrypted automated backup, point-in-time recovery and protected snapshots, subject to D13 and platform approval. A database design is complete only after a clean restore proves schema history, roles, secrets/config access, application readiness, integrity checks and payment/outbox reconciliation after the recovery point. Multi-AZ failover is not a substitute for backup or logical error recovery.

## B002 local implementation boundary

[U01/B002 evidence](../context/aidlc/bolts/B002-foundation.md) covers synthetic local/test PostgreSQL 18.4, separate restricted runtime roles, eight ownership schemas, serialized hash-checked migration history and real transaction tests. Runtime applications never migrate. No domain tables, production roles/default grants, managed failover or restore acceptance is implied. The local fixture bootstrap creates environment logins/databases; the immutable migration owns schema and history grants. Review future generated SQL against these existing schemas before applying it.


## U02/B003 migration evidence

AUTH-006 adds reviewed immutable 0001_identity after 0000_foundation: seven IAM tables and protected early staff audit, restricted API DML, immutable runtime audit and no worker IAM grants. Existing local/test databases upgraded and fresh Linux/PostgreSQL rebuilt both revisions; [B003](../context/aidlc/bolts/B003-identity.md) records hashes, concurrency/failure/denial evidence and pending human acceptance. No guest/order/domain-commerce migration was applied. Runtime readiness now requires both hashes. Preserve data on rollback; B002-only readiness cannot accept the new history. Future generic audit work must use a forward migration to extend/reconcile this table.
