# Quality and acceptance plan

**Purpose:** Define evidence required to accept Release 1.  
**Current state:** No implementation evidence exists; all checks are planned.

Quality is built into each increment. The later hardening phase confirms the integrated system under realistic data, concurrency, dependency failures, and operating procedures.

## Acceptance ownership

Each [AI-DLC Bolt](aidlc/workflow.md) records its intended outcome, independent acceptance expectations, actual artifact/environment/profile identity, checks executed, defects and reviewer conclusion. AI self-review, test results, human acceptance and release authorization are separate evidence types. Reuse the existing approval scope; never infer human acceptance from generated code, a second AI opinion or passing tests. Low-impact documentation changes use document checks; high-risk domain changes retain their negative/race/recovery evidence.

| Evidence area | Accountable reviewer |
| --- | --- |
| Customer journey and scope | Product owner |
| Money, payment, refund, settlement and financial reports | Finance owner |
| Inventory, fulfillment, return and operational workflow | Operations owner |
| Architecture, API, data invariants and concurrency | Technical lead |
| Verification completeness and defect evidence | QA lead |
| Security, identity, privacy and access | Security/technical lead plus business policy owner |
| Availability, telemetry, deployment, backup and recovery | Platform lead |
| Migration quality and reconciliation | Data owner plus product/operations |
| Production release | Sponsor |

## Evidence levels

| Level | Meaning | Example |
| --- | --- | --- |
| Design | Behavior and states agreed before build | Wireflow, state table, calculation examples |
| Component | One bounded behavior verified | SKU validation or role guard evidence |
| Integrated | Multiple components complete one outcome | Checkout creates one reserved pending order |
| Operational | Failure/recovery and staff procedure verified | DLQ replay, restore, settlement review |
| Production readiness | Configuration, ownership and real-provider readiness reviewed | Live merchant callback/refund checklist |

Screenshots alone are weak evidence for money, stock, authorization, concurrency, replay, performance, or recovery. Retain inputs, expected results, actual records/metrics, environment/build identity, reviewer, date, and linked defects.

## Requirement acceptance matrix

| Requirement | Core evidence | Key negative/edge cases | Reviewer |
| --- | --- | --- | --- |
| CAT-01 | Product/category/variant/price lifecycle | Duplicate SKU, incomplete publish, archive with historical order | Product + QA |
| MED-01 | Authorized upload-to-published-media flow | Oversize/type spoof, unprocessed object, private export access | Product + security |
| SRCH-01 | Approved keyword/facet/autocomplete set and freshness | Draft/archived result, stale update, delete, outage/reindex | Product + technical |
| ACC-01 | Auth0 login, token validation, staff MFA/roles | Invalid/expired token, revoked staff, role escalation | Security + QA |
| ACC-02 | Guest/customer address/order access | Cross-customer access, expired/guessed guest link, snapshot rewrite | Product + security |
| CART-01 | Persistence, quantity, login merge and stale correction | Cache loss, duplicate item, invalid limit, changed price/stock | Product + QA |
| CHK-01 | Authoritative repeat-safe checkout and snapshots | Double submit, changed payload, tampered totals, multi-line rollback | Technical + finance + QA |
| INV-01 | Ledger, reservation, expiry, allocation, adjustment, return disposition | Last unit, expiry/payment race, duplicate release/allocation, dispatch double-deduct | Operations + technical + QA |
| PAY-01 | Hosted initiation and verified successful payment | Forged browser/callback, amount/currency/reference mismatch, initiation timeout | Finance + security + QA |
| PAY-02 | Pending/unknown/late/duplicate/excess/reconciliation operations | Out-of-order event, late success no stock, double payment, settlement mismatch | Finance + QA |
| ORD-01 | Immutable order facts and controlled history | Invalid/backward/concurrent state, held/unpaid fulfillment | Product + operations |
| SHIP-01 | Zone charge and manual pick-pack-track-deliver flow | Unsupported zone, invalid tracking, failed delivery, premature dispatch | Operations + QA |
| RET-01 | Cancellation, line return, inspection and refund lifecycle | Ineligible quantity/window, concurrent over-refund, ambiguous refund, damaged restock | Finance + operations + QA |
| ADM-01 | Role-specific admin workflows, conflicts and audit | Support refund approval, unauthorized export, stale edit overwrite | Product + security |
| MKT-01 | Coupon and homepage campaign lifecycle | Concurrent cap, expiry, ineligible item/customer, stale cache | Product + finance |
| SEO-01 | Metadata, sitemap, canonical, structured data, accessible journey | Filter duplication, archived URL, keyboard/error state | Product + QA |
| NTF-01 | Queued transactional messages and visible outcomes | Provider outage, duplicate event, DLQ/replay, sensitive content | Operations + QA |
| RPT-01 | Defined reports and private exports reconcile to facts | Refund across period, fee mismatch, unauthorized/expired export | Finance + data + QA |
| MIG-01 | Validated, rehearsed, reconciled catalog/stock import | Bad encoding, duplicate SKU, partial failure, replay, media mismatch | Data + operations |
| OPS-01 | Staged release, monitoring, backup, incident and recovery readiness | Queue/provider/cache/search/DB failure, bad deployment, restore | Platform + technical |
| SEC-01 | Least privilege, ownership, secrets, logs, uploads, limits, retention | IDOR, token misuse, CSRF, injection, flood, secret/PII leakage | Security + QA |

## Nonfunctional evidence

| Target | Test boundary | Evidence required |
| --- | --- | --- |
| NFR-01 availability | First-party valid storefront/API requests, agreed exclusions and provider failures reported separately | Measurement definition, synthetic/operational view, alert and calculation sample |
| NFR-02 latency | 100 dynamic requests/sec mixed workload including 10 checkout attempts/sec, 10,000 SKUs, agreed environment | Repeatable workload, percentile results, errors, resource/DB/queue signals |
| NFR-03 web vitals | Agreed public critical pages, mobile/network/device profile, p75 | Per-page lab results and field plan; identified regressions |
| NFR-04 search freshness | Committed catalog change to searchable result at agreed load | p50/p95/max, oldest-update alert, stale/delete/reindex cases |
| NFR-05 recovery | Regional DB/service recovery including access, config, secrets and payment backlog | Timed drill, achieved RPO/RTO, reconciliation and improvement actions |
| NFR-06 accessibility | Browse, search, product, cart, checkout, payment status, order/return and core admin | Automated results plus keyboard, focus, error, contrast and screen-reader review |
| NFR-07 security | Application, API, dependencies, containers, IaC and configuration | Findings with severity/evidence; no unresolved critical/high at launch |
| NFR-08 integrity | Replay, concurrency, ownership, rollback and recovery suite | No duplicate money effect, unauthorized order access, or negative checkout stock |
| NFR-09 replaceable support systems | Valkey/OpenSearch loss, stale data, rebuild and bounded fallback | Committed orders remain correct; no stale-price purchase |

## Scenario suites

### Identity and authorization

- Token missing, malformed, wrong issuer/audience, expired, revoked or insufficient scope.
- Customer requests another customer's profile, address, cart, order, return, or export.
- Staff role permits viewing but not approval; refund/export threshold and dual approval where selected.
- MFA absent, session expires, staff is revoked, Auth0 is unavailable.
- Guest link expires, is guessed, is forwarded, and accesses only masked intended order data.

### Checkout and inventory

- One and many lines succeed; one failed line rolls everything back.
- Two sessions request the last unit; exactly one valid reservation succeeds.
- Same idempotency key with identical and changed payload.
- Price, coupon, delivery, tax, publication or quantity changes after cart display.
- Reservation sweeper races with payment verification.
- Allocation, release, adjustment, restock, retry and queue replay occur more than once.
- Stock ledger roll-forward equals current positions after every scenario.

### Payment and refund

- Provider initiation succeeds, fails, times out before/after possible session creation.
- Browser return claims success without verified payment.
- Callback is forged, duplicated, delayed, out of order, malformed, excessive, or temporarily unpersistable.
- Verified result has wrong merchant, environment, reference, amount or currency.
- Payment succeeds with active, expired-but-reallocatable, and expired-unavailable stock.
- Two attempts succeed for one order.
- Partial/full refund, concurrent refund, timeout, unknown result, failure, retry and final reconciliation.
- Application ledger reconciles to provider transactions, refunds, settlement and fees under defined metrics.

### Async and dependency resilience

- Domain commit succeeds while SQS publish fails.
- Publish succeeds while outbox mark fails; message delivers repeatedly or out of order.
- Consumer crashes before/after local commit and during external call.
- Visibility timeout and retry reach DLQ; authorized bounded replay succeeds.
- Valkey, OpenSearch, SQS, email, Auth0, SSLCOMMERZ, S3/CDN and PostgreSQL each fail according to the system blueprint.
- Search reindex builds, catches up, validates and switches without becoming checkout authority.

### Migration and reports

- Encoding/header/size/schema failure and row-level required/type/range failure.
- Duplicate/conflicting SKU and missing/invalid media.
- Partial execution, safe restart, repeated input and source change after approval.
- SKU/product/variant/price/media/publication/stock totals reconcile.
- One representative order flows through sale, payment, fulfillment, return, refund, settlement and every report without unexplained difference.

## Defect severity and release effect

| Severity | Definition | Release rule |
| --- | --- | --- |
| Critical | Duplicate/incorrect money effect, unauthorized sensitive access, corrupted stock/order facts, or widespread checkout failure | Stop affected flow/release; preserve evidence and escalate immediately |
| High | Core purchase/payment/refund/fulfillment/security/recovery behavior fails without a safe controlled workaround | Must be resolved before launch gate |
| Medium | Material incorrect behavior with documented safe workaround and bounded impact | Owner/date and product/technical exception required |
| Low | Minor presentation or documentation issue | Prioritize in backlog with reviewer decision |

Severity depends on impact and likelihood. Ease of repair or launch pressure does not reduce severity.

## Evidence package for each task

- Task ID, requirement IDs, decision/version/build/environment identity.
- Preconditions, representative data, exact action, expected and observed outcome.
- Relevant DB/provider/queue/audit/trace/metric evidence with secrets and personal data removed.
- Negative, permission, retry, concurrency or failure cases appropriate to the task.
- Defects/exceptions and their disposition.
- Reviewer name/role, decision and date.

## Release acceptance rule

Release 1 is acceptable only when every P0/P1 requirement has reviewed evidence, NFR targets have measured evidence or an explicitly rejected/changed target, all G3 items have owners and approval, and no critical/high blocker or unexplained financial/stock discrepancy remains. The sponsor makes the final release decision based on this package.
