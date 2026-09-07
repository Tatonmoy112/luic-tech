# Database validation and acceptance checklist

No checkbox is currently accepted. Each checked item must link to observed evidence, reviewer and date.

## Design review

- [ ] All 78 tables have one owner, purpose, requirements and retention class.
- [ ] Cancellation requests/history, outbox deliveries and workflow jobs match the incorporated supplement; approval is distinct from final cancellation.
- [ ] Product/index composite projection identity, desired/applied generations, persistent tombstones and fenced claims are represented in migrations.
- [ ] Stable response snapshots and restricted provider-session recovery fields match the API replay and authorization contract.
- [ ] Every relationship in the data dictionary appears correctly in the diagrams.net pages.
- [ ] Every foreign key has deliberate delete/update behavior.
- [ ] Every nullable column has a documented missing-value meaning.
- [ ] Money and quantity units are unambiguous in every table and API mapping.
- [ ] Current catalog data and immutable order snapshots cannot be confused.
- [ ] Payment, order, shipment, return and refund remain separate state dimensions.
- [ ] Valkey/OpenSearch/SQS/S3/Auth0 references do not become unverified commercial authority.
- [ ] D01–D14 and DB-001–DB-028 decisions affecting schema are approved or explicitly block the affected work.
- [ ] Diagram, dictionary, ORM declaration, migrations and live schema have one reviewed version relationship.

## Structural inspection

- [ ] A clean PostgreSQL 18 database builds from the ordered migration history.
- [ ] Expected eight schemas and database roles exist with correct ownership.
- [ ] Primary, unique, foreign key and named check constraints match the approved catalog.
- [ ] Referencing foreign-key columns have deliberate indexes where needed.
- [ ] Runtime roles cannot perform DDL or grant roles.
- [ ] Money uses exact integer minor units and no floating-point/locale-dependent money fields.
- [ ] All stored instants use timezone-aware timestamps.
- [ ] UUID/public reference strategy matches the approved decision.
- [ ] No raw password, access token, guest token, payment credential or card data field exists.
- [ ] Schema drift check passes for declared ORM, migration result and inspected database.

## Catalog, price and promotion integrity

- [ ] Normalized SKU cannot duplicate an active or archived SKU.
- [ ] Product publication fails when required variant, price, media or content is missing.
- [ ] Archived/unpublished variants cannot enter a new checkout.
- [ ] Effective price intervals cannot produce two valid current prices in the same scope.
- [ ] Order-line price/name/SKU/attributes remain unchanged after catalog edits.
- [ ] Variant attribute value belongs to the stated attribute.
- [ ] Only approved media can receive a public versioned path.
- [ ] Coupon code normalization prevents equivalent duplicate codes.
- [ ] One order cannot have more than one coupon redemption.
- [ ] Concurrent coupon holds cannot exceed approved campaign/customer limits.
- [ ] Released/expired coupon hold changes counters once.

## Inventory and checkout integrity

- [ ] Stock position is unique per variant/location and all counters remain nonnegative.
- [ ] Every stock change has one append-only movement with a unique operation key.
- [ ] Position after-values reconcile to ordered movements.
- [ ] Two concurrent checkouts for the last unit allow at most one full reservation.
- [ ] A multi-line checkout reserves all lines or none.
- [ ] Cart placement never reserves stock.
- [ ] Authoritative price/stock/delivery/tax/coupon changes require checkout reconfirmation.
- [ ] Same idempotency key and request hash returns the original checkout outcome.
- [ ] Same key with a changed hash conflicts and creates no second order.
- [ ] Reservation commit, release or expiry happens once under repeated workers.
- [ ] Packing/dispatch creates no second stock deduction.
- [ ] Manual adjustment requires actor, permission, reason and unique operation key.
- [ ] Sellable return inspection creates one restock movement; damaged/quarantine does not.

## Payment and refund integrity

- [ ] Browser return parameters cannot mark a payment succeeded.
- [ ] Duplicate callbacks produce one durable receipt/effective transition.
- [ ] Forged/mismatched merchant, transaction, currency or amount evidence is rejected and visible.
- [ ] Unknown provider outcome remains unknown and is queried before unsafe retry.
- [ ] Payment success racing reservation expiry never creates negative stock or loses money evidence.
- [ ] Late success either creates a complete fresh allocation or a paid-but-unallocated hold/exception.
- [ ] Two successful attempts remain recorded while goods allocate once and excess payment is visible.
- [ ] Confirmed order has verified sufficient payment, full allocation and no active blocking hold.
- [ ] Refund lines reconcile exactly to the approved refund value.
- [ ] Concurrent refunds cannot reserve more than the eligible successful payment balance.
- [ ] Ambiguous refund submission retains reserved balance and is reconciled before resubmission.
- [ ] Completed refund requires verified final provider evidence.
- [ ] Refund completion does not automatically restock; return restock does not automatically refund.
- [ ] Settlement entries preserve source fingerprint and reconcile matched/unmatched/partial amounts.

## Identity, privacy and staff access

- [ ] Customer A cannot query or mutate customer B cart, address, order or return.
- [ ] Guest reference without valid unexpired secret proof returns no protected order data.
- [ ] Stored guest proof is a hash and is unusable as the original token.
- [ ] Editing/deleting a saved address never changes an order address snapshot.
- [ ] Revoked staff loses permissions within the approved bound.
- [ ] Catalog, fulfillment, support and finance role restrictions match the approved matrix.
- [ ] Dual approval prevents self-approval above refund/stock thresholds when enabled.
- [ ] Restricted provider/settlement/audit/export fields are absent from ordinary staff views.
- [ ] Every sensitive action has correlated domain history and audit evidence without secrets.
- [ ] Anonymization/retention job preserves finance/stock/report integrity and honors legal hold.

## Async, import, export and projection integrity

- [ ] Domain commit and outbox event succeed/fail together.
- [ ] Republished event is harmless to each consumer.
- [ ] Consumer receipt and local database effect succeed/fail together.
- [ ] Out-of-order search event cannot overwrite a newer product projection.
- [ ] Search/cache loss does not change checkout correctness.
- [ ] Notification duplicate/retry does not change order/payment/refund state.
- [ ] Import duplicate source/row behavior is deterministic and reviewable.
- [ ] Partial import does not publish an unreconciled catalog/opening stock.
- [ ] Export preserves definition version, filters, timezone, currency, freshness and requester.
- [ ] Private export object expires without removing its audit/job evidence.

## Migration and operational safety

- [ ] Each migration has requirement/decision references and a compatibility classification.
- [ ] Large scans, index builds, backfills and constraints have measured lock/WAL/storage plans.
- [ ] Backfill can resume without double application.
- [ ] Current and previous supported application versions behave during the compatibility window.
- [ ] Destructive contract occurs only after rollback no longer requires the old shape.
- [ ] Only one controlled migrator can apply shared/production schema changes.
- [ ] Long transactions, lock waits, deadlocks and pool exhaustion produce bounded failure/retry.
- [ ] Invariant monitors detect intentionally introduced bad fixtures.
- [ ] Alerts cover database pressure, lock/deadlock, backup age, replication, outbox and reconciliation age.
- [ ] Clean restore completes within the approved target and preserves grants/constraints/migrations.
- [ ] Post-restore payments, refunds, stock, outbox and settlement reconcile.

## Requirement coverage

| Requirement | Database evidence focus |
| --- | --- |
| CAT-01 | Catalog lifecycle, unique SKU, attributes, current price and immutable historical references |
| MED-01 | Media approval metadata and public/private object separation |
| SRCH-01 | Published-product version/projection state and authoritative checkout revalidation |
| ACC-01 | Auth0 identity link, current staff roles/permissions and ownership predicates |
| ACC-02 | Guest proof, saved address ownership and immutable order-address snapshots |
| CART-01 | Durable owner-scoped cart and unique variant line |
| CHK-01 | Scoped idempotency, authoritative quote and atomic order/reservation/payment intent |
| INV-01 | Position, movement, reservation, allocation and inspected-restock concurrency |
| PAY-01 | Receipt, server validation, payment attempt and evidence-backed transition |
| PAY-02 | Pending/unknown/late/duplicate/excess exceptions and settlement reconciliation |
| ORD-01 | Immutable order facts, guarded state history and operational holds |
| SHIP-01 | Delivery-zone snapshot and one allocation-backed shipment |
| RET-01 | Return quantity, inspection, refund allocation/balance and provider outcome |
| ADM-01 | Staff grants, versions, action queues, attributable audit and export control |
| MKT-01 | Coupon targets, counter, hold and redemption concurrency |
| SEO-01 | Stable product/category slugs, publication state and projection eligibility |
| NTF-01 | Durable deduplicated delivery request/attempt independent of business state |
| RPT-01 | Typed amount components, definition versions, settlement match and authorized export |
| MIG-01 | Fingerprinted import, row errors, idempotent apply and count/amount reconciliation |
| OPS-01 | Controlled migrations, monitoring, backup, restore and workload access |
| SEC-01 | Least privilege, restricted data, redaction, retention and append-only audit |
| FUT-01 | No Release 1 tables promised for later features; every future capability requires a new model/decision review |
| NFR-01 | Connection/service health, failover and database availability evidence |
| NFR-02 | Critical query plans, lock/pool behavior and mixed-load transaction latency |
| NFR-03 | Database latency must stay within the end-to-end page budget; primary evidence remains frontend |
| NFR-04 | Outbox-to-search projection version and freshness timestamps |
| NFR-05 | Backup/PITR, timed clean restore and post-restore reconciliation |
| NFR-06 | Address/error/content storage supports accessible journeys; primary evidence remains frontend |
| NFR-07 | Database privilege, migration, sensitive-data and dependency findings closed |
| NFR-08 | Concurrency/replay/ownership checks show no duplicate money, unauthorized access or negative stock |
| NFR-09 | Authoritative rows and transactions remain correct without cache/search |

## Approval record

The database package is ready for implementation only when the technical lead accepts the logical model, finance accepts money/payment/refund/settlement rules, operations accepts inventory/fulfillment/return rules, security accepts access/classification/retention controls, and product accepts catalog/customer behavior. Production readiness requires observed migration, concurrency, load, restore and reconciliation evidence in addition to design approval.
