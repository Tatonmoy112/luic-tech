# Commerce data flows

Each flow identifies authority, transaction boundary, remote work, recovery, and visible outcome. Database transaction IDs refer to [integrity and transactions](../database/04-integrity-and-transactions.md).

## F01 — product publication to storefront

1. Catalog manager submits a versioned publish command.
2. Backend authenticates staff and checks catalog publication permission.
3. Catalog module reloads product, variants, effective price, categories, and approved media.
4. Publication policy returns missing requirements or permits transition.
5. Local transaction guards product version, changes publication state, appends audit and outbox event, then commits.
6. The projection-request consumer atomically deduplicates the event and increments desired generation for every affected product/concrete index. The search worker reads that generation and public facts in one consistent snapshot, then applies the document or persistent tombstone using external generation control and conditionally advances applied generation. Independent product, stock and price versions are never compared.
7. Cache invalidation/refresh runs after commit; CDN media already points to approved versioned objects.
8. Public queries can show the product after index freshness delay. Batch-check current PostgreSQL publication eligibility for search results and check it for direct product reads; stale search/cache entries cannot expose unpublished products.

Failure result: product commit remains valid if queue/search/cache fails; projection lag is visible and recoverable by replay/reindex.

## F02 — media upload and approval

1. Authorized staff requests an upload intent with filename metadata, declared type, and size.
2. Backend creates a private object key and short-lived bounded upload grant.
3. Browser uploads directly to private S3; object-created evidence schedules inspection/processing.
4. Media worker checks actual size/type and required safety/quality rules, records derived object metadata, and leaves source private.
5. Authorized staff approves or rejects eligible media.
6. Approval transaction records state/audit/outbox. Only approved derivative/reference can become public through CloudFront.

Failure result: orphan/private objects are cleaned by an audited retention job; an uploaded object is never automatically publishable.

## F03 — cart update and merge

1. Resolve verified customer or high-entropy guest cart owner.
2. Validate product/variant reference and requested quantity for cart policy.
3. Execute T01 against durable PostgreSQL cart and expected version.
4. Load observed price and indicative availability for response; do not reserve stock.
5. Refresh Valkey after commit on a best-effort basis.
6. On sign-in, load both owned carts, apply approved merge rules, and commit one deterministic result under idempotency/version control.

Failure result: Valkey loss causes bounded PostgreSQL access; stale price/availability is labeled and corrected during quote.

## F04 — authoritative quote and reconfirmation

1. Customer submits contact/address, delivery selection, cart version, coupon, and last-seen quote identity.
2. Backend revalidates ownership and reads current published variants, prices, delivery rule, tax policy, coupon eligibility, and stock indication.
3. Pricing computes exact allocations and returns a canonical quote hash and expiry/review boundary.
4. No order, reservation, coupon hold, or payment attempt is created during preview.
5. At checkout submit, T02 recomputes everything. If the accepted values changed, it stores/returns a reconfirmation outcome without holding stock.
6. Customer explicitly confirms the new quote through a new canonical payload and a new idempotency key. The original key continues to replay its safe reconfirmation response.

Failure result: the customer keeps input and receives field/business codes; the API never silently charges a changed amount.

## F05 — checkout, reservation, and order creation

1. Require customer/guest context, `Idempotency-Key`, canonical payload, and confirmed quote identity.
2. Resolve or create the scoped idempotency record. Return prior result for the same hash; reject a changed hash.
3. Commerce coordinator executes database T02: authorize, lock cart and product/variant eligibility in the documented prelude, recompute, lock coupon and positions, recheck caps/availability, create reservation/order snapshots/payment intent/history/audit/outbox and fixed delivery rows using one shared transaction context.
4. Commit all or roll back all.
5. Return pending order and payment attempt references.
6. Claim the persisted payment initiation intent and start the hosted session outside the transaction through the recoverable payment workflow. A concurrent caller cannot initiate it again.
7. Persist the session response or unknown outcome. Session POST returns an accepted status reference; an authorized session GET returns a still-valid gateway URL from restricted storage only after a confirmed eligible result. API clients can exercise this without a frontend.

Failure result: no partial order/reservation exists after transaction failure. Unknown provider initiation never triggers blind creation of multiple charge paths.

## F06 — SSLCOMMERZ callback and payment confirmation

1. Edge admits only the bounded callback route and payload size/rate class.
2. API derives a safe receipt fingerprint and persists a redacted callback receipt before acknowledging durable intake.
3. Duplicate fingerprint returns the existing intake outcome.
4. Payment validation work calls SSLCOMMERZ Order Validation API outside a database transaction.
5. Adapter verifies environment, merchant, transaction/reference, expected BDT amount, provider status, and risk result; immutable validation evidence is stored.
6. For a verified success, the commerce coordinator executes T04 under the global lock order using the owning payment/order/inventory/promotion ports.
7. Apply payment success once. Check excess funding, terminal order state, risk/other holds and coupon eligibility before any allocation. Only then commit an eligible active reservation or attempt one fresh full allocation after expiry, according to corrected database T04.
8. Confirm order only with eligible funding, allocation, and no active hold; emit outbox events. Complete validation may succeed while the attempt is still created. Later initiation evidence cannot downgrade success, and session retrieval stops returning a gateway URL once payment is no longer eligible.
9. A second success opens an excess-payment exception without a second allocation.
10. Customer return/status page reads this backend state; it does not set it.

Failure result: mismatched/forged evidence is retained safely and rejected; provider/network uncertainty becomes `unknown` with scheduled reconciliation.

## F07 — reservation expiry versus late payment

1. Scheduler finds expired active reservation candidates using database time.
2. For each candidate, T03 locks order/payment/reservation/coupon/positions and rechecks state.
3. If payment is safely absent/terminal-failed, release reservation and coupon hold once and transition according to policy.
4. If payment is pending/unknown, release due unallocated stock/coupon holds once under the proposed expiry default, but preserve an order/payment uncertainty hold and schedule reconciliation. Do not cancel the order merely because inventory expired. Verified definitive evidence may later resolve only this uncertainty hold; independent holds remain.
5. If a verified success locks first, T04 allocates and expiry later observes a terminal reservation.
6. If expiry commits first and success arrives later, T04 retains successful payment evidence, checks excess funding, terminal order state, holds and coupon eligibility, then tries one fresh full allocation only if eligible. All lines allocate or none do; the expired reservation remains expired. An expired coupon enters finance review under the conservative local default.
7. Insufficient stock produces paid-but-unallocated hold and finance/operations work. Once the cause is resolved, an authorized idempotent hold-resolution command follows database T04 resolution and rechecks funding/refunds, independent holds, coupon and all stock lines. Duplicate callback replay does not execute this repair.

Failure result: neither path can double-release, create negative stock, or discard the late payment.

## F08 — fulfillment lifecycle

1. Staff queue selects orders with verified funding, complete allocation, no active hold, and shipment eligibility.
2. Authorized operator creates/opens the one Release 1 shipment and items matched to allocation lines.
3. Each pick, pack, dispatch, delivery, failure, or return-to-origin command supplies expected version/state.
4. T06 checks order/allocation/payment/hold guards, records shipment transition/history/audit/outbox, and commits. Before dispatch, funding excludes completed and reserved refunds; refund approval shares the order lock and opens a finance hold, so approval cannot race past dispatch.
5. Dispatch records manual courier/tracking facts required by approved policy.
6. Notification work is created asynchronously from committed events.
7. Shipment completion can make the order eligible for completion without collapsing return/refund states.

Failure result: repeated transition is a stable conflict/idempotent outcome; no fulfillment transition changes stock already deducted during allocation.

## F09 — cancellation

1. Customer or staff submits request with actor, reason, expected state, and idempotency context.
2. Persist the uniquely active cancellation request and append its initial history atomically; a repeated idempotency key resolves to the same request. Under the order lock, an existing approved request awaiting cancellation resolution also prevents a second request: return the existing authorized reference or a stable conflict. Customer withdrawal or a staff decision appends request history.
3. The coordinator locks order, payment, reservation/coupon, campaign, positions and shipment/allocation as applicable in the global order, then rechecks ownership, cancellation policy and dispatch progress.
4. If unpaid and safe, release reservation/coupon once and cancel. If already dispatched, reject cancellation or route to the separately authorized return process.
5. If paid or payment outcome is unknown, open a blocking hold and move an eligible confirmed/pending order to on_hold. Complete finance/refund and unshipped allocation-release resolution through owning modules before guarded on_hold-to-cancelled transition. Approval of the request alone does not mean the order is cancelled.
6. Append request/order history, audit, outbox and delivery rows with each local transition. Rejection/withdrawal resolves only its own cancellation hold; another active hold still blocks fulfillment.

Failure result: concurrent fulfillment/payment action causes a conflict and a fresh policy decision; no partial stock/money reversal occurs.

## F10 — return, inspection, and restock

1. Customer/staff requests eligible order-line quantities and reasons.
2. Authorization and policy check order ownership/state, return window, and cumulative prior quantities, including inspected cases. Count approved entitlement once per return case rather than summing its successive lifecycle stages; receipt and inspection remain bounded by their preceding quantities.
3. Staff approval, receipt, and inspection use guarded T07 transitions.
4. Inspection records quantity and disposition separately for each decision.
5. Sellable disposition locks the stock position and appends exactly one positive restock movement in the same transaction.
6. Damaged, quarantined, lost, or rejected quantity does not increase sellable stock.
7. Resolution emits events for customer status, reports, and an independently authorized refund process.

Failure result: concurrent return requests cannot exceed purchased quantity; correction uses new inspection/compensating evidence under policy.

## F11 — refund approval and provider processing

1. Request identifies order, original successful payment, line/component allocations, reason, and amount.
2. Backend checks finance permission, requester/approver separation, threshold, and approved policy.
3. T08 follows global order: lock order, then payment/refund roots and affected records, and atomically reserve eligible payment balance and original line/component entitlement. A pre-dispatch approval opens a finance hold in this transaction; a second refund cannot reuse a line already reserved/refunded.
4. Commit approved refund/history/audit/outbox before provider call.
5. Refund worker calls SSLCOMMERZ with stable application reference outside the transaction and records every submission/query.
6. Timeout or ambiguous response becomes `unknown`; the worker queries status before any resubmission.
7. T09 moves reserved to completed only on verified final success, or releases under verified terminal-failure policy.
8. Customer/staff status and settlement reconciliation remain visible.

Failure result: pending plus completed refunds cannot exceed verified paid balance, even with concurrent approvals.

## F12 — settlement reconciliation

1. Authorized finance staff creates an import and uploads the private provider source.
2. File worker fingerprints and parses under the approved provider schema and sign convention.
3. Rows persist with source line/hash and validation result; duplicate source is rejected.
4. Automatic matching uses scoped provider IDs, amount, currency, merchant/environment, and type.
5. Ambiguous/unmatched/partial rows enter a finance work queue.
6. Manual match requires permission, reason, expected state, and audit.
7. Reconciliation reports distinguish order payable, successful payment, refund, fee, and settled net.

Failure result: source and typed evidence remain immutable; rerun does not create duplicate matches.

## F13 — product and opening-stock import

1. Staff requests an import and uploads a private file under size/type controls.
2. Worker fingerprints the source and validates mapping version, required columns, duplicates, prices, stock, categories, and media references.
3. Row results are reviewable without modifying catalog or stock.
4. Authorized approver accepts the validated batch.
5. Worker applies bounded rows through catalog and inventory-owned commands with stable row operation keys.
6. Opening stock becomes append-only movement, never a direct counter replacement.
7. Checkpoint, counts, sums, failures, targets, and high-water mark support safe restart.
8. Completion reconciliation compares source, valid, applied, rejected, catalog, and movement counts.

Failure result: partial application is explicit and resumable; rollback uses approved compensating actions rather than deleting shared history.

## F14 — report export

1. Staff selects a versioned report definition, filters, timezone, and format.
2. Backend checks report/export permission, tenant-free Release 1 scope, row/period bounds, and data classification.
3. API creates an export job and returns `202 Accepted` with status reference.
4. File worker queries through approved read paths in bounded pages and builds a private artifact.
5. Worker stores fingerprint, row count, freshness, definition version, expiry, and outcome.
6. Authorized staff requests a short-lived download grant; creation and sensitive download are audited as required.
7. Artifact expires under retention policy while job/audit evidence remains.

Failure result: large exports do not occupy API requests or expose a permanent public object URL.

## F15 — DLQ replay and operational repair

1. Operator reviews message type, failure history, payload classification, current domain state, and proposed batch.
2. Backend checks service-operator permission and any finance/security approval requirement.
3. Replay request records reason, bounded count, event IDs, actor, correlation, and expected effect.
4. Messages are replayed to their owning queue without removing durable dedupe controls.
5. Consumers re-evaluate current state; already-applied effects remain no-ops.
6. Result records succeeded/skipped/failed and remaining oldest age.
7. Business reconciliation confirms the backlog is resolved; queue count alone is insufficient.

Failure result: no bulk unreviewed replay, no edit of consumer receipts, and no direct business-row correction to hide errors.
