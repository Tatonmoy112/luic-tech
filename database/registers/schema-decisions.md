# Database decision register

**Status values:** Proposed, Approved, Rejected, Superseded, Blocked.  
**Rule:** No proposed item becomes an implementation fact until the named reviewer records evidence.

| ID | Decision | Proposed position | Status | Owner/reviewer | Needed before |
| --- | --- | --- | --- | --- | --- |
| DB-001 | Database boundary | One PostgreSQL database with eight ownership schemas | Proposed | Technical lead | Schema implementation |
| DB-002 | Primary identifiers | UUIDv7 primary keys; public order/reference values separate | Proposed | Technical lead + security | First migration |
| DB-003 | Money storage | `bigint` minor units and `char(3)` currency; no float or PostgreSQL `money` | Proposed | Finance + technical | Pricing tables |
| DB-004 | Quantity storage | Integer units for Release 1 | Proposed | Product + operations | Catalog/inventory tables |
| DB-005 | State representation | Text with named check constraints and append-only transition history | Proposed | Technical lead | Workflow tables |
| DB-006 | Mutable edit control | `version` counter and expected-version update on staff-managed aggregates | Proposed | Technical lead | Admin workspaces |
| DB-007 | Catalog price history | Effective-dated price records; one current interval per variant/currency/channel | Proposed | Finance + product | Catalog implementation |
| DB-008 | Stock authority | Position row plus append-only movement ledger updated in one transaction | Proposed | Operations + technical | Inventory implementation |
| DB-009 | Reservation/allocation | Explicit headers and lines; one terminal transition and operation key | Proposed | Operations + technical | Checkout implementation |
| DB-010 | Order snapshot | Item, variant attributes, prices, allocations and addresses copied into immutable order records | Proposed | Finance + product | Checkout implementation |
| DB-011 | Idempotency scope | Actor/surface/operation/key unique with canonical request hash and retained outcome | Proposed | Technical + security | Checkout/payment commands |
| DB-012 | Payment evidence | Receipt, validation and state history separated from payment attempt | Proposed | Finance + technical | Provider integration |
| DB-013 | Excess payment | Permit several successful attempts per order and open a finance exception | Proposed | Finance | Reconciliation flow |
| DB-014 | Refund balance | Reserve refundable balance locally before remote submission | Proposed | Finance + technical | Refund implementation |
| DB-015 | Return/restock | Inspection disposition separate from refund; sellable result authorizes movement | Proposed | Operations + finance | Return implementation |
| DB-016 | Queue reliability | Transactional outbox, durable inbox and unique consumer receipt | Proposed | Technical + platform | Worker foundation |
| DB-017 | Soft deletion | Archive catalog/config; no hard delete of transactional history | Proposed | Product + policy owner | Retention design |
| DB-018 | Partitioning | None at launch; measure audit/outbox/state-history growth first | Proposed | Platform + DBA | Performance review |
| DB-019 | Row-level security | Application authorization is primary; assess PostgreSQL RLS only as defense-in-depth after connection-pooling design | Proposed | Security + technical | Security review |
| DB-020 | Database roles | Separate owner, migrator, runtime read/write, worker and reporting roles with no shared human credentials | Proposed | Platform + security | Environment setup |
| DB-021 | Extensions | No required extension in the baseline; approve any effective-date exclusion extension separately | Proposed | DBA + platform | First migration |
| DB-022 | Tax representation | Versioned policy reference plus immutable order tax amounts; rule structure waits for D07 | Blocked | Finance | Pricing design approval |
| DB-023 | Retention periods | Per-data-class durations and anonymization/legal-hold process | Blocked | Policy owner + security | Production migration |
| DB-024 | SSLCOMMERZ mappings | Exact identifiers, uniqueness scopes, statuses, evidence and settlement columns | Blocked | Finance + technical | Payment schema approval |
| DB-025 | Human references | Format and collision policy for order, return, refund, import and export references | Proposed | Product + operations | First relevant migration |
| DB-026 | Case-insensitive identifiers | Store normalized companion columns rather than require `citext` | Proposed | Technical lead | Identity/catalog migration |
| DB-027 | Order numbering/invoice | Order reference is operational; tax invoice sequence/content is separate and pending D07 | Blocked | Finance | Invoice implementation |
| DB-028 | Development seed data | Synthetic only; no copied production personal/payment data | Proposed | Security + QA | Development environment |

## Backend readiness change proposal

The [schema supplement](../10-backend-readiness-supplement.md) proposes four tables beyond the original 74, plus response/lease/projection refinements. Review it before implementing cancellation, fan-out, operational jobs, hosted-session recovery or reindexing. T04 now checks excess/terminal-order conditions before allocation; T07 follows one global lock hierarchy. These are design corrections, not applied migrations or approved merchant policies.

## Relationship to project decisions

DB-001 through DB-021 refine A01–A05 and D01–D14. DB-022 through DB-024 and DB-027 cannot close until D05/D07/D13 are decided. A changed warehouse, shipment, COD, product-unit or multi-tenant decision requires a new schema-impact review; editing a column list alone is insufficient.

## DB-029: Adaptive policy persistence and model extensions

**Status:** Proposed extension inventory; outside the current 78-table dictionary/ERD. **Owners:** DBA, technical lead and affected domain owners. [Commerce extension plan](../11-commerce-extension-plan.md) proposes profile/policy release entities, explicit historical order bindings and separately selected domain packages. ADAPT-004 must finalize fields/FKs/constraints, ownership, lock order, migration and diagram coverage before adaptive migrations. No arbitrary JSON replaces relational money, stock, ownership or financial ledgers; profiles do not establish tenant isolation.

## Decision evidence format

For approval, add the date, approver, reviewed example or provider document, affected tables, compatibility impact and any replacement decision. Preserve superseded decisions for audit.
