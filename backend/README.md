# Production backend architecture pack

**Status:** Proposed design only  
**Scope:** Release 1 NestJS API and workers  
**Snapshot:** 6 September 2026

## Purpose

This folder converts the documented project and database planning into a backend build blueprint. It defines what the backend must own, how requests and background work move through the system, where transactions begin and end, how modules cooperate, and what evidence is needed before a capability is accepted.

Nothing in this folder is executable. It does not contain NestJS source, Drizzle schema, SQL, configuration, credentials, infrastructure, tests, or deployment artifacts.

## Analysis result

The architecture pack remains documentation. As of 7 September 2026, the repository also contains the bounded B001 API/worker workspace, lockfile, shared configuration and executable verification suite. [B001 evidence](../context/aidlc/bolts/B001-foundation.md) records actual local results and pending human acceptance. B002 adds local ownership-schema migrations, HTTP foundation and telemetry. No commerce API, real provider or cloud deployment exists.

The proposed Release 1 backend is a modular NestJS monolith built once and started in separate API and worker roles. PostgreSQL is the commercial authority. Valkey, OpenSearch, S3, SQS, Auth0, SSLCOMMERZ, email, and observability services are integrations with explicit failure boundaries.

## Development readiness update

Use [AI-DLC](../context/aidlc/README.md) for the development process and [workflow state](../context/aidlc/state.md) for current authorization and next work. The [Unit/Bolt map](../context/aidlc/execution-map.md) organizes all BUILD tasks and selected ADAPT additions while preserving their dependencies. U01/B001-B002 foundation evidence is linked from state, with human acceptance pending; frontend remains excluded.

Start with the [consolidated architecture and build guide](13-consolidated-build-guide.md): complete 78-table ownership, transaction/data-flow mapping, initial event routing, search/reindex protocol, seven build stages and evidence gates. The [backend readiness pack](readiness/README.md) supplies local defaults, field contracts and 44 implementation tasks. The updated eight-page backend diagram and six-page database ERD incorporate these corrections. Backend work can proceed by capability without a frontend or all production accounts. No implementation has started.

## Reading order

For adaptable business rules and other commerce models, read [configurable commerce](14-configurable-commerce.md) with the [commerce profiles](../context/11-commerce-adaptability.md). This is a proposed extension to the baseline, including policy lifecycle, compatibility gates and historical-order behavior; it is not implemented and is not represented as completed in the baseline diagrams.

The [design recheck findings](readiness/07-design-recheck.md) record the latest semantic corrections and remaining verification limits.

1. [Project analysis](01-project-analysis.md)
2. [Runtime architecture](02-runtime-architecture.md)
3. [Module boundaries](03-module-boundaries.md)
4. [REST API contract design](04-api-contracts.md)
5. [Request and application data flow](05-request-dataflow.md)
6. [Commerce data flows](06-commerce-dataflows.md)
7. [Events, queues, and scheduled jobs](07-events-queues-jobs.md)
8. [Security and access design](08-security-and-access.md)
9. [Resilience, observability, and operations](09-resilience-observability-operations.md)
10. [Configuration and deployment design](10-configuration-deployment.md)
11. [Backend build sequence](11-backend-build-sequence.md)
12. [Validation checklist](12-validation-checklist.md)
13. [Backend decision register](registers/backend-decisions.md)
14. [Backend architecture and data-flow diagram](diagrams/backend-architecture.drawio)

Use [module design review](templates/module-design-review.md) before starting a module and [endpoint review](templates/endpoint-review.md) before accepting a REST operation.

## Fixed design principles

- Organize the codebase by business module, with a small platform foundation and no general-purpose business `shared` module.
- Keep HTTP transport, application use cases, domain rules, and infrastructure adapters distinct inside each module.
- Permit one module to change only the aggregates it owns. Cross-module work uses an explicit application contract or an event.
- Keep PostgreSQL transactions short and free of network calls.
- Commit business state, history, audit, and outbox records atomically where required.
- Treat every remote result as fallible and every SQS Standard message as potentially duplicated or out of order.
- Revalidate price, stock, coupon, delivery, tax, payment, and authorization against authoritative state at the command boundary.
- Return a stable idempotent outcome for replayed high-risk commands with the same canonical request; reject changed payloads under the same key.
- Keep customer, staff, provider callback, and operational surfaces separately authenticated, authorized, rate-controlled, and observed.
- Design the API and workers so loss of Valkey or OpenSearch does not corrupt orders, stock, or money.

## Relationship to authoritative plans

The [current context](../context/00-current-context.md), [system blueprint](../context/02-system-blueprint.md), and [domain rules](../context/03-domain-and-data-rules.md) define product and system intent. The [database pack](../database/README.md) owns table, constraint, lock-order, and migration design. This folder owns backend component boundaries, contracts, orchestration, integrations, and build sequencing.

If a backend proposal conflicts with a domain invariant or database transaction specification, the invariant and database specification win until a recorded decision changes them. Decisions marked proposed or blocked are not implementation facts.

## Official design references

- NestJS documents modules, providers, guards, pipes, interceptors, exception filters, versioning, OpenAPI, security, scheduling, and observability in its [official documentation](https://docs.nestjs.com/).
- AWS states that SQS Standard queues can deliver more than once and occasionally out of order; consumer effects therefore require durable deduplication. See [SQS Standard queues](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues.html) and [visibility timeout](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html).
- Auth0 requires API access tokens to be validated for signature and claims including the intended audience. See [Validate Access Tokens](https://auth0.com/docs/secure/tokens/access-tokens/validate-access-tokens).
- SSLCOMMERZ directs merchants to validate IPN notifications through its Order Validation API before updating transaction state. See the [SSLCOMMERZ developer guide](https://developer.sslcommerz.com/index.html).

## Change control

Record backend-specific choices in [backend decisions](registers/backend-decisions.md). Update the module map, affected data flows, build tasks, acceptance checks, and context handoff together. Do not silently turn a Release 2 candidate or unresolved policy into Release 1 behavior.
