# Backend module boundaries

## Module map

| Module | Aggregate ownership | Main synchronous responsibilities | Main events produced |
| --- | --- | --- | --- |
| Identity and access | `iam` schema | map Auth0 identity, customer profile/address, staff grants, guest access, authorization decisions | customer changed, staff grant changed, guest access issued/revoked |
| Catalog | product/category/attribute/variant and content entry/revision records | catalog and content lifecycle, SKU uniqueness, publication eligibility | product published/changed/archived, content published |
| Media | media assets and product-media links | signed upload intent, quarantine/approval, product media ordering | media uploaded/approved/rejected, product media changed |
| Pricing | price history, delivery rules, tax policy references | effective price lookup, price activation, delivery quote, tax policy selection | price activated, delivery rule changed |
| Promotion | coupon campaigns, targets, holds, redemption | eligibility, cap reservation, release, redemption | coupon hold created/released/redeemed, campaign changed |
| Inventory | positions, movements, reservations, allocations | availability, reservation, allocation, release, adjustment, restock | stock changed, reservation changed, allocation committed |
| Cart | carts and cart lines | ownership, merge, line update, estimated totals | cart changed/merged/expired |
| Checkout and order | checkout attempts, order snapshots/history/holds, cancellation requests/history | authoritative quote, order creation/read, holds/cancellation/completion through commerce coordinator | order placed/held/confirmed/cancelled/completed |
| Payment | attempts, callback receipts, validations, exceptions | session intent, callback intake, validation, payment transition, reconciliation | payment pending/succeeded/failed/unknown, exception opened |
| Refund and settlement | refunds, submissions, settlement imports/entries/matches | refundable balance reservation, provider submission result, settlement reconciliation | refund approved/completed/failed/unknown, settlement matched |
| Fulfillment and return | shipments, returns, inspections | eligibility, pick/pack/dispatch/delivery, return request/approval/receipt/inspection | shipment changed, return changed, inspection completed |
| Search | projection state; OpenSearch documents | search query contract, projection, reindex, fallback | reindex progress/complete, projection failed |
| Notification | templates, requests, attempts | select immutable template version, render, send, outcome | notification sent/failed |
| File jobs and reporting | import/export jobs/rows and report queries | file validation/application, report definitions, private export | import validated/applied/failed, export ready/failed |
| Platform operations | idempotency, outbox, inbox, audit and job controls | correlation, dedupe, dispatch, replay authorization, health, invariants | operational event only where another worker needs it |

Module ownership follows the [database schema map](../database/02-architecture-and-schema-map.md). A table listed under `platform` is assigned to the business capability that controls its lifecycle even though the database schema is shared.

## Identity and access

**Commands:** link customer identity, update customer profile, create/update/delete saved address under policy, deactivate account, issue/rotate/revoke guest order access, create/deactivate staff account, grant/revoke role, change role permissions.

**Queries:** current customer, saved addresses, effective staff permissions, authorized staff directory, masked guest order-access context.

**Rules:** Auth0 proves authentication only. Every request maps issuer and subject to an active application account. Customer ownership, staff permission, scope, amount threshold, dual approval, and revocation overlay remain application decisions. Passwords, refresh tokens, and raw guest tokens never enter business tables.

**Dependencies:** Auth0 key/claim validation, order reference for guest access, audit.

## Catalog and media

**Commands:** create/edit/archive product, create/edit/archive variant, assign categories/attributes, publish/unpublish, create upload authorization, record uploaded object, approve/reject media, attach/order media.

**Queries:** published product/category detail, staff catalog detail, SKU lookup, publication readiness.

**Rules:** product publication requires approved content, active variant, effective price, and approved media according to the agreed checklist. SKU remains unique after archive. Orders keep immutable snapshots. Object upload does not imply approval or public access.

**Dependencies:** pricing publication facts, media scan/approval, S3, audit, outbox.

## Pricing and promotion

**Commands:** schedule/activate/close price, configure delivery zone/rule, configure tax-policy version, create/update/activate coupon campaign, reserve/release/redeem coupon usage.

**Queries:** effective variant prices at database time, delivery quote, tax policy, coupon preview, staff campaign utilization.

**Rules:** exact BDT minor-unit arithmetic; one Release 1 coupon; serialized cap checks; current price and cart estimate are separate; finance-approved rounding/allocation order; overlapping effective prices are prevented through the approved database strategy.

**Dependencies:** catalog identity, customer eligibility, order reference, audit.

## Inventory

**Commands:** create opening balance, adjust stock, reserve order stock, release/expire reservation, allocate verified order, attempt fresh late allocation, restock inspected return.

**Queries:** authoritative stock position, reservation/allocation detail, movement history, indicative availability projection input, low-stock work queue.

**Rules:** `available = sellable_on_hand - reserved_quantity`; movements and position update together; all requested rows lock in stable order; reservation terminal action applies once; allocation deducts stock once; fulfillment never deducts again; correction uses a compensating movement.

**Dependencies:** variant/location identity, order/order-line identity, inspection disposition, audit/outbox.

## Cart

**Commands:** get-or-create cart, add/change/remove line, merge guest cart to customer, expire cart.

**Queries:** owned cart with observed catalog/price/availability, cart count.

**Rules:** exactly one owner context; cart does not hold stock; observed amounts are estimates; merge has an explicit quantity and conflict policy; Valkey loss falls back to PostgreSQL without changing ownership.

**Dependencies:** catalog sellability, pricing observation, inventory indication, customer identity.

## Checkout and order

**Commands:** preview authoritative quote, submit checkout, acknowledge changed quote, cancel eligible order, open/resolve hold, complete eligible order.

**Queries:** owned or masked order detail, order list, staff order work queues, state history.

**Rules:** the submit command implements database T02; canonical request identity and idempotency precede mutation; order snapshots never follow current catalog edits; order/payment/fulfillment/return/refund states remain separate; no remote call occurs before local commit.

**Dependencies:** identity, catalog, pricing, promotion, inventory, payment intent, audit/outbox.

The commerce application coordinator sits above the leaf modules and owns checkout T02 and verified-result T04 orchestration, plus other reviewed cross-module workflows. Each owning module receives the same explicit transaction context through a narrow port and writes only its own tables. Order and Payment do not import each other. The coordinator owns no additional business tables and is not a sixteenth business module.

## Payment

**Commands:** prepare attempt, record session initiation result, receive callback, validate notification, apply verified result, expire attempt, reconcile pending/unknown, resolve payment exception.

**Queries:** customer-safe payment status, staff attempt/evidence summary, aged pending/unknown queue, exception queue.

**Rules:** callback receipt is durable before acknowledgement; browser return is informational; successful transition requires server validation of merchant/environment/reference/amount/currency/status/risk; a late success is retained; multiple success is an exception, not discarded; unknown outcome is queried before retry.

**Dependencies:** SSLCOMMERZ adapter, payment repositories, audit/outbox. Verified evidence is passed to the commerce coordinator; the coordinator invokes order, inventory and promotion ports. Payment does not directly depend on those implementations.

## Refund and settlement

**Commands:** request/approve/reject refund, submit approved refund, record/query provider result, import settlement, auto-match, manually resolve a match.

**Queries:** refund detail and work queue, refundable balance, settlement summary/unmatched entries, finance reconciliation.

**Rules:** approval atomically reserves balance; provider timeout stays unknown; completion requires verified final evidence; refund and return/restock remain independent; match overrides require permission, reason, and audit.

**Dependencies:** payment success, order/return allocations, SSLCOMMERZ, private S3 files, audit/outbox.

## Fulfillment and return

**Commands:** create eligible shipment, start picking, pack, dispatch, record delivery/failure/return-to-origin, request/approve/reject/receive/inspect/resolve return.

**Queries:** fulfillment queues, shipment detail/history, owned return detail, staff return/inspection queues.

**Rules:** one Release 1 shipment per order; verified funding, complete allocation, and no active hold are dispatch guards; transitions use expected version; returns enforce cumulative eligible quantity; only sellable inspection creates one restock movement.

**Dependencies:** order, payment eligibility, allocation, inventory restock, customer/staff authorization, audit/outbox.

## Search

**Commands/jobs:** project one product version, apply deletion/tombstone, start/catch-up/verify/switch reindex, repair failed projection.

**Queries:** keyword, autocomplete, category, approved facets, sort and cursor pagination; bounded PostgreSQL fallback during outage.

**Rules:** only published sellable documents; per-product/index desired/applied generation prevents stale writes; independent stock/price/product aggregate versions are never compared; search amount/availability is indicative; alias switch requires verification; query input and result size are bounded. Apply the schema supplement for concurrent live/rebuild indexes.

**Dependencies:** catalog/pricing/media/inventory projection facts, OpenSearch, outbox.

## Notification

**Commands/jobs:** publish template version, create deduplicated notification request, render, send, record provider outcome, retry eligible failure.

**Queries:** staff delivery status and failure queue.

**Rules:** immutable published template version; bounded safe render model; recipient protected; one dedupe key per intended lifecycle message; message delivery never authorizes or changes commerce state.

**Dependencies:** domain events, email provider, customer/order snapshot, audit where policy requires.

## File jobs and reporting

**Commands/jobs:** request upload, validate import, approve import, apply bounded import rows, restart failed job, request export, build/upload export, expire artifact.

**Queries:** report definitions, authorized dashboard/report data, job progress, row-level import errors, short-lived download authorization.

**Rules:** private objects and fingerprints; no production PII in development; imports validate before apply and use idempotent row results; reports expose definition/timezone/freshness; exports are asynchronous, scoped, audited, and expiring.

**Dependencies:** S3, catalog/inventory application commands, finance facts, identity authorization, audit/outbox.

## Platform operations

**Commands/jobs:** dispatch outbox, claim work, record consumer receipt, replay approved DLQ batch, run invariant check, record audit, report readiness.

**Queries:** health/readiness, queue/outbox age, projection lag, invariant findings, operational job status.

**Rules:** operational repair cannot rewrite business history; replay is bounded and attributable; sensitive payloads remain out of logs/events; health endpoints reveal minimum detail; migration and runtime roles are separated.

## Cross-module interaction matrix

These are logical interactions, not mutual NestJS imports. A commerce coordinator above the leaf modules owns T02/T04 orchestration; payment and order do not import each other. See [the readiness corrections](readiness/03-contract-and-model-corrections.md).

| Caller | Callee | Interaction | Transaction expectation |
| --- | --- | --- | --- |
| Cart | Catalog/Pricing/Inventory | read observed sellability, price, availability | read only; no stock hold |
| Commerce coordinator: checkout | Identity/Catalog/Pricing/Promotion/Inventory/Order/Payment | validate and create accepted order context | one explicit local transaction per T02 |
| Commerce coordinator: verified result | Payment/Order/Inventory/Promotion | apply verified success and allocation | one explicit local transaction per T04 |
| Scheduler | Payment/Inventory/Promotion/Order | expire/reconcile candidate | each candidate gets its own guarded transaction |
| Fulfillment | Order/Payment/Inventory | check eligibility and transition shipment | guarded local transaction; no stock write on dispatch |
| Return | Order/Inventory | enforce quantity and apply sellable inspection | T07 transaction |
| Refund | Payment/Order/Return | reserve balance and later apply provider result | T08/T09; remote call between transactions |
| Search worker | Catalog/Pricing/Media/Inventory | build versioned read document | read facts, write projection state after external result |
| Notification worker | Order/Identity | resolve safe render facts | no business state mutation |
| Import worker | Catalog/Inventory | apply approved rows through owning commands | bounded per batch/row transactions |

Any new interaction needs an owner, sync/async choice, failure behavior, authorization rule, transaction statement, and observability definition before implementation.
