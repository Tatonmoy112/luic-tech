# Commerce profiles and adaptability

**Date:** 6 September 2026. **Status:** Proposed documentation; no implementation.

## Purpose and scope

The project should be adaptable to different commerce businesses through a stable transaction core, explicit profiles, versioned policies, and separately designed capability extensions. No single configuration makes the current database suitable for every business. This document replaces the assumption that every future merchant must use the original physical-goods rules; it does not declare new commerce models implemented or included in Release 1.

The current 78-table dictionary and diagrams remain the single-merchant physical-goods baseline. The [profile register](registers/commerce-profiles.md) identifies which assumptions are selected for local tests. New capabilities must pass the [backend policy contract](../backend/14-configurable-commerce.md) and [database extension design](../database/11-commerce-extension-plan.md) before activation. The existing stack remains the default; supporting a new business model does not automatically require microservices or a new queue/database.

## Four kinds of change

| Kind | Meaning | Example | Required work |
| --- | --- | --- | --- |
| Policy | Change a bounded value or select behavior the domain already supports | Reservation duration, delivery fee, return window | Typed validation, versioned release, scenarios and business evidence |
| Adapter | Connect the same internal operation to another verified provider | Another hosted-payment or email provider | Capability mapping, credentials by secret reference, contract and failure tests |
| Domain extension | Introduce new entities, quantities, obligations or workflow states | Recurring billing, split shipments, vendor settlements | Domain/DB/API/event design, migration, reconciliation and acceptance |
| Deployment decision | Change capacity, region, accounts or isolation | More worker tasks, another region, separate merchant deployment | Compatibility, capacity, access, restore and cost evidence |

These classifications compose. A new payment provider may also require a domain extension for authorization/capture; an adapter cannot hide missing financial states.

## Capability matrix

"Baseline" means covered by the proposed design, not built or production-accepted. A template proposes requirements and is disabled until its gaps close.

| Capability | Current position | Adaptation required | Activation boundary |
| --- | --- | --- | --- |
| Single-merchant physical retail | Baseline | Confirm goods and policies | Local synthetic profile first; real evidence before real use |
| Catalog categories, variants, media and descriptive attributes | Baseline | Merchant field definitions and import mapping | Attributes cannot replace typed money, ownership or stock fields |
| Shipping fees, reservation duration, simple coupon, returns | Baseline rules; configurable design added | Versioned supported policy choices | No policy may weaken stock/payment/refund invariants |
| Multiple payment/courier providers | Extension of adapters | Explicit selection per attempt/shipment, capability and reconciliation mapping | Existing attempts remain bound to their original provider/account |
| Multiple warehouses and split shipments | Location table exists; allocation/shipment behavior is restricted | Routing, partial quantities, cancellation/return allocation and locks | A second location is not evidence that split fulfillment works |
| Weighted or measured goods | Unsupported; integer item counts | Exact unit/scale, conversion, rounding and final-weight pricing | New quantity contract throughout stock, checkout, payment and returns |
| Lot, expiry or serial tracking | Unsupported | Lot/serial ownership, picking, expiry/quarantine and return traceability | Traceable stock movements and allocations |
| Digital goods/licenses | Unsupported | Entitlements, delivery attempts, access/revocation and evidence | No fake warehouse/shipping record to represent digital delivery |
| Services, bookings and rentals | Unsupported | Capacity/time reservations, timezone rules, rescheduling, deposits and returns | Conflict, overlap, cancellation and settlement proof |
| Subscriptions | Unsupported | Billing agreements, schedules, renewals, proration, dunning and cancellation | Verified recurring-payment rights and explicit renewal orders |
| B2B/wholesale | Unsupported beyond ordinary buyer accounts | Organizations, purchasing roles, price lists, quotes, credit/invoicing | Organization isolation, credit/receivable accounting and approvals |
| Marketplace | Unsupported | Sellers, offer ownership, commissions, split orders, payables and payouts | Seller isolation, money ledger and payout reconciliation |
| COD | Unsupported | Collection obligation, courier remittance, refusal and shortages | No automatic conversion of dispatch/delivery into online payment success |
| Preorders/backorders | Unsupported | Supply promises, reservation priority, capture timing and delay cancellation | No negative available stock used as a substitute for supply planning |
| Multiple currencies/countries | BDT/BD synthetic baseline | Currency scale, address/market, prices, tax/invoice, provider and settlement contracts | One currency per order; no aggregation across currencies without explicit conversion evidence |
| Bundles, gift cards, store credit and loyalty | Unsupported | Component stock and allocation, or liability/credit ledger and redemption rules | No promotion field used to conceal stored monetary value |
| Many merchant tenants in one deployment | Unsupported | Tenant-scoped keys, ownership, auth, jobs, storage, search and operational isolation | A profile ID is not tenant isolation |
| Mixed physical/digital/service cart | Unsupported | Line fulfillment type, obligation groups and aggregate completion rules | Every enabled combination needs end-to-end cancellation/refund proof |

## How a business is onboarded

1. Select merchant identity and deployment scope. Record whether this is one merchant per deployment; do not infer marketplace or SaaS tenancy.
2. Select goods, quantity units, inventory model, buyer type, markets/currencies, fulfillment and payment models from known capability IDs.
3. Produce a compatibility report: baseline supported, policy required, adapter required, domain extension required, or incompatible. Unknown choices stay disabled.
4. Collect only the inputs needed by the selected capabilities. For example, no warehouse questionnaire for a digital-only template; digital entitlement design is required instead.
5. Create policy drafts with bounded values, examples, named owner roles and evidence state. Development may select explicit fictional fixtures.
6. Run calculation, eligibility, state-transition and failure scenarios. Reject incomplete or contradictory policy sets as one release.
7. Bind a reviewed profile revision to one compatible release of application, schema and adapters. Activate atomically for new transactions after the relevant gate.
8. Preserve historical order policy references and snapshots. Retire a capability only after new intake is disabled and existing obligations are drained or migrated with evidence.

No production value is inferred from industry, country, product name or AI-generated examples. The mechanism supplies structure and deterministic local fixtures; the merchant/provider supplies facts.

## Non-configurable integrity rules

- Exact money representation, explicit currency/scale and conservation of component totals.
- Authoritative ownership, current sensitive permissions, staff revocation and separation of approval duties where required by the selected workflow.
- Atomic business state/history/outbox changes, idempotent outcomes and no network call inside commerce transactions.
- Stock reservation/allocation correctness, quantity entitlement limits and no duplicate movements.
- Independent payment verification, durable unknown outcomes, payment and line/component refund ceilings.
- Immutable accepted order facts and explainable changes through explicit adjustments or new workflow records.
- Cache/search cannot authorize commercial effects. A policy cannot disable audit, verification, isolation or schema constraints.

## Context handoff

Use [AI-DLC](aidlc/README.md) to refine each selected profile/capability change into a Unit/Bolt. Profile selection and policy activation are different from permission to implement or deploy. Record conditional stages, original-order effects, necessary ADAPT/EXT design and the actual evidence gate; disabled templates cannot become enabled merely because AI generated a plan.

Every future task records profile ID/revision, capability IDs, policy release, affected baseline requirement IDs, BUILD/ADAPT IDs and evidence gate. New product scope receives new requirement IDs through the existing requirement register before acceptance; do not repurpose a physical-goods requirement as marketplace acceptance.

Read [adaptation tasks and gap treatment](../backend/readiness/08-adaptive-development-plan.md) to start. D01-D16 remain evidence records; a selected profile does not mark them approved. Frontend work remains outside this plan.
