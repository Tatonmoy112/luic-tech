# Backend design context

**Snapshot:** 7 September 2026  
**Status:** Proposed commerce architecture; B001/B002 local foundation implemented; human acceptance pending

## Latest readiness refinement

The [design recheck](../backend/readiness/07-design-recheck.md) records corrections beyond the initial structural review: callback/session races, paid-hold resolution, return/refund limits, dispatch funding, migration parents, missing capability substeps and source publication controls. The 78-table/44-BUILD baseline remains documentation only; final-candidate acceptance is still required.

Start with the [consolidated backend guide](../backend/13-consolidated-build-guide.md) for complete module/table ownership, data-flow and transaction mapping, routing, search/reindex and ordered build stages. [Backend readiness](../backend/readiness/README.md) supplies concrete defaults and 44 implementation tasks separate from the 199 design tasks. The dictionary and six-page ERD contain 78 proposed tables, still unimplemented. [B001 evidence](aidlc/bolts/B001-foundation.md) covers the local core; [B002](aidlc/bolts/B002-foundation.md) adds HTTP, PostgreSQL transactions/migrations and local telemetry. Human and business/account acceptance remain pending; no frontend or production accounts are required for local work.

## What exists

The later [commerce adaptability context](11-commerce-adaptability.md) and [backend policy design](../backend/14-configurable-commerce.md) specify selected profiles, conditional evidence, immutable policy releases and extension boundaries. Follow the [ADAPT sequence](../backend/readiness/08-adaptive-development-plan.md) for runtime-adjustable policy behavior. Candidate policy entities and alternative models remain outside the baseline 78-table ERD until their detailed schema review is complete.

The documentation-only [backend architecture pack](../backend/README.md) translates the product, system, and 78-table database model into a NestJS API and worker design. It includes runtime roles, module ownership, REST surfaces, request flow, 15 commerce data flows, SQS/event/job behavior, security, observability, deployment, a 199-task design sequence, 44 implementation tasks, acceptance checks, decisions, templates, and an editable eight-page diagrams.net file.

## Backend shape to preserve

- One modular NestJS monolith for Release 1, built once and started as API or specialized worker roles.
- Business modules own aggregates and expose application contracts; they do not mutate another module's tables through shared repositories.
- PostgreSQL is authoritative. Valkey and OpenSearch are bounded, replaceable accelerators/projections.
- Local business changes, history, audit, and outbox commit together where required.
- Remote Auth0, SSLCOMMERZ, email, S3, OpenSearch, Valkey, and SQS calls do not run inside commerce database transactions.
- SQS Standard consumers expect duplicates and ordering gaps; local effects commit with durable consumer receipts.
- Customer, staff, provider callback, operations, and health API surfaces have separate security and exposure policy.
- Auth0 authentication does not replace application permission, record ownership, state, threshold, or approval-separation checks.
- Browser payment returns never establish payment success. SSLCOMMERZ server validation plus guarded database transition does.
- Unknown payment/refund outcomes are reconciled by stable reference before retry.

## Reading path for backend work

Start with [AI-DLC state](aidlc/state.md) and the [selected Unit/Bolt](aidlc/execution-map.md). The list below supplies technical context for that slice. AUTH-004 authorized B001 and AUTH-005 now authorizes B002, BUILD-004 through BUILD-006. Later Units need their own bounded instruction; human acceptance remains separate.

1. Read [current project context](00-current-context.md), [product blueprint](01-product-blueprint.md), [system blueprint](02-system-blueprint.md), and [domain rules](03-domain-and-data-rules.md).
2. Read the [database context](09-database-design-context.md) and database T01–T10 transaction specifications.
3. Read [backend project analysis](../backend/01-project-analysis.md) and [runtime architecture](../backend/02-runtime-architecture.md).
4. Review [module boundaries](../backend/03-module-boundaries.md) and [REST contracts](../backend/04-api-contracts.md).
5. Use [request flow](../backend/05-request-dataflow.md), [commerce flows](../backend/06-commerce-dataflows.md), and [queue/job design](../backend/07-events-queues-jobs.md) while refining a capability.
6. Apply [security](../backend/08-security-and-access.md), [operations](../backend/09-resilience-observability-operations.md), and [deployment](../backend/10-configuration-deployment.md) to the same task.
7. Select the next ready BUILD item from the [implementation sequence](../backend/readiness/05-implementation-sequence.md), use BE tasks as design references, and verify it with the [backend checklist](../backend/12-validation-checklist.md).
8. View or edit the eight-page [backend diagrams.net file](../backend/diagrams/backend-architecture.drawio).

## Decisions still open

All project decisions D01–D16, architecture decisions A01–A05, database decisions DB-001–DB-028, and backend decisions BA-001–BA-040 retain their recorded status. BA-026 staff grant-revocation freshness, BA-032 connection budgets, and BA-040 exact dependency versions are specifically blocked on owner, capacity, or compatibility evidence.

SSLCOMMERZ field/status mappings, tax/invoice behavior, retention, exact AWS topology, Auth0 session propagation, staff approval thresholds, queue settings, pool sizes, and service objectives cannot be finalized by assumption.

## Update rule

When a backend decision changes, update the decision register, affected module boundary, API contract, data flow, event/queue/job contract, security/operations behavior, build tasks, requirement traceability, and diagram. Planning text is never evidence that an endpoint, worker, integration, or deployment exists.
