# Database design context

**Status:** Detailed design draft created; review and implementation not started  
**Design location:** [`database/`](../database/README.md)  
**Diagram:** [`database/diagrams/ecommerce-erd.drawio`](../database/diagrams/ecommerce-erd.drawio)

## What exists

The database pack analyzes the project and proposes one PostgreSQL 18 database with eight ownership schemas and 78 tables. It includes the diagrams.net ERD, full table/column dictionary, integrity constraints, workflow states, transaction/lock order, indexes, environment isolation, safe migrations, privacy/audit rules, 115 ordered database tasks and an acceptance checklist.

No PostgreSQL instance, Drizzle schema, SQL migration, seed script, connection string, infrastructure or application code has been created.

## Design rules a contributor must preserve

- PostgreSQL is authoritative for accepted catalog price, stock, order, payment, refund and audit facts.
- Money uses exact `bigint` minor units with currency; quantities are integer Release 1 units.
- Product variants are sellable SKUs; orders preserve immutable item, amount and address snapshots.
- Stock position and append-only movement ledger update together. Reservation, allocation, release and restock apply once.
- An order can have several payment attempts and even several real successes; excess value becomes a finance exception and inventory allocates once.
- Payment callbacks are durable receipts whose result requires server/provider validation. Browser returns are never authority.
- Return inspection/restock and refund processing are linked but independent decisions.
- SQS duplicates are controlled through transactional outbox and consumer receipts.
- Valkey and OpenSearch are disposable; their loss cannot corrupt checkout or authorization.
- Historical order, payment, refund, stock, settlement and audit records are not hard-deleted or silently rewritten.

## Open decisions

Implementation is blocked where the model depends on tax/rounding/invoice rules, return/refund/coupon-restoration policy, exact SSLCOMMERZ identifiers/statuses/settlement fields, retention periods, catalog unit rules, provider/session expiry behavior, staff approval thresholds, exact PostgreSQL patch/extensions and import mapping.

Use the [database decision register](../database/registers/schema-decisions.md) together with the project [decision log](registers/decision-log.md). A proposed decision is not approval.

## How to continue

For database work within an [AI-DLC Unit/Bolt](aidlc/execution-map.md), reference the exact tables, DBT/design inputs, BUILD outcome, invariants and migration evidence. A logical-schema review closes design work only. Actual migrations, constraints, concurrency, rollback and recovery must be demonstrated before implementation acceptance; candidate adaptable-policy entities remain outside the baseline ERD until their design integration is complete.

1. Read the [project analysis](../database/01-project-analysis.md) and [schema map](../database/02-architecture-and-schema-map.md).
2. Resolve Phase A decisions in the [database development sequence](../database/08-development-sequence.md).
3. Review the [data dictionary](../database/03-data-dictionary.md) against approved policies and provider samples.
4. Review the diagrams.net pages for relationship/cardinality errors.
5. Approve integrity, lock and migration patterns before creating ORM or SQL artifacts.
6. Implement in DBT task order and attach observed evidence to the [validation checklist](../database/09-validation-checklist.md).
7. Keep the project status board and requirement traceability current; do not mark SYS-006–SYS-009 or SYS-017 accepted from planning text alone.
