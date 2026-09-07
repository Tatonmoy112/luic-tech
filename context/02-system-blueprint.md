# System blueprint

**Architecture style:** Modular monolith with separately deployed web, API, and workers  
**Status:** Proposed Release 1 design; exact versions, region, sizing, and vendor accounts remain readiness work

## Logical topology

AI-DLC Construction uses this blueprint and the detailed backend/database packs as technical inputs for the selected Unit. [Units](aidlc/execution-map.md) organize delivery outcomes; they do not create additional services or authorize cross-module writes. Before a Bolt changes topology, contracts or data ownership, record its architecture impact and update the owning decision/design with the change.

1. Customer and staff browsers connect through CloudFront, WAF, and managed TLS.
2. The edge routes allowed requests to the Next.js web service on ECS Fargate.
3. The web service uses the NestJS API for controlled commerce operations and Auth0 for the approved authentication flow.
4. SSLCOMMERZ notifications reach a dedicated bounded API callback path.
5. The API uses PostgreSQL for commercial truth and may use Valkey, OpenSearch, and S3 within their stated boundaries.
6. PostgreSQL outbox records are dispatched to purpose-specific SQS queues and dead-letter queues.
7. Independently scaled NestJS workers consume payment, notification, search, import, export, and maintenance work.
8. Web, API, and workers emit correlated, redacted signals through OpenTelemetry, Sentry, and CloudWatch.

This topology is logical. Final VPC, subnet, load-balancer, origin, and account boundaries require the region and platform design tasks.

## Deployable components

| Component | Responsibility | Scaling signal | Failure boundary |
| --- | --- | --- | --- |
| Web | SSR public/store/admin interface, secure session boundary, API mediation where designed | Request rate, latency, CPU/memory | Public/admin UI may degrade while API facts remain intact |
| API | REST/OpenAPI, validation, authorization, transactional commands and queries | Request/latency, CPU/memory, DB pressure | Stop unsafe writes if DB/dependency truth unavailable |
| Outbox dispatcher | Publish committed domain events to SQS | Oldest unpublished outbox age and volume | Domain commit remains valid; side effects delay |
| Payment worker | Verify notifications, reconcile attempts/refunds, serialize financial state | Financial queue age and pending state age | Never infer success; expose exception for finance |
| Notification worker | Send versioned transactional messages and record outcome | Queue age/failure rate | Order remains valid if delivery fails |
| Search worker | Maintain versioned OpenSearch product projection/reindex | Search update age, error rate | Browse fallback; checkout still authoritative |
| Import/export worker | Validate/process bounded files and produce private outputs | Job age, error volume, object size | Partial work remains reviewable and restart-safe |
| Reservation/reconciliation scheduler | Expire reservations and find unresolved operational states | Backlog age/count | Conditional transitions prevent duplicate release/action |

Workers may share a codebase and deployment artifact while scaling or scheduling independently. Split into new services only after ownership, throughput, deployment, or reliability evidence justifies it.

## Domain modules

| Module | Owns | May depend on | Must not do |
| --- | --- | --- | --- |
| Identity/customer | Auth0 subject link, customer profile, addresses, app roles, guest access | Auth0 verification, audit | Treat identity-provider role as sufficient record authorization |
| Catalog/media | Products, variants, attributes, categories, prices, publication, media references | S3/media processing, outbox | Rewrite historical order lines |
| Inventory | Stock ledger, stock position, reservation, allocation, inspection disposition | Order identifiers, audit | Let catalog/cart/fulfillment directly mutate available stock |
| Cart/pricing/promotion | Durable cart, quote, coupon eligibility/hold | Catalog, inventory read, customer | Treat cart total as final checkout truth |
| Checkout/order | Idempotent attempt, order snapshot, state/history | Pricing, inventory, payment intent | Call remote provider while holding transaction locks |
| Payment/refund | Attempts, provider receipts/validation, reconciliation, refund balance/state | Orders, finance permissions, outbox | Accept browser return as payment authority |
| Fulfillment/return | Shipment, tracking, delivery exception, return line/inspection | Order/payment eligibility, inventory | Deduct allocated stock again on dispatch |
| Notification | Templates, request and outcome | Domain events, provider | Authorize or reverse business actions |
| Reporting/audit | Projections, definitions, exports, attributable activity | All owned facts through controlled reads/events | Overwrite source transactions from a report |

## Source-of-truth matrix

| Information | Authority | Derived copies and rule |
| --- | --- | --- |
| Sellable catalog and current price | PostgreSQL catalog/pricing records | Valkey/OpenSearch/CDN may lag; checkout revalidates |
| Cart | PostgreSQL durable cart | Valkey may accelerate; loss must not create an order error or access grant |
| Stock and reservation | PostgreSQL inventory ledger/position | Search/cache show only indicative availability |
| Order and state history | PostgreSQL order records | Reporting/read projections cannot modify them |
| Payment/refund state | PostgreSQL after verified provider evidence | Provider is external evidence; browser/cache/event alone is insufficient |
| Product binary media | S3 object plus approved DB metadata/publication | CloudFront caches approved versioned object paths |
| Authentication | Auth0 token/session evidence | Application owns authorization, revocation overlay, and record ownership |
| Search result | OpenSearch projection | Rebuildable from authoritative catalog/outbox sequence |
| Queued work | PostgreSQL outbox before publish; consumer record during local effect | SQS is transport and may duplicate delivery |
| Metrics/logs/traces | Monitoring systems | Observability is diagnostic, not commercial truth |

## API contract principles

- Version the public contract and publish reviewed OpenAPI descriptions.
- Separate customer, staff, and machine callback surfaces.
- Validate payload shape, size, enumerations, money/currency, references, pagination, filters, and state preconditions.
- Authenticate tokens and authorize role, scope, record ownership, and action on the server.
- Use consistent problem/error categories, stable correlation IDs, and no secrets or personal data in error details.
- Use idempotency on commands that can duplicate orders or external effects; store payload identity with the result.
- Use optimistic conflict behavior for staff edits and state preconditions for transitions.
- Bound list pages, search filters, exports, uploads, webhook traffic, login attempts, and checkout attempts.
- Specify cache policy explicitly. Customer, cart, checkout, order, admin, and callback data must not enter shared public caches.

## Persistence and transaction boundaries

PostgreSQL transactions protect local changes that must succeed or fail together: checkout order plus reservation plus coupon hold plus payment intent plus outbox; verified payment plus reservation allocation plus state history plus outbox; refund balance reservation plus history plus outbox; stock movement plus position plus audit.

Remote Auth0, SSLCOMMERZ, email, S3 processing, OpenSearch, and SQS calls occur outside short database lock windows. Unknown outcomes are reconciled through stable references, status queries where available, and review queues.

Use relational constraints and conditional updates in addition to application validation. Review unique SKU, provider/reference, event, idempotency, nonnegative quantity, eligible transition, and refund-balance constraints. Apply migrations through backward-compatible expand, backfill/verify, switch, and later contract steps.

## Asynchronous reliability

1. Write domain change and outbox event in one transaction.
2. Publish after commit using a stable event ID, aggregate ID/version, event type/schema, timestamp, and correlation ID.
3. Assume Standard SQS may deliver a message more than once and out of order.
4. Record local consumer idempotency together with its local effect.
5. For external effects, use provider idempotency when documented; otherwise query/reconcile an unknown result before retry.
6. Use bounded exponential backoff/jitter, correct visibility timeouts, dead-letter queues, alerts, and controlled replay.
7. Delete only after durable success. A DLQ replay requires an operator, reason, bounded batch, and recorded result.

## Caching and search

Use Valkey for bounded hot catalog data, cart acceleration, session/abuse needs selected in design, and rate-control support. Separate protected session/security use from evictable cache if necessary. Define TTL, namespace, invalidation, stampede control, fallbacks, and load limits for every cache.

OpenSearch stores a versioned published-product projection. Old events cannot overwrite newer documents. Deletions require tombstones or authoritative resolution. Reindex into a new index, catch up events, verify counts/sample queries, and switch an alias. During failure, provide bounded category/exact-SKU browse if safe and clearly explain advanced-search unavailability.

## Security boundaries

- Private application/data subnets and no public DB/cache/search endpoints.
- Least-privilege workload identities and security groups; controlled egress.
- CloudFront private S3 origin and explicit origin bypass protection.
- Secure HttpOnly SameSite session cookies and appropriate CSRF defense.
- Access-token issuer, audience, signature, expiry, and scope checks; application role and ownership checks.
- Separate sandbox, staging, and production secrets/configuration; managed storage and rotation.
- Bounded signed upload grants, type/size inspection, processing/quarantine, controlled publication.
- Short-lived authorized downloads for private exports/documents.
- Data minimization and redaction across logs, traces, errors, URLs, queue messages, and support tools.
- Dependency/container/IaC scanning, protected branches/environments, and short-lived GitHub-to-AWS identity.
- Append-only attributable audit for sensitive staff and operational actions.

## Failure behavior

| Dependency failure | Safe behavior |
| --- | --- |
| PostgreSQL | Do not accept new commercial writes or claim payment recorded; preserve/reconcile provider callbacks |
| Valkey | Use bounded DB fallback where safe; never lose transactional truth or grant access |
| OpenSearch | Provide bounded fallback; keep checkout correct and queue projection updates |
| SQS | Accumulate committed outbox work and alert; resume duplicate-safe dispatch later |
| SSLCOMMERZ | Keep attempt pending/unknown; query/reconcile; avoid opening repeated charges blindly |
| Auth0 | Do not bypass authentication; valid existing sessions follow policy, new login may pause |
| Email | Keep order state; retry and expose backlog/outcome to operators |
| S3/CDN | Preserve catalog facts; explain unavailable media/private export and retry safely |
| New deployment | Stop promotion, keep compatible previous artifact, use forward repair for data when required |

## Architecture completion evidence

Architecture readiness requires an approved decision record, exact-version compatibility matrix, selected region/service assessment, threat model, data model review, API conventions, queue/cache/search policies, migration approach, capacity assumptions, observability specification, and recovery/release design. These are tasks in the master catalog and are not yet complete.
