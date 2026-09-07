# Events, queues, and scheduled jobs

## Reliability model

PostgreSQL commit is the point at which local business state becomes authoritative. An outbox event written in that same transaction describes work to publish after commit. SQS Standard is transport and can duplicate or reorder delivery. A worker therefore proves whether its effect has already happened through a durable consumer receipt, operation key, aggregate version, or provider reconciliation.

No event alone authorizes stock, order, payment, refund, or access changes. The receiving use case reloads current authoritative state and rechecks its guard.

## Event envelope

Every published event carries these conceptual fields:

| Field | Purpose |
| --- | --- |
| Event ID | globally stable deduplication identity from the outbox row |
| Event type | stable business fact name in past tense |
| Event schema version | payload compatibility and evolution |
| Aggregate type/ID/version | ordering within that aggregate only; search uses a separate per-product/index generation |
| Occurred at | UTC commit-related fact time |
| Available at | optional deferred-processing boundary |
| Correlation and causation IDs | trace the originating request/event without embedding secrets |
| Producer | logical module and release identity |
| Payload | bounded identifiers and safe immutable facts needed to locate/rebuild work |

Payloads exclude access tokens, raw guest tokens, cookies, full addresses, payment credentials, complete provider payloads, signed URLs, and unrestricted free-form notes.

## Event naming and evolution

- Use business facts such as `order.placed`, `payment.succeeded`, and `product.published`.
- Do not name events after a controller, database table update, or queue.
- Add optional fields compatibly within a schema version only when old consumers retain the same meaning.
- Create a new schema version for changed meaning or required shape; keep dual consumer support through the rollout window.
- Preserve event ID during redelivery/replay. A transformed new event gets its own ID and causation link.
- Consumers reject unsupported versions to controlled failure handling rather than guessing.

## Queue registry

Exact names, retention, visibility, redrive count, concurrency, and alarms are set after D02/D08/D14. The logical queues are:

| Queue | Producers | Consumers | Work | Ordering/idempotency control | DLQ priority |
| --- | --- | --- | --- | --- | --- |
| `payment-validation` | callback intake, reconciliation scheduler | payment worker | validate IPN or query pending attempt | receipt fingerprint, attempt/version, validation evidence | critical |
| `refund-processing` | approved refund, reconciliation scheduler | payment/refund worker | submit/query refund | refund reference, submission sequence, balance reservation | critical |
| `search-projection` | catalog/price/media/stock events | search worker | request generation and rebuild one product/index document or tombstone | consumer receipt plus desired/applied generation | medium |
| `notifications` | lifecycle event projector | notification worker | create/render/send message | lifecycle dedupe key and request/attempt record | medium |
| `imports` | approved import request | file worker | validate/apply bounded file rows | source fingerprint, job version, row fingerprint/operation key | high |
| `exports` | authorized export request | file worker | generate private report artifact | export job/reference and checkpoint | medium |
| `maintenance` | scheduler/operations | specialized worker | reindex, invariant scan, repair/reconciliation batch | job run/target operation key | severity by job type |

Payment/refund work remains separate from general events so concurrency, egress credentials, visibility, alerts, and operator access can be tighter. Notifications cannot block financial work. Import/export work cannot starve request-serving database connections.

## Outbox dispatcher

Per-destination publication state is required for fan-out. Create fixed delivery destinations atomically with the event, then claim and mark each independently. Use the [schema supplement](../database/10-backend-readiness-supplement.md). A single event published_at flag cannot represent partial fan-out success.

1. Select a small due batch using an index-supported claim with lease/skip-locked behavior approved in database design.
2. Mark/lease candidates without holding locks during SQS network calls.
3. Publish each stable envelope to its routing destination.
4. Record success after provider acknowledgement.
5. If publish succeeded but marking failed, the same event may publish again; consumers absorb duplicates.
6. Increment bounded attempt/error evidence and release lease for retry with jitter.
7. Alert on oldest unpublished age, repeated failures, poison routing, and volume growth.

Do not delete outbox rows merely because they were published. Retention follows policy and replay/reconciliation needs.

## Consumer processing contract

| Step | Required behavior |
| --- | --- |
| Receive | long polling, bounded batch, role-specific concurrency |
| Validate | envelope/type/version/size/hash/reference checks before business effect |
| Observe | continue correlation/trace, record queue wait and receive count safely |
| Deduplicate | check/insert `(consumer_name, event_id)` with local effect |
| Guard | reload aggregate and compare version/state/eligibility |
| Execute | short local transaction or recorded external-call workflow |
| Acknowledge | delete only after durable success/terminal handling |
| Retry | classified transient failure with jitter; respect provider/database capacity |
| Dead-letter | after reviewed redrive threshold; page by business severity/age |

Do not use receive count as a business operation number. Do not reset or delete consumer receipts during normal replay.

## Retry classification

| Class | Examples | Action |
| --- | --- | --- |
| Transient dependency | connect timeout, throttling, temporary 5xx | bounded exponential backoff with jitter and deadline |
| Local contention | deadlock, serialization, lock timeout | retry whole idempotent local unit within small bound |
| Unknown external effect | timeout after provider may have acted | persist unknown and query by stable reference before retry |
| Permanent business | ineligible state, archived target, invalid current policy | record skipped/terminal outcome; acknowledge |
| Permanent payload | malformed envelope, unsupported version, oversize/forbidden data | quarantine/DLQ with safe evidence and owner alert |
| Defect | invariant/constraint mismatch, unexpected mapping | stop affected work class as needed, alert, retain for repair |

## Visibility and heartbeat policy

- Set visibility above normal processing duration plus safety margin for each queue, based on measured p99.
- Extend visibility only for bounded work that is making progress and can finish within the maximum service limit.
- Split files/reindex operations into checkpointed units rather than holding one message for hours.
- Stop heartbeats on shutdown/failure so another consumer can retry.
- Size worker concurrency so processing completes before visibility without exhausting DB connections or provider limits.

## Dead-letter handling

Every source queue has a same-environment DLQ and redrive policy. An alert includes queue, oldest age, count, event type, failure code distribution, and business severity without payload PII.

Replay requires:

1. identified root cause or justified current-state re-evaluation;
2. event schema support and payload safety review;
3. named operator and approval appropriate to payment/refund/security risk;
4. bounded event IDs/count and abort threshold;
5. dedupe controls left intact;
6. result and business reconciliation evidence.

Queue purge is excluded from ordinary operations.

## Event catalog

| Event family | Representative event types | Main consumers |
| --- | --- | --- |
| Identity | customer profile changed, staff grant changed, guest access revoked | audit/security cache, notifications where approved |
| Catalog/media | product published/changed/archived, media approved/rejected | search projection, cache refresh, sitemap/content tasks |
| Pricing/promotion | price activated, delivery rule changed, campaign changed, coupon redeemed | search/cache refresh, reporting |
| Inventory | stock position changed, reservation expired, allocation committed, return restocked | search indication, order/payment orchestration, reporting |
| Order | order placed/held/confirmed/cancelled/completed | wake existing payment intent where needed; notifications, fulfillment work queues, reporting; never recreate T02 intent |
| Payment | payment pending/succeeded/failed/unknown, payment exception opened | notification, finance reporting, reconciliation wake-up; payment.succeeded never repeats T04 allocation |
| Fulfillment/return | shipment state changed, return requested/received/inspected/resolved | notification, refund eligibility, reporting |
| Refund/settlement | refund approved/submitted/completed/failed/unknown, settlement matched | payment worker, notifications, finance reporting |
| Jobs | import validated/applied/failed, export ready/failed, reindex completed | staff status notification/operations |

Before emitting each event, assign exact producer, payload schema, aggregate version source, versioned destination set, consumers, retention, PII review and compatibility owner. Use the concrete [build guide routing baseline](13-consolidated-build-guide.md) for the first slices. Keep payloads bounded and identifiers sufficient to reload authority.

## Scheduled-job registry

| Job | Candidate/query | Normal action | Safety control | Alert signal |
| --- | --- | --- | --- | --- |
| Reservation expiry | active reservation past DB expiry time | T03 per candidate | state predicate and terminal operation key | overdue active age/count |
| Coupon-hold expiry | active hold past expiry | release under same order/campaign guards | one terminal transition | overdue hold age/count |
| Payment reconciliation | pending/unknown attempt beyond interval | provider status validation/query | stable attempt reference; no blind charge retry | oldest unresolved and mismatch count |
| Refund reconciliation | submitted/processing/unknown refund due | provider status query | stable refund/provider reference | oldest unknown and reserved balance age |
| Outbox recovery | unpublished due events | lease and republish | stable event ID | oldest unpublished age |
| Notification retry | eligible failed/available request | new delivery attempt | dedupe request; provider rate cap | oldest required message age |
| Search projection repair | failed/stale projection | reload and apply newest full document | projection version | freshness target breach |
| Cart/idempotency cleanup | terminal/expired rows beyond approved retention | bounded purge | D13 policy, legal hold, no active relation | growth/purge lag |
| Import/export cleanup | expired private artifacts/jobs | delete object and retain required provenance | policy, object fingerprint, audit | expired object backlog |
| Invariant monitor | indexed reconciliation queries | create finding/incident | read-only unless separate repair approved | any critical invariant result |
| Settlement aging | unmatched/partial entry beyond threshold | create finance work item | never auto-force ambiguous match | unmatched value/age |

## Graceful shutdown

On task termination, stop receiving new messages, fail readiness, finish or safely abandon in-flight work within the ECS grace window, stop visibility heartbeat, close telemetry, and release database connections. Do not acknowledge an unfinished message. API tasks stop new traffic before closing active requests and never extend a transaction beyond the termination budget.

## Queue acceptance evidence

- duplicate delivery produces one local effect;
- out-of-order old product event cannot overwrite new projection;
- process termination before and after commit is safe;
- publish-success/mark-failure causes harmless republish;
- visibility timeout and concurrency are supported by measured duration;
- poison/unsupported message reaches DLQ and alerts safely;
- replay is bounded, audited, and reconciled;
- SQS outage accumulates outbox and catches up without losing business commits;
- provider timeout follows unknown-outcome reconciliation;
- no secret or prohibited PII appears in event/message attributes or payloads.
