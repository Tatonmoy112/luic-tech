# Database development sequence

**Status:** Domain work remains planned. B002 supplies bounded local foundation evidence for DBT-023 and DBT-025 through DBT-028; no full task or human acceptance is inferred.  
**Task rule:** A task starts only when its dependencies and named business decisions are ready. A task completes only with reviewable evidence, not because a file was edited.

## Phase A — policy and database decisions

| ID | Small outcome | Depends on | Minimum evidence |
| --- | --- | --- | --- |
| DBT-001 | Name database designer, technical approver, finance reviewer, operations reviewer and security reviewer | GOV-001 | Recorded owners |
| DBT-002 | Approve Release 1 merchant/currency/language boundary | D01 | Decision evidence |
| DBT-003 | Approve SKU/order/traffic and data-retention volume assumptions | D02 | Sizing sheet |
| DBT-004 | Approve one-location, integer-unit and no-backorder rules | D03, DB-004 | Operations examples |
| DBT-005 | Approve customer/guest identity fields and staff MFA/revocation behavior | D04 | Identity decision |
| DBT-006 | Obtain SSLCOMMERZ field/status/refund/settlement samples | D05 | Redacted provider mapping source |
| DBT-007 | Approve delivery zone/rate and one-shipment rules | D06, A05 | Operations decision |
| DBT-008 | Approve tax, rounding, invoice, cancellation, return, refund and coupon restoration rules | D07 | Finance calculation/policy examples |
| DBT-009 | Approve catalog/opening-stock import source and exclusions | D10 | Sample and owner sign-off |
| DBT-010 | Approve personal, finance, audit, callback and file retention | D13 | Retention matrix |
| DBT-011 | Approve exact RDS PostgreSQL 18 patch, UUID strategy and allowed extensions | D08, D09, DB-002/021 | Compatibility record |
| DBT-012 | Approve database boundary, schemas and aggregate ownership | A01–A04, DB-001 | Architecture review record |

## Phase B — logical model review

| ID | Small outcome | Depends on | Minimum evidence |
| --- | --- | --- | --- |
| DBT-013 | Review all 78 table purposes against P0/P1 scope | DBT-012 | Scope-to-table review |
| DBT-014 | Review aggregate roots and cross-schema write permissions | DBT-012 | Ownership matrix |
| DBT-015 | Review identifiers and human-reference formats | DBT-011, DB-025 | Collision/enumeration analysis |
| DBT-016 | Review standard timestamp, version, code and normalization columns | DBT-011 | Column convention approval |
| DBT-017 | Review money columns and order/refund/settlement equations | DBT-008 | Finance examples reconcile |
| DBT-018 | Review stock position, movement, reservation and allocation relationships | DBT-004 | Final-unit/expiry examples |
| DBT-019 | Review payment receipt, validation, attempt and exception relationships | DBT-006 | Late/duplicate/excess examples |
| DBT-020 | Review return, inspection, restock and refund separation | DBT-008 | Damaged/partial-return examples |
| DBT-021 | Review idempotency, outbox and consumer deduplication relationships | DBT-012 | Duplicate/replay examples |

## Phase C — empty database foundation

| ID | Small outcome | Depends on | Minimum evidence |
| --- | --- | --- | --- |
| DBT-022 | Define development/test/staging/production database isolation | DBT-012 | Environment matrix |
| DBT-023 | Define owner, migrator, API, worker, reporting and operator roles | DBT-010, DBT-022 | Privilege matrix |
| DBT-024 | Define schema naming, object naming and constraint/index naming standard | DBT-016 | Reviewed naming guide |
| DBT-025 | Establish immutable ordered migration history | DBT-011, DBT-024 | Clean migration ledger |
| DBT-026 | Create logical schemas through reviewed migration | DBT-023–025 | Schema inspection |
| DBT-027 | Apply grants/default privileges through reviewed migration | DBT-023, DBT-026 | Allow/deny verification |
| DBT-028 | Prove an empty database rebuild from the migration history | DBT-025–027 | Rebuild log and schema fingerprint |

## Phase D — identity, catalog and pricing structures

| ID | Small outcome | Depends on | Minimum evidence |
| --- | --- | --- | --- |
| DBT-029 | Implement customer and saved-address structure/constraints | DBT-005, DBT-028 | Identity/address constraint cases |
| DBT-030 | Implement guest order-access hash/expiry structure | DBT-005, DBT-010 | Secret absence and expiry cases |
| DBT-031 | Implement staff, role, permission and assignment structures | DBT-005, DBT-023 | Role/grant/revocation cases |
| DBT-032 | Load stable permission reference data | DBT-031 | Permission inventory reconciliation |
| DBT-033 | Implement brand/category hierarchy structures | DBT-028 | Slug, parent and cycle cases |
| DBT-034 | Implement product lifecycle and category membership | DBT-033 | Draft/publish/archive relationship cases |
| DBT-035 | Implement attribute/value structures | DBT-028 | Unique code/value cases |
| DBT-036 | Implement variant and attribute-selection structures | DBT-034/035 | Unique SKU and attribute-integrity cases |
| DBT-037 | Implement effective-dated price structure | DBT-008, DBT-036 | Current/future/overlap cases |
| DBT-038 | Implement media metadata and product ordering structures | DBT-034/036 | Approval/public/private relation cases |
| DBT-039 | Implement content entry/revision structures | DBT-028 | Revision/publication cases |
| DBT-040 | Implement delivery zone and effective rule structures | DBT-007 | Boundary/overlap cases |
| DBT-041 | Implement coupon campaign, target, hold and redemption structures | DBT-008, DBT-034/036 | Eligibility/cap/one-coupon cases |
| DBT-042 | Implement tax-policy version reference after finance approval | DBT-008 | Policy-version and validity cases |

## Phase E — inventory, cart, checkout and order structures

| ID | Small outcome | Depends on | Minimum evidence |
| --- | --- | --- | --- |
| DBT-043 | Implement stock location structure and Release 1 location record | DBT-004, DBT-028 | Location uniqueness/status case |
| DBT-044 | Implement stock position counters and checks | DBT-036, DBT-043 | Nonnegative/unique position cases |
| DBT-045 | Implement append-only stock movement structure | DBT-044, DBT-031 | Duplicate operation and immutability cases |
| DBT-046 | Implement reservation header/line structures | DBT-044 | One-order/positive-quantity cases |
| DBT-047 | Implement allocation header/line structures | DBT-046 | One-allocation and line-link cases |
| DBT-048 | Implement cart owner and line structures | DBT-029/036 | Guest/customer/merge constraints |
| DBT-049 | Implement generic command idempotency structure | DBT-028 | Same-key/same-hash and conflict cases |
| DBT-050 | Implement checkout-attempt structure | DBT-048/049 | Stable outcome and actor-context cases |
| DBT-051 | Implement order header and amount checks | DBT-017, DBT-042/050 | Balanced/unbalanced order cases |
| DBT-052 | Implement immutable order-line snapshots | DBT-036/051 | Snapshot and component equation cases |
| DBT-053 | Implement immutable order address snapshots | DBT-029/040/051 | Saved-address edit isolation case |
| DBT-054 | Implement order discount snapshot | DBT-041/051 | One-coupon and allocation cases |
| DBT-055 | Implement order state history and hold structures | DBT-051, DBT-031 | Transition/active-hold cases |
| DBT-056 | Add reservation/allocation foreign keys to order/order lines | DBT-046/047/052 | No orphan/mismatch report |
| DBT-057 | Implement final-unit checkout transaction | DBT-041, DBT-044–056 | Two-concurrent-buyers evidence |
| DBT-058 | Implement reservation release/expiry transaction | DBT-057 | Payment/expiry race evidence |
| DBT-059 | Implement manual/opening inventory adjustment transaction | DBT-045 | Duplicate/threshold/audit evidence |

## Phase F — payment, fulfillment, return and refund structures

| ID | Small outcome | Depends on | Minimum evidence |
| --- | --- | --- | --- |
| DBT-060 | Implement payment attempt structure and scoped identifiers | DBT-006/051 | Provider uniqueness and state checks |
| DBT-061 | Implement callback receipt deduplication structure | DBT-006/060 | Duplicate receipt and size/redaction cases |
| DBT-062 | Implement validation evidence structure | DBT-061 | Valid/forged/mismatched evidence cases |
| DBT-063 | Implement payment state history | DBT-060/062 | Guarded terminal transition cases |
| DBT-064 | Implement payment exception queue structure | DBT-060 | Unknown/late/excess queue cases |
| DBT-065 | Implement verified-payment allocation transaction | DBT-047/058/060–064 | Normal/late/duplicate/double-success evidence |
| DBT-066 | Implement shipment, item and history structures | DBT-007, DBT-047/055 | One shipment and allocation-link cases |
| DBT-067 | Implement guarded pick/pack/dispatch/delivery transitions | DBT-065/066 | Unpaid/held denial and no-double-stock case |
| DBT-068 | Implement return header/item/history structures | DBT-008/052/066 | Eligible quantity and state cases |
| DBT-069 | Implement return inspection/disposition structure | DBT-045/068 | Sellable/damaged/quarantine cases |
| DBT-070 | Implement atomic inspected-return restock transaction | DBT-044/045/069 | Duplicate/concurrent restock evidence |
| DBT-071 | Implement refund header and line-allocation structures | DBT-008/060/068 | Amount/quantity reconciliation cases |
| DBT-072 | Implement refund submission and state-history structures | DBT-006/071 | Unknown/final evidence cases |
| DBT-073 | Implement atomic refund-balance reservation transaction | DBT-071/072 | Concurrent over-refund evidence |
| DBT-074 | Implement verified refund completion/failure transaction | DBT-073 | Duplicate/unknown/retry evidence |
| DBT-075 | Implement settlement import and entry structures | DBT-006/060/072 | Fingerprint/count/amount cases |
| DBT-076 | Implement settlement match structure and balance checks | DBT-075 | Matched/unmatched/partial cases |

## Phase G — platform reliability and operational structures

| ID | Small outcome | Depends on | Minimum evidence |
| --- | --- | --- | --- |
| DBT-077 | Implement transactional outbox structure | DBT-028 | Aggregate/event uniqueness cases |
| DBT-078 | Add outbox writes to each authoritative transaction | DBT-057–076/077 | Domain commit/outbox atomicity cases |
| DBT-079 | Implement consumer receipt structure | DBT-077 | Duplicate consumer cases |
| DBT-080 | Prove local consumer effect and receipt commit atomically | DBT-079 | Crash/replay evidence |
| DBT-081 | Implement append-only audit structure and restricted grants | DBT-023/031 | Write/read/immutability evidence |
| DBT-082 | Add audit writes to sensitive staff/finance/stock actions | DBT-059/067/070/073/076/081 | Correlated action evidence |
| DBT-083 | Implement import job/row structures | DBT-009/028 | Duplicate source/row error cases |
| DBT-084 | Implement export job structure and private-object metadata | DBT-010/023 | Authorization/expiry cases |
| DBT-085 | Implement notification template/request/attempt structures | D11, DBT-077 | Dedupe/retry/no-business-authority cases |
| DBT-086 | Implement search projection state structure | DBT-034/036/077 | Stale-version/delete/rebuild cases |
| DBT-087 | Implement invariant and reconciliation read models | DBT-057–086 | Known-bad fixture detection |
| DBT-088 | Implement approved operational/reporting views | DBT-017/076/087 | Definition/freshness/access evidence |

## Phase H — indexes, development data and migration proof

| ID | Small outcome | Depends on | Minimum evidence |
| --- | --- | --- | --- |
| DBT-089 | Add and verify all primary/unique/foreign-key constraints | DBT-029–086 | Catalog of live constraints |
| DBT-090 | Add initial identity/catalog lookup indexes | DBT-029–042/089 | Representative query plans |
| DBT-091 | Add cart/order/customer/action-queue indexes | DBT-048–055/089 | Representative query plans |
| DBT-092 | Add inventory/reservation/outbox worker indexes | DBT-043–047/077/089 | Claim/expiry query plans |
| DBT-093 | Add payment/refund/return/settlement indexes | DBT-060–076/089 | Reconciliation query plans |
| DBT-094 | Add audit/import/export/notification indexes | DBT-081–085/089 | Bounded admin/worker query plans |
| DBT-095 | Build deterministic identity/access seed pack | DBT-029–032 | Repeatable fixture report |
| DBT-096 | Build deterministic catalog/pricing/inventory seed pack | DBT-033–047 | Repeatable fixture report |
| DBT-097 | Build deterministic order/payment/return/refund seed pack | DBT-048–076 | Scenario reconciliation report |
| DBT-098 | Build generated 10,000-SKU/representative-order performance dataset | DBT-003, DBT-096/097 | Volume/distribution manifest |
| DBT-099 | Verify complete database rebuild plus seed load | DBT-089–098 | Clean-run evidence |
| DBT-100 | Rehearse one additive and one backfill migration | DBT-099 | Expand/backfill/switch evidence |
| DBT-101 | Verify ORM declaration, migration result and database have no drift | DBT-099/100 | Drift report |

## Phase I — correctness, performance, security and recovery acceptance

| ID | Small outcome | Depends on | Minimum evidence |
| --- | --- | --- | --- |
| DBT-102 | Run order amount and price-snapshot reconciliation suite | DBT-057/097 | Zero unexplained differences |
| DBT-103 | Run stock ledger/position/reservation/allocation reconciliation suite | DBT-058/070/097 | Zero unexplained differences |
| DBT-104 | Run duplicate checkout/callback/event/refund replay suite | DBT-065/074/080 | No duplicate effect |
| DBT-105 | Run checkout, expiry, payment and refund concurrency suite | DBT-058/065/073 | No oversell/deadlock leak/over-refund |
| DBT-106 | Run return/refund/settlement reconciliation suite | DBT-070/074/076 | Traceable totals and quantities |
| DBT-107 | Verify customer ownership, staff grants and restricted columns/views | DBT-031/084/088 | Allow/deny matrix |
| DBT-108 | Verify secret, PII and provider evidence redaction | DBT-061/081/085 | Storage/log sample review |
| DBT-109 | Run mixed-load database test and capture critical query plans | DBT-090–098 | Latency/lock/resource report |
| DBT-110 | Test pool exhaustion, lock timeout, deadlock retry and long transaction controls | DBT-109 | Failure/recovery evidence |
| DBT-111 | Rehearse catalog/opening-stock import and reconcile counts/amounts | DBT-083/100 | Import sign-off report |
| DBT-112 | Restore backup into clean isolated environment | FND recovery readiness, DBT-099 | Timed restore record |
| DBT-113 | Run post-restore schema, integrity, outbox and payment reconciliation | DBT-112 | Recovery reconciliation report |
| DBT-114 | Review measured growth and confirm no launch partitioning | DBT-003/109/113 | DBA decision record |
| DBT-115 | Approve database production-readiness package | DBT-102–114 | Technical/finance/operations/security approval |

## Execution controls

Execute applicable DBT work inside the selected [AI-DLC Unit/Bolt](../context/aidlc/execution-map.md), linked to its BUILD/ADAPT outcome. A local synthetic foundation requires only its actual prerequisites; full merchant/account gates apply to their dependent real capabilities. Record the exact migration/diff, schema/profile/environment, invariant/race/rollback evidence and human review before acceptance. Keep proposed design separate from executed schema state.

Only one migration task changes shared schema at a time. Documentation, fixture design and independent query review can proceed in parallel when they do not depend on an undecided rule. Any failed correctness task reopens the owning structure, transaction, index and acceptance tasks; it is not closed by weakening the assertion.

The database critical path is DBT-001–012 -> DBT-013–021 -> DBT-022–028 -> DBT-029–059 -> DBT-060–076 -> DBT-077–088 -> DBT-089–101 -> DBT-102–115.

## B002 foundation evidence

[BUILD-005 / B002](../context/aidlc/bolts/B002-foundation.md) implements restricted local logins, immutable migration history, ownership schemas and rebuild/replay verification. This is partial local evidence for the related DBT design/implementation inputs, not separate duplicate delivery credit. Full environment/production privileges and later domain structures remain pending.
