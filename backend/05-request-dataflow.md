# Request and application data flow

## Standard API request path

Every API operation follows the same ordered control path. Read-only operations may omit transaction steps; sensitive and mutating operations may add stronger controls.

1. **Edge admission:** CloudFront/WAF/load balancer applies TLS, allowed path/method, body limit, coarse abuse control, and origin restrictions.
2. **Request context:** API accepts or creates a valid correlation ID, records environment/runtime role, starts a trace, and sets a hard request deadline.
3. **Surface classification:** router identifies public, customer, staff, provider, or operations policy before handler execution.
4. **Authentication:** verify trusted service identity and, when required, Auth0 access-token signature, issuer, audience, expiry, and required claims; provider callbacks use their dedicated controls.
5. **Principal resolution:** map verified issuer/subject to active customer or staff account; resolve guest capability only through its dedicated verifier.
6. **Rate/abuse decision:** apply named limit by surface, actor, IP-derived safe key, operation risk, and dependency capacity.
7. **Transport validation:** validate content type, size, path/query/header syntax, allowed fields, enumeration, pagination, and command schema.
8. **Authorization:** evaluate current permission, target ownership/scope, action, amount threshold, dual-approval rule, and account/revocation state.
9. **Idempotency/precondition:** resolve idempotency record or expected aggregate version before business mutation.
10. **Application use case:** load required authoritative facts through module-owned repositories/contracts and run domain eligibility/calculation.
11. **Local transaction:** lock in documented order, perform guarded writes, append history/audit/outbox, assert reconciliation, commit or roll back.
12. **Post-commit integration:** update cache best-effort, publish or allow dispatcher to publish work, and perform only those remote calls whose workflow explicitly needs an immediate response.
13. **Presentation:** map domain result to the documented response without exposing internal rows or provider evidence.
14. **Telemetry:** record safe status/error code, duration, dependency timing, row/result counts where safe, and trace correlation; never record secret/PII payloads.

## Command pipeline

| Stage | Input | Output | Failure behavior |
| --- | --- | --- | --- |
| Decode | raw transport | typed request | 400, no business access |
| Authenticate | credentials/session evidence | verified external principal | 401, no account inference |
| Resolve actor | external principal/guest token | application actor and authority version | 401/404/403 under enumeration policy |
| Authorize | actor + action + target context | allow/deny and approval constraints | deny before mutation; audit sensitive denials as approved |
| Deduplicate | actor + operation + key + canonical hash | new or prior operation record | prior same result or 409 changed payload |
| Validate business | command + authoritative facts | eligible domain decision | 409/422 with safe stable code |
| Commit | decision + expected versions | durable state/history/outbox | retry only classified transient local failures within deadline |
| Integrate | durable reference | provider/queue/cache outcome | pending/unknown/retryable state; never erase commit |
| Present | application result | public DTO/problem | redact by audience |

## Query pipeline

1. Authenticate and authorize before loading protected detail.
2. Apply ownership/scope predicate inside the authoritative query, not through response filtering.
3. Select only fields required by the response model.
4. Use a documented index path, bounded filters, stable sort, and cursor.
5. Load derived search/cache data only under its freshness and fallback contract.
6. Convert internal states into audience-safe status without collapsing distinct payment, order, shipment, return, and refund dimensions.
7. Mark report definition, timezone, currency, and freshness where business interpretation depends on them.

## Transaction ownership

| Pattern | Boundary |
| --- | --- |
| Single aggregate command | owning application use case begins and closes the unit of work |
| Coordinated commerce command | named orchestrator owns the unit of work and calls transaction-aware module capabilities |
| Worker local effect | consumer receipt and local state effect commit together |
| Remote effect | local intent/evidence commits before call; result commits in a later transaction |
| Batch job | job lease/checkpoint plus bounded row batches; never one transaction for the full file |

A repository never starts a hidden independent transaction inside an existing commerce command. Nested behavior and retry policy must be explicit in the unit-of-work contract.

## Database error handling

| Database outcome | Application response/action |
| --- | --- |
| Known unique conflict | stable duplicate/conflict business code; retrieve prior idempotent result where applicable |
| Expected-version update affects no row | precondition/state conflict; reload safe current version |
| Stock/coupon conditional update fails | out-of-stock/cap/quote-changed result; roll back all checkout effects |
| Serialization/deadlock classified transient | retry the whole local unit within strict attempt/deadline bound and preserve idempotency |
| Statement/lock timeout | abort transaction; return retriable busy/dependency result where safe and emit contention signal |
| Connection loss before known commit | resolve through idempotency/resource lookup; never blindly repeat high-risk operation |
| Constraint violation indicating defect | roll back, stable generic response, high-severity internal signal with constraint name only |

## External client policy

Every adapter declares:

- endpoint/environment and permitted egress destination;
- authentication secret owner and rotation path;
- connect, headers, body, and total deadline;
- safe retryable operations/statuses and maximum attempts;
- provider idempotency/reference capability;
- unknown-outcome classification and reconciliation query;
- concurrency/rate limit and circuit/open behavior;
- request/response size and redaction schema;
- metrics, trace propagation where supported, and alert thresholds;
- sandbox/live differences and contract test evidence.

An HTTP library default is not an integration policy.

## Cache data flow

1. Define a namespace, key composition, schema version, owner, TTL, maximum size, and sensitivity class.
2. Read through only where PostgreSQL fallback is safe and bounded.
3. Include authoritative version/freshness metadata in values where stale overwrite is possible.
4. Invalidate or refresh after commit through event processing; a failed invalidation leaves only a bounded stale read.
5. Prevent stampedes with bounded coalescing/jitter and protect PostgreSQL with fallback concurrency limits.
6. Never store guest raw tokens, unrestricted customer responses, provider secrets, or authorization decisions beyond their approved revocation bound.

## OpenSearch data flow

1. Product/pricing/media/stock changes commit with aggregate version and outbox event.
2. Dispatcher publishes the stable event to the search queue.
3. Search worker checks durable consumer receipt and current projection version.
4. Worker loads the complete publishable document from authoritative modules rather than patching from an untrusted partial event.
5. Worker applies create/update/tombstone using per-product/index projection generation. Independent stock, price and product aggregate versions are not comparable; see [C06 in readiness corrections](readiness/03-contract-and-model-corrections.md).
6. Worker records projection version, index, event, timestamp, and result.
7. API search uses bounded timeout and returns a documented degraded result or fallback when unavailable.
8. Checkout ignores search price/stock and performs full PostgreSQL revalidation.

## SQS consumer data flow

1. Long-poll a bounded message batch under role-specific concurrency.
2. Validate envelope version, event ID/type, payload size/hash, correlation, and required references.
3. Reject/quarantine unsupported or malformed messages with safe evidence; do not loop infinitely.
4. Start trace context and load the durable consumer receipt key.
5. If local-only effect: insert receipt with the effect in one transaction.
6. If external effect: persist attempt/intent, call outside transaction, then persist result; ambiguous outcome becomes unknown/reconciliation.
7. Delete SQS message only after durable success or a documented terminal handling result.
8. Allow redelivery on process failure. Extend visibility only for bounded known work.
9. Move repeatedly failing work to DLQ under redrive policy and alert by oldest age/business risk.

## Scheduled-job data flow

- ECS/EventBridge or the selected scheduler emits a job trigger with a unique run reference.
- A durable lease/run record prevents unsafe overlap.
- The scheduler finds candidates with database time and bounded index-supported queries.
- Each candidate is reloaded and mutated in its own guarded transaction.
- Work beyond the run budget checkpoints and schedules continuation.
- Completion records scanned, changed, skipped, failed, duration, and high-water mark.
- Another scheduler run or manual replay is safe because transitions and operation keys are idempotent.

## Logging boundary

Log event name, outcome code, correlation, safe actor class, resource type/reference where permitted, duration, attempt count, dependency name, and trace linkage. Do not log request/response bodies by default. Specifically exclude authorization headers, cookies, tokens, addresses, email, phone, raw query terms if sensitive, provider credentials, complete IPN payloads, signed S3 URLs, database bind values, and stack traces returned to clients.
