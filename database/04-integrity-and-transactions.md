# Integrity, state and transaction design

## Enforcement hierarchy

Use the strongest practical enforcement level for each rule:

1. **Column type and `NOT NULL`:** invalid absence or shape must not enter the table.
2. **Named check constraint:** row-local ranges, amount equations, timestamp order and allowed states.
3. **Primary/unique/foreign key:** identity, deduplication and required parent relationships.
4. **Partial unique index:** uniqueness only for active/default/current rows.
5. **Short serialized transaction:** totals, quantities or eligibility spanning multiple rows.
6. **Guarded application command:** permitted state edge, actor permission and policy rule.
7. **Invariant monitor/reconciliation:** detect drift from bugs, manual access or external uncertainty.

A database check cannot safely enforce a changing sum across other rows. Such rules use row locks or conditional updates plus a post-write reconciliation assertion. Triggers are reserved for narrow database-owned guarantees approved by the technical lead; hidden business workflows in triggers are discouraged.

## Required row-local checks

| Area | Checks |
| --- | --- |
| Money | Currency is three uppercase letters; ordinary amounts nonnegative; fixed discount has currency; percentage within approved range; order/refund/settlement component equations balance |
| Quantity | Cart/order/reservation/allocation/shipment/return requested quantities positive; position counters and post-movement balances nonnegative |
| Time | End/expiry after start; completion not before creation; closed price/rule interval after opening |
| Identity | Auth issuer/subject nonblank; exactly one owner/actor context where required; clear secret never stored |
| Catalog | SKU normalized nonblank; compare-at value not below active selling value; variant attribute value belongs to the declared attribute |
| Workflow | State belongs to allowed set; terminal-state timestamp consistent; from/to values differ |
| Evidence | Payload size capped; schema version positive; hashes use one approved representation |
| Settlement | Provider-approved sign equation between gross, fees, adjustments and net |

## Required unique guarantees

| Guarantee | Database object |
| --- | --- |
| Auth0 identity link | Unique `(auth_issuer, auth_subject)` separately for customer and staff |
| SKU lifetime identity | Unique normalized SKU across active and archived variants |
| Product/category URLs | Unique stable slug in its approved scope |
| One selected value per attribute | Unique `(variant_id, attribute_id)` |
| One active/default address kind | Partial unique index by customer and default kind |
| One primary category | Partial unique index on product where `is_primary` |
| One current/open price interval | Partial unique index where `valid_to is null`; scheduled overlap also prevented by serialized activation or approved exclusion design |
| Position | Unique `(variant_id, stock_location_id)` |
| One reservation and allocation per order | Unique `order_id` on each header; unique allocation reservation |
| No repeated stock operation | Unique `stock_movements.operation_key` and reserve operation key |
| Cart line | Unique `(cart_id, variant_id)` |
| Checkout outcome | Unique idempotency record and unique created order |
| One coupon/order | Unique `coupon_redemptions.order_id` |
| Provider notification | Unique provider/environment receipt fingerprint |
| Payment transaction | Scoped partial unique provider/merchant/environment transaction ID when present |
| Refund/settlement source | Unique stable application reference and provider-scoped identifiers where documentation supports it |
| One shipment/order | Unique `shipments.order_id` for Release 1 |
| SQS consumer effect | Unique `(consumer_name, event_id)` |
| Import source | Unique approved source fingerprint in the relevant import scope |

## State models

### Order

| Current | Permitted next | Guard |
| --- | --- | --- |
| `pending_payment` | `confirmed` | One eligible verified successful attempt covers the exact payable, complete allocation exists, no blocking hold; Release 1 does not combine partial attempts |
| `pending_payment` | `on_hold` | Payment, stock, risk or reconciliation issue recorded |
| `pending_payment` | `cancelled` | No incompatible successful/unknown payment; reservation and coupon hold terminate once |
| `on_hold` | `confirmed` | Blocking issues resolved, verified payment and full allocation present |
| `on_hold` | `cancelled` | Finance/operations resolution and required refund/release actions recorded |
| `confirmed` | `on_hold` | Cancellation review or blocking finance/operations issue recorded under the order lock; shipment eligibility is rechecked and dispatch is blocked while the hold is active |
| `confirmed` | `completed` | Shipment delivered and no unresolved blocking return/exception under approved policy |

`cancelled` and `completed` are terminal. A later payment or refund does not reopen or erase the order; it creates finance history and an exception if needed.

### Payment attempt

| Current | Permitted next | Evidence |
| --- | --- | --- |
| `created` | `pending`, `unknown`, `failed`, `cancelled`, `succeeded` | Provider initiation/session result or reconciled failure; direct success requires complete independent server validation when callback wins the session-result race |
| `pending` | `succeeded`, `failed`, `cancelled`, `expired`, `unknown` | Completed server validation or documented expiry rule |
| `unknown` | `pending`, `succeeded`, `failed`, `cancelled`, `expired` | Provider query/reconciliation evidence |
| `expired` | `succeeded` | Verified late success; allocation/hold decision handled separately |

Succeeded, failed and provider-confirmed cancelled results are preserved. A later provider correction is a new evidence record and reviewed compensating transition, never an overwrite.

A callback can be validated before the initiation worker saves its response. T04 may apply a verified success from created; a later session response is retained as evidence but cannot downgrade succeeded or reopen a payment path. An owned session GET must omit the gateway URL once the attempt/order is no longer eligible to pay, even if the stored URL has not expired.

### Reservation and coupon hold

`active` has exactly one terminal transition to `committed`/`redeemed`, `released`, or `expired`. The state predicate and unique terminal operation key make repeated sweepers, callbacks and retries harmless.

### Shipment

`allocated -> picking -> packed -> shipped -> delivered`, with guarded `failed_delivery` and `return_to_origin` branches. Shipped records are never reset to packing. Correction adds history and an exception. Packing or dispatch never changes stock already allocated.

### Return

`requested -> approved -> received -> inspected -> resolved`, or `requested/approved -> rejected/cancelled` under policy. Cumulative quantities are checked under an order-line lock before approval, receipt and inspection.

### Refund

`requested -> approved -> submitted -> processing -> completed`, with `rejected`, `failed` and `unknown` branches. An unknown submission must be queried before another submit. Only verified final provider evidence permits `completed`.

### Cancellation request

The cancellation-request lifecycle is separate: requested may move to reviewing, approved, rejected or withdrawn; reviewing may move to approved, rejected or withdrawn while the decision is still reversible. Approval/rejection requires authorized staff or an explicitly permitted automatic unpaid-cancellation policy; withdrawal requires the requester or authorized staff. All transitions recheck the order under its lock and append request history. Approved/rejected/withdrawn requests are terminal; an approved request may still have an outstanding order hold and finance resolution. A new request cannot bypass that outstanding resolution.

## Global lock order

All commands that touch existing commerce rows follow this order when the rows apply:

1. idempotency record;
2. order;
3. payment attempt, then refund ordered by UUID;
4. reservation and coupon hold;
5. coupon campaign;
6. stock positions ordered by `(stock_location_id, variant_id)`;
7. allocation/shipment/return aggregates ordered by UUID;
8. order lines and return items ordered by UUID.

Cart-only commands lock carts by UUID. T02 acquires idempotency and cart locks before newly created order rows. Existing-order workflows do not later acquire cart locks. T02 also acquires shared locks on product/variant eligibility rows in stable ID order before campaign/stock locks. Price activation and publication writers take exclusive locks on those same owning rows before changing eligibility; inventory-only writers do not acquire catalog locks.

Rows are selected first by stable identifiers, then locked in this order. A batch never follows cart insertion order. Candidate sweep queries may identify work without locks, but each item is reloaded and locked through the global order before mutation. Remote network calls never occur while these locks are held.

## Transaction specifications

### T01 — cart update

1. Resolve owner and cart; lock cart by ID and expected version.
2. Validate variant reference and requested quantity; current price is observation only.
3. Insert/update/remove the unique cart line.
4. Increment cart version and activity time.
5. Commit; cache update occurs after commit.

### T02 — checkout and stock reservation

1. Insert or lock the scoped idempotency record and compare canonical request hash.
2. Lock the owned cart and product/variant eligibility rows as described above. Re-read cart/customer/guest ownership, published variants, effective prices, delivery rule, tax-policy version and coupon eligibility.
3. If the authoritative quote differs from customer-confirmed quote, persist a reconfirmation outcome without reserving stock.
4. Lock coupon campaign if present, then every stock position in stable order.
5. Recheck coupon cap and `available >= requested` for every line.
6. Insert parents before children: checkout attempt with nullable order back-reference, order referencing that attempt, immutable order lines/address/discount snapshots, reservation header and coupon hold; fill the attempt's order back-reference within this transaction. Create the initial payment intent once.
7. Create reservation lines and their movements in FK-safe order, increase reserved counters, and link resulting records. The uniqueness/operation keys and already-held position locks protect the complete unit.
8. Append state/audit/outbox records and fixed delivery destinations.
9. Assert order totals and reservation quantities reconcile, then commit all or roll back all.
10. Initiate SSLCOMMERZ only after commit.

### T03 — reservation expiry/release

1. Find candidate by database time without assuming it remains active.
2. Lock order, relevant payment attempts, reservation, coupon hold/campaign and positions through the global order; every competing payment/expiry writer first locks this order.
3. Apply only if reservation is still active and expiry/explicit-release guard is true. A committed allocation is ineligible. For the proposed local expiry policy, release due unallocated inventory even if provider status is pending/unknown; uncertainty must not reserve stock indefinitely.
4. Decrease reserved counters, append one release movement per line and terminate coupon hold once. Keep payment evidence unchanged.
5. Cancel only if the order/payment policy proves that safe. Pending/unknown money instead opens an order hold and reconciliation job; releasing inventory does not prove that no payment happened.
6. Append history/outbox/audit and commit.

### T04 — verified payment success and allocation

1. Persist provider validation evidence before the commerce transition.
2. Lock order, payment attempt, reservation, coupon rows and stock positions.
3. If this provider transaction is already applied, return the existing result.
4. Mark this attempt succeeded once and retain the verified amount/currency/evidence reference.
5. Before any allocation, check whether another successful attempt or allocation already funds the order. If so, open an excess-payment exception and perform no stock/coupon allocation.
6. Check terminal order state and blocking holds. Verified definitive evidence may resolve only the payment-uncertainty hold that it proves obsolete; record that resolution. A cancelled/completed order is never reopened or allocated by late success; preserve payment and open a finance exception. Cancellation, risk and other independent holds remain active. An expired coupon hold needs the approved exception policy; development defaults hold the order without allocation.
7. For an otherwise eligible order, commit active reservation quantities once or attempt one fresh complete allocation after expiry. If any line fails, allocate none and open paid-but-unallocated hold. The original expired reservation stays expired and the allocation records its late origin.
8. Redeem a valid coupon hold only under approved payment/order policy.
9. Confirm order only when complete funding, allocation and hold checks pass.
10. Append histories/outbox/audit and commit.

### T04 resolution — an already-paid order on hold

The idempotent staff hold-resolution use case is separate from callback replay. T04's already-applied result is intentionally a no-op; replaying it cannot repair an order that previously failed allocation.

1. Require the relevant finance/operations permission, expected order version, reason and a new scoped resolution idempotency key. Lock the order and applicable payment/refund/reservation/coupon/position/allocation rows in the global order.
2. Reload verified payment evidence and reserved/completed refunds. Reject terminal orders, unresolved excess-payment or independent holds, pending cancellation, and insufficient remaining funding. Before dispatch, eligible funding excludes both completed and reserved refunds.
3. Resolve only the named hold whose cause is proven removed. If coupon expiry cannot be resolved under an approved policy, keep the order held and route to cancellation/refund; never change accepted price or exceed coupon caps.
4. If no allocation exists and all guards pass, check every required position under lock, then allocate every line once or none. Preserve expired reservation state and link the late allocation to its origin. If allocation already exists, verify its complete active quantities without deducting stock again.
5. Confirm only with complete allocation, sufficient eligible funding and no active block. Commit hold resolution, order/history, stock/coupon effects, audit and outbox/destinations atomically. Provider calls are unnecessary for an already-verified result and cannot run inside this transaction.

### T05 — inventory adjustment

1. Authorize actor and approval threshold before mutation.
2. Lock position and validate expected version.
3. Apply signed delta without allowing invalid counters.
4. Append movement with unique operation key, reason and resulting balance.
5. Increment version, audit and emit outbox; commit.

Opening balance uses the same movement contract through an approved import job. Direct counter replacement is forbidden.

### T06 — shipment transition

1. Lock order, allocation and shipment.
2. Verify expected state, staff permission, complete allocation, verified funding and no active block.
3. Validate courier/tracking fields required for the requested edge.
4. Update shipment state/version and timestamp; append state/audit/outbox.
5. Never write stock position or movement on picking, packing or dispatch.

### T07 — return approval/receipt/inspection

1. Read identifiers without locks, then lock order, applicable stock positions, return aggregate and affected order lines/return items in the global order; revalidate every relationship.
2. For each order line, sum approved quantities across distinct approved/received/inspected/resolved return cases, counting each case once. Exclude rejected/cancelled cases only when policy permits and no received stock must still be accounted for. Include the proposed approval in the purchased-quantity cap while holding the order lock. On receipt enforce received <= approved; on inspection enforce cumulative inspected <= received; never sum multiple lifecycle stages as independent returned units.
3. Record guarded return state and quantities.
4. For inspection, use the already-locked position to create exactly one positive sellable movement for approved sellable quantity.
5. Damaged/quarantined/lost dispositions retain evidence without sellable increase.
6. Commit state history, inventory movement, audit and outbox together.

### T08 — refund approval and balance reservation

1. Lock order, successful payment attempt and refund.
2. Verify actor authority, dual approval threshold, policy, line allocations and remaining eligible paid balance. In addition to the payment-wide cap, reserve per-order-line quantity and merchandise/tax/shipping component entitlement across approved/submitted/processing/unknown/completed refunds. Count each refund once; a second request cannot refund the same line twice merely because other lines retain unpaid refund entitlement.
3. Atomically increase `refund_reserved_minor`; update refund to approved.
4. If the order has not dispatched, open a finance hold in this same order-locked transaction and move a nonterminal eligible order to on_hold. Dispatch must recheck eligible funding after reserved/completed refunds; it cannot race past approval. Append history/audit/outbox and commit. Post-dispatch refunds preserve historical shipment/order facts and follow their own policy.
5. Submit remotely after commit with the stable refund reference.

### T09 — refund provider result

1. Persist submission/status evidence.
2. Lock order, payment attempt and refund.
3. For verified completion, move the amount from reserved to completed exactly once.
4. For verified terminal failure, release reserved amount under policy; for unknown, keep it reserved.
5. Append state history, exception/outbox/audit and commit.

### T10 — outbox dispatch and consumer effect

The originating transaction commits an event and its fixed destination rows together. The dispatcher leases a bounded batch of due `outbox_deliveries`, publishes outside the transaction, then marks each destination with a matching lease token. Event `published_at` is set only when all required destinations are published. A publish followed by marking failure can repeat, so consumers insert their unique receipt in the same local transaction as their local effect or durable external-call intent. An external call outcome is recorded separately; ambiguous calls are reconciled before retry. Expired leases never establish that a financial call was not sent.

## Invariant monitoring

Run read-only checks at an approved cadence and after migrations/imports:

- negative position counters or calculated available stock;
- position after-values inconsistent with latest movement;
- active expired reservations/coupon holds older than allowed processing grace;
- reservation/allocation/order-line quantity mismatch;
- confirmed order without complete allocation or verified funding;
- more than one shipment per Release 1 order;
- refund reserved/completed balance above successful payment;
- refund lines not equal to refund amount;
- return quantities above purchased eligibility;
- succeeded provider transaction duplicated outside its documented scope;
- unpublished/failed outbox age above target;
- consumer effect without receipt or receipt without expected effect;
- settlement unmatched/partially matched beyond finance threshold.

An invariant alert opens an operational incident or reconciliation case. Automated repair is allowed only when the correction rule is deterministic, idempotent, audited and separately approved.
