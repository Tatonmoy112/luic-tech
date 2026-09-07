# Domain and data rules

These rules protect the commercial truth of the system. Any implementation or design change that conflicts with them requires a reviewed architecture and business decision.

## Money model

For every relevant [AI-DLC Bolt](aidlc/workflow.md), load these invariants and the canonical database transaction rules before proposing implementation. Derive applicable success, denial, duplicate, race, unknown and rollback expectations before reviewing generated code. Short delivery cycles and configurable profiles do not weaken money, stock, authorization or immutable-history requirements.

- Use exact minor-unit or fixed-decimal arithmetic with an explicit currency; never floating point.
- Store order-line unit price and quantity plus allocated line discount, tax, and refund values.
- Store order-level delivery, discount, tax, payable, paid, pending-refund, and completed-refund values in reconcilable form.
- Freeze the accepted item name, SKU, variant attributes, addresses, and commercial allocations on the order.
- Current catalog changes never rewrite an existing order snapshot.
- Finance approves rounding, tax inclusion, invoice content/numbering, delivery refund, partial-return allocation, fees, and settlement treatment.
- Pending plus completed refund reservations cannot exceed the eligible successful paid balance.

## Inventory model

For Release 1, each variant has one stock location.

`available = sellable on-hand - active reserved quantity`

- Reservation increases reserved quantity without reducing sellable on-hand.
- Successful allocation atomically reduces sellable on-hand and reserved quantity once and records a movement.
- Packing or dispatch does not deduct the allocated quantity a second time.
- Reservation release/expiry reduces reserved quantity exactly once.
- A fresh late-payment allocation may reduce sellable stock only if all quantities remain valid; otherwise place the paid order on hold.
- Returned goods enter an inspection disposition. Only accepted sellable disposition creates an authorized restock movement.
- Damage, quarantine, loss, and manual adjustment require reason, actor, permission, quantity, and audit.
- Stock history is append-only. Corrections use compensating movements.

## Checkout transaction

One short local transaction must:

1. Resolve a scoped idempotency key and payload identity.
2. Revalidate customer/guest ownership, product publication, variant, quantity, current price, coupon eligibility/cap, delivery, tax, and stock.
3. Lock or conditionally reserve all requested stock in stable SKU order.
4. Reserve limited coupon usage if applicable.
5. Create the order and immutable commercial/address snapshots.
6. Create the payment-attempt intent.
7. Record state history/audit and outbox events.
8. Commit all or roll back all.

The gateway network call begins after commit. A repeated key with the same canonical payload returns the existing result; a changed payload returns a conflict. The proposed key retention is seven days, subject to technical approval.

## State models

### Order

| From | Allowed next state | Guard |
| --- | --- | --- |
| Pending payment | Confirmed | Eligible verified payment and stock allocation completed |
| Pending payment | Cancelled | No incompatible successful/unknown payment; reservation released once |
| Pending payment | On hold | Payment, allocation, risk, or reconciliation exception |
| On hold | Confirmed | Exception resolved with verified payment and allocation |
| On hold | Cancelled | Finance/operations resolution and money/stock actions recorded |
| Confirmed | On hold | Cancellation review or other blocking issue recorded under order lock; dispatch rechecks holds |
| Confirmed | Completed | Shipment delivered and no unresolved blocking workflow |

Order state does not replace payment, fulfillment, return, or refund state.

### Payment attempt

| State | Meaning |
| --- | --- |
| Created | Local intent exists; provider session not confirmed |
| Pending | Provider interaction may be active or awaiting verification |
| Succeeded | Successful result verified against provider and expected transaction facts |
| Failed | Verified terminal failure |
| Cancelled | Verified/provider-mapped cancellation where applicable |
| Expired | Attempt is no longer eligible under approved rules, subject to late-event handling |
| Unknown | Outcome cannot safely be inferred; reconciliation required |

Late success never disappears. A second success for the same order is recorded and routed to excess-payment resolution; goods allocate once.

### Reservation

`Active -> Committed allocation` or `Active -> Released/Expired`. Every terminal transition uses an expected-state condition and can happen once.

### Fulfillment

`Unallocated -> Allocated -> Picking -> Packed -> Shipped -> Delivered`.

Exceptions include hold, failed delivery, and return-to-origin. Dispatch needs verified payment eligibility, allocation, tracking/courier information required by policy, and actor permission.

### Return

`Requested -> Approved -> Received -> Inspected -> Resolved`, or rejected with a reason. Cumulative return quantity per order line cannot exceed eligible purchased quantity after prior returns/cancellations.

### Refund

`Requested -> Approved -> Submitted -> Processing -> Completed`, with rejected, failed, and unknown branches. An unknown submission is reconciled before resubmission. Final completion requires verified provider outcome.

## Payment verification rules

- Persist a bounded incoming notification receipt durably before acknowledging success to the sender.
- Treat browser success/failure/cancel return pages as navigation signals only.
- Verify merchant/environment, transaction identity/reference, successful provider result, expected BDT currency, and original payable amount.
- Keep provider identifiers unique where their documented scope permits.
- Preserve validation evidence and risk status with redaction.
- Serialize payment confirmation against attempt, order, reservation, and prior successful attempts.
- If payment succeeds after reservation expiry, try a fresh full allocation atomically. If unavailable, mark paid-but-unallocated and block fulfillment for finance/customer resolution.
- Reconcile pending/unknown attempts on a provider-approved schedule and surface aged cases.

## Refund rules

- An authorized request identifies original successful payment, order lines/allocations, reason, amount components, and approval authority.
- Atomically reserve eligible refund balance before provider submission.
- Give every refund a stable application reference and preserve every provider request/status result.
- After timeout or ambiguous response, query status before resubmitting.
- Mark completed only after verified final status. Initiated/processing is not completed.
- Return inspection/restock and refund processing are separate decisions linked for audit.
- Concurrent requests cannot over-refund even when both initially appear eligible.

## Customer and authorization rules

- Link an application customer to the intended Auth0 subject/issuer combination.
- Store historical order addresses separately from editable saved addresses.
- Every customer read/write checks record ownership in the application.
- Guest order access uses a high-entropy, expiring, safely stored verification mechanism and a masked response.
- Staff actions require application role/permission and, where applicable, refund/export thresholds or dual approval.
- Staff revocation must become effective within an approved maximum period independent of a long identity-provider session.
- Audit actor, action, target, prior/next state or safe change summary, time, reason, and correlation without storing secrets.

## Catalog and content rules

- SKU is unique for a sellable variant and remains referenceable after archive.
- A published item needs all required commercial content, valid variant/price, allowed media, and publication permission.
- Archive removes purchase eligibility without deleting order references.
- Only approved media objects become public; private source/import/export objects use separate paths and access.
- Coupon checks include status, time window, customer/order/product eligibility, minimums, maximum discount, total redemption cap, per-customer use, and one-coupon Release 1 rule.
- Concurrent checkout cannot exceed a coupon cap; abandoned/expired holds release once.

## Time, identity, and history

- Store instants in UTC and show business dates/times in Asia/Dhaka with explicit report boundaries.
- Use stable opaque identifiers externally; do not expose sequential identifiers where enumeration creates risk.
- Do not hard-delete financial, inventory, order, payment, refund, audit, or reconciliation history. Retention/anonymization follows approved policy.
- Use version/precondition checks on concurrent staff edits and aggregate state transitions.
- Derivations include definition/version/freshness so a report can be reconciled to source facts.

## Data lifecycle and migration

1. Define ownership, classification, required fields, retention, and access for every data group.
2. Validate the source CSV without changing production data.
3. Produce row-level errors, duplicate detection, media mapping, and summary counts/totals.
4. Transform through a documented versioned mapping and retain the approved source fingerprint.
5. Rehearse into an isolated environment and reconcile SKU, publication, price, media, and opening stock.
6. Freeze the approved source and accept controlled deltas.
7. Import production data through an auditable job with resumable/idempotent behavior.
8. Reconcile again before sales open and obtain data/operations sign-off.

## Invariants to verify before launch

- No checkout path creates negative available stock.
- No reservation, allocation, release, restock, or manual adjustment applies twice.
- No duplicate request creates more than one intended order or external money action.
- No browser-controlled input can set price, discount, tax, shipping, payment success, stock, or permission.
- No refund combination exceeds eligible paid value.
- No customer can read or act on another customer's order/address.
- No stale cache/search result determines the final order facts.
- No queue replay or out-of-order event moves a terminal aggregate backward.
- No report/export modifies source facts or exposes data beyond the actor's scope.
