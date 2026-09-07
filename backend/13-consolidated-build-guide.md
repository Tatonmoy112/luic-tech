# Backend architecture and step-by-step build guide

**Status:** Documentation baseline; B001/B002 local foundation implemented, human acceptance pending; commerce implementation pending.  
**Scope:** Release 1 API, workers, database and operations; frontend development excluded.  
**Reviewed:** 6 September 2026.

The [design recheck](readiness/07-design-recheck.md) records subsequent corrections for callback/session ordering, paid-hold resolution, return/refund limits, migration dependencies, strict publication caching and acceptance against the final release candidate. Read its findings before assigning the affected BUILD slices.

## 1. Analysis and architectural conclusion

The subsequent [configurable-commerce design](14-configurable-commerce.md) adds profiles, typed policy releases, historical contract handling and capability gates. Use the [16 ADAPT tasks](readiness/08-adaptive-development-plan.md) alongside the affected BUILD tasks if implementing that extension. The 78-table ownership map and current diagrams below remain the baseline; alternative commerce models and proposed policy entities are separately specified and unimplemented.

The workspace contains discovery/delivery plans in `dev`, product and task context in `context`, a logical database pack in `database`, and backend architecture/readiness documents in `backend`. The [B001 implementation](../context/aidlc/bolts/B001-foundation.md) now adds API/worker source, shared configuration, one lockfile and local tests. B002 adds bounded HTTP contracts and local ownership-schema migrations; executable commerce contracts and deployed environments remain absent. Design coverage beyond this bounded foundation is not implementation evidence.

The appropriate documented baseline is one NestJS modular monolith, one PostgreSQL database with eight ownership schemas and 78 proposed tables, and separately started API/dispatcher/payment/notification/search/file/scheduler roles. Fifteen business modules share a small platform foundation. A commerce application coordinator sits above owning-module ports so local commercial transactions remain atomic without circular imports.

The analysis found and reconciled these design gaps: the original 74-table diagram omitted cancellation requests and durable fan-out/jobs; payment/order dependencies were cyclic when read as imports; search incorrectly compared independent aggregate versions; some payment flows checked excess/terminal conditions too late; request-validation and lock-order descriptions differed; and the original BE sequence mixed design work with implementation expectations. The dictionary, diagrams, flows and separate BUILD sequence now describe the corrected baseline.

Merchant scope, tax, delivery, returns, provider mappings and production accounts remain proposed or unverified. Local synthetic development can start capability by capability after a future coding instruction and compatibility checks. No business approval is inferred from this guide.

## 2. Use these documents in this order

Before this technical reading sequence, use [AI-DLC state](../context/aidlc/state.md) to select the active intent/Unit/Bolt and confirm action scope. [The workflow](../context/aidlc/workflow.md) controls planning, human decisions, verification and handoff. Technical authority remains in the documents below; AI-DLC is not a replacement architecture or a claim that development gates passed.

| Step | Read | Result before moving on |
| --- | --- | --- |
| 1 | [Current context](../context/00-current-context.md) and [readiness gates](readiness/README.md) | Understand Release 1 scope and local versus real-integration limits |
| 2 | This guide and [runtime architecture](02-runtime-architecture.md) | Identify role, module, owner and transaction for the intended slice |
| 3 | [Database dictionary](../database/03-data-dictionary.md) and [T01–T10](../database/04-integrity-and-transactions.md) | Identify tables, keys, state guards and lock sequence |
| 4 | [REST design](04-api-contracts.md), [initial field contracts](readiness/06-initial-api-contracts.md), [request flow](05-request-dataflow.md) | Define input, actor, permission, output, error and replay behavior |
| 5 | [Commerce flows F01–F15](06-commerce-dataflows.md) and [worker contracts](07-events-queues-jobs.md) | Define commit point, remote work, retries and recovery |
| 6 | [44 implementation tasks](readiness/05-implementation-sequence.md) | Select an unblocked task with measurable acceptance evidence |
| 7 | [Security](08-security-and-access.md), [operations](09-resilience-observability-operations.md), [deployment](10-configuration-deployment.md), [acceptance](12-validation-checklist.md) | Include negative access, race/outage and operational evidence in that slice |

The 199 BE tasks are design/refinement references; the 44 BUILD tasks describe future implementation outcomes. The 115 DBT tasks supply database detail. Do not count these catalogs as three independent implementations or mark tasks complete because a document exists.

## 3. Runtime and transaction boundaries

The API admits bounded requests, validates trusted identity, applies current application permission and ownership, and invokes use cases. PostgreSQL owns carts, stock, accepted prices, orders, financial evidence and workflow progress. Valkey accelerates permitted reads/rate controls; OpenSearch supplies discovery; neither can authorize a commercial write.

The coordinator opens one explicit transaction context and passes it to the leaf ports participating in T02/T04 or another reviewed cross-module command. Repositories do not silently open independent transactions. Domain rules have no vendor dependency. Workers use the same use cases and rules as API commands.

Every external call occurs outside commerce transactions. SQS delivers committed work; S3 stores private source/export objects and approved media; Auth0 supplies identity evidence; SSLCOMMERZ supplies independently verified payment/refund evidence. A timeout after a possible external effect becomes an explicit unknown outcome with recovery ownership.

Run one immutable release artifact in separately configured roles. Give each role bounded pools/concurrency, role-specific secrets/IAM and observable shutdown. A scheduled trigger only discovers/enqueues durable work; `workflow_jobs` owns claim, checkpoint and result. The migrator is a separately authorized deployment role, never application startup auto-sync.

## 4. Complete table-to-module ownership

Names below are fully qualified by their schema prefix. Each table has exactly one write owner. A coordinator, importer or report cannot bypass that owner. The counts total 78.

| Module | Owned tables | Count |
| --- | --- | --- |
| Identity/access | iam: customers, customer_addresses, guest_order_access, staff_accounts, roles, permissions, staff_role_assignments, role_permissions | 8 |
| Catalog/content | catalog: brands, categories, products, product_categories, attributes, attribute_values, product_variants, variant_attribute_values, content_entries, content_revisions | 10 |
| Media | catalog: media_assets, product_media | 2 |
| Pricing | catalog: price_records; pricing: delivery_zones, delivery_zone_rules, tax_policy_versions | 4 |
| Promotion | pricing: coupon_campaigns, coupon_targets, coupon_holds, coupon_redemptions | 4 |
| Inventory | inventory: stock_locations, stock_positions, stock_movements, reservations, reservation_lines, allocations, allocation_lines | 7 |
| Cart | sales: carts, cart_lines | 2 |
| Checkout/order | sales: checkout_attempts, orders, order_lines, order_addresses, order_discounts, order_state_history, order_holds, cancellation_requests, cancellation_request_history | 9 |
| Payment | finance: payment_attempts, payment_callback_receipts, payment_validations, payment_state_history, payment_exceptions | 5 |
| Refund/settlement | finance: refunds, refund_lines, refund_submissions, refund_state_history, settlement_imports, settlement_entries, settlement_matches | 7 |
| Fulfillment/return | fulfillment: shipments, shipment_items, shipment_state_history, returns, return_items, return_inspections, return_state_history | 7 |
| Search | platform: search_projection_state | 1 |
| Notification | platform: notification_templates, notification_requests, notification_attempts | 3 |
| File jobs/reporting | platform: import_jobs, import_rows, export_jobs | 3 |
| Platform operations | platform: idempotency_records, outbox_events, outbox_deliveries, consumer_receipts, audit_events, workflow_jobs | 6 |

Cross-module reads use a named read port or reviewed read model. The diagram groups related modules to stay readable; a box group is not a separate deployable service. Identity/authorization tables must exist before staff-attributed configuration. Create the initial verified staff record before its self-referencing initial grants, with protected bootstrap audit provenance and no public bootstrap endpoint.

## 5. Critical data flows and acceptance

| Capability | Ordered path and local commit | Remote work and recovery | Required evidence |
| --- | --- | --- | --- |
| Publication F01/F02 | authorize; validate product/price/approved media; guard version; commit lifecycle/audit/event/destinations | inspect private media; project search; invalidate cache after commit | draft/archive hidden; rejected media private; event replay safe |
| Cart/quote F03/F04 | T01 owns cart; quote recomputes exact prices, tax, delivery and discount; preview creates no stock hold | optional read acceleration | ownership; deterministic merge; exact integer allocation; quote-change response |
| Checkout F05 | T02 locks idempotency/cart/eligibility, then campaign/positions; commit snapshots, reservation, coupon hold, payment intent, history/audit/outbox | one claimed hosted-session initiation; authorized status polling | final-unit race; atomic rollback; same key stable response; changed payload conflict |
| Payment F06/F07 | durable callback receipt; verified evidence; T04 records success, resolves uncertainty-only hold, checks excess/terminal/other holds before allocating once | validation/status query outside transaction; unknown to reconciliation | forged/duplicate/mismatched/late/excess success; no paid order lost or allocated twice |
| Cancellation F09 | durable request/history; lock order and related roots; reject dispatch conflict; hold paid/unknown; guarded final resolution | refund or finance review as needed | approval distinct from cancellation; dispatch race; stock/coupon release once |
| Shipment F08 | T06 rechecks funded, allocated, unheld eligibility; one shipment; guarded history transition | manual courier facts; asynchronous notification | no second stock deduction; invalid/stale transitions denied |
| Return F10 | T07 locks order, applicable positions, return and lines; enforce cumulative quantity; inspect disposition; restock sellable once | independent refund eligibility workflow | no over-return; damaged stock excluded; repeated inspection safe |
| Refund F11 | T08 reserves refundable balance; commit approval; T09 applies verified final result once | durable claimed submission; unknown retains reserved balance and requires query/manual resolution | simultaneous approvals bounded by verified success; duplicate result no-op |
| Settlement F12 | immutable source/typed rows; scoped match; audited override | private provider file obtained with account evidence | duplicate file; missing/partial match; payments/refunds/fees/net reconcile |
| Imports/exports F13/F14 | durable job; validate before approval/application; bounded owner commands/checkpoints | private object upload/download; restricted expiring grant | resumable partial import; stock movement reconciliation; scoped report totals |
| Async repair F15/T10 | event plus destination rows; local consumer receipt plus effect/intent; durable replay job | fenced publish/send; stable event ID; bounded reviewed replay | partial fan-out, crash before marking/deletion, stale lease and poison message |

Global lock order is idempotency, order, payment/refund, reservation/coupon hold, campaign, sorted stock positions, allocation/shipment/return roots, then order/return lines. T02 has the explicit cart and shared product/variant eligibility prelude because its order does not yet exist. Follow the detailed transaction document for parent-before-child inserts and exact guards.

Order, payment, shipment, return, refund and cancellation-request state are separate response dimensions. A success notification, browser return, expired lease or queue acknowledgement never substitutes for a guarded business transition.

## 6. Initial routing and durable-work contracts

This is the proposed first-slice routing version 1. Persist the chosen destination set with each outbox event. Version changes require a reviewed compatibility/replay plan. Common envelope fields are defined in the queue document. Payload additions below are identifiers only; workers reload sensitive facts through authorized ports.

| Fact / producer | Required payload references | Destination and durable consumer effect |
| --- | --- | --- |
| product.published / product.changed / product.archived; Catalog | productId | search-projection; receipt plus desired-generation increment for registered concrete indexes |
| price.activated; Pricing | variantId, productId | search-projection; same generation request contract |
| stock.position.changed; Inventory | stockPositionId, variantId, productId | search-projection; indicative availability rebuild |
| product.media.changed; Media | productId, mediaAssetId | search-projection; approved-public facts only |
| order.placed; coordinator through Order | orderId, paymentAttemptId | payment-validation to wake the existing initiation intent; notifications to create a deduplicated request if the template policy requires it |
| payment.callback.received; Payment intake | callbackReceiptId | payment-validation; receipt plus durable validation job; provider call handled by claimed job |
| payment.succeeded / payment.exception.opened; Payment within T04 | paymentAttemptId, orderId, optional exceptionId | notifications where policy permits; maintenance for exception/reconciliation work; never allocate again from this fact |
| order.confirmed / order.cancelled; Order | orderId | notifications; fulfillment queries read authoritative eligibility rather than blindly creating a shipment |
| refund.approved; Refund | refundId, paymentAttemptId | refund-processing; receipt plus durable submission intent; T08 already reserved balance |
| shipment.state.changed / return.state.changed; Fulfillment | orderId, shipmentId or returnId, previousState, nextState | notifications; terminal/current eligibility checked before creating a message |
| import.requested / import.approved; File jobs | importJobId | imports; claim validated job and resume from recorded progress |
| export.requested; Reporting | exportJobId | exports; claim scoped job and produce private artifact |

Do not put transport URLs, credentials, recipients, addresses or complete order snapshots in these messages. Every emitted fact needs an explicit route; an informational fact with no asynchronous consumer belongs in history/audit rather than an orphan outbox row. Scheduled work uses `workflow_jobs` with a stable job-type/dedupe key and target reference. The same queue can contain versioned intent types, but the handler must distinguish initiation, validation and reconciliation explicitly.

## 7. Search consistency and reindex sequence

1. Register the active concrete index and projection schema in controlled role configuration. For reindex, register the replacement for fan-out before beginning its backfill, roll this configuration to all projection request consumers, and persist the run/checkpoint in a workflow job.
2. Consumer receipt and desired-generation increments for affected product/index rows commit together. A duplicate event produces no second increment; independent source version numbers are never compared.
3. Claim a product/index row. Read its desired generation and all projection facts in one short read-only consistent snapshot, then close the transaction before OpenSearch work. A generation begins at 1 when first requested.
4. Index the document with strict external versioning. A conflict is successful stale/duplicate work only after confirming that the stored generation is equal or newer in the same concrete index. Do not blindly treat every conflict as success.
5. Advance applied generation only for the successfully applied or verified newer generation, bounded by current desired generation and fenced by the lease. If desired increased during work, leave it eligible for another pass.
6. Represent deletion/unpublication as a persistent minimal tombstone document with a generation; filter tombstones from public search. Batch-check current database publication eligibility before presenting candidate hits. This is necessary even during normal projection lag.
7. Backfill all product identities, including archived identities needing tombstones, into the replacement index. Track backlog until desired equals applied, verify mappings/counts/publication/representative queries, and perform the alias switch only after the recorded catch-up gate. Keep old-index updates during the rollback window; retire it through an audited completed job.

This design uses PostgreSQL snapshot semantics and OpenSearch strict external versioning; exact client/version behavior must be proven by BUILD-001/029. See [PostgreSQL transaction isolation](https://www.postgresql.org/docs/18/sql-set-transaction.html) and [OpenSearch Index Document API](https://docs.opensearch.org/latest/api-reference/document-apis/index-document/). The generation, tombstone and rollout protocol is this project's proposed design, not a claim that those products automatically implement it.

## 8. Build in these reviewable stages

| Stage | BUILD tasks | Deliverable and exit evidence |
| --- | --- | --- |
| A. Compatibility/foundation | 001–006 | pinned compatible tools; independent API/worker startup; explicit transactions; safe errors/configuration/telemetry; graceful stop |
| B. Identity/catalog slice | 007–013 | signed-token validation and staff bootstrap; guarded draft/price/publication; table constraints; audit/idempotency/event destinations; public read through an API client |
| C. Commerce core | 014–022 | stock ledger, cart, exact quote, T02, expiry, session and callback/T04; order reads; concurrency and recovery scenarios |
| D. Operations and finance | 023–026 | cancellation, one shipment, inspected returns, approved refund with reserved balance; permission and state-race coverage |
| E. Background capability | 027–033 | fan-out, fenced provider work, search/reindex, Valkey/rate controls, media/content lifecycle, local notification capture, resumable imports/private exports |
| F. Real integrations | 034–038 | Auth0, SSLCOMMERZ, settlement samples, AWS services and email verified independently with sandbox evidence |
| G. Release readiness | 039–044 | CI/artifact/migrations, isolated staging, load/security/outage evidence, restore reconciliation, approved real data/policy, authorized pilot/handover |

Stages group outcomes; task dependencies decide execution order. For example, dispatcher BUILD-027 can follow BUILD-012 without waiting for every commerce endpoint. Synthetic media fixtures may enable the first local publication demo, but cannot count as S3/media-security acceptance. CI checks should accompany completed slices; BUILD-039 consolidates release-grade evidence.

For each task, first record requirement/BE/DBT references, table owner, endpoint/event contract and relevant transaction. Then define happy path, denied access, invalid state, replay and race/unknown scenarios. In future authorized coding work, implement the smallest complete slice, verify it, review its OpenAPI/schema compatibility and operational signals, and update task status with actual evidence. Never replace a missing provider/merchant decision with an invented production value.

## 9. Required inputs by gate

| Gate | Inputs needed | What can continue without them |
| --- | --- | --- |
| Local synthetic | compatible toolchain; isolated PostgreSQL; signed local test identity; explicit synthetic policies; named implementer/reviewer when assigned | no frontend, merchant secrets or full cloud estate required; select a ready local slice |
| Real integration | relevant nonproduction account, region/endpoint, secret delivery path, scopes/IAM, Auth0 audience/claims, payment reference/status samples and HTTPS callback where applicable | unrelated synthetic slices and other provisioned integrations |
| Production | approved D01–D16 and affected architecture/database/backend decisions; real catalog/stock provenance; finance/tax/refund policy; named operators; measured capacity/recovery; runbooks and authorized release | documentation and sandbox hardening; production transactions remain gated |

Detailed missing inputs and evidence owners are in the [gap register](readiness/01-gap-register.md) and [external evidence checklist](readiness/04-external-evidence.md). Keep credentials in the designated secret store, with only secret identifiers and owner/status recorded in planning files. A Multi-AZ database or PITR setting is not measured proof of regional recovery objectives.

## 10. Diagram navigation and completion criteria

Open the [backend diagrams.net file](diagrams/backend-architecture.drawio) using diagrams.net **File → Open From → Device**. Its eight pages cover runtime, dependency direction, protected request, checkout/payment, async reliability, security, cancellation/return/refund, and search/reindex. Open the [database ERD](../database/diagrams/ecommerce-erd.drawio) for six pages covering all 78 table definitions and selected logical relationships. Reference boxes repeat a table for readability; they are not additional tables.

Use the dictionary for exact logical columns/keys and transaction document for guards; diagram arrows distinguish flow/dependency from physical FK relationships. Review the module and endpoint templates when accepting each capability. Backend readiness requires demonstrated API/worker behavior, financial/stock invariants, real integration evidence, restore/reconciliation and operational ownership. This documentation finishes the requested design baseline; it does not mark any implementation or production gate complete.

Documentation verification on 6 September 2026 checked Markdown table shapes and local links, 78 unique dictionary tables with one defining ERD box each, valid XML page/cell/edge references, and contiguous BE-001–199 and BUILD-001–044 task catalogs without forward/self references in the checked dependency fields. These are structural documentation checks. No application tests, database execution, integration acceptance or rendered diagrams.net visual review was performed.
