# Table implementation review template

## `[schema.table]` — purpose

| Field | Review value |
| --- | --- |
| Owning module | |
| Requirement IDs | |
| Decision IDs | |
| AI-DLC intent/Unit/Bolt | |
| BUILD/ADAPT scope and authorization | |
| Artifact/schema/profile evidence identity | |
| Data owner | |
| Data classification | Public / internal / confidential / restricted |
| Retention rule | |
| Expected launch volume/growth | |
| Primary write paths | |
| Primary query paths | |

## Columns and keys

Record every column, type, nullability, default, business meaning and whether it is immutable. Identify primary key, foreign keys, unique keys, checks and delete/update behavior.

## Integrity and concurrency

- State the invariant this table protects.
- State which related rows are locked and in what global order.
- Identify the expected-state or expected-version predicate.
- Identify the operation/idempotency key.
- Explain retry and unknown-outcome behavior.
- Explain how correction uses a compensating record rather than history rewrite.

## Access and privacy

List each runtime role that can select, insert or update the table. Identify customer ownership filters, staff permissions, sensitive fields, redaction, export behavior, audit event and deletion/anonymization handling.

## Index review

For each index, name the query it supports, expected selectivity, sort order, partial predicate and write/storage cost. Confirm that every foreign-key lookup used for parent deletion or joins is covered where needed.

## Migration review

Document expand, backfill, verification, switch and contract steps. Include lock/scan risk, timeout plan, compatibility window, recovery/forward-repair path and representative row-count estimate.

## Acceptance evidence

- Schema inspection result
- Constraint violation cases
- Happy-path transaction case
- Concurrent/retry case
- Query plan at representative volume
- Authorization/privacy case
- Backup/restore or migration rehearsal reference where applicable
- Reviewer, date and unresolved exception
