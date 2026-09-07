# Backend readiness schema supplement

**Status:** Proposed logical design correction; no SQL, Drizzle schema or migration created.  
**Relationship:** The original model had 74 tables. These four additions and field/key refinements are now incorporated into the 78-table logical dictionary and six-page ERD. This document retains the change rationale; implementation and migration acceptance remain future work.

## New proposed tables

| Table and owner | Purpose and logical fields | Constraints and indexing |
| --- | --- | --- |
| sales.cancellation_requests; Order | id, order_id, request_reference, idempotency_record_id, actor_type, customer_id/staff_id, reason_code, bounded note, state, requested_at, decided_at, decided_by_staff_id, decision_code, version, created_at, updated_at | Unique reference/idempotency; one active request per order; actor consistency; states requested/reviewing/approved/rejected/withdrawn; index state/requested_at and order_id |
| sales.cancellation_request_history; Order | id, cancellation_request_id, from_state, to_state, reason_code, actor_type, actor_reference, occurred_at, correlation_id | Append-only; FK to request; target state must match guarded request transition; ordered lookup by request/time/id |
| platform.outbox_deliveries; Dispatcher | id, event_id, destination_key, state, available_at, attempt_count, claimed_by, lease_token, locked_until, published_at, last_error_code, created_at, updated_at | Unique event_id/destination_key; FK event; pending/leased/published states; due unpublished index; completion uses current lease token |
| platform.workflow_jobs; Platform | id, job_type, dedupe_key, target_type/id, state, safe arguments, checkpoint, attempt_count, available_at, claimed_by, lease_token, locked_until, requested_by_type/reference, reason_code, started_at, completed_at, last_error_code, created_at, updated_at, version | Unique job_type/dedupe_key; pending/running/succeeded/failed/cancelled; due-job and target indexes; bounded safe payload; audit sensitive actions |

Cancellation request approval does not alone imply order cancelled. The coordinator applies the guarded order/stock/finance resolution or records waiting state. Terminal order history remains truthful. Repeated requests resolve through idempotency and active-request uniqueness.

Outbox destination rows are created in the business transaction along with their event, based on a versioned routing contract. Keep the original event's published_at as a derived all-destinations-complete marker. A destination added to a replay is an audited new delivery request, never silent mutation of prior routing meaning.

Workflow leases prevent simultaneous normal execution but do not prove external exactly-once effects. Completion compares lease token; expired owner cannot overwrite newer work. Financial unknown attempts remain uncertain even after lease expiry.

## Refinements to existing records

| Record | Logical addition/refinement | Why required |
| --- | --- | --- |
| platform.idempotency_records | Safe response_snapshot and response_schema_version, or explicit immutable result reconstruction contract | response_fingerprint alone cannot reproduce a stable error/reconfirmation outcome |
| platform.search_projection_state | Replace product-only primary key with product_id/index_name composite; desired_generation, applied_generation, tombstone flag, claim/lease fields | Multiple source versions and simultaneous live/rebuild indexes |
| finance.payment_attempts | Initiation claim token/lease, initiation_started_at, initiation_outcome; encrypted/restricted hosted session URL or provider-recoverable retrieval reference | Session reference alone may not reproduce the hosted URL; concurrent initiation needs a durable guard |
| finance.refund_submissions | Existing started/completed/unknown evidence plus worker claim/lease linkage | Recovery must distinguish unstarted from may-have-sent |
| platform.notification_requests | claimed_by, lease_token, locked_until; existing attempts remain delivery history | Avoid overlapping sends; provider unknown outcomes still require documented duplicate policy |
| platform.import_jobs/export_jobs | Claim/lease and checkpoint where not already represented by row results | Resume bounded work and prevent stale worker completion |
| iam.staff_role_assignments/role_permissions | Explicit initial-admin bootstrap actor provenance model | Existing grantor staff foreign key cannot require a nonexistent first grantor |

For bootstrap, create the named staff row first under a deployment-only role, then create self-referencing initial grant records with bootstrap provenance in protected audit; require the externally verified Auth0 subject and disable bootstrap after first completion. This is not a public self-grant endpoint.

## Projection generation transaction

A duplicate-safe projection-request consumer inserts its consumer receipt and increments desired_generation for each affected product/index in one short transaction. Build a document from a consistent snapshot containing the generation and all required public facts. Apply with generation-aware external version control and then conditionally update applied_generation. Independent price/stock/product version numbers are never compared.

## Migration and verification order

1. Reconcile these decisions with original table definitions and schema decision register.
2. Create outbox delivery and workflow-job structures with their parents in place.
3. Create cancellation requests, then cancellation history after orders/idempotency/staff/customer tables exist.
4. Add claim/response/projection refinements and explicit constraints.
5. Verify future migration definitions against the extended 78-table ERD and dictionary before schema acceptance; the logical documentation integration is complete.
6. Rebuild all migrations from an empty PostgreSQL instance.
7. Verify partial outbox fan-out, stale lease completion, cancellation/dispatch race, stable replay and two-index reindex.
8. Only then mark the supplement implemented.

## Review authority

The corrected transaction walkthrough is in [database integrity](04-integrity-and-transactions.md); cross-module and transport decisions are in [backend corrections](../backend/readiness/03-contract-and-model-corrections.md). This supplement is the explicit change proposal for database implementation, and older 74-table counts describe the original model rather than the extended target.
