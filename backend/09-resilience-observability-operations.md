# Resilience, observability, and operations

## Service objectives and signals

The NFRs are planning targets until D14 approval and load evidence. Backend signals must make them measurable without pretending that a configured alarm proves the target.

| Target | Backend indicators | Required evidence |
| --- | --- | --- |
| NFR-01 availability | valid request success by critical route class, excluding approved client errors | monthly calculation, synthetic journey, dependency attribution |
| NFR-02 latency | API route p50/p95/p99, checkout local transaction duration, DB wait/query, provider time | repeatable production-like mixed load and capacity headroom |
| NFR-04 search freshness | outbox age, search queue age, product projection delay/version gap | publish/change/delete/reindex freshness suite |
| NFR-05 recovery | restore duration, data loss point, post-restore reconciliation | timed clean restore and application readiness proof |
| NFR-07 security | finding severity/age, access-denial anomalies, secret/PII leakage checks | reviewed security report with no unresolved critical/high |
| NFR-08 correctness | invariant counts, duplicate financial effects, cross-owner access, negative available stock | concurrency/replay/reconciliation suites |
| NFR-09 dependency loss | cache/search/SQS/provider outage behavior | controlled fault scenarios and recovery catch-up |

## Telemetry model

### Traces

Create one trace for an inbound request, provider callback, scheduled run, or SQS receive. Propagate correlation/trace context through safe message attributes. Important spans cover authentication/authorization class, application use case, unit of work, named database operations, cache/search, SQS publish/receive, S3, and provider calls.

Do not use customer ID, email, phone, address, order contents, payment/provider payload, token, idempotency key, or high-cardinality raw reference as span attributes. Use route templates, module, use-case name, dependency, outcome code, environment, runtime role, and safe classification.

### Metrics

| Area | Core measures |
| --- | --- |
| API | requests, valid errors by stable code, duration, in-flight, timeouts, response size |
| Authentication/authorization | validation failures by safe reason, denied action class, revocation-cache freshness |
| Database | pool used/wait, transaction duration/rollback, lock/statement timeout, deadlock, slow operation class |
| Checkout/inventory | attempts, reconfirmations, stock conflicts, reservation age, allocation failures, paid-unallocated count |
| Payment/refund | initiation/validation result, pending/unknown age/value, mismatch, excess payment, reserved refund age/value |
| Queues/outbox | oldest age, visible/in-flight/DLQ count, receive count, processing duration/result, unpublished age |
| Search/cache | query latency/error, projection lag, reindex progress, hit/miss/eviction, fallback concurrency |
| File jobs | job age, rows read/valid/applied/rejected, bytes, checkpoint, export rows/age |
| Provider | calls/result/timeouts/throttles, circuit state, unknown outcome, reconciliation latency |
| Runtime | CPU, memory, event-loop lag, restart, graceful-shutdown completion, open connections |

Financial amounts do not become unrestricted metric labels. Aggregate values belong in controlled finance reports or low-cardinality protected metrics designed with finance/security.

### Logs

Use structured event records with timestamp, severity, service/runtime role, release, environment, event name, stable result/error code, route/use case, correlation/trace, safe resource type, duration, attempt, and dependency. Stack/error detail goes to restricted error tooling with redaction. Debug logging in production is time-limited and approved.

## Error taxonomy

| Category | Examples | Operator meaning |
| --- | --- | --- |
| Client validation | malformed or out-of-range field | expected product behavior; monitor abuse spikes |
| Authentication/authorization | invalid token, ownership deny, revoked grant | security/product signal; never expose target existence |
| Business conflict | quote changed, out of stock, invalid transition, stale version | expected concurrent behavior; measure UX/operations impact |
| Dependency transient | DB unavailable, provider timeout, SQS/OpenSearch error | retry/fallback/circuit according to adapter policy |
| External unknown | payment/refund call may have succeeded | reconciliation required; do not blind retry |
| Data invariant | amount/quantity/history mismatch | high-severity correctness incident |
| Configuration/release | missing config, unsupported schema/event version | fail startup/readiness or affected work safely |
| Internal defect | unexpected exception | capture, alert by critical path/error budget |

## Health model

| Probe | Purpose | Behavior |
| --- | --- | --- |
| Liveness | process can make progress | shallow, no remote cascade; failure triggers replacement |
| Readiness: API | instance can safely serve its route set | bounded checks/config/startup state; remove from traffic on critical failure |
| Readiness: worker | consumer can safely receive its work | role config, DB/queue/provider prerequisites appropriate to worker |
| Startup | initialization/migration compatibility complete | prevent traffic before safe initialization |
| Dependency dashboard | diagnose downstream state | detailed protected view; not coupled directly to liveness |

An OpenSearch or Valkey failure should not make every API route unready if safe fallback exists. A PostgreSQL failure makes commercial API writes unready but should not create restart storms through an over-sensitive liveness probe.

## Dependency resilience matrix

| Dependency | Timeout/fallback | Write safety | Recovery |
| --- | --- | --- | --- |
| PostgreSQL | fail fast within request budget; no cache-authoritative write | do not claim success on unknown commit; resolve by idempotency/reference | reconnect with jitter, reconcile in-flight operations |
| Valkey | short timeout; bounded DB fallback or omit acceleration | no authorization/commerce truth depends solely on cache | warm naturally/event refresh; monitor DB load |
| OpenSearch | bounded timeout; category/exact lookup fallback where approved | checkout always PostgreSQL | process backlog or reindex/catch up/switch alias |
| SQS | outbox accumulates | local commit remains valid | dispatcher catches up; monitor age/capacity |
| SSLCOMMERZ | strict connect/total deadline; pending/unknown result | validate before success; query before repeat | scheduled/manual reconciliation |
| Auth0/JWKS | bounded cached keys under safe rotation policy | never bypass auth; existing validated session behavior follows policy | refresh keys/config, incident on prolonged login loss |
| S3/CloudFront | safe missing-media/private-file response | catalog/order facts remain | retry processing/grants; object reconciliation |
| Email | retry/record failure | notification never changes business state | backlog/retry/provider switch plan |
| Telemetry | bounded nonblocking export | no request failure solely from telemetry exporter | buffer/drop by policy and alert on observability loss |

## Circuit and retry policy

- Retry only operations classified safe and only within the caller deadline.
- Use jitter and respect provider retry hints/rate limits.
- Limit retries at one layer to prevent multiplicative storms.
- A circuit protects a failing dependency but does not manufacture a successful business result.
- Half-open probes are low volume and observable.
- Database retries rerun the entire idempotent unit of work, not a partial statement sequence.
- Payment/refund unknown outcomes leave the normal retry path and enter reconciliation.

## Alert priorities

| Priority | Examples | Response |
| --- | --- | --- |
| Critical | payment correctness invariant, duplicate/excess financial effect surge, cross-customer exposure, confirmed order without allocation/funding | page immediately, contain affected action, preserve evidence |
| High | checkout failure/latency breach, DB saturation, provider unknown backlog, outbox/payment DLQ age, paid-unallocated order | urgent operator response and business queue ownership |
| Medium | search freshness breach, notification backlog, import/export failure, cache eviction/fallback load | work-hours response under runbook unless launch event raises severity |
| Low | trend/capacity warning, noncritical job delay | planned remediation/review |

Every alert has a symptom, business impact, owner, threshold/window, dashboard, first checks, safe mitigation, escalation, and resolution evidence. Alert on age and impact, not only counts.

## Required runbooks

- API elevated error/latency and database pool exhaustion;
- database failover/outage and unknown commit resolution;
- checkout stock contention or invariant failure;
- payment callback failure, validation mismatch, pending/unknown and excess payment;
- reservation expiry and paid-but-unallocated order;
- refund unknown/failed and reserved-balance aging;
- SQS outage, outbox backlog, poison message, DLQ review/replay;
- OpenSearch outage, stale projection and full reindex/alias switch;
- Valkey outage and PostgreSQL fallback overload protection;
- Auth0 login/JWKS/revocation issue;
- S3/media/private export failure;
- import partial failure and safe resume;
- security/PII/secret exposure response;
- deployment abort/rollback and data forward repair;
- backup restore and post-recovery commerce reconciliation.

## Operational controls

- Disable or restrict a risky command through an approved release control with owner, expiry, and visible operator/customer behavior.
- Pause a consumer by queue/runtime role without disabling unrelated work.
- Replays, reindex, reconciliation, imports, exports, repairs, and break-glass actions use bounded jobs with audit.
- Do not expose provider credentials, raw SQL consoles, arbitrary queue payload mutation, or unrestricted database edits through an admin UI.
- Support-facing error/reference lookup returns only fields allowed by current permission.

## Recovery reconciliation

After database restore or major outage, verify:

1. schema/migration history and runtime role privileges;
2. order totals and line snapshots;
3. stock positions, movements, active reservations, and allocations;
4. payment/refund provider results after the recovery point;
5. outbox publication gaps and consumer receipt/effect relation;
6. settlement matches and unresolved financial exceptions;
7. search projection versions and required reindex;
8. notification/import/export jobs with uncertain outcome;
9. secrets/config access and health/readiness;
10. a controlled synthetic and, when authorized, live reconciliation journey.

Restoring the database is only one step of service recovery.

## Performance design

- Set route-specific budgets whose sum includes edge, API, pool wait, queries, and safe external work.
- Keep checkout local transaction within the proposed one-second target under agreed contention, while the complete hosted-payment journey has a separate target.
- Use the query/index plan in [database performance](../database/05-indexing-and-performance.md).
- Reject unbounded lists, wildcards, deep offsets, large synchronous exports, N+1 query patterns, and per-item provider calls.
- Batch only where invariants and response/error ownership remain clear.
- Load-test with realistic line counts, hot final-unit contention, callback bursts, staff/report activity, and worker catch-up.
- Record saturation point, limiting resource, autoscaling lag, failure behavior, and safe operating headroom.

## Operational acceptance

Production readiness requires trace correlation across API/outbox/SQS/worker, redaction review, role-specific dashboards, tested alerts/runbooks, dependency-loss exercises, graceful shutdown evidence, sustained load/catch-up evidence, clean restore within approved objective, and finance/stock reconciliation after recovery.
