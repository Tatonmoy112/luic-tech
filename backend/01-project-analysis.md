# Project analysis before backend design

## Review method

The local review followed this order:

1. inspect every file under `dev`, `context`, and `database`;
2. identify confirmed inputs, proposed assumptions, blocked decisions, and explicit exclusions;
3. trace the 31 requirement IDs into customer and staff journeys;
4. trace every commerce invariant into its owning aggregate and database transaction;
5. identify remote systems and the failure or retry behavior they impose;
6. identify missing backend artifacts and define a dependency-ordered design plan;
7. verify current platform behavior against primary vendor documentation where versions or delivery semantics may change.

## Repository findings

| Finding | Backend consequence |
| --- | --- |
| The repository contains planning documents only | This pack defines future boundaries and evidence; it does not describe implemented behavior |
| Release 1 is a proposed single-merchant Bangladesh store | No tenant abstraction, marketplace payout, multi-currency, or cross-border tax workflow is designed |
| One warehouse, no backorders, no split shipment, no COD | Inventory and fulfillment can use one complete reservation/allocation and one shipment per order |
| PostgreSQL has 78 proposed tables in eight ownership schemas | Backend modules align with those ownership schemas but table count does not imply service count |
| Database transaction specifications T01–T10 already exist | Application commands must orchestrate those transactions without weakening lock order or constraints |
| Customer, staff, and service roles have different authority | The backend needs separate API surfaces and policy checks in addition to Auth0 token validation |
| Payment uses a hosted SSLCOMMERZ flow | The backend owns session initiation, IPN receipt, server validation, reconciliation, and refund orchestration; it never handles raw card data |
| SQS Standard and transactional outbox are selected | Every consumer must be duplicate-safe and tolerate ordering gaps; SQS receipt is not a business commit |
| Valkey and OpenSearch are projections | Backend commands cannot trust cached price, availability, permission, or payment state |
| Exact versions, AWS region, policies, and merchant capabilities are unresolved | Compatibility and integration proof are gates before committing the backend foundation |

## Release 1 backend boundary

The backend includes:

- public catalog and search APIs used by the web service;
- authenticated customer profile, address, cart, checkout, order, cancellation, and return APIs;
- staff catalog, inventory, order, fulfillment, finance, reporting, import/export, access, and operations APIs;
- SSLCOMMERZ callback receipt and validation orchestration;
- outbox dispatch and dedicated background consumers;
- search projection, email notification, product/stock import, report export, expiry, reconciliation, and invariant-check jobs;
- audit, idempotency, correlation, health, metrics, and operational control surfaces.

The backend does not include Next.js rendering, browser component behavior, Auth0 tenant administration, provider-owned payment pages, courier booking APIs, a data warehouse, marketplace settlement, recommendation engines, real-time inventory feeds, or Release 2 features.

## Workload and design envelope

The planning envelope remains proposed: up to 10,000 sellable SKUs, around 1,000 orders per day, and 100 dynamic requests per second at peak. This supports a modular monolith with targeted worker scaling. It does not justify microservices, Kafka, distributed transactions, event sourcing, or launch-time table partitioning.

Before sizing, collect product count, variant distribution, category depth, image volume, search query rate, concurrent checkout rate, lines per order, callback burst behavior, staff concurrency, import/export size, notification rate, and seasonal multiplier. Capacity evidence may change pools, task counts, queue settings, cache policy, and search topology without changing domain ownership.

## Critical design cases

| Case | Backend control |
| --- | --- |
| Two buyers request the final unit | Stable row-lock order, in-transaction recheck, one successful reservation |
| Quote changes after cart | Authoritative recomputation and explicit reconfirmation result; no stock hold |
| Checkout repeats | Scoped idempotency record plus canonical request hash and stable response |
| Provider session call times out | Persist unknown initiation evidence and reconcile by stable reference before another charge attempt |
| Browser reports success | Treat as navigation only; status remains pending until server validation succeeds |
| IPN repeats or arrives out of order | Durable fingerprinted receipt, verification, conditional transition, immutable evidence |
| Reservation expiry races with payment | Reload and lock through the global order; either commit existing reservation, make one fresh full allocation, or hold the paid order |
| Two payment attempts succeed | Record both, allocate once, open an excess-payment finance exception |
| Concurrent refund approvals | Reserve refundable balance inside the local transaction before remote submission |
| Return is damaged | Record inspection disposition; do not create sellable stock movement |
| Search/cache is unavailable | Use bounded fallback or explicit degraded result; commercial commands continue from PostgreSQL where capacity permits |
| SQS delivers twice | Insert consumer receipt with local effect; query external outcome before repeating ambiguous calls |
| Staff access is revoked mid-session | Re-evaluate application account/grants within the approved revocation bound and on every sensitive command |
| Guest order token is guessed or forwarded | Store only token hash, use expiry/revocation, mask response, rate-limit verification, avoid distinguishable errors |

## Missing inputs that block final contracts

- D01–D07 business, stock, payment, delivery, return, refund, tax, and invoice policies.
- D08/D09 AWS region and exact Node.js, NestJS, Drizzle, database driver, Valkey client, and OpenSearch client compatibility.
- D10 representative import samples and ownership.
- D11 transactional email provider behavior.
- D13 privacy and retention rules.
- D14 approved service objectives and capacity model.
- D16 merchant account ownership and delegated access.
- DB-022 through DB-024 and DB-027 database decisions.

These items do not prevent designing boundaries. They prevent marking affected contracts ready for implementation.

## Resulting architecture stance

Start with one repository and one backend application composition. Build one artifact and run it with distinct API, dispatcher, payment, notification, search, file-job, and scheduler roles. Keep modules independently testable and prohibit cross-module table mutation. Split a deployable service only when measured scaling, isolation, release cadence, security, or ownership needs exceed the operational cost of another distributed boundary.
