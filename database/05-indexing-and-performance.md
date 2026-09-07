# Indexing and performance plan

## Planning envelope

The current unapproved load model is up to 10,000 SKUs, 1,000 orders/day, 100 dynamic requests/second and 10 checkout attempts/second. It is sufficient for an initial index design, not a capacity promise. Query plans must be measured with representative data distribution and concurrent writes before Gate E.

Primary and unique constraints create their own indexes. Add secondary indexes only for named query paths. Every added index increases checkout/import write cost, storage, vacuum work and migration risk.

## Initial query-path indexes

| Query path | Proposed index shape | Notes |
| --- | --- | --- |
| Customer lookup after Auth0 | `customers(auth_issuer, auth_subject)` unique | Exact lookup |
| Active saved addresses | `(customer_id, archived_at, updated_at desc)` | Partial active index if useful |
| Active staff grants | `(staff_account_id, starts_at, ends_at)` plus active predicate | Permission evaluation/revocation |
| Category children | `(parent_id, status, sort_order, id)` | Supports deterministic tree pages |
| Published product by slug | `(slug)` unique; optional partial covering publication fields | Product detail route |
| Product listing | `(status, published_at desc, id)` and join indexes on product/category | PostgreSQL fallback only; facets remain OpenSearch |
| Variant by product | `(product_id, status, id)` | Product detail and publication validation |
| SKU lookup | `(sku_normalized)` unique | Admin/import/exact-SKU fallback |
| Current price | `(variant_id, currency, channel, valid_from desc)` with open/active predicate | Database time still checked |
| Approved product media | `(product_id, variant_id, role, sort_order)` | Page media ordering |
| Active content | `(entry_key, status, starts_at, ends_at)` | Scheduled campaign rendering |
| Delivery rule | `(delivery_zone_id, currency, status, valid_from desc)` | Checkout quote |
| Coupon lookup | `(code_normalized)` unique | Lock campaign row after lookup |
| Active coupon holds | `(coupon_campaign_id, expires_at)` where state active | Sweeper and cap review |
| Customer redemption | `(coupon_campaign_id, customer_id, redeemed_at)` | Per-customer limit |
| Stock position | `(variant_id, stock_location_id)` unique | Checkout locks by stable key |
| Movement history | `(stock_position_id, occurred_at desc, id desc)` | Reconciliation/admin timeline |
| Expiring reservation | `(expires_at, id)` where state active | Bounded sweeper batch |
| Reservation/order | `(order_id)` unique | Payment resolution |
| Active cart owner | `(customer_id, state, last_activity_at desc)` or guest owner equivalent | Ownership predicate included |
| Cart lines | `(cart_id, variant_id)` unique | Cart display/update |
| Order by customer | `(customer_id, placed_at desc, id desc)` | Cursor pagination; customer predicate first |
| Order operational queue | `(state, placed_at, id)` with active-state predicate | Staff action queues |
| Order reference | `(order_reference)` unique | Support lookup after authorization |
| Order state timeline | `(order_id, occurred_at, id)` | Ordered history |
| Active order holds | `(order_id, hold_type)` with active predicate | Eligibility check |
| Payment/order attempts | `(order_id, attempt_number)` unique | Order timeline |
| Pending payment aging | `(state, updated_at, id)` where state pending/unknown | Reconciliation worker |
| Provider transaction | Scoped partial unique keys | Exact dedupe/query |
| Callback processing | `(processing_state, received_at, id)` partial unfinished | Worker queue if DB recovery needed |
| Open payment exception | `(state, severity, opened_at, id)` | Finance queue |
| Refund/order | `(order_id, created_at desc, id)` | Order/refund timeline |
| Refund aging | `(state, updated_at, id)` for submitted/processing/unknown | Reconciliation |
| Settlement entry matching | `(match_state, occurred_at, id)` plus provider reference indexes | Finance workflow |
| Shipment operations | `(state, updated_at, id)` and exact tracking reference where approved | Fulfillment queue/search |
| Return/order | `(order_id, requested_at desc, id)` | Eligibility and timeline |
| Return action queue | `(state, requested_at, id)` | Operations queue |
| Due outbox delivery | `outbox_deliveries(available_at, id)` where state is pending; separate leased/locked_until recovery path | Dispatcher claims individual destinations; event published_at is a completion summary |
| Outbox destination identity | `outbox_deliveries(event_id, destination_key)` unique | Prevent duplicate routing rows; supports all-destinations completion check |
| Cancellation work queue | `cancellation_requests(state, requested_at, id)` plus `(order_id)` | Partial unique order_id for requested/reviewing; request history ordered by request/time/id |
| Due workflow job | `workflow_jobs(available_at, id)` for pending jobs; leased/running locked_until recovery index | Unique job_type/dedupe_key; target_type/target_id lookup; fenced checkpoint/completion |
| Audit target history | `(target_schema, target_table, target_id, occurred_at desc)` | Restricted admin investigation |
| Audit actor history | `(actor_staff_id, occurred_at desc)` where staff actor exists | Access review |
| Import rows | `(import_job_id, state, row_number)` | Error review/resume |
| Export jobs | `(requested_by_staff_id, created_at desc)` and `(state, created_at)` | Owner listing/worker |
| Notification backlog | `(state, available_at, id)` for queued/retry | Delivery worker |
| Search projection identity/lag | PK `(product_id, index_name)`; `(index_name, updated_at, product_id)` where desired_generation > applied_generation | Independent live/rebuild progress; separate lease-expiry recovery path; verify partial-index query predicates |

All foreign keys used in joins, ownership checks, state transitions or parent lifecycle receive a deliberate supporting index. PostgreSQL does not automatically index the referencing side of a foreign key.

## Pagination and list behavior

Use keyset/cursor pagination for customer order history, staff action queues, movements, audit, payment events and other growing timelines. The cursor contains the stable sort pair such as `(placed_at, id)`. Offset pagination is acceptable only for bounded configuration lists where drift and deep-page cost are immaterial.

Every list has an upper page-size bound and deterministic tiebreaker. Search filters do not become arbitrary SQL expressions. Admin text search uses explicitly supported normalized keys or a separately reviewed PostgreSQL text index; broad product discovery stays in OpenSearch.

## Hot-row and contention review

| Hot candidate | Treatment |
| --- | --- |
| Popular SKU position | Keep transaction short, lock stable position only, reject/retry serialization failure within bound, monitor lock wait |
| High-use coupon campaign | Counter update under one campaign row; consider sharded counters only after measured contention and unchanged cap correctness |
| One order receiving callbacks | Order/attempt version guard and rapid transaction; provider I/O before/after lock window |
| Outbox backlog | Bounded `skip locked` style claiming design, several dispatchers, no large transaction |
| Audit/event inserts | Append-only narrow rows and asynchronous evidence where atomicity is not required; preserve correlation |

## Query-plan acceptance

For every critical query, capture representative `EXPLAIN (ANALYZE, BUFFERS)` evidence in nonproduction with safe data. Review row estimates, actual rows, loop counts, sort/hash spill, heap fetches, buffer use and lock time. Acceptance covers p50/p95/p99 latency under concurrent mixed load, not a single warm query.

Critical paths are product/variant lookup, cart load, authoritative checkout reads/locks, payment attempt reconciliation, order/customer lookup, fulfillment action queue, refund balance calculation, expired reservation sweep, outbox dispatch and finance reconciliation.

## Partitioning and retention

Do not partition at launch. At the proposed volume, indexes and retention should be simpler to operate. Measure monthly rows, bytes, vacuum duration, index bloat, backup/restore time and query latency for `audit_events`, `outbox_events`, state-history, callbacks, validation evidence and notification attempts.

Reconsider time partitioning only when one of these tables creates a measured maintenance, retention deletion, backup or query problem. Before partitioning, review uniqueness limitations, foreign keys, ORM/migration support, operational runbooks and the need to include the partition key in primary/unique constraints.

## Database operating signals

Track connections versus limit, pool wait, transaction duration, lock wait/deadlocks, statement p95/p99, rows examined/returned, temporary bytes, replication lag, storage/IOPS/queue depth, WAL rate, checkpoint behavior, vacuum/analyze age, dead tuples, index size/use, backup age and restore duration.

Tag database operations with safe query/operation names and correlation IDs. Do not put email, phone, address, token, raw callback or free-form customer content into query tags or logs.

## Maintenance baseline

- Use transaction-pooling behavior only after prepared statement and session-setting compatibility is reviewed.
- Bound statement, lock and idle-in-transaction timeouts by workload class.
- Run analyze after material imports/backfills and verify plans before opening traffic.
- Monitor autovacuum rather than disabling it; tune table-by-table only from evidence.
- Reindex or change fill factor only from measured bloat/write patterns.
- Keep reporting exports bounded and asynchronous so they cannot exhaust API pool or lock commerce work.
- Use a read replica for reporting only after lag semantics, cost and workload evidence justify it; finance freshness must remain explicit.
