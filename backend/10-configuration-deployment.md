# Configuration and deployment design

## Environment model

| Environment | Purpose | Data/integration rule |
| --- | --- | --- |
| Local | individual backend design and future development | synthetic fixtures; local/emulated dependencies where approved; no production secrets/data |
| Shared development | integration of modules/contracts | isolated nonproduction accounts/resources and synthetic scenarios |
| Test/ephemeral | automated repeatable verification | disposable database/schema, deterministic generated data, provider stubs/contract fixtures |
| Staging | production-like acceptance and migration/load/recovery rehearsal | provider sandbox, production-shaped topology, synthetic or approved masked data only |
| Production | live commerce | live merchant-owned accounts, strict access, retention, monitoring, backup, change control |
| Recovery rehearsal | isolated restore validation | protected temporary restore, restricted access, recorded destruction |

No environment shares database, queue, bucket prefix, OpenSearch index/alias, Valkey namespace, Auth0 application, provider credential, signing key, or telemetry environment identity with production.

## Configuration inventory

Separate deployment configuration from versioned business policy and capability release. [Configurable commerce](14-configurable-commerce.md) specifies their owners, authoritative activation, operational stops and historical obligations. Environment variables or feature flags must not silently change purchased terms or enable unsupported commerce models. Record the active policy/profile revision alongside artifact/schema identity when this extension is implemented.

Configuration is validated at startup by runtime role. It includes:

- service name, runtime role, environment, release/build identity, region/timezone display policy;
- listener/route exposure, trusted proxy/origin/CORS, request/body/time limits;
- PostgreSQL endpoint/database/role, TLS, pool/timeouts, migration compatibility range;
- Auth0 issuer/audience/claims/JWKS cache and staff/customer policy;
- Valkey endpoint/TLS/namespaces/TTLs/timeouts/fallback limits;
- OpenSearch endpoint/index alias/schema version/timeouts/query bounds;
- SQS queue/DLQ URLs, polling, visibility, batch, concurrency, redrive assumptions;
- S3 bucket/prefix, KMS, upload/download expiry, size/type controls, CloudFront distribution policy;
- SSLCOMMERZ environment/endpoints/merchant identity/credentials/return and IPN URL policy;
- email provider/sender/template policy/rate/timeouts;
- telemetry exporters/sample/redaction/resource attributes and alert routing;
- job schedules/batch limits/leases/retention flags;
- feature release controls with safe defaults and owner.

Startup logs configuration keys and validation outcome only, never values for secrets or sensitive endpoints.

## Runtime-role permissions

| Runtime role | Database | AWS/integration access |
| --- | --- | --- |
| API | required module query/write commands; no DDL | receive HTTP; limited S3 grants/cache/search; write outbox through DB |
| Dispatcher | claim/update outbox only | send to declared SQS queues |
| Payment worker | payment/order/inventory transaction paths | receive payment/refund queues; SSLCOMMERZ egress/secret only |
| Notification worker | notification tables and safe render reads | receive notification queue; email secret/egress |
| Search worker | read publishable facts and projection state | receive search queue; OpenSearch write/index-admin only for reindex role |
| File worker | job tables and approved domain command paths | receive import/export; scoped S3 source/output prefixes |
| Scheduler | job lease/candidate reads and owning command paths | enqueue maintenance/payment work as declared |
| Migrator | schema migration history and approved DDL | deployment-only; no steady runtime |
| Reporting | approved read views/queries | no business writes; export goes through authorized job |

Use separate task definitions or IAM roles where credential/network isolation is material, even when they run the same image.

## Container and process contract

- Build an immutable image once per release; promote the same digest through environments.
- Run as non-root with read-only filesystem except declared temporary paths.
- Include only runtime dependencies and trusted certificates; no source secrets or development tools.
- Select startup role through validated non-secret configuration.
- Fail startup when required configuration, schema compatibility, or essential instrumentation is invalid.
- Expose role-specific liveness/readiness and perform graceful shutdown.
- Write logs to stdout/stderr in structured form; durable files go to S3 or database, not container disk.
- Record release, commit, schema compatibility, event/contract versions, and config fingerprint safely.

## Database migration relationship

Follow [database environments and migrations](../database/06-environments-and-migrations.md). A deployment never relies on ORM auto-synchronization. One controlled migrator applies immutable reviewed migrations before or between compatible application waves according to expand, backfill, switch, observe, and later contract.

API/workers declare the minimum and maximum compatible schema revision. A destructive contract step occurs only after old tasks are drained and rollback no longer depends on the old shape. Hot migrations include lock/scan/WAL/replication/pool plans and forward repair.

## Deployment sequence

1. Confirm decisions, accepted contract/schema compatibility, dependency accounts, and release evidence.
2. Build once, generate inventory/SBOM and provenance, scan dependencies/image, sign or attest under platform policy.
3. Deploy/prove in development and staging using the same artifact shape.
4. Apply additive migration through the controlled migrator and verify schema/drift.
5. Deploy disabled or backward-compatible workers/API canary with readiness and telemetry.
6. Run smoke checks for auth, public read, protected ownership, database, queue publish/consume, provider sandbox as appropriate.
7. Shift bounded traffic/work concurrency while monitoring errors, latency, pool, outbox/queue age, payment and invariants.
8. Enable feature/integration in an approved sequence.
9. Observe through the rollback window and reconcile commerce events.
10. Complete backfill/switch steps as separate recorded actions.
11. Promote only after acceptance owner records evidence.
12. Remove old schema/behavior in a later compatible contract release.

## Rollback and abort

Artifact rollback is permitted while the prior release remains schema/event/config compatible. Stop promotion on critical/high security findings, migration drift, readiness failure, error/latency/pool threshold, queue age growth, payment mismatch, invariant failure, or unowned alert.

Do not restore a pre-release database snapshot after new live orders/payments. Preserve committed facts and use forward repair, compensation, replay, or provider reconciliation. Every deployment plan states the safe rollback point and the owner of forward repair.

## Autoscaling and capacity

| Role | Scale metric | Guardrail |
| --- | --- | --- |
| API | request concurrency/latency/CPU | database pool and total connection budget |
| Dispatcher | oldest unpublished age and rate | SQS throttling and DB claim load |
| Payment/refund | oldest high-risk queue/pending age | provider rate, finance serialization, DB locks |
| Notification | queue age/send rate | provider quota/rate and DB request updates |
| Search | queue age/projection lag | OpenSearch bulk pressure and DB read load |
| File | job age/rows | memory/temp storage, S3 throughput, reserved DB pool |

Scale-in respects graceful drain and visibility. Maximum task/concurrency settings prevent autoscaling from exhausting PostgreSQL or a provider.

## Network design requirements

- API and worker tasks run in private subnets where approved; only load balancer/edge exposes required HTTP paths.
- PostgreSQL, Valkey, and OpenSearch are private and security-group scoped.
- S3 uses private origin/access and VPC endpoints where the region/cost design approves them.
- Egress is restricted by runtime role, especially payment/refund workers.
- SSLCOMMERZ IPN and outbound endpoint/IP requirements are validated against current provider guidance and change procedures.
- Management access uses AWS-native controlled channels and named identity; no permanent bastion/shared key assumption.

## CI/CD quality gates

Future automation should verify formatting/type/build, meaningful unit/component/integration tests, OpenAPI lint/compatibility, database migration rebuild/drift/compatibility, dependency/license/secret/image scans, event schema compatibility, infrastructure plan, and deployment smoke/reconciliation. Money/stock changes require concurrency and replay evidence; provider changes require sandbox contract evidence.

Branch approval and environment promotion identify who accepted product behavior, database migration, security risk, and production release. A green pipeline alone is not business acceptance.

## Release artifact inventory

Each backend release records:

- immutable image digest and source revision;
- dependency/SBOM and scan result;
- OpenAPI version/diff and supported clients;
- schema migration set and compatibility range;
- event schema versions and consumer compatibility;
- runtime roles/task definitions and config schema version;
- feature-control values by environment;
- known risks/exceptions and expiry;
- test/load/security/recovery evidence links;
- rollout/abort/rollback/forward-repair plan;
- named release and operational owners.

## Production readiness dependencies

Backend production deployment remains blocked until D05, D08, D09, D11, D13, D14, and D16 are resolved; exact API/payment contracts and finance workflows also depend on D01–D07 and DB-022–DB-024/DB-027. The architecture may be reviewed before those decisions, but affected work cannot be declared release-ready.
