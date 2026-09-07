# Backend runtime architecture

## Logical component model

| Component | Primary responsibility | Inbound | Outbound | Scale signal |
| --- | --- | --- | --- | --- |
| API runtime | REST validation, authentication, authorization, queries, transactional commands | Trusted web/API route, provider callback path | PostgreSQL, Valkey, OpenSearch, S3 grants, outbox | request rate, p95 latency, CPU, memory, DB wait |
| Outbox dispatcher | Publish committed events | PostgreSQL outbox poll | SQS queues | oldest unpublished age, batch throughput, failures |
| Payment worker | Validate IPN, reconcile attempts/refunds, resolve provider outcomes | payment queues and schedules | SSLCOMMERZ, PostgreSQL/outbox | queue age, pending/unknown age, provider latency |
| Notification worker | Resolve template, render, send, and record outcome | notification queue | email provider, PostgreSQL | queue age, send latency, failure/rate limit |
| Search worker | Apply versioned product projection and reindex | search queue/jobs | OpenSearch, PostgreSQL | projection lag, bulk errors, reindex age |
| File worker | Validate/import source files and build private exports | import/export queues | S3, PostgreSQL | job age, rows/second, memory, object size |
| Scheduler/reconciler | Expiry, aged-state reconciliation, invariant checks, maintenance enqueue | controlled schedule | PostgreSQL/outbox/SQS | overdue candidates, run duration, overlap skips |

All runtimes use the same reviewed release artifact and domain modules. Each starts only the modules, consumers, schedules, health checks, and permissions needed for its role.

The [readiness corrections](readiness/03-contract-and-model-corrections.md) are incorporated into the current logical design: commerce orchestration sits above leaf modules, outbox fan-out has per-destination durability, and search uses product/index projection generations. Page 2 of the diagram shows dependency direction; other pages show runtime or data flows. Use the [consolidated build guide](13-consolidated-build-guide.md) to navigate these boundaries.

## Internal layering

Every business module uses four explicit layers:

| Layer | Owns | May call | Must avoid |
| --- | --- | --- | --- |
| Interface | REST controllers, request models, auth context mapping, response presenters, consumer handlers | Application use cases | SQL, provider SDKs, business state mutation |
| Application | Commands, queries, unit-of-work orchestration, authorization policies, idempotency, ports | Domain model and declared ports | HTTP details, global service locator, unbounded cross-module reads |
| Domain | Aggregate rules, value concepts, state-transition policies, calculation rules, domain events | Pure domain collaborators | NestJS, database, queue, clock/network globals |
| Infrastructure | Drizzle repositories, transaction adapter, provider clients, SQS/S3/Valkey/OpenSearch adapters | External systems behind ports | Deciding business eligibility or bypassing application commands |

This separation is a review rule, not a requirement for excessive classes. A simple query may remain a small application handler. High-risk commands keep their transaction and policy behavior explicit.

## Dependency rules

1. A module exports named application capabilities, not repositories or arbitrary database access.
2. The interface layer depends inward on application contracts.
3. Application code depends on domain rules and narrow ports.
4. Infrastructure implements ports and may depend on vendor libraries.
5. Domain code has no dependency on NestJS or vendor SDKs.
6. Cross-module synchronous calls are allowed within the monolith only through exported application contracts and without creating cycles.
7. Cross-module facts needed after a commit travel through versioned domain events.
8. One orchestration use case may coordinate several module contracts when a single database transaction must protect a business invariant; ownership of each write remains explicit.
9. No module reads another schema for convenience unless the schema map records the read contract and the owning module reviews it.
10. A module never injects a global ORM object into controllers or consumers.

## Platform foundation

The backend composition needs small platform capabilities shared by policy:

- validated configuration and environment identity;
- structured logging, correlation, trace context, metrics, and error capture;
- clock and identifier generation;
- PostgreSQL connection and explicit unit of work;
- idempotency coordinator;
- outbox writer/dispatcher contract;
- authentication principal parsing and authorization decision interface;
- stable problem response and error taxonomy;
- health/readiness checks;
- provider HTTP client policy with timeout, retry, redaction, and telemetry;
- object storage and signed-access policy;
- queue envelope and consumer lifecycle;
- feature release controls when a risky integration needs staged enablement.

These capabilities contain no catalog, order, stock, or payment rules.

## Process and failure boundaries

- API instances are stateless between requests. Durable state belongs in PostgreSQL; limited request/session acceleration may use Valkey under an explicit fallback policy.
- A failed API instance cannot leave a partial commerce transaction because the local unit of work commits or rolls back.
- Worker termination before SQS deletion causes redelivery. Durable consumer receipts make the local effect repeat-safe.
- An unavailable SQS service leaves committed events in the outbox for later dispatch.
- An unavailable provider yields pending/unknown business-visible state and scheduled reconciliation.
- A search or cache outage degrades read convenience and never changes the checkout truth.
- A database outage stops unsafe commercial writes. Provider callback receipt needs a documented retry/temporary failure response and post-recovery reconciliation path.

## Connection and concurrency policy

- Give API and each worker role a defined connection budget; reserve capacity for migrations, operations, and recovery.
- Bound task concurrency by database pool, provider rate limits, memory, and queue visibility behavior rather than ECS task count alone.
- Set request and transaction timeouts separately. A request may wait on a remote call only outside a database transaction.
- Use the database global lock order for checkout, expiry, payment, refund, and return interactions.
- Do not wrap an entire HTTP request or message handler in a database transaction.
- Use optimistic `version` preconditions for staff editing and guarded state transitions for lifecycle actions.

## Architecture evolution triggers

Review a service split only when evidence shows one of these:

- a worker needs materially different deployment cadence or security boundary;
- a workload cannot scale without starving other modules after pool and queue isolation;
- a team owns an independently releasable domain with stable contracts;
- provider risk requires stronger network or credential isolation;
- availability objectives require independent failure containment;
- the cost of distributed consistency, duplicated operations, and contract ownership is accepted.

Until then, internal module boundaries provide clarity with lower operational risk.
