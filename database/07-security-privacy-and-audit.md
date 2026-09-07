# Database security, privacy and audit design

## Data classification

| Class | Examples | Handling |
| --- | --- | --- |
| Public | Published product title, description, approved media metadata, public category | May be projected/cached; publication state still enforced |
| Internal | SKU administration, stock counters, operational state, template definitions, search lag | Staff/workload need only; no public cache |
| Confidential | Customer profile, saved/order address, phone/email, return notes, export filters | Encrypted in transit/at rest, narrow query/access, redacted logs and exports |
| Restricted | Guest token hashes, Auth0 subjects, provider evidence, settlement data, audit, private object keys, recipient values | Smallest role surface, no ad hoc exposure, stronger monitoring and retention control |
| Secret | Database credentials, Auth0/payment keys, raw guest tokens, signing keys | Never stored in business tables, logs, audit, fixtures or diagrams |

Raw card or wallet credentials are outside the system boundary because payment uses hosted SSLCOMMERZ. If unexpected sensitive payment data arrives, reject or redact it and raise an incident according to provider/security procedure.

## Authorization boundaries

- PostgreSQL workload roles limit modules and operations; application commands enforce customer ownership and staff permissions.
- A valid Auth0 token does not by itself authorize a database record. The issuer/subject maps to the current application account and grants.
- Customer queries always include the authenticated customer ID or a verified guest-access context in the authoritative predicate.
- Staff access combines current account status, permission, action, target scope and any amount/dual-approval threshold.
- Reporting users see approved views/fields. They do not get unrestricted base-table access merely because a report exists.
- Service operators diagnose through bounded tools and read-only queries. Break-glass writes are time-limited, approved, attributable and followed by reconciliation.
- Production database endpoints remain private. Direct developer access is exceptional and auditable.

PostgreSQL row-level security can provide an additional barrier only after connection pooling, request identity propagation, privileged bypass behavior and operational access are reviewed. It does not replace command authorization and must not be partially applied in a way that creates false confidence.

## Sensitive-field controls

| Data | Storage/control |
| --- | --- |
| Auth0 identity | Issuer and subject; no password, refresh token or unnecessary identity profile |
| Guest access | Store only cryptographic token hash, purpose, expiry and revocation/use metadata |
| Email/phone/address | Store only required commerce/support fields; mask by role and context; exclude from telemetry |
| Provider receipt/evidence | Typed commercial facts plus bounded redacted evidence; reject secrets and card data |
| Notification recipient | Restricted/encrypted representation as approved; never in queue/log labels |
| Import/export objects | Private S3 metadata, short-lived authorized downloads and expiry; database path is not permission |
| Audit/change summary | Stable fields and safe summaries; no full payload copy by default |
| Free-form notes | Length-limited, warned against sensitive input, restricted by workspace |

Field-level application encryption is considered only for identified threat/retention needs and must include key ownership, rotation, query/search impact, backup recovery and incident access. RDS/storage encryption alone does not solve over-broad application access.

## Audit events

Audit these actions with actor, target, correlation, time, reason and safe before/after summary:

- staff access grant, revocation and permission change;
- product publish/archive, price activation and campaign/coupon change;
- stock opening balance, adjustment, reservation override or returned-stock restock;
- order hold, cancellation and exceptional state decision;
- payment exception resolution and manual reconciliation;
- return approval/decline, inspection disposition and refund approval/submission;
- settlement import/match override;
- personal-data view/export when policy requires, every export creation/download authorization;
- import approval/application, queue/DLQ replay and operational repair;
- retention/anonymization/legal-hold action and break-glass access.

Audit records are append-only to runtime roles. A correction appends another event. Audit does not replace the domain state/movement/payment history; both references should share a correlation ID.

## Retention and deletion matrix

Exact periods are blocked on D13. The handling method is designed now:

| Data group | Default handling before policy approval |
| --- | --- |
| Product/category/price/media configuration | Archive and preserve references needed by orders/import evidence |
| Carts/idempotency | Eligible for bounded expiry/purge after operational and dispute needs are approved |
| Orders/order lines/address snapshots | Retain for approved commerce/accounting/legal period; restrict and later anonymize where lawful |
| Stock ledger/allocation | Retain append-only for inventory reconciliation period |
| Payment/refund/settlement evidence | Retain under finance/provider/legal rules; no hard delete by runtime |
| Callback/raw redacted evidence | Keep only the minimum period needed for dispute/reconciliation; typed facts survive longer if required |
| Return/inspection | Retain with order and stock evidence requirements |
| Audit/security logs | Separate security/legal retention and protected access |
| Notification attempts | Shorter operational retention after delivery/dispute needs, with domain outcome preserved |
| Import/export files | Short-lived private object; job provenance/counts retained longer under policy |
| Search/cache | Rebuildable and independently expirable; never used to satisfy authoritative retention |

Anonymization must not break money, stock, settlement or aggregate reporting. Replace or remove direct identifiers under an approved mapping while preserving non-identifying historical facts and referential integrity. Legal hold suspends eligible deletion through an explicit audited control.

## Logging and observability

Database logs and tracing record operation name, safe correlation ID, duration, rows and error class. They exclude SQL bind values where those values can contain PII/secrets and avoid dynamic table/field names derived from users. Slow-query investigation uses controlled access and redacted evidence.

Alert on repeated authorization failures, anomalous bulk reads/exports, direct privileged use, migration outside release control, disabled audit, constraint/invariant failure, unexpected schema drift and access from unapproved network/workload identity.

## Backup privacy

Backups contain the same sensitive classes as the source. Encrypt them, restrict restore permissions, protect deletion, track copies, apply retention/legal hold and prevent restoration into general developer environments. Recovery rehearsals use isolated access and destroy temporary restored copies through recorded policy.

## Security acceptance

- Runtime roles cannot create/alter/drop objects or grant privileges.
- API and workers can access only required schemas/tables/actions.
- Cross-customer and guessed guest-reference cases return no data.
- Revoked staff loses effective application permission within the approved bound.
- Support cannot approve refunds; catalog staff cannot change stock; fulfillment cannot edit payment evidence.
- Exports and provider evidence are inaccessible through public/object-key guessing.
- Secrets/raw guest tokens/raw card data do not appear in tables, fixtures, outbox payloads, logs or audit.
- Break-glass and migration actions are attributable.
- Backup restore preserves privileges, audit protection and retention controls.

