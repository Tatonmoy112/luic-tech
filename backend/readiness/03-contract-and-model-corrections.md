# Contract and model corrections

**Status:** Working engineering decisions for future implementation. No migration or code has been applied.

## C01 — avoid a circular commerce module dependency

Earlier diagrams show Checkout calling Payment and Payment calling Order. Treat these as business interactions, not mutual NestJS module imports.

Introduce a commerce application coordinator above the leaf modules. CheckoutController and financial worker handlers call that coordinator. It receives order, payment, inventory and promotion ports and one explicit transaction context. Payment owns provider evidence/attempt writes; Order owns snapshots/holds/state; Inventory owns position/reservation/allocation; Promotion owns coupon facts. Leaf modules never import the coordinator or one another's repository.

T02 and T04 run in the coordinator using the same transaction context across ports. An order.placed event must not create the initial payment intent a second time: that intent already exists in T02. Payment.succeeded events describe the already-committed T04 result; they do not repeat allocation.

The updated backend diagram page 2 shows permitted dependency direction through the coordinator; other pages show logical runtime/data flows. Acceptance: a static dependency review finds no circular Nest imports, and rollback tests prove one shared transaction.

## C02 — one lock hierarchy, including return inspection

Retain the database global order, adding an explicit line-lock stage: idempotency; order; payment attempts/refunds; reservation/coupon hold; campaign; stock positions sorted by location and variant; allocation/shipment/return aggregates; order lines/return items sorted by ID.

T07 must not lock return rows before stock positions. Read stable identifiers without locks, lock order first, then applicable stock positions, then return aggregate and lines, and recheck all relationships and quantities. Every return command also locks the order, serializing cumulative quantity checks across cases. Do not assume a pre-read grants eligibility.

Cart-only commands use cart ordering. T02 takes idempotency then cart lock before newly created order-related rows; existing-order workflows do not acquire cart locks later. Guest merge locks carts in UUID order and marks the source cart terminal. T02 takes shared product/variant eligibility locks in stable ID order before campaign/stock locks. Publication/price writers take exclusive locks on those same owning rows before changing eligibility. Inventory-only commands do not acquire catalog locks. This prevents validating one price/publication state and purchasing another.

## C03 — excess payments and cancelled orders before allocation

T04 first records verified success, then checks whether another successful attempt or existing allocation already funded this order. If yes, create an excess-payment exception and perform no stock/coupon allocation.

Next check terminal order state and active holds. A verified payment for a cancelled/completed order is retained as financial evidence and routed to finance; never reopen, fulfill or allocate that order. Risk-marked success stays on hold.

Only an eligible order can allocate an active reservation or make one fresh full allocation after expiry. An expired reservation stays expired; the allocation references that original reservation and records late allocation through movement reason/history. It does not transition back to active.

If the original coupon hold expired, do not exceed the campaign cap or change the accepted payable silently. Conservative development behavior is paid_on_hold with a coupon-expiry exception and no allocation until finance/operations resolves it. The merchant may later approve honoring the discount as a merchant-funded exception with separate accounting.

An already-applied callback does not run allocation again. Use the separately idempotent staff hold-resolution command described under database T04 resolution to recheck funding/refunds, named and independent holds, coupon policy and complete stock availability. A verified callback may also reach T04 while its attempt is still created; later session evidence cannot downgrade success or expose a now-ineligible hosted URL.

## C04 — durable fan-out and asynchronous external effects

One outbox published_at field cannot track partial success to several queues. Add explicit per-destination deliveries in the database supplement. Create the event and its fixed delivery destinations atomically with the business change. The dispatcher claims each destination, sends outside the transaction and marks only that destination acknowledged. Event completion derives from all required destinations.

An SQS consumer receipt protects a local durable effect, not the external call. A financial intent/notification request is the local effect. Workers then lease the intent, record attempt-before-call, call outside DB locks and persist outcome. A crashed unknown attempt is reconciled; a timeout alone never licenses a competing worker to repeat a financial mutation.

Do not write a consumer success receipt and then omit the external intent. Re-delivery must find that intent and its current state. Poison messages remain visible as terminal handling/DLQ; incompatible envelopes never disappear as successful business work.

## C05 — persisted cancellations and scheduled work

The prior 74-table model lacks the cancellation-request resource advertised by the API and a generic durable scheduled-job lease/checkpoint.

Add sales.cancellation_requests and append-only sales.cancellation_request_history. The request is separate from order state. A confirmed order may enter on_hold for cancellation review; only guarded finance/stock resolution permits on_hold to cancelled. Dispatch and cancellation serialize on the order. A request is never modeled as a fake order-state transition from a state to itself.

Add platform.workflow_jobs for bounded operational/reconciliation/reindex runs. Existing import/export and notification tables retain their specific lifecycle. All external attempts need atomic claim/lease fields; local-only sweepers remain safe under duplicate invocation through conditional transitions.

See the [schema supplement](../../database/10-backend-readiness-supplement.md) for columns, keys and migration order.

## C06 — search has several source versions and several target indexes

Catalog, price and stock events have independent aggregate versions. Comparing stock version 50 to product version 6 is meaningless.

Maintain a per-product desired projection generation. Every relevant committed source change causes a duplicate-safe local projection request that increments that generation. The projector reads desired generation and source facts in one consistent snapshot, writes the full document using that generation as the external version, and updates applied generation conditionally. If another request advances desired during processing, leave it pending.

Store state per product and concrete index generation. A single product primary key cannot represent both live and rebuilding indexes. During reindex, capture updates for old and new targets, backfill, catch up desired generations, reconcile published membership, then switch the alias. Archived products keep persistent projection tombstones until retention allows safe removal; reject stale republish after delete.

Search and caches may briefly contain stale publication. The API batch-validates product publication from PostgreSQL before exposing search results/detail; checkout always revalidates all commercial facts. A stale index must not disclose draft or archived content.

## C07 — bigint, quote and idempotency wire semantics

All money and bigint version values cross JSON as base-10 integer strings. Quantities use bounded JSON integers. Internal arithmetic uses bigint or a reviewed exact-decimal library. No conversion of unrestricted database bigint to JavaScript Number. Amount range is checked before SSLCOMMERZ serialization.

Convert BDT minor units into exactly two decimal digits without floating point. The fictional 37,499 minor total becomes 374.99 for the provider. Compare provider decimal amounts by validated exact conversion back to minor units.

Quote requests include cart version, chosen address/contact, delivery zone and coupon. Server recomputes; quote hash includes normalized accepted facts, policy versions and currency. The client hash never substitutes for recomputation. A changed quote under an existing key returns the prior reconfirmation outcome; accepting the changed payload requires a fresh key.

Persist a safe canonical response snapshot for idempotency, or reconstruct it only from immutable outcome facts. Reauthorize the actor on every replay. Do not replay expired signed URLs/tokens/provider URLs from an old success body; provide a current authorized retrieval operation.

Use 400 for shape, 401 authentication, 404 hidden ownership, 409 idempotency/state conflict, 412 stale version, 413 oversize, 415 media type, 422 domain/reconfirmation, 428 missing required precondition and 429 admission limits.

## C08 — secure backend-only authentication and guest access

A backend API test client can send a real Auth0 access token or a strictly local synthetic token; there is no dependency on a Next.js implementation. Future web clients forward an access token intended for the API over the private deployment route. Never trust raw X-User-ID or X-Role headers.

Guest cart token is a random capability; store only its hash. Checkout authorizes the cart and creates an order-access capability after the order exists. Exchange guest order capability through the dedicated POST operation, returning a masked view or narrowly scoped short-lived access context. Customer list operations require a customer token; guests cannot enumerate orders.

Auth0 customer provisioning is lazy: first valid customer access creates the application customer once by issuer/subject uniqueness. Staff provisioning is explicit. Initial production administrator is provisioned by a separately audited one-time bootstrap role with a recorded external Auth0 subject; no public first-user-is-admin path. Subsequent staff grants use existing administrators. The self-referencing grant audit columns require a bootstrap migration/seed design, not disabled integrity.

## C09 — realistic recovery and dependency gates

RDS Multi-AZ and in-region PITR do not by themselves prove a regional-outage RPO of five minutes. Record separate plans and evidence for instance/AZ failure, logical corruption and whole-region loss. A regional five-minute RPO requires a priced cross-region replication/recovery design and measured lag; until that is selected, the original regional target remains unproven.

Local deterministic tests may precede accounts. Sandbox-specific tests wait only for their account. Production waits for actual policies, production credentials, rate/quota evidence, security, restore/load results and named owners. A complete document is neither compatibility proof nor production approval.
