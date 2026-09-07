# Stage 4: Solution architecture

**Status:** Proposed design for Release 1; no system has been implemented or benchmarked.

**Owner:** Technical lead. **Inputs:** Stage 2 requirements, Stage 3 scope, D01-D16 assumptions.

**Source review date:** 5 September 2026.

## 1. Architecture decision

Use a modular NestJS monolith with PostgreSQL transaction boundaries and independently deployed Next.js web, NestJS API, and worker services. This gives the initial team one coherent commerce domain while allowing different scaling and release needs. Separate modules through explicit ownership and interfaces; do not introduce distributed transactions merely to split services.

The primary design objective is correct orders, money, and stock during retries, outages, and concurrency. Managed infrastructure supports operations but does not replace application invariants.

## 2. Technology baseline and alternatives

| Layer | Proposed launch decision | Rationale and condition |
| --- | --- | --- |
| Web | Next.js 16, React, TypeScript | SSR/public SEO, responsive customer and admin interfaces; pin a supported React/Next patch set |
| UI | Tailwind CSS and shadcn/ui | Shared tokens/components with accessible interaction review |
| API and workers | NestJS, Node.js 24 LTS | One TypeScript domain model; exact Nest major/patch chosen at compatibility gate |
| API contract | REST with versioned OpenAPI documentation | Explicit authentication, validation, errors, pagination and idempotency |
| Primary data | PostgreSQL 18, RDS Multi-AZ | Relational constraints and transactional consistency; choose region-supported patch |
| ORM | Drizzle with PostgreSQL driver | Explicit transactions and reviewed migrations; ORM typing does not enforce business correctness |
| Cache | ElastiCache Valkey 9.x | Disposable hot data, cart acceleration, session support, abuse counters; validate region/mode |
| Cache client | Valkey GLIDE preferred | Confirm Node.js 24, runtime architecture, TLS and selected engine support; mature compatible client fallback by decision |
| Search | Amazon OpenSearch Service, supported engine/client pair | Product search/facets; not an authoritative inventory or finance database |
| Queue | SQS Standard queues plus dead-letter queues | Independent worker throughput with duplicate-safe consumers |
| Objects | AWS S3 | Public product media through CDN; private exports/documents with scoped access |
| Edge | CloudFront, AWS WAF, managed TLS | One primary edge provider; approved DNS/domain management required |
| Payments | SSLCOMMERZ hosted checkout | Merchant account and supported methods/refunds validated before launch |
| Identity | Auth0 | Customer/admin authentication; application still owns commerce permissions and record access |
| Compute | ECS Fargate for web, API and workers | Containerized deployment without Kubernetes operations |
| Observability | OpenTelemetry, CloudWatch, Sentry | Correlated traces/metrics/logs and errors with redaction |
| Delivery | GitHub Actions | Reviewed changes, bounded deployment identities, staged promotion |
| Infrastructure definition | OpenTofu | Choose one tool; secure remote state, locking, reviewed changes |

**Alternatives:** Aurora PostgreSQL requires a measured availability/scale/cost reason; it is not automatically selected alongside RDS. Cloudflare may replace the edge choice if its operational value is approved; avoid layering two full-page caches without a clear need. Elasticsearch is an alternative engine, not assumed API-identical to OpenSearch. RabbitMQ suits distinct routing requirements and Kafka suits durable event replay/streaming needs; traffic growth alone does not justify replacing SQS. Kubernetes requires an operating model and workload benefit. Terraform is an acceptable alternative to OpenTofu after ownership, license, and provider support review.

Official sources confirm [Node.js 24 LTS](https://nodejs.org/en/about/previous-releases), [Next.js 16 runtime requirements](https://nextjs.org/docs/app/guides/upgrading/version-16), [RDS PostgreSQL 18 releases](https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-versions.html), and [ElastiCache Valkey 9.0 documentation](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/engine-versions.html). [Aurora's release calendar](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraPostgreSQLReleaseNotes/aurorapostgresql-release-calendar.html) also lists PostgreSQL 18. This verifies documented options, not availability in an unselected account/region.

Compatibility evidence must cover [NestJS's current runtime/module requirements](https://docs.nestjs.com/migration-guide), [GLIDE's supported clients](https://glide.valkey.io/overview/), and the selected [OpenSearch service engine](https://docs.aws.amazon.com/opensearch-service/latest/developerguide/what-is.html). Do not pin unseen patch versions in this plan.

## 3. System topology and trust boundaries

| Path | Planned flow and access boundary |
| --- | --- |
| Customer/admin browser | HTTPS -> CloudFront/WAF -> load balancer -> Next.js on Fargate |
| Web commerce actions | Next.js session boundary -> NestJS API -> PostgreSQL or supporting service |
| External payment notifications | Dedicated public API ingress -> bounded receipt validation -> durable inbox -> payment verification worker |
| Authentication | Browser redirects to Auth0; web exchanges authorization response; backend validates API access tokens |
| Static/media delivery | CloudFront -> private S3 origin; published product media exposed through approved paths |
| Async side effects | PostgreSQL outbox -> dispatcher -> SQS -> workers -> provider/read model |
| Operations | Restricted admin console plus audited infrastructure access; no public database/search/cache endpoints |

Use private application/data subnets, least-privilege security groups and service identities, encrypted service connections, and controlled outbound access. Restrict origin access so bypassing CloudFront does not bypass intended edge controls. Payment callbacks need a dedicated machine-facing path that does not require a browser challenge or customer login.

Propose at least two web and two API tasks across availability zones. Scale workers separately using queue age and throughput. Use a managed Multi-AZ database, replicated cache, and a search topology sized for the approved availability target. The selected region must support the proposed service/AZ layout. No task sizes or infrastructure bill are claimed without a sizing exercise.

## 4. Domain ownership

| Module | Owns | Boundary rule |
| --- | --- | --- |
| Identity/customer | Auth0 subject linkage, customer profile, addresses, staff permissions | Auth0 authenticates; API authorizes each record/action |
| Catalog/media | Products, variants, attributes, prices, publication, image references | Archived products remain referenced by historical order snapshots |
| Inventory | Stock position, movement ledger, reservations, allocation, inspection disposition | Only inventory rules mutate available stock |
| Cart/pricing/promotions | Durable carts, quotations, discounts, redemption reservations | Cart values are advisory; checkout recalculates |
| Checkout/orders | Checkout attempts, immutable order lines/totals, state history | Local order creation and stock reservation share one transaction |
| Payments | Attempts, provider identifiers, validation evidence, reconciliation, refunds | No client or search/cache event may declare payment success |
| Fulfillment/returns | Shipment state, tracking, return lines, inspection | Dispatch and restocking require valid upstream states |
| Notifications | Templates, delivery jobs and outcomes | Message delivery failure never reverses a committed order |
| Reporting/audit | Read models, authorized exports, attributable activity | Derived reports do not overwrite transactional facts |

## 5. Conceptual data model and invariants

Customers have many addresses and orders; guest orders may have no customer link. Products have many variants and media assets. Each variant has a stock position per location, movements, and reservations. Carts have lines; a checkout creates an order with snapshot lines. Orders have multiple payment attempts, at most one launch shipment, and potentially several return/refund records. Refund lines reference the original order lines and payment allocation. Outbox events, incoming notifications, idempotency results, and audit records support safe processing.

This is a conceptual model, not a SQL schema or migration.

- Use exact monetary arithmetic, explicit currency, and finance-approved rounding. Never floating-point arithmetic for money.
- Record item, discount, tax, shipping, and refund allocations so totals can be reconciled without current catalog prices.
- Enforce unique SKU, provider transaction/reference where appropriate, event ID, and scoped idempotency key constraints.
- Keep foreign-key relationships and nonnegative quantity constraints. Serialize competing stock and refund decisions with row locks or conditional atomic updates.
- Within this model, sellable on-hand includes reserved stock; available = sellable on-hand minus active reservations. Payment allocation atomically reduces sellable on-hand and reserved quantity once, and records a movement. Physical dispatch must not deduct that same allocation again. A separate physical-location view may include packed allocated goods.
- Keep damaged/quarantined returns outside sellable stock until inspection. Manual adjustments require reason, actor, and permission.
- Store UTC instants and display Asia/Dhaka business time. Preserve financial history; deletion/anonymization follows approved retention policy.
- Use reviewed additive migrations, backfill validation, compatibility windows and later cleanup. Restore backup is not the normal rollback for an application release.

Drizzle provides [transaction support](https://orm.drizzle.team/docs/transactions); transaction scope and concurrency policies remain deliberate design responsibilities.

## 6. Checkout, reservation and payment flow

1. Resolve guest/customer ownership and a persisted checkout idempotency key. Same key and same payload return the existing result; changed payload returns a conflict. Proposed retention is seven days with longer order/payment uniqueness; final policy belongs to technical acceptance.
2. Recalculate current prices, coupon eligibility, delivery/tax, quantity limits, and publication status. Show changed totals for confirmation.
3. In one short PostgreSQL transaction, lock/conditionally reserve all required stock in stable SKU order, reserve limited coupon usage, persist order snapshots and payment-attempt intent, and write outbox records. If any line fails, roll back the whole checkout.
4. After commit, initiate the gateway session using a unique merchant transaction reference. Do not hold database locks during network calls. On timeout, reconcile the existing attempt before opening another; never assume timeout means the provider did nothing.
5. Redirect to hosted checkout. The return page displays pending/verified status from the API; browser redirect parameters cannot authorize fulfillment.
6. Accept bounded payment notifications and durably record minimal necessary data before acknowledging. Worker processing performs provider validation. Duplicate input can safely return an acknowledgement once the receipt is durable; temporary persistence failure must remain retryable.
7. On a verified successful result, serialize against order, attempt and reservation state. Record payment once and convert an active reservation to allocation. Emit order-confirmed work only when all release conditions are met.
8. A separate sweeper expires reservations using database time and conditional transitions. It releases stock/coupon holds once and races safely against payment confirmation.
9. If payment succeeds after expiry, try a fresh atomic allocation under current stock rules while preserving the paid price snapshot. If unavailable, mark paid-but-unallocated and hold fulfillment for finance/customer resolution, usually refund. Never silently substitute goods or create negative stock.
10. If two payment attempts eventually succeed for the same order, preserve both receipts, allocate goods once, and open an excess-payment refund case.

Proposed reservation duration is 15 minutes, pending provider session behavior and D07 approval. Search/cart stock is indicative; PostgreSQL decides purchase eligibility.

## 7. Payment and refund controls

The provider documents server-side initiation, IPN validation, transaction queries, refund initiation/status queries, and registered public IP requirements for refund access. It also distinguishes an initiated refund from its later outcome. See [SSLCOMMERZ v4 documentation](https://developer.sslcommerz.com/doc/v4/).

**Proposed application controls:**

- Validate successful provider result, merchant/environment, transaction identity, expected currency and original payable amount before accepting payment. Preserve risk status for review.
- Use separate sandbox/live credentials in managed secrets. Redact credential-bearing URLs, query strings, callback fields, and payment metadata from logs/traces.
- Register controlled outbound IPs for refund operations where required; include all failover egress IPs in the merchant onboarding check.
- Reconcile pending/unknown attempts periodically, initially every five minutes with provider-approved limits; finance reviews settlement mismatches daily.
- Reserve refund balance atomically before submission. Completed plus pending refunds cannot exceed the eligible successful payment balance; concurrent requests cannot over-refund.
- Give each refund a stable unique reference. On uncertain timeout, query/reconcile before resubmission. Mark completed only after verified final status.
- Verify all provider status mappings in sandbox and with merchant support, including ambiguous documented refund cancellation wording. Unknown states remain under review.
- Require approval reason and finance authority. Partial refunds allocate merchandise, discount, tax and delivery components using the approved policy.
- Process return inspection and money independently; neither return receipt nor refund request automatically restocks goods.

These controls are proposed system design, not a claim that the provider guarantees idempotency or a particular settlement/refund timeframe.

## 8. State models

| Aggregate | Normal progression | Exceptions and guards |
| --- | --- | --- |
| Order | Pending payment -> confirmed -> completed | Cancelled before fulfillment; on hold for payment risk/stock/review; completion requires delivered state |
| Payment attempt | Created -> pending -> succeeded | Failed, cancelled, expired, or unknown; verified late success handled without overwriting earlier evidence |
| Reservation | Active -> committed allocation | Released or expired; terminal transition exactly once |
| Fulfillment | Unallocated -> allocated -> picking -> packed -> shipped -> delivered | Failed delivery/return-to-origin reviewed; shipped order cannot be casually cancelled |
| Return | Requested -> approved -> received -> inspected -> resolved | Rejected with reason; quantity cannot exceed eligible original quantity |
| Refund | Requested -> approved -> submitted -> processing -> completed | Rejected, failed, or unknown; retry requires evidence that it will not duplicate the action |

Payment, order, shipment, and refund state are separate dimensions. A refunded order still retains its original successful payment. Every transition checks actor permission, expected prior state, quantity/balance, and records history. Late events cannot blindly move a terminal state backwards.

## 9. Queue and event reliability

SQS Standard may deliver more than once, so consumers must tolerate duplicates. See [AWS delivery semantics](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/standard-queues-at-least-once-delivery.html).

Propose separate queues for payment verification, notifications, search updates, and exports/import work. Queue messages carry event ID, aggregate reference/version, event type, timestamp, schema version, and correlation ID; avoid unnecessary personal data.

Persist domain changes and an outbox event in the same database transaction. Dispatch after commit. If publishing succeeds but marking dispatched fails, republishing is safe through consumer deduplication. This follows the [transactional outbox pattern](https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/transactional-outbox.html).

Record consumer processing keys with local effects atomically. For external effects, use provider idempotency if supported, otherwise query/reconcile uncertain outcomes. Use bounded retries with jitter, visibility timeouts longer than processing with extension for long jobs, dead-letter queues, and alerting. Delete messages only after durable success.

Proposed DLQ review begins when any financial job arrives; other queue alarms depend on age and volume. Replay requires an operator, reason, bounded batch, duplicate safety, and recorded results. Ordering is enforced through aggregate versions/state guards; add FIFO only for a demonstrated ordering requirement, without claiming end-to-end exactly-once effects.

## 10. Cache, search and frontend behavior

Persist carts in PostgreSQL and accelerate reads in Valkey. Cache hot catalog/read models with bounded TTLs and change invalidation. Isolate security/session data from evictable cache workloads or use protected session storage; eviction must never grant access. A lost session requires reauthentication where needed.

OpenSearch receives versioned catalog projections through the outbox. Prevent old events from replacing newer documents; preserve deletion tombstones or resolve against current catalog state. Rebuild a new index from an authoritative snapshot, catch up changes, verify counts/sample results, and switch an alias. Checkout remains correct while the index is stale.

Next.js runs as ephemeral replicas. Define shared cache/invalidation behavior, deployment identity and compatible asset retention; per-instance invalidation alone is insufficient. Public catalog pages may be cached; account, cart, checkout, admin and personalized responses must bypass shared caches. Versioned media can use long TTLs. Follow [Next.js self-hosting guidance](https://nextjs.org/docs/app/guides/self-hosting) when validating future deployment behavior.

Use server-rendered public content, bounded product pagination, canonical/filter URL policy, meaningful image sizes/alt text, accessible forms, visible progress/errors, and mobile checkout review. Avoid depending on a browser-only search result for an order's true price.

## 11. Identity, API and security

Propose a web session boundary using secure, HttpOnly, SameSite cookies with appropriate CSRF defenses. Keep browser tokens out of persistent JavaScript-readable storage where possible. Auth0 performs authentication; API access tokens are checked for signature, issuer, audience, expiry and required scope. ID tokens are not API bearer authorization. See [Auth0 validation guidance](https://auth0.com/docs/secure/tokens/access-tokens/validate-access-tokens).

Keep record-level authorization and staff permission checks in NestJS. Disable a staff member's application access promptly rather than relying only on long-lived token expiry. Guest links use high-entropy expiring tokens stored safely, masked status views, and no personal data in URLs.

REST contracts define resource ownership, bounded pagination, validation, consistent error categories, correlation IDs, idempotent commands, and optimistic edit conflicts. Separate public customer endpoints, staff endpoints and machine callbacks. Limit payload size, filter complexity, export volume, login/checkout attempts and webhook floods.

Protect uploads using authorized bounded upload grants, file/type inspection, image processing or quarantine, and controlled publication. Private documents use short-lived download permission, not permanent public URLs. Add secret rotation, dependency/image scanning, restricted workload IAM roles, protected backups, data minimization, retention/deletion procedures, and append-only audit retention. Do not store raw payment card data.

## 12. Failure behavior and operating signals

| Failure | Customer/system behavior | Recovery and alert |
| --- | --- | --- |
| PostgreSQL unavailable | Do not accept new orders or claim payment recorded; public cached browsing may remain | Failover/restore; callback retry and provider reconciliation |
| Valkey unavailable | Bounded DB-backed catalog/cart fallback; protected actions retain conservative abuse limits or pause | Alert on fallback load; rebuild cache; no stock truth lost |
| OpenSearch unavailable | Bounded category/exact-SKU browse fallback; explain unavailable advanced search | Restore/rebuild; drain versioned updates |
| SQS unavailable | Persist outbox; committed order remains valid; downstream actions may be delayed | Alert on oldest outbox age; resume dispatch |
| Payment API unavailable | Existing attempt remains pending/unknown; no false failure or repeated charge request | Backoff, query reconciliation, finance review |
| Auth0 unavailable | Existing sessions work only within valid policy; new login blocked; approved guest flow may continue | Dependency status, no auth bypass |
| Email unavailable | Order state remains valid; status visible in account/guest view | Retry/DLQ; operator checks notification backlog |
| Deployment unhealthy | Stop promotion; revert compatible application revision | Preserve forward-compatible data and reconcile in-flight work |

Dashboards cover availability/latency, checkout success, unverified paid orders, reconciliation age, expired reservation backlog, stock anomalies, refund age, outbox/queue age, search lag, database connections/locks, cache evictions, and cloud cost. Use OpenTelemetry correlation across requests/jobs; Sentry for errors and CloudWatch for operational metrics/logs. Alert on actionable conditions with named responders and escalation.

## 13. Deployment, recovery and handover

Separate development, staging and production accounts/environments where practical, with isolated secrets and Auth0/payment configuration. Build immutable artifacts once and promote them. Use short-lived GitHub-to-AWS identities, reviewed infrastructure changes, restricted remote state, health/readiness gates, and explicit production release approval.

Plan backward-compatible schema changes before application rollout. Keep a rollback decision window, previous artifact, and incident commander. Stop if error rates, checkout anomalies or payment discrepancies breach the agreed release thresholds.

Propose encrypted automated DB backups with 14-day point-in-time retention, protected snapshots, S3 versioning/lifecycle, configuration/state recovery, and access recovery procedures. Retention remains subject to D13. Multi-AZ is availability protection, not protection from accidental deletion. Rehearse restoring to a clean environment and replay/reconcile financial events occurring after the restored point.

NFR-05 targets in Stage 2 apply to regional recovery. A region-wide disaster has no committed RTO/RPO in Release 1; evaluate cross-region backups and standby as a separately costed decision if required. A backup existing is not proof the one-hour recovery target can be met.

Handover includes service inventory, account owners, release process, restore evidence, payment/refund reconciliation runbooks, DLQ replay rules, catalog import procedure, staff training, on-call contact and monthly cost ownership.

## 14. Architecture acceptance before launch

- [ ] Correctness scenarios cover final-unit contention, duplicate/late payments, expiry races, double payment, partial refunds, and concurrent refund submissions.
- [ ] End-to-end provider status and refund mappings verified; live account, egress/IP requirements, and support route approved.
- [ ] Cache/search loss, queue outage and provider timeouts preserve financial/stock truth.
- [ ] Auth, ownership, admin permissions, guest links, uploads, secrets and private-cache boundaries verified.
- [ ] Approved load profile, accessibility, observability, backup/restore, deployment rollback and data import rehearsals have evidence.
- [ ] Operations/finance can run fulfillment, reconciliation, returns, and incident procedures with assigned cover.

All boxes remain pending. This document specifies future work; it does not report completed development.
