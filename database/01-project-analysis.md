# Project analysis before database design

## Repository finding

The repository currently contains product discovery, scope, architecture, delivery and operating plans in `dev/` and `context/`. No application source, ORM schema, SQL migration, sample data, existing database, or legacy schema is present. The database therefore has no compatibility constraint from prior implementation, but it must remain a proposal because the business and technical gates are not approved.

The review used these sources as the design baseline:

- `context/00-current-context.md` for Release 1 boundaries, NFRs and decision gates;
- `context/01-product-blueprint.md` for customer/staff journeys and exception behavior;
- `context/02-system-blueprint.md` for module ownership and transaction boundaries;
- `context/03-domain-and-data-rules.md` for money, inventory, state and history invariants;
- `dev/Step-2/Stage 2-Requirement Document.md` for the 31 traceable requirements;
- `dev/Step-2/Stage 3-Scope Definition.md` for included and excluded scope;
- `dev/Step-2/Stage 4-Solution Architecture.md` for the conceptual model and failure behavior;
- the discovery documents for catalog, admin, marketing and reporting detail.

## Findings that directly shape the schema

| Finding | Database consequence |
| --- | --- |
| PostgreSQL is the commercial authority | Final price, stock, order, payment, refund and audit facts reside in PostgreSQL |
| Modular monolith | One database with ownership-separated schemas; no cross-service distributed transaction |
| Guest and Auth0 customers | Customer link on an order can be null; guest access is a separate expiring secret-verification record |
| Current profile/address can change | Orders store address and identity snapshots independent of saved addresses |
| Product variants are sellable units | SKU, price, stock, reservation, order line and search projection all anchor to variant |
| One stock location at launch | Model location explicitly so Release 1 is clear and later expansion is possible without pretending it exists now |
| Cart does not reserve stock | Cart lines reference variants and estimates; reservation begins only in checkout |
| Checkout must be repeat-safe | Persist scoped idempotency key, canonical request hash, outcome reference and expiry |
| Payment and order are separate dimensions | An order has several payment attempts and keeps every verified outcome |
| A late payment can arrive after stock expiry | Reservation and payment histories remain independent; allocation can be retried or order held |
| Two attempts can both succeed | Success uniqueness is per provider transaction, not one-success-per-order; an exception records excess payment |
| Return and refund are separate | Return inspection/disposition does not imply refund completion or restock |
| One shipment per order | A shipment table still exists, with a unique order relationship in Release 1 |
| SQS can duplicate or reorder | Transactional outbox and consumer-processing keys are persisted |
| Callback may duplicate or be forged | Durable receipt, verification result and provider evidence are separate records |
| Finance reports must reconcile | Line/order amount components, successful payments, refund allocations and settlement matching are typed records |
| Search and cache may be lost | No authoritative relationship is stored only in OpenSearch or Valkey |
| Staff edits can race | Mutable aggregates carry versions; transitions use expected-state conditions and append history |
| History cannot be rewritten | Stock, state, payment, refund, settlement and audit evidence uses append-only records and compensating actions |

## Critical cases traced into the model

| Case | Tables and control |
| --- | --- |
| Two buyers request the final unit | `inventory.stock_positions`, `reservations`, `reservation_lines`; conditional quantity update under stable lock order |
| Price changes after cart | `catalog.price_records` remains current; `sales.order_lines` freezes accepted amounts after reconfirmation |
| Duplicate checkout submission | `platform.idempotency_records` and `sales.checkout_attempts` preserve request hash and prior outcome |
| Payment browser return says success | No state authority; only `finance.payment_validations` can support a guarded attempt transition |
| Duplicate/out-of-order callback | `finance.payment_callback_receipts` deduplicates receipt; attempt state/version prevents reversal |
| Reservation expires as payment succeeds | Both workflows lock reservation/order/positions in the documented order; only one terminal reservation transition wins |
| Two payment attempts succeed | Both attempts remain succeeded; `finance.payment_exceptions` marks excess value; allocation remains unique per order |
| Two refunds race | Payment/refund balance is reserved atomically; pending plus completed value cannot exceed eligible paid value |
| Returned product is damaged | `fulfillment.return_inspections` records disposition; only sellable disposition creates a stock movement |
| Queue replay repeats work | `platform.consumer_receipts` has unique consumer/event identity stored with local effect |
| Search/cache unavailable | Database queries can provide bounded fallback; no checkout fact is accepted from projected data |

## Design assumptions that still require owner decisions

The following items cannot be finalized by a database designer alone:

- tax inclusion, rounding sequence, invoice numbering and fiscal definition;
- exact cancellation/return window, shipping-fee refund and coupon restoration policy;
- catalog product types, mandatory attributes, units and maximum quantities;
- checkout reservation duration and relationship to provider session expiry;
- customer identifiers, phone requirements and approved account-link behavior;
- staff refund and stock-adjustment approval thresholds;
- courier zone/rate rules and failed-delivery treatment;
- provider transaction/refund/settlement field mappings and uniqueness scope;
- personal-data and audit retention, anonymization and legal-hold rules;
- import columns, source quality, product/category mapping and opening balance sign-off;
- report fiscal calendar, event dates and export retention;
- exact RDS PostgreSQL patch, extensions and runtime/Drizzle compatibility.

The schema reserves explicit places for these facts but does not invent their values.

## Resulting design stance

Use a normalized transactional model for mutable commerce facts and deliberate snapshots for accepted historical facts. Keep totals both decomposed and summarized, then enforce reconciliation in the write transaction. Use JSON only for bounded evidence or versioned configuration that is not the sole enforcement source. Do not create generic entity/value tables for catalog, money, permissions or workflow state.

The schema should begin as one PostgreSQL database split into eight logical schemas. This keeps cross-domain transactions possible while making ownership visible. Separate databases would break the checkout, payment-allocation and refund invariants without giving the proposed team a measured benefit.

