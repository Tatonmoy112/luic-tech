# Backend validation and acceptance checklist

**Use:** Review this checklist during design, implementation, release, and handover.  
**Current state:** Planned evidence only. No item is accepted by the existence of this document.

## Architecture and ownership

For each AI-DLC Bolt, record intent/Unit/Bolt IDs, exact BUILD/ADAPT scope, profile/policy, authorized environment, canonical design references, artifact identity, checks actually run and actual reviewer type. Separate permission to act, technical results and human acceptance. Preserve unresolved exceptions and update context before the handoff. Use [the workflow](../context/aidlc/workflow.md); no new code test is required for documentation-only changes.

- [ ] Every runtime role has one purpose, startup composition, permission set, scaling signal, readiness rule, and shutdown behavior.
- [ ] Every aggregate/table lifecycle has one owning backend module.
- [ ] All 78 dictionary tables match the ownership guide; coordinator composition contains no Order/Payment import cycle.
- [ ] Module dependency direction follows interface → application → domain with infrastructure implementing ports.
- [ ] No controller/consumer performs direct SQL or provider-driven business decisions.
- [ ] No module mutates another module's tables through an undeclared repository.
- [ ] Every cross-module call/event states owner, transaction, failure, authorization, and telemetry behavior.
- [ ] Checkout/payment/refund/return orchestration preserves database T01–T10 and the global lock order.
- [ ] A callback validated before session-result persistence succeeds safely; the later response cannot downgrade state or expose an ineligible hosted URL.
- [ ] An already-paid order can leave an allocation hold through the authorized resolution command; callback replay remains a no-op.
- [ ] Return caps include inspected cases exactly once, and refund caps protect both payment-wide and original line/component entitlements.
- [ ] Refund approval and dispatch serialize on the order; pre-dispatch reserved/completed refunds cannot leave the order eligible to ship.
- [ ] Strict publication checks cover cached candidates and autocomplete; shared HTTP caching cannot bypass those checks.
- [ ] Network calls occur outside database transactions.
- [ ] A service split has not been introduced without measured need and a recorded decision.

## API contract

- [ ] Public, customer, staff, provider, operations, and health surfaces are separated.
- [ ] Every OpenAPI operation has a stable ID, audience, owner, requirement, permission, schemas, errors, idempotency, cache, rate, audit, and data classification.
- [ ] Unknown/oversized fields, body, query, filter, sort, cursor, and file metadata are bounded.
- [ ] Money uses exact minor units and explicit currency; time and identifier formats are consistent.
- [ ] Protected reads enforce ownership/scope in the authoritative predicate.
- [ ] Errors use stable safe codes and contain no stack, SQL, secret, provider payload, or unnecessary PII.
- [ ] Lists use stable bounded pagination and indexed sort/filter paths.
- [ ] Staff edits and transitions use expected version/state; stale changes return a safe conflict.
- [ ] High-risk commands use scoped idempotency and canonical request identity.
- [ ] Safe replay snapshots/schema versions preserve reconfirmation/error outcomes; newly confirmed quotes use a new key; replay is reauthorized.
- [ ] Money and bigint versions survive JSON as exact decimal strings; session initiation returns accepted status and authorized polling does not expose expired hosted URLs.
- [ ] Private responses and errors cannot enter shared caches.
- [ ] Contract lint, security scheme, examples, operation ID, and compatibility checks pass.

## Identity and authorization

- [ ] Auth0 token signature, issuer, audience, algorithm, expiry/not-before, and required claim checks reject invalid tokens.
- [ ] Verified external identity maps to an active application account before access.
- [ ] Customer, staff, workload, and guest principals cannot be confused.
- [ ] Customer A cannot read or mutate customer B profile, address, cart, order, return, or export.
- [ ] Guest access uses a hashed high-entropy capability with expiry, revocation, masking, rate limit, and rotation.
- [ ] Staff actions enforce current permission, scope, state, threshold, and separation rules.
- [ ] Revoked grants become ineffective within the approved bound even when Auth0 session remains valid.
- [ ] Support, catalog, fulfillment, finance, platform-admin, and service-operator boundaries match the approved matrix.
- [ ] Sensitive views/exports and break-glass actions are attributable.

## Catalog, media, pricing, promotion, search, and cart

- [ ] SKU/archive/publication and product/variant/category/attribute rules match CAT-01.
- [ ] A product cannot publish without required content, variant, effective price, and approved media.
- [ ] Upload, quarantine/inspection, approval, private source, and public derivative controls match MED-01.
- [ ] Price intervals, exact arithmetic, delivery rule, tax-policy version, and rounding examples reconcile.
- [ ] Coupon eligibility, dates, min/max, targeting, cap, per-customer, one-coupon, hold/release/redeem cases pass.
- [ ] Search document contains only approved publishable fields and carries projection version.
- [ ] Duplicate/out-of-order search events cannot overwrite a newer document.
- [ ] Unpublish/delete and reindex/catch-up/alias-switch flows reconcile counts and freshness.
- [ ] Search outage returns the approved degraded/fallback behavior without affecting checkout truth.
- [ ] Cart ownership, persistence, merge, stale estimate, version conflict, expiry, and Valkey-loss cases pass.

## Inventory, checkout, and order

- [ ] Position and append-only movement update together; direct counter replacement is impossible through runtime commands.
- [ ] Two checkouts for the final unit produce at most one reservation.
- [ ] All stock rows lock in stable order independent of cart order.
- [ ] Reservation commit/release/expiry applies exactly once.
- [ ] Checkout revalidates actor, publication, variant, price, delivery, tax, coupon, stock, and quantity.
- [ ] Changed authoritative quote returns reconfirmation without order/reservation/coupon hold.
- [ ] Same checkout key and payload returns the stable outcome; changed payload conflicts.
- [ ] Failed checkout transaction leaves no partial order, reservation, coupon hold, attempt, audit, or outbox relation.
- [ ] Order line/address/discount/tax snapshots remain unchanged after catalog/customer edits.
- [ ] Order amount equation, reservation lines, allocation lines, and order lines reconcile.
- [ ] Confirmed order always has verified funding, complete allocation, and no blocking hold.
- [ ] Packing/dispatch never deducts stock a second time.

## Payment, refund, and settlement

- [ ] Callback intake is bounded, redacted, fingerprinted, durable, and duplicate-safe before successful acknowledgement.
- [ ] Browser return never changes payment state.
- [ ] Success requires SSLCOMMERZ server validation and merchant/environment/reference/amount/BDT/status/risk checks.
- [ ] Forged, mismatched, repeated, late, and out-of-order events preserve evidence and produce safe outcomes.
- [ ] Reservation expiry/payment races cannot create negative stock, double allocation, or discarded payment.
- [ ] A second successful attempt is retained and creates an excess-payment exception without allocating again.
- [ ] Initiation/validation/refund timeouts become unknown and query/reconcile before retry.
- [ ] Refund approval authority, separation, allocation, and stable reference are enforced.
- [ ] Concurrent refund approvals cannot make reserved plus completed exceed successful paid amount.
- [ ] Refund completes only from verified final provider evidence.
- [ ] Settlement source fingerprints, line hashes, sign/amount equations, auto-match, manual reason/audit, and rerun behavior pass.
- [ ] Finance reports separately reconcile payable, paid, refunded, fees, and settled net.

## Fulfillment and return

- [ ] Only fully allocated, verified-funded, non-held orders enter fulfillment.
- [ ] One Release 1 shipment maps completely to allocation/order lines.
- [ ] Pick, pack, dispatch, delivery, failed-delivery, and return-to-origin edges enforce state/version/permission.
- [ ] Manual courier/tracking requirements follow approved D06 policy.
- [ ] Cancellation handles unpaid, paid, unknown-payment, reserved, and fulfillment-in-progress cases without erasing evidence.
- [ ] Return request/approval/receipt/inspection quantities remain within cumulative purchased eligibility under concurrency.
- [ ] Only inspected sellable quantity creates one positive restock movement.
- [ ] Damaged/quarantined/lost return quantity does not increase sellable stock.
- [ ] Return resolution and refund processing remain independently visible and authorized.

## Events, workers, files, and notifications

- [ ] Domain change and outbox event commit together.
- [ ] Envelope version/type/size/hash/correlation/aggregate fields are validated.
- [ ] Duplicate delivery creates one local effect and out-of-order delivery cannot regress state.
- [ ] Consumer receipt commits with the local effect; external effects use recorded attempt/result/reconciliation.
- [ ] Process termination before/after effect and before SQS delete is safe.
- [ ] Visibility, batch, concurrency, retries, redrive, and DLQ thresholds are supported by measurements.
- [ ] SQS outage accumulates outbox and catches up without losing or corrupting commits.
- [ ] DLQ replay is authorized, bounded, audited, duplicate-safe, and business-reconciled.
- [ ] Notification dedupe/template version/recipient protection/provider retry work without becoming business authority.
- [ ] Import validates before approval/apply; duplicate source/row, partial failure, checkpoint/resume, and reconciliation pass.
- [ ] Export enforces permission/filter/definition/timezone/private object/expiry/download audit and CSV safety.
- [ ] Scheduled jobs use durable run/lease, DB time, bounded candidates, per-item guards, checkpoints, and overlap safety.

## Security, privacy, and telemetry

- [ ] CORS, CSRF, secure session cookie, redirect allowlist, security headers, and rate classes match the accepted web/API design.
- [ ] Provider, database, queue, cache, search, S3, and telemetry roles follow least privilege.
- [ ] Secrets are absent from source, image, DB, queue, event, log, trace, error, fixture, export, and diagram.
- [ ] PII/provider evidence fields are selected, masked, encrypted, retained, and audited by classification.
- [ ] Object-key guessing, expired grants, unapproved media, and cross-user downloads fail.
- [ ] CSV formula, malformed encoding, archive/file-size, unsafe filter/sort, and mass-assignment cases fail safely.
- [ ] Logs/traces/metrics use safe low-cardinality fields and preserve correlation across API/outbox/SQS/worker.
- [ ] Critical audit records and domain history are append-only to runtime roles.
- [ ] Dependency and internal errors are captured without client leakage.

## Reliability, performance, deployment, and recovery

- [ ] Liveness does not cause dependency restart storms; readiness is role/route appropriate.
- [ ] PostgreSQL, Valkey, OpenSearch, SQS, SSLCOMMERZ, Auth0, S3, email, and telemetry failure behaviors are exercised.
- [ ] Retry occurs at one owned layer with jitter/deadline and never repeats unknown financial effects blindly.
- [ ] API and worker pool/concurrency budgets stay within reserved database capacity.
- [ ] Mixed load meets approved route/checkout targets with headroom and documents saturation behavior.
- [ ] Callback bursts, hot-stock contention, projection catch-up, import/export, and report load remain bounded.
- [ ] API and every worker role shut down gracefully without losing/acknowledging unfinished work.
- [ ] Image digest, SBOM/provenance, scans, OpenAPI, schema/event compatibility, config version, and release evidence are recorded.
- [ ] Additive migration, canary, abort, artifact rollback, and data forward-repair procedures are rehearsed.
- [ ] Timed clean restore meets approved RPO/RTO and post-restore money/stock/outbox/search reconciliation passes.
- [ ] Dashboards, alerts, runbooks, escalation, payment/finance/operations ownership, and hypercare roster are accepted.

## Requirement coverage

| Requirement | Backend design evidence |
| --- | --- |
| CAT-01 | catalog module, staff/store APIs, publication/archive flow |
| MED-01 | media upload/inspection/approval/object data flow |
| SRCH-01 | OpenSearch query/projection/delete/reindex/outage design |
| ACC-01 | Auth0 validation, app grants, MFA/revocation controls |
| ACC-02 | customer ownership, guest capability, order masking |
| CART-01 | durable cart, merge, version, stale/cache-loss behavior |
| CHK-01 | quote/reconfirmation/idempotent T02 checkout flow |
| INV-01 | position/ledger/reservation/allocation/restock commands |
| PAY-01 | session/IPN/server-validation/payment transition flow |
| PAY-02 | late/excess/unknown/refund/settlement reconciliation |
| ORD-01 | immutable order snapshots, states, holds, history |
| SHIP-01 | eligibility and one-shipment lifecycle |
| RET-01 | cancellation/return/inspection/refund boundaries |
| ADM-01 | staff APIs, permissions, conflict, audit and operations |
| MKT-01 | coupon campaign/hold/redemption and content events |
| SEO-01 | publish/unpublish/search projection and API metadata inputs |
| NTF-01 | versioned templates, deduped requests, attempts/DLQ |
| RPT-01 | metric definitions, bounded queries, private exports, reconciliation |
| MIG-01 | fingerprinted validate/approve/apply/checkpoint/reconcile import |
| OPS-01 | runtime roles, health, telemetry, deployment, runbooks, recovery |
| SEC-01 | trust, authn/authz, validation, secrets, privacy, audit design |
| FUT-01 | service-split and extension triggers remain evidence-based |
| NFR-01 | availability indicators, readiness, alerts, evidence plan |
| NFR-02 | latency budgets, pools, query paths, mixed-load plan |
| NFR-03 | backend timing/cache/SSR API support and telemetry inputs |
| NFR-04 | projection version, lag, alert, reindex design |
| NFR-05 | migration/restore/reconciliation design |
| NFR-06 | accessible error/status semantics and complete frontend state support |
| NFR-07 | security verification and release severity gate |
| NFR-08 | lock/idempotency/ownership/refund/invariant controls |
| NFR-09 | cache/search/queue/provider dependency-loss behavior |

## Acceptance record

For each accepted section, record reviewer, date, environment, release/image, OpenAPI/schema/event/config versions, evidence links, unresolved exceptions with owner/expiry, and the decision that permits progression. Do not convert unchecked design statements into accepted status without evidence.
