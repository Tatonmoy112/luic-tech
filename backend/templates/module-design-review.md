# Backend module design review template

## `[module]` — purpose and owner

| Field | Value |
| --- | --- |
| Business outcome |  |
| Requirement IDs |  |
| AI-DLC intent/Unit/Bolt |  |
| BUILD/ADAPT scope, profile and authorization |  |
| Product owner |  |
| Technical owner |  |
| Status/decision links |  |

## Boundary

- Aggregates/tables owned:
- Commands owned:
- Queries owned:
- Events produced/consumed:
- External systems:
- Explicit exclusions:

## Contracts

| Contract | Caller | Authentication/authorization | Input/output | Failure/idempotency/version |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |

## Rules and transactions

- Invariants and state transitions:
- Unit-of-work owner and lock order:
- Constraints/expected-version behavior:
- Remote calls outside commit:
- Unknown/retry/reconciliation behavior:

## Data protection and operations

- Data classification and response masking:
- Audit actions:
- Logs/traces/metrics and redaction:
- Cache/search/event rules:
- Health, alert, runbook, and recovery behavior:

## Acceptance scenarios

- Happy path:
- Invalid and unauthorized:
- Conflict/concurrency:
- Duplicate/retry/out-of-order:
- Dependency outage/unknown result:
- Migration/rollback/recovery:

## Review record

Record reviewers, date, open decisions, accepted evidence, exceptions/expiry, and affected documentation.
