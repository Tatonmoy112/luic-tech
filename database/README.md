# Production database design pack

**Project:** Release 1 custom e-commerce platform  
**Database:** PostgreSQL 18 through Drizzle ORM  
**Status:** Domain design draft; B002 local ownership-schema migration and PostgreSQL foundation now exist, with evidence under review  
**Last reviewed:** 7 September 2026

## Purpose

This folder turns the approved planning context into a reviewable relational design. It is detailed enough for engineers to create Drizzle schema definitions and staged migrations after the outstanding business and architecture decisions are approved. The authorized [B002 foundation](../context/aidlc/bolts/B002-foundation.md) adds reviewed SQL migrations under migrations/. Eight ownership schemas and Drizzle history exist locally; none of the 78 domain tables is implemented. Credentials remain outside versioned artifacts.

The design protects four forms of truth:

1. **Commercial truth:** accepted prices, discounts, tax, delivery charge, order totals, payments, refunds and settlements.
2. **Stock truth:** sellable on-hand, reservations, allocations, releases, adjustments and inspected returns.
3. **Workflow truth:** independent order, payment, fulfillment, return and refund histories.
4. **Operational truth:** idempotency, incoming receipts, outbox events, consumer processing, audit and reconciliation.

## Backend readiness supplement

The current proposed dictionary and ERD contain 78 tables, incorporating four additions from the [backend readiness supplement](10-backend-readiness-supplement.md). Cancellation requests, outbox fan-out, durable jobs, response replay, provider claims and search reindexing are represented consistently. The supplement retains the rationale; the integrity document owns corrected lock-order, expiry and excess-payment rules. These are logical designs, not applied migrations.

## Reading order

Use [AI-DLC](../context/aidlc/README.md) to select the Unit/Bolt and current scope before implementing database work. The DBT catalog supplies design and verification detail; BUILD tasks own the integrated implementation outcome. The table review template records lifecycle/authorization/evidence links. Proposed schema, applied migration, successful concurrency proof and human acceptance are separate states.

| Order | File | What it answers |
| --- | --- | --- |
| 1 | [Project analysis](01-project-analysis.md) | What was found in the existing project and how it shapes the database |
| 2 | [Architecture and schema map](02-architecture-and-schema-map.md) | Database boundaries, PostgreSQL schemas and ownership |
| 3 | [Data dictionary](03-data-dictionary.md) | Tables, columns, keys and relationships for development |
| 4 | [Integrity and transaction rules](04-integrity-and-transactions.md) | Constraints, state guards, lock order and race handling |
| 5 | [Index and performance plan](05-indexing-and-performance.md) | Initial indexes, query paths, growth and maintenance |
| 6 | [Environment and migration plan](06-environments-and-migrations.md) | Development/staging/production isolation and safe change sequence |
| 7 | [Security, privacy and audit](07-security-privacy-and-audit.md) | Access, sensitive data, deletion, retention and evidence rules |
| 8 | [Development sequence](08-development-sequence.md) | Small ordered database work packages and completion evidence |
| 9 | [Validation checklist](09-validation-checklist.md) | Design, migration, concurrency, reconciliation and recovery checks |
| 10 | [Schema decision register](registers/schema-decisions.md) | Proposed choices and unresolved design inputs |
| 11 | [Table review template](templates/table-review.md) | Required review record for every implemented table |

Open [ecommerce-erd.drawio](diagrams/ecommerce-erd.drawio) in diagrams.net. It contains six pages: system overview, identity/catalog/cart, inventory/orders/fulfillment, payments/returns/finance, platform reliability, and cancellation/delivery/jobs. The file uses native uncompressed diagrams.net XML so it can be opened and edited directly.

## Design boundary

For different commerce models and dynamic business policies, use the [commerce extension plan](11-commerce-extension-plan.md). It identifies proposed policy persistence, order references, selected domain packages and migration gates. These candidate entities are not yet part of the 78-table dictionary/ERD. This baseline remains a valid starting profile; exclusions below identify capabilities requiring explicit extension rather than permanently forbidding other business models.

Release 1 assumes one merchant, physical goods, BDT, one stock location, integer item quantities, guest and Auth0 customer access, one shipment per order, manual courier tracking, SSLCOMMERZ hosted payments, one coupon per order, and one agreed catalog import. These remain proposed until the owners approve D01–D16 in the project decision log.

This pack excludes marketplace/vendor settlement, multiple warehouses, split shipments, COD, subscriptions, stored cards, loyalty, reviews, wishlists, batch/serial/expiry inventory, ERP/accounting synchronization, historical-order migration, data warehouse design, and multi-tenant isolation.

## Core design choices

| Topic | Proposed choice | Reason |
| --- | --- | --- |
| Identifier | UUIDv7 primary keys; separate opaque human-facing references where needed | Stable distributed identity and roughly time-ordered inserts without exposing row counts |
| Money | Signed `bigint` minor units plus ISO currency; BDT values use poisha | Exact arithmetic and simple reconciliation; no floating point |
| Quantity | Signed `integer` with nonnegative business constraints | Release 1 sells countable physical units; fractional units need a new decision |
| Time | `timestamptz` UTC instants; Asia/Dhaka only at business/report boundaries | One stored time standard with explicit display semantics |
| State | Lowercase text values with named checks and guarded transition history | Easier controlled evolution than PostgreSQL enum types |
| Deletion | Archive mutable catalog/configuration; retain transactional history | Orders, money, stock and audit remain explainable |
| Concurrency | Short transactions, stable lock order, conditional updates and unique operation keys | Prevent oversell, double release, double capture and over-refund |
| External payloads | Bounded, redacted evidence only; business facts promoted to typed columns | Provider diagnostics remain available without making JSON the commercial model |
| Search/cache | No foreign-key or correctness dependency on Valkey/OpenSearch | Both are disposable projections and PostgreSQL remains authoritative |
| Partitioning | No launch partitioning; introduce only after measured volume and retention justify it | Avoid operational complexity at the proposed 1,000 orders/day planning level |

PostgreSQL 18 includes native UUIDv7 generation and exact numeric types. The final generation location, RDS patch, extensions and Drizzle support must still be confirmed in D09. PostgreSQL constraints and partial unique indexes are used where one row can enforce an invariant; invariants across several rows also need the transaction patterns in this pack.

Reference material used for PostgreSQL-specific choices:

- [PostgreSQL 18 UUID functions](https://www.postgresql.org/docs/18/functions-uuid.html)
- [PostgreSQL 18 data types](https://www.postgresql.org/docs/18/datatype.html)
- [PostgreSQL 18 constraints](https://www.postgresql.org/docs/18/ddl-constraints.html)
- [PostgreSQL 18 partitioning and limitations](https://www.postgresql.org/docs/18/ddl-partitioning.html)

## Authority and change control

The project requirements and approved decision records remain authoritative for scope and policy. This folder is authoritative for the proposed database structure only after architecture review. If a business rule changes, update the decision record, affected domain rules, this database pack, task traceability and acceptance evidence before implementation.

Every future database change must identify:

- the requirement and decision IDs it supports;
- owning domain and table owner;
- forward migration, compatibility window and rollback/forward-repair path;
- constraint and index effects;
- data classification, retention and audit effect;
- transaction/concurrency impact;
- verification query or scenario and observed evidence.
