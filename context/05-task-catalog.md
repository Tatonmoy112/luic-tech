# Detailed task catalog

**Status of every task:** Not started, unless the [status board](registers/status-board.md) explicitly changes it.  
**Sizing rule:** Each catalog row is intended to become one reviewable task, usually 0.5–3 focused person-days. Split it further when the assigned team cannot meet that shape. The catalog does not replace the 408–519 person-day project estimate because coordination, review, rework, integration, and specialist work span rows.

`Evidence` names the minimum reviewable output. Actual evidence links and reviewers belong in the task card and traceability matrix.

## Phase 0 — Governance, discovery, and readiness

Use this catalog as full-product requirement/task context. Backend implementation is routed through [AI-DLC Units and Bolts](aidlc/execution-map.md), the 44 BUILD outcomes and applicable ADAPT additions. Keep existing IDs and dependencies; Unit/Bolt planning does not duplicate the 317-task catalog or mark its tasks implemented. The current backend-only intent excludes frontend delivery tasks.

Primary owners: sponsor, product owner, delivery manager, finance, operations, technical lead.

| ID | Small outcome | Depends on | Requirement/decision | Minimum evidence |
| --- | --- | --- | --- | --- |
| GOV-001 | Name sponsor, product, finance, operations, technical, QA, platform, design, data and support owners | None | D12 | Responsibility record with availability |
| GOV-002 | Approve decision, risk, scope-change and acceptance workflow | GOV-001 | OPS-01 | Governance record and escalation times |
| GOV-003 | Confirm merchant, goods, market, currency and language | GOV-001 | D01 | Approved business boundary |
| GOV-004 | Confirm SKU/order/traffic/seasonal sizing inputs | GOV-001 | D02, NFR-02 | Approved load model |
| GOV-005 | Confirm warehouse, backorder, preorder and shipment model | GOV-001 | D03, INV-01, SHIP-01 | Approved stock/fulfillment policy |
| GOV-006 | Confirm customer login, guest and admin MFA policy | GOV-001 | D04, ACC-01, ACC-02 | Identity policy |
| GOV-007 | Confirm courier, zones, fees, delivery states and COD boundary | GOV-001 | D06, SHIP-01 | Shipping policy and zone source |
| GOV-008 | Confirm tax, invoice, cancellation, return, refund and restock rules | GOV-001 | D07, RET-01 | Finance/operations policy matrix |
| GOV-009 | Confirm CSV source, size, ownership, quality and migration exclusions | GOV-001 | D10, MIG-01 | Data intake statement and sample owner |
| GOV-010 | Confirm budget, rates, team allocation and target constraints | GOV-001 | D12 | Authorized capacity/forecast basis |
| GOV-011 | Approve Release 1 inclusion/exclusion and Release 2 parking lot | GOV-003–GOV-010 | All P0/P1, FUT-01 | Signed scope baseline |
| GOV-012 | Establish backlog, task/evidence storage and status vocabulary | GOV-002 | OPS-01 | Working board and evidence structure |
| GOV-013 | Establish weekly review, daily blocker and decision cadence | GOV-002, GOV-012 | OPS-01 | Calendar/cadence record |
| GOV-014 | Build dependency calendar for merchant, cloud, identity, email, domain and content | GOV-001 | D05, D08, D11, D15, D16 | Dependency plan with owners/dates |
| GOV-015 | Approve Definition of Ready and Definition of Done | GOV-002 | All | Reviewed delivery rules |
| GOV-016 | Record ready-kickoff decision and unresolved conditional items | GOV-003–GOV-015 | G1 | Gate A record |

## Phase 1 — Product, experience, contract, and architecture design

Primary owners: product owner, product designer, technical lead, QA, security, finance, operations.

| ID | Small outcome | Depends on | Requirement/decision | Minimum evidence |
| --- | --- | --- | --- | --- |
| DES-001 | Map storefront information architecture and navigation | GOV-011 | CAT-01, SEO-01 | Sitemap and navigation model |
| DES-002 | Design home/category/search/product responsive wireflows | DES-001 | CAT-01, SRCH-01, MKT-01 | Reviewed flows with all states |
| DES-003 | Design cart, login/guest and checkout wireflow | GOV-006, GOV-008 | CART-01, CHK-01, ACC-02 | Reviewed flow and error states |
| DES-004 | Design payment handoff, pending, success, failure and recovery views | DES-003 | PAY-01, PAY-02 | Provider-neutral state flow |
| DES-005 | Design order status, cancellation and return customer flows | GOV-008 | ORD-01, RET-01 | Reviewed flows and eligibility messages |
| DES-006 | Design catalog/media administration flow | GOV-011 | CAT-01, MED-01, MIG-01 | Staff flow including validation/conflicts |
| DES-007 | Design inventory and stock-adjustment workspace | GOV-005, GOV-008 | INV-01 | Ledger/position/inspection flow |
| DES-008 | Design order and fulfillment workspace | GOV-007 | ORD-01, SHIP-01 | Queue/detail/transition flow |
| DES-009 | Design payment, reconciliation and refund workspace | GOV-008 | PAY-02, RET-01 | Exception and approval flow |
| DES-010 | Design promotion, content, notification and report workspaces | GOV-011 | MKT-01, NTF-01, RPT-01 | Staff flows with permissions/freshness |
| DES-011 | Define shared visual tokens, component inventory and interaction states | DES-002–DES-010 | SEO-01, NFR-06 | Design-system specification |
| DES-012 | Review critical flows for mobile, keyboard, focus, errors and screen reader intent | DES-002–DES-011 | NFR-03, NFR-06 | Accessibility design review |
| DES-013 | Approve user-facing vocabulary and status copy ownership | DES-002–DES-010 | ORD-01, PAY-01, RET-01 | Terminology/content matrix |
| ANL-001 | Define analytics event names and funnel properties without sensitive data | DES-002–DES-005 | RPT-01, SEC-01 | Event dictionary and consent boundary |
| SYS-001 | Record modular-monolith architecture decision and alternatives | GOV-011 | D08, D09, OPS-01 | Approved architecture decision record |
| SYS-002 | Select AWS region and confirm required service/version/AZ availability | GOV-004, GOV-014 | D08 | Region assessment |
| SYS-003 | Select exact runtime/framework/client/engine patch versions | SYS-002 | D09 | Compatibility matrix and validation notes |
| SYS-004 | Define application, AWS account, VPC, subnet and trust boundaries | SYS-001, SYS-002 | SEC-01, OPS-01 | Deployment/trust diagram |
| SYS-005 | Define domain module ownership and allowed dependencies | SYS-001 | All functional requirements | Module contract document |
| SYS-006 | Define conceptual relational model and aggregate ownership | SYS-005, GOV-005, GOV-008 | CHK-01, INV-01, PAY-01, RET-01 | Reviewed entity/relationship model |
| SYS-007 | Define order/payment/reservation/fulfillment/return/refund transitions | SYS-006 | INV-01, PAY-02, ORD-01, RET-01 | State/guard tables |
| SYS-008 | Define money, rounding, allocation and reconciliation model | GOV-008, SYS-006 | CHK-01, PAY-02, RPT-01 | Finance-approved calculation examples |
| SYS-009 | Define inventory ledger, position, reservation and returned-stock model | GOV-005, SYS-006 | INV-01 | Concurrency/invariant examples |
| SYS-010 | Define API conventions: versioning, errors, pagination, ownership and idempotency | SYS-005–SYS-007 | ACC-01, CHK-01, ADM-01 | API standards and example contracts |
| SYS-011 | Define outbox, event envelope, queue, retry, DLQ and replay policy | SYS-005 | NTF-01, OPS-01, NFR-08 | Async reliability specification |
| SYS-012 | Define cache namespaces, TTL, fallback and security/session isolation | SYS-004, SYS-005 | CART-01, SEC-01, NFR-09 | Cache policy |
| SYS-013 | Define search document/version, freshness, deletion and reindex policy | SYS-005 | SRCH-01, NFR-04, NFR-09 | Search projection specification |
| SYS-014 | Threat-model customer, admin, callback, upload, export and operations paths | SYS-004, SYS-010 | SEC-01, NFR-07 | Threat model and treatment backlog |
| SYS-015 | Define data classification, retention decision points and redaction | SYS-004, SYS-014 | D13, SEC-01 | Data handling matrix |
| SYS-016 | Define telemetry signals, correlation, dashboards and alert ownership | SYS-005, SYS-011 | OPS-01, NFR-01–05 | Observability specification |
| SYS-017 | Define migration expansion/backfill/compatibility and rollback rules | SYS-006 | OPS-01 | Schema change procedure |
| SYS-018 | Define backup, restore, release rollback and incident model | SYS-002, SYS-004 | OPS-01, NFR-05 | Recovery/release design |
| SYS-019 | Review and approve Gate B architecture/design package | DES-001–DES-013, SYS-001–SYS-018 | All P0/P1 | Review record and action closure |

## Phase 2 — Platform and operating foundations

Primary owners: platform engineer, technical lead, security reviewer, QA.

| ID | Small outcome | Depends on | Requirement/decision | Minimum evidence |
| --- | --- | --- | --- | --- |
| FND-001 | Confirm merchant-owned AWS, Auth0, SSLCOMMERZ, domain and repository account ownership | GOV-014 | D05, D16 | Ownership/access register |
| FND-002 | Establish development, staging and production isolation model | SYS-004, FND-001 | SEC-01, OPS-01 | Environment matrix |
| FND-003 | Establish least-privilege human access and emergency-access procedure | FND-001, SYS-014 | SEC-01 | Role mapping and access review |
| FND-004 | Establish Git workflow, review rules and protected deployment environments | GOV-012, FND-001 | OPS-01, SEC-01 | Repository control evidence |
| FND-005 | Establish OpenTofu state ownership, encryption, locking and review | FND-002 | OPS-01, SEC-01 | State/control design review |
| FND-006 | Establish base network, private data access and controlled egress design | SYS-004, FND-005 | SEC-01 | Network review evidence |
| FND-007 | Establish workload identity, secrets, rotation and environment configuration | FND-002, FND-006 | SEC-01 | Secret inventory and access test |
| FND-008 | Establish immutable web/API/worker artifact build and provenance | SYS-003, FND-004 | OPS-01, NFR-07 | Build record and artifact identity |
| FND-009 | Establish staged promotion with health/readiness and approval gates | FND-008 | OPS-01 | Staging promotion demonstration |
| FND-010 | Establish RDS baseline, connectivity, encryption, backup and maintenance settings | SYS-002, FND-006 | OPS-01, NFR-05 | Reviewed nonproduction service evidence |
| FND-011 | Establish Valkey baseline, TLS, access, eviction and isolation settings | SYS-002, SYS-012, FND-006 | NFR-09, SEC-01 | Connectivity/failure evidence |
| FND-012 | Establish OpenSearch baseline, private access, encryption and snapshot approach | SYS-002, SYS-013, FND-006 | SRCH-01, NFR-04 | Connectivity/operations evidence |
| FND-013 | Establish S3 media/private-object separation, encryption, lifecycle and origin controls | SYS-004, SYS-015 | MED-01, SEC-01 | Bucket/access policy review |
| FND-014 | Establish SQS queue/DLQ set and least-privilege publisher/consumer paths | SYS-011, FND-006 | NTF-01, OPS-01 | Queue topology and redrive test |
| FND-015 | Establish CloudFront, WAF, TLS, origin protection and cache policy baseline | FND-006, FND-013 | SEO-01, SEC-01 | Edge/origin access review |
| FND-016 | Establish Auth0 tenant/application/environment configuration baseline | GOV-006, FND-002 | ACC-01 | Tenant ownership and callback review |
| FND-017 | Establish OpenTelemetry, structured redacted logs, Sentry and CloudWatch correlation | SYS-016, FND-009 | OPS-01, SEC-01 | Trace/error/log demonstration |
| FND-018 | Establish dependency, source, container and IaC security checks | FND-004, FND-008 | NFR-07 | Scan policy and sample result |
| FND-019 | Establish database migration execution and compatibility gate | SYS-017, FND-009, FND-010 | OPS-01 | Safe migration rehearsal |
| FND-020 | Establish automated backup checks and clean-environment restore skeleton | SYS-018, FND-010 | NFR-05 | Initial restore procedure/evidence |
| FND-021 | Establish cloud cost tags, budget visibility and service ownership | FND-002 | OPS-01 | Cost dashboard/owner record |
| FND-022 | Demonstrate foundation failure signals and deployment stop behavior | FND-009–FND-020 | OPS-01 | Gate B operational demonstration |

## Phase 3 — Identity, access, catalog, media, and admin shell

Primary owners: frontend/backend engineers, technical lead, product designer, QA, security.

| ID | Small outcome | Depends on | Requirement/decision | Minimum evidence |
| --- | --- | --- | --- | --- |
| IAM-001 | Define customer, staff and machine authentication contract | SYS-010, FND-016 | ACC-01, ACC-02 | Reviewed contract |
| IAM-002 | Establish secure web session and CSRF behavior | IAM-001 | ACC-01, SEC-01 | Session/CSRF verification |
| IAM-003 | Validate API token signature, issuer, audience, expiry and scopes | IAM-001 | ACC-01 | Invalid/expired token evidence |
| IAM-004 | Link Auth0 identity to application customer safely | IAM-003 | ACC-01 | Link/conflict cases |
| IAM-005 | Create and update owned customer profile | IAM-004 | ACC-02 | Ownership and validation evidence |
| IAM-006 | Manage saved customer addresses without changing order history | IAM-005 | ACC-02 | Edit/snapshot isolation cases |
| IAM-007 | Define and enforce staff permission matrix | GOV-006, IAM-003 | ACC-01, ADM-01 | Role/action verification |
| IAM-008 | Enforce record-level customer ownership on every customer resource | IAM-004, SYS-010 | ACC-01, SEC-01 | Cross-customer denial matrix |
| IAM-009 | Create secure expiring guest order access | SYS-010, SYS-015 | ACC-02, SEC-01 | Expiry/guess/reuse/masking cases |
| IAM-010 | Enforce admin MFA and application revocation overlay | IAM-007 | ACC-01, SEC-01 | MFA/revocation evidence |
| IAM-011 | Add attributable security/access audit events | IAM-007, FND-017 | ADM-01, SEC-01 | Audit record review |
| IAM-012 | Verify login/logout/session-expiry/provider-outage journeys | IAM-002–IAM-011 | ACC-01, ACC-02 | Integrated identity scenario evidence |
| CAT-001 | Establish category hierarchy and ordering rules | SYS-006, DES-006 | CAT-01 | Category validation cases |
| CAT-002 | Establish product draft/archive lifecycle | SYS-006, DES-006 | CAT-01 | Transition/history cases |
| CAT-003 | Establish unique variant/SKU and attribute rules | CAT-002 | CAT-01 | Duplicate/invalid cases |
| CAT-004 | Establish current BDT price and activation rules | SYS-008, CAT-003 | CAT-01 | Price/rounding cases |
| CAT-005 | Establish publication readiness validation | CAT-001–CAT-004 | CAT-01 | Incomplete item blocked evidence |
| CAT-006 | Create staff product list/search/filter behavior | IAM-007, CAT-002 | CAT-01, ADM-01 | Permission/list states |
| CAT-007 | Create staff product/variant create and edit behavior | CAT-003, IAM-007 | CAT-01 | Validation/conflict/audit evidence |
| CAT-008 | Create publish, unpublish and archive commands | CAT-005, CAT-007 | CAT-01 | Guard and history evidence |
| CAT-009 | Preserve product references after archive and later edits | CAT-008 | CAT-01, ORD-01 | Historical reference scenario |
| CAT-010 | Emit versioned catalog projection events | SYS-011, CAT-008 | SRCH-01, NFR-04 | Event version/order evidence |
| CAT-011 | Verify catalog permissions and concurrent-edit conflicts | CAT-006–CAT-010 | ADM-01, SEC-01 | Role/conflict matrix |
| MED-001 | Define public media and private file metadata/lifecycle | SYS-006, FND-013 | MED-01, SEC-01 | Object/data model review |
| MED-002 | Issue bounded authorized upload intent | IAM-007, MED-001 | MED-01, SEC-01 | Permission/expiry/size cases |
| MED-003 | Validate type, size and safe processing/quarantine outcome | MED-002 | MED-01, SEC-01 | Malformed/disallowed file evidence |
| MED-004 | Associate processed media with product/variant and ordering/alt text | MED-003, CAT-007 | MED-01, SEO-01 | Association/accessibility cases |
| MED-005 | Publish only approved versioned media paths through CDN | MED-004, FND-015 | MED-01, SEC-01 | Origin/private/public access tests |
| MED-006 | Remove/replace media without breaking historical/public cache safety | MED-005 | MED-01 | Replacement/cache evidence |
| ADM-001 | Create permission-aware admin navigation and session states | IAM-007, DES-006–DES-010 | ADM-01 | Role-specific navigation evidence |
| ADM-002 | Create shared admin list pagination/filter/empty/error behavior | ADM-001 | ADM-01 | Interaction review |
| ADM-003 | Create safe confirmation, conflict and retry patterns for staff commands | SYS-010, ADM-001 | ADM-01 | Conflict/double-submit cases |
| ADM-004 | Create audit viewer with safe filtering and export boundary | IAM-011, ADM-002 | ADM-01, SEC-01 | Permission/redaction evidence |

## Phase 4 — Storefront, search, SEO, and cart

Primary owners: frontend/backend engineers, product designer, SEO/product owner, QA.

| ID | Small outcome | Depends on | Requirement/decision | Minimum evidence |
| --- | --- | --- | --- | --- |
| WEB-001 | Establish public page shell, responsive navigation and global states | DES-001, DES-011, FND-015 | SEO-01 | Mobile/desktop interaction evidence |
| WEB-002 | Deliver homepage content slots and category discovery | WEB-001, CAT-010 | CAT-01, MKT-01 | Published/unpublished states |
| WEB-003 | Deliver paginated category listing | CAT-008, WEB-001 | CAT-01, SEO-01 | Page/empty/error cases |
| WEB-004 | Deliver product detail and variant selection | CAT-008, MED-005 | CAT-01, MED-01 | Variant/unavailable states |
| WEB-005 | Show indicative stock and delivery/policy summary safely | WEB-004, GOV-007 | CAT-01, INV-01 | Stale/unavailable messaging |
| WEB-006 | Establish safe public/private response cache boundaries | SYS-012, WEB-001 | SEC-01, NFR-09 | Cache-header/session isolation evidence |
| WEB-007 | Establish deployment identity and asset-version compatibility | FND-009, WEB-001 | OPS-01 | Mixed-version rollout evidence |
| WEB-008 | Verify critical public pages across agreed devices/browsers | WEB-002–WEB-007 | NFR-03, NFR-06 | Compatibility/accessibility results |
| SEA-001 | Create published-product search projection mapping | SYS-013, CAT-010 | SRCH-01 | Mapping review and sample documents |
| SEA-002 | Process versioned product create/update/delete events duplicate-safely | SEA-001, FND-014 | SRCH-01, NFR-04 | Replay/out-of-order evidence |
| SEA-003 | Deliver bounded keyword search and pagination | SEA-002 | SRCH-01 | Approved query relevance set |
| SEA-004 | Deliver category/attribute/price facets and filters | SEA-003 | SRCH-01 | Facet correctness set |
| SEA-005 | Deliver autocomplete with bounded results and abuse control | SEA-003 | SRCH-01, SEC-01 | Relevance/rate cases |
| SEA-006 | Exclude draft/archived/unavailable items according to approved rules | SEA-002 | SRCH-01 | Publication freshness cases |
| SEA-007 | Measure index freshness and alert on backlog | SEA-002, FND-017 | NFR-04 | Freshness dashboard/alert test |
| SEA-008 | Rebuild new index, catch up events, verify and switch alias | SEA-002 | SRCH-01, OPS-01 | Reindex rehearsal |
| SEA-009 | Provide bounded search-outage browse behavior | WEB-003, SEA-003 | NFR-09 | Outage journey evidence |
| SEO-001 | Define canonical and filter/indexing URL rules | DES-001, SEA-004 | SEO-01 | Reviewed URL policy |
| SEO-002 | Deliver page metadata and social preview rules | WEB-002–WEB-004 | SEO-01 | Representative page review |
| SEO-003 | Deliver sitemap and robots behavior for publication lifecycle | CAT-010, SEO-001 | SEO-01 | Add/remove/update evidence |
| SEO-004 | Deliver appropriate product/breadcrumb structured data | WEB-004 | SEO-01 | Validator/review evidence |
| SEO-005 | Define archive/unavailable redirects and status behavior | CAT-008, SEO-001 | SEO-01 | URL transition cases |
| CART-001 | Establish durable guest and customer cart ownership model | SYS-006, IAM-004 | CART-01, SEC-01 | Ownership model review |
| CART-002 | Add valid published variant to cart | CART-001, WEB-004 | CART-01 | Valid/invalid/duplicate cases |
| CART-003 | Change quantity and remove line within configured limits | CART-002 | CART-01 | Boundary/concurrent cases |
| CART-004 | Persist cart across refresh and approved session lifetime | CART-002, SYS-012 | CART-01 | Persistence/cache-loss evidence |
| CART-005 | Merge guest and customer cart on login using approved rules | CART-004, IAM-004 | CART-01 | Conflict/quantity merge matrix |
| CART-006 | Calculate advisory subtotal without accepting browser price | CAT-004, CART-002 | CART-01, CHK-01 | Tamper/stale price evidence |
| CART-007 | Explain changed price, publication and indicative-stock states | CART-006 | CART-01 | Customer recovery flow |
| CART-008 | Keep cart correct through Valkey loss/eviction | CART-004, FND-011 | CART-01, NFR-09 | Failure/fallback evidence |
| CART-009 | Apply cart abuse/quantity controls without unsafe availability claims | CART-003, SYS-012 | SEC-01 | Limit and fallback cases |
| CART-010 | Accept product-to-cart increment | WEB-008, SEA-009, CART-001–CART-009 | CAT-01, SRCH-01, CART-01 | I2 integrated demonstration |

## Phase 5 — Pricing, promotion, inventory, and checkout

Primary owners: backend/frontend engineers, technical lead, finance, operations, QA.

| ID | Small outcome | Depends on | Requirement/decision | Minimum evidence |
| --- | --- | --- | --- | --- |
| PRC-001 | Establish canonical line subtotal and BDT rounding behavior | SYS-008, CAT-004 | CHK-01 | Finance-reviewed examples |
| PRC-002 | Establish delivery zone eligibility and charge calculation | GOV-007, SYS-008 | SHIP-01, CHK-01 | Zone/boundary examples |
| PRC-003 | Establish approved tax and invoice calculation behavior | GOV-008, SYS-008 | CHK-01, RPT-01 | Finance-reviewed examples |
| PRC-004 | Establish coupon definition, eligibility, date and cap rules | SYS-008, GOV-011 | MKT-01 | Rule/rounding examples |
| PRC-005 | Establish coupon hold, redemption and expiry behavior | PRC-004, SYS-009 | MKT-01, INV-01 | Concurrent-cap evidence |
| PRC-006 | Produce one authoritative quote from current server facts | PRC-001–PRC-005, CART-006 | CHK-01 | Tamper/change cases |
| PRC-007 | Allocate line/order discount, tax and delivery for later refund/reporting | PRC-006 | RET-01, RPT-01 | Reconciliation examples |
| INV-001 | Establish stock location, position and append-only movement records | SYS-009, FND-010 | INV-01 | Model/constraint review |
| INV-002 | Record auditable opening stock and manual adjustment | INV-001, IAM-007 | INV-01, ADM-01 | Reason/role/history cases |
| INV-003 | Expose position, reserved, allocated and available quantities to staff | INV-001, ADM-002 | INV-01 | Calculation/freshness evidence |
| INV-004 | Reserve one line with conditional availability control | INV-001 | INV-01 | Last-unit concurrency evidence |
| INV-005 | Reserve multiple lines atomically in stable order | INV-004 | INV-01, CHK-01 | Full rollback/deadlock review |
| INV-006 | Commit reservation to allocation once | INV-005 | INV-01 | Duplicate/race evidence |
| INV-007 | Release or expire reservation once using database time | INV-005 | INV-01 | Repeated/concurrent sweeper cases |
| INV-008 | Handle payment-versus-expiry race with expected-state guards | INV-006, INV-007 | INV-01, PAY-02 | Race matrix |
| INV-009 | Try fresh atomic allocation for late paid order | INV-008 | INV-01, PAY-02 | Available/unavailable cases |
| INV-010 | Place paid-but-unallocated order on controlled hold | INV-009 | PAY-02, ORD-01 | Exception queue evidence |
| INV-011 | Prevent packing/dispatch from deducting allocated stock again | INV-006 | INV-01, SHIP-01 | Lifecycle stock reconciliation |
| INV-012 | Establish returned-stock quarantine/inspect/restock movements | GOV-008, INV-001 | INV-01, RET-01 | Disposition cases |
| INV-013 | Detect and surface negative/impossible stock anomalies | INV-001, FND-017 | NFR-08, OPS-01 | Alert/investigation evidence |
| CHK-001 | Establish persisted checkout attempt and scoped idempotency key | SYS-010, CART-001 | CHK-01 | Same/different payload cases |
| CHK-002 | Validate guest/customer checkout ownership and contact | IAM-005, IAM-009, CHK-001 | ACC-02, CHK-01 | Ownership/validation cases |
| CHK-003 | Validate address and supported delivery zone | PRC-002, CHK-002 | CHK-01, SHIP-01 | Unsupported/invalid cases |
| CHK-004 | Revalidate publication, variant, quantity and price | PRC-006, CHK-001 | CAT-01, CHK-01 | Stale/tampered cases |
| CHK-005 | Revalidate coupon eligibility and reserve cap | PRC-005, CHK-004 | MKT-01, CHK-01 | Cap/race cases |
| CHK-006 | Reserve all stock and roll back entire checkout on line failure | INV-005, CHK-004 | INV-01, CHK-01 | Multi-line rollback evidence |
| CHK-007 | Snapshot items, address, price, discount, tax and delivery | PRC-007, CHK-003, CHK-006 | CHK-01, ORD-01 | Snapshot/reconciliation review |
| CHK-008 | Create pending order, payment intent, history and outbox atomically | CHK-007, SYS-011 | CHK-01, PAY-01, ORD-01 | Transaction rollback/replay evidence |
| CHK-009 | Return stable result for repeated identical checkout | CHK-008 | CHK-01 | Network retry/double-submit evidence |
| CHK-010 | Present changed-total confirmation and recoverable validation errors | DES-003, CHK-004–CHK-009 | CHK-01, NFR-06 | Customer interaction evidence |
| CHK-011 | Sweep expired checkout reservations and coupon holds | INV-007, PRC-005, CHK-008 | INV-01, MKT-01 | Backlog/retry evidence |
| CHK-012 | Accept commerce-core gate | PRC-001–CHK-011, CART-010 | CHK-01, INV-01, NFR-08 | I3 integrated concurrency demonstration |

## Phase 6 — Payment, queues, and reconciliation

Primary owners: backend engineers, technical lead, finance, platform, QA, security.

| ID | Small outcome | Depends on | Requirement/decision | Minimum evidence |
| --- | --- | --- | --- | --- |
| PAY-001 | Confirm sandbox/live methods, credentials, callbacks, validation, query, refund and settlement capabilities | FND-001, GOV-014 | D05, PAY-01, PAY-02 | Merchant/provider capability matrix |
| PAY-002 | Define application-to-provider status mapping including unknown states | PAY-001, SYS-007 | PAY-01, PAY-02 | Finance-approved mapping |
| PAY-003 | Define unique merchant transaction/reference and amount/currency matching | PAY-001, SYS-008 | PAY-01 | Reference/validation rules |
| PAY-004 | Initiate hosted session only after local checkout commit | CHK-008, PAY-003 | PAY-01 | Transaction/network-boundary evidence |
| PAY-005 | Resolve initiation timeout before allowing another attempt | PAY-004 | PAY-01, PAY-02 | Unknown/reconciliation scenario |
| PAY-006 | Present safe hosted redirect and pending return state | DES-004, PAY-004 | PAY-01 | Browser-return tamper cases |
| PAY-007 | Accept bounded machine callback without browser authentication | SYS-004, SYS-010, PAY-001 | PAY-01, SEC-01 | Route/threat-control evidence |
| PAY-008 | Persist minimal callback receipt before acknowledgement | PAY-007, FND-010 | PAY-01, PAY-02 | Persistence-failure/retry evidence |
| PAY-009 | Deduplicate callback receipt while preserving evidence | PAY-008 | PAY-02, NFR-08 | Duplicate/replay evidence |
| PAY-010 | Verify provider transaction, merchant/environment, status, BDT currency and expected amount | PAY-002, PAY-003, PAY-009 | PAY-01 | Forged/mismatch/success matrix |
| PAY-011 | Serialize successful verification against attempt/order/reservation | PAY-010, INV-006, CHK-008 | PAY-01, INV-01, ORD-01 | Concurrent verification evidence |
| PAY-012 | Allocate active reservation and confirm order exactly once | PAY-011 | PAY-01, INV-01, ORD-01 | Duplicate callback stock/money evidence |
| PAY-013 | Handle verified late success through fresh allocation or hold | PAY-011, INV-009, INV-010 | PAY-02, INV-01 | Late-payment matrix |
| PAY-014 | Preserve and route second successful attempt as excess payment | PAY-011 | PAY-02, RET-01 | Double-payment case |
| PAY-015 | Reconcile pending/unknown attempts on approved schedule | PAY-002, PAY-010 | PAY-02 | Aged-attempt queue and provider query evidence |
| PAY-016 | Create finance payment exception list/detail/actions | PAY-013–PAY-015, ADM-002 | PAY-02, ADM-01 | Permission/action audit cases |
| PAY-017 | Import or record settlement evidence under approved provider process | PAY-001, SYS-008 | PAY-02, RPT-01 | Settlement data provenance |
| PAY-018 | Reconcile order/payment/refund/settlement differences and expose reason | PAY-015, PAY-017 | PAY-02, RPT-01 | Known discrepancy examples |
| PAY-019 | Redact credentials, callback fields, URLs and provider metadata in telemetry | FND-017, PAY-007 | SEC-01 | Log/trace redaction review |
| ASY-001 | Persist and dispatch outbox event after local commit | SYS-011, FND-014, CHK-008 | OPS-01 | Commit/publish failure cases |
| ASY-002 | Republish safely when publish succeeded but marking failed | ASY-001 | OPS-01, NFR-08 | Duplicate publish evidence |
| ASY-003 | Record consumer processing key with local effect | ASY-001 | OPS-01, NFR-08 | Duplicate delivery evidence |
| ASY-004 | Apply bounded retry/jitter and correct visibility timeout | ASY-003 | OPS-01 | Retry/timeout evidence |
| ASY-005 | Move exhausted work to correct DLQ and alert owner | ASY-004, FND-017 | OPS-01 | DLQ/alert demonstration |
| ASY-006 | Provide audited bounded operator replay | ASY-005, IAM-007 | OPS-01, ADM-01 | Authorized replay evidence |
| ASY-007 | Enforce aggregate version/state guard for out-of-order events | ASY-003 | NFR-08 | Out-of-order matrix |
| ASY-008 | Measure outbox and queue age by work type | ASY-001, FND-017 | OPS-01 | Dashboard/threshold review |
| PAY-020 | Accept complete sandbox payment increment including failure/replay cases | PAY-004–PAY-019, ASY-001–ASY-008 | PAY-01, PAY-02, NFR-08 | I4 scenario and reconciliation pack |

## Phase 7 — Order operations, fulfillment, cancellation, return, and refund

Primary owners: backend/frontend engineers, operations, finance, support, QA.

| ID | Small outcome | Depends on | Requirement/decision | Minimum evidence |
| --- | --- | --- | --- | --- |
| ORD-001 | Expose customer/guest order detail with separate state dimensions | IAM-008, IAM-009, CHK-008 | ACC-02, ORD-01 | Ownership/masking/state evidence |
| ORD-002 | Expose authorized staff order list/search/filter | IAM-007, ADM-002, CHK-008 | ORD-01, ADM-01 | Permission/pagination evidence |
| ORD-003 | Expose staff order snapshot, history, payment, stock and fulfillment context | ORD-002, PAY-012 | ORD-01 | Historical consistency review |
| ORD-004 | Enforce allowed order transitions and expected prior state | SYS-007, ORD-003 | ORD-01 | Invalid/concurrent transition matrix |
| ORD-005 | Create controlled order hold/release with reason and authority | ORD-004, IAM-007 | ORD-01, ADM-01 | Hold/permission/audit cases |
| ORD-006 | Make support-visible safe order context and request actions | ORD-003, IAM-007 | ORD-01, SEC-01 | Data-minimization/role evidence |
| ORD-007 | Preserve append-only state/action audit and edit conflict handling | ORD-004, ADM-003 | ORD-01, ADM-01 | History/concurrency evidence |
| FUL-001 | Build fulfillment eligibility projection from verified payment/allocation/hold state | PAY-012, ORD-005 | ORD-01, SHIP-01 | Eligible/ineligible matrix |
| FUL-002 | Expose permission-aware fulfillment queue | FUL-001, ADM-002 | SHIP-01, ADM-01 | Role/queue states |
| FUL-003 | Start picking with expected-state guard and attribution | FUL-002 | SHIP-01 | Concurrent action evidence |
| FUL-004 | Record pack completion without a second stock deduction | FUL-003, INV-011 | SHIP-01, INV-01 | Stock lifecycle reconciliation |
| FUL-005 | Record manual courier booking and validated tracking data | GOV-007, FUL-004 | SHIP-01 | Validation/audit evidence |
| FUL-006 | Dispatch only eligible packed order | FUL-005, ORD-004 | SHIP-01, ORD-01 | Unauthorized/held/unpaid cases |
| FUL-007 | Record delivered status with controlled transition | FUL-006 | SHIP-01 | State/history evidence |
| FUL-008 | Record failed delivery and return-to-origin exception | FUL-006 | SHIP-01, RET-01 | Exception/next-action cases |
| FUL-009 | Complete order only after approved fulfillment condition | FUL-007, ORD-004 | ORD-01 | Premature completion blocked |
| FUL-010 | Accept pick-pack-dispatch-delivery increment | FUL-001–FUL-009 | ORD-01, SHIP-01, INV-01 | I5 integrated operational evidence |
| RET-001 | Define cancellation eligibility by order/payment/fulfillment state | GOV-008, SYS-007 | RET-01 | Finance/operations eligibility table |
| RET-002 | Accept customer/support cancellation request with reason | RET-001, ORD-001, ORD-006 | RET-01 | Ownership/duplicate cases |
| RET-003 | Approve/reject cancellation with permission and expected-state guard | RET-002, IAM-007 | RET-01, ADM-01 | Concurrent/permission evidence |
| RET-004 | Release active stock/coupon holds once on unpaid cancellation | RET-003, INV-007, PRC-005 | RET-01, INV-01 | Repeated cancellation evidence |
| RET-005 | Route paid cancellation to refund workflow without erasing payment | RET-003, PAY-012 | RET-01, PAY-02 | State/reconciliation evidence |
| RET-006 | Define return window, reasons, eligible quantities and evidence rules | GOV-008, SYS-007 | RET-01 | Approved policy mapping |
| RET-007 | Accept owned line-level return request within eligibility | RET-006, ORD-001 | RET-01 | Quantity/window/ownership cases |
| RET-008 | Approve or reject return with reason and authority | RET-007, IAM-007 | RET-01, ADM-01 | Role/state evidence |
| RET-009 | Record received return quantities without automatic restock/refund | RET-008 | RET-01 | Partial/duplicate receipt cases |
| RET-010 | Inspect each returned quantity into sellable/quarantine/damaged disposition | RET-009, INV-012 | RET-01, INV-01 | Disposition/movement evidence |
| RET-011 | Calculate eligible partial/full refund allocation | PRC-007, RET-005 or RET-010 | RET-01 | Finance reconciliation examples |
| RET-012 | Atomically reserve refund balance under concurrent requests | RET-011, SYS-008 | RET-01, NFR-08 | Concurrent over-refund evidence |
| RET-013 | Approve/reject refund with reason, threshold and separation rule | RET-012, IAM-007 | RET-01, ADM-01 | Authority/audit evidence |
| RET-014 | Submit stable refund reference through controlled egress | PAY-001, RET-013 | RET-01, SEC-01 | Egress/reference evidence |
| RET-015 | Treat timeout/ambiguous refund as unknown and reconcile before retry | RET-014, PAY-002 | RET-01, PAY-02 | Unknown/retry matrix |
| RET-016 | Verify final refund status before completion | RET-015 | RET-01 | Initiated/processing/final mapping evidence |
| RET-017 | Reconcile failed/rejected/excess/partial refund and release balance safely | RET-012–RET-016 | RET-01, PAY-02 | Balance/state cases |
| RET-018 | Expose finance return/refund queue and attributable actions | RET-008–RET-017, ADM-002 | RET-01, ADM-01 | Permission/aging/audit evidence |
| RET-019 | Accept cancellation-return-refund increment | RET-001–RET-018 | RET-01, PAY-02, INV-01 | I6 lifecycle/reconciliation pack |

## Phase 8 — Promotions, content, notifications, and reporting

Primary owners: product, frontend/backend engineers, finance, operations, QA.

| ID | Small outcome | Depends on | Requirement/decision | Minimum evidence |
| --- | --- | --- | --- | --- |
| MKT-001 | Create permission-aware coupon list and detail | PRC-004, ADM-002 | MKT-01 | Role/list states |
| MKT-002 | Create/edit coupon rules with finance/product validation | MKT-001 | MKT-01 | Invalid/rounding cases |
| MKT-003 | Activate/deactivate coupon with cap and date safeguards | MKT-002, PRC-005 | MKT-01 | Time/cap transition evidence |
| MKT-004 | Report coupon holds, redemptions and expiry reconciliation | PRC-005, RPT-001 | MKT-01, RPT-01 | Count/amount reconciliation |
| MKT-005 | Create permission-aware homepage campaign content | WEB-002, ADM-001 | MKT-01 | Draft/publish/schedule cases |
| MKT-006 | Validate campaign links/media/publication window | MKT-005, MED-005 | MKT-01, SEO-01 | Invalid/expired cases |
| MKT-007 | Verify campaign/coupon concurrency and cache invalidation | MKT-003, MKT-006 | MKT-01 | Integrated promotion evidence |
| NTF-001 | Select email provider, sender domain and support ownership | GOV-014 | D11 | Provider/readiness record |
| NTF-002 | Define transactional event-to-template/status matrix | NTF-001, SYS-011 | NTF-01 | Product/operations-approved matrix |
| NTF-003 | Create versioned safe templates for approved order/payment/shipment/refund events | NTF-002, DES-013 | NTF-01 | Content/privacy review |
| NTF-004 | Queue notification request from committed domain event | ASY-001, NTF-002 | NTF-01 | Commit/replay evidence |
| NTF-005 | Send duplicate-safely using stable delivery identity | NTF-004 | NTF-01 | Duplicate delivery behavior |
| NTF-006 | Record provider outcome without changing order/payment state | NTF-005 | NTF-01 | Provider failure evidence |
| NTF-007 | Retry, DLQ, alert and approved replay failed delivery | ASY-004–ASY-006, NTF-006 | NTF-01, OPS-01 | Failure/replay demonstration |
| NTF-008 | Expose authorized notification history and backlog | NTF-006, ADM-002 | NTF-01, ADM-01 | Role/redaction evidence |
| NTF-009 | Verify content links, masking, timezone and all lifecycle triggers | NTF-003–NTF-008 | NTF-01, SEC-01 | End-to-end message matrix |
| RPT-001 | Approve metric dictionary, date basis, currency, freshness and owners | GOV-008, ANL-001 | RPT-01 | Metric sign-off |
| RPT-002 | Produce order-count/status report from authoritative history | RPT-001, ORD-007 | RPT-01 | Source reconciliation |
| RPT-003 | Produce GMV, discount, tax, delivery and net-sales report | RPT-001, CHK-007 | RPT-01 | Finance calculation examples |
| RPT-004 | Produce successful payment and collected amount report | RPT-001, PAY-012 | RPT-01, PAY-02 | Payment reconciliation |
| RPT-005 | Produce pending/completed refund and returned-sales report | RPT-001, RET-017 | RPT-01, RET-01 | Refund allocation reconciliation |
| RPT-006 | Produce settlement/fee/discrepancy report | PAY-017, PAY-018 | RPT-01, PAY-02 | Provider-vs-ledger reconciliation |
| RPT-007 | Produce stock position/movement/reservation/anomaly report | INV-001–INV-013 | RPT-01, INV-01 | Quantity roll-forward reconciliation |
| RPT-008 | Produce fulfillment lead-time and delivery-exception report | FUL-001–FUL-009 | RPT-01 | Timestamp/status validation |
| RPT-009 | Produce search zero-result and funnel event views | ANL-001, SEA-003 | RPT-01 | Event quality/privacy review |
| RPT-010 | Apply staff permission, bounded filters and freshness label | IAM-007, RPT-002–RPT-009 | RPT-01, SEC-01 | Cross-role/freshness cases |
| RPT-011 | Generate private bounded export with expiry and audit | RPT-010, FND-013 | RPT-01, MED-01, SEC-01 | Access/expiry/volume evidence |
| RPT-012 | Reconcile representative order through every report | RPT-002–RPT-011 | RPT-01 | Traceable worked example |
| RPT-013 | Accept content-message-reporting increment | MKT-001–MKT-007, NTF-001–NTF-009, RPT-001–RPT-012 | MKT-01, NTF-01, RPT-01 | I7 integrated operational evidence |

## Phase 9 — Migration and integrated quality hardening

Primary owners: data owner, engineering, QA, security, platform, product, finance, operations.

| ID | Small outcome | Depends on | Requirement/decision | Minimum evidence |
| --- | --- | --- | --- | --- |
| MIG-001 | Obtain approved representative CSV, media and opening-stock sample | GOV-009 | MIG-01 | Source/version/owner record |
| MIG-002 | Define source-to-target field, type, default and rejection mapping | MIG-001, SYS-006 | MIG-01 | Mapping approval |
| MIG-003 | Fingerprint source and validate encoding/header/size/schema safely | MIG-002 | MIG-01, SEC-01 | File-level validation cases |
| MIG-004 | Validate row required fields, SKU, variant, price and stock rules | MIG-003, CAT-003, CAT-004 | MIG-01 | Row error report |
| MIG-005 | Detect duplicate/conflicting SKU/category/product relationships | MIG-004 | MIG-01 | Conflict report |
| MIG-006 | Validate media mapping, existence, type and ownership | MIG-004, MED-003 | MIG-01, MED-01 | Media discrepancy report |
| MIG-007 | Produce import preview with counts, totals, warnings and rejected rows | MIG-003–MIG-006 | MIG-01 | Reviewable preview |
| MIG-008 | Execute idempotent/resumable isolated rehearsal | MIG-007, FND-019 | MIG-01, OPS-01 | Restart/replay evidence |
| MIG-009 | Reconcile SKU, product, publication, price, media and opening stock | MIG-008 | MIG-01, INV-01 | Signed reconciliation |
| MIG-010 | Define final source freeze, controlled delta and cutover timing | MIG-009, GOV-014 | MIG-01 | Cutover data plan |
| MIG-011 | Rehearse failure recovery/rollback without partial commercial truth | MIG-008, SYS-018 | MIG-01, OPS-01 | Failure/recovery evidence |
| MIG-012 | Approve production import package and accountable sign-off | MIG-009–MIG-011 | MIG-01 | Gate E data approval |
| QLT-001 | Complete requirement-to-task-to-scenario coverage review | GOV-011, all planned tasks | All P0/P1 | No unexplained coverage gaps |
| QLT-002 | Execute critical customer journey functional acceptance | Feature increments | CAT/CART/CHK/PAY/ORD/RET | Product acceptance evidence |
| QLT-003 | Execute staff role, ownership, export and revoked-access matrix | IAM/ADM tasks | ACC-01, ADM-01, SEC-01 | Security/QA evidence |
| QLT-004 | Execute checkout tamper, idempotency, rollback and last-unit concurrency | CHK-012 | CHK-01, INV-01, NFR-08 | Integrity evidence |
| QLT-005 | Execute forged, duplicate, late, out-of-order and double payment matrix | PAY-020 | PAY-01, PAY-02, NFR-08 | Finance/QA evidence |
| QLT-006 | Execute concurrent cancellation/return/refund and over-refund matrix | RET-019 | RET-01, NFR-08 | Finance/QA evidence |
| QLT-007 | Execute queue duplicate, crash, timeout, DLQ and replay matrix | ASY-001–ASY-008 | OPS-01, NFR-08 | Resilience evidence |
| QLT-008 | Execute cache loss/eviction and safe fallback load test | CART-008, SYS-012 | NFR-09 | Correctness/capacity evidence |
| QLT-009 | Execute search outage, stale event, deletion and reindex test | SEA-002–SEA-009 | NFR-04, NFR-09 | Search resilience evidence |
| QLT-010 | Execute approved mixed-load and burst profile | GOV-004, full staging system | NFR-01, NFR-02 | Repeatable performance report |
| QLT-011 | Execute Core Web Vitals on agreed mobile/network profile | WEB-008, representative data | NFR-03 | Page/journey results |
| QLT-012 | Execute keyboard, focus, labels, errors, contrast and screen-reader review | DES-012, complete critical flows | NFR-06 | Accessibility evidence/defects |
| QLT-013 | Execute application/API/upload/export/abuse security review | SYS-014, complete system | SEC-01, NFR-07 | Findings and remediation record |
| QLT-014 | Execute dependency/container/IaC/secret exposure review | FND-018, release candidate | NFR-07 | Findings and remediation record |
| QLT-015 | Execute DB failover/restore and reconcile post-restore payment backlog | FND-020, full staging system | OPS-01, NFR-05 | Timed recovery evidence |
| QLT-016 | Execute deployment rollback/forward-repair with in-flight work | FND-009, SYS-017 | OPS-01 | Release recovery evidence |
| QLT-017 | Execute Auth0, payment, email, S3/CDN and queue dependency-failure journeys | Complete integrations | OPS-01, NFR-09 | Failure behavior matrix |
| QLT-018 | Reconcile catalog-to-order-to-payment-to-stock-to-refund-to-report example | Complete system | RPT-01, NFR-08 | End-to-end ledger evidence |
| QLT-019 | Triage all defects and obtain explicit exception decisions | QLT-001–QLT-018 | All | Defect/gate register |
| QLT-020 | Record Release Candidate Gate E result | MIG-012, QLT-001–QLT-019 | All P0/P1, G3 | Signed ready/hold decision |

## Phase 10 — Production readiness, pilot, launch, and handover

Primary owners: sponsor, delivery, platform, finance, operations, support, product, security.

| ID | Small outcome | Depends on | Requirement/decision | Minimum evidence |
| --- | --- | --- | --- | --- |
| LCH-001 | Approve customer policies, retention, privacy, accessibility and support content | GOV-008, D13/D15 owners | D13, D15, SEC-01 | Owner-approved content |
| LCH-002 | Confirm production SSLCOMMERZ methods, callback, validation, refund egress and support route | PAY-001, QLT-005 | D05, PAY-01, PAY-02 | Production readiness checklist |
| LCH-003 | Confirm production Auth0, email, domain, DNS, TLS, WAF and origin settings | FND-015, FND-016, NTF-001 | ACC-01, NTF-01, SEC-01 | Production config review |
| LCH-004 | Confirm on-call, finance, fulfillment, support and escalation cover | GOV-001, QLT-019 | OPS-01 | Named rota/contact record |
| LCH-005 | Train catalog/inventory operators and verify role access | CAT/INV/ADM tasks | CAT-01, INV-01, ADM-01 | Practical exercise sign-off |
| LCH-006 | Train order/fulfillment/support operators and verify procedures | ORD/FUL tasks | ORD-01, SHIP-01 | Practical exercise sign-off |
| LCH-007 | Train finance on payment/refund/settlement reconciliation | PAY/RET/RPT tasks | PAY-02, RET-01, RPT-01 | Practical exercise sign-off |
| LCH-008 | Train platform operators on deploy, alerts, incident, DLQ, restore and reindex | FND/ASY/SEA/QLT tasks | OPS-01 | Practical exercise sign-off |
| LCH-009 | Rehearse complete cutover, data import, smoke checks and rollback timing | MIG-012, QLT-020 | MIG-01, OPS-01 | Timed cutover rehearsal |
| LCH-010 | Freeze approved source and execute controlled production import | LCH-009 | MIG-01 | Job record and source fingerprint |
| LCH-011 | Reconcile production SKU, price, media, publication and opening stock | LCH-010 | MIG-01, INV-01 | Data/operations sign-off |
| LCH-012 | Verify production backups, access recovery, alerts, queues, dashboards and cost ownership | QLT-015, LCH-003, LCH-004 | OPS-01, NFR-05 | Operations readiness record |
| LCH-013 | Obtain sponsor approval for controlled low-value live purchase/refund | LCH-001–LCH-012 | G3 | Explicit transaction authorization |
| LCH-014 | Execute and reconcile approved live purchase, allocation, notification, fulfillment test boundary and refund | LCH-013 | PAY-01, PAY-02, INV-01, RET-01 | Provider/ledger/stock evidence |
| LCH-015 | Open limited pilot with defined users/SKUs/traffic and stop conditions | LCH-014 | OPS-01 | Pilot decision and monitoring record |
| LCH-016 | Reconcile every pilot order, payment, refund, stock movement and failed notification | LCH-015 | PAY-02, RPT-01 | Zero-unexplained-difference record |
| LCH-017 | Review pilot defects, support volume, service targets and operational workload | LCH-015, LCH-016 | NFR-01–NFR-09 | Pilot review and action closure |
| LCH-018 | Record sponsor public launch/hold decision | LCH-017, QLT-020 | G3 | Dated decision with reasons |
| LCH-019 | Expand public traffic/campaign exposure under monitored release plan | LCH-018 | OPS-01 | Release observation record |
| LCH-020 | Reconcile launch-day money, stock, queues, notifications and incidents | LCH-019 | PAY-02, INV-01, OPS-01 | Day-one operating record |
| LCH-021 | Transfer account ownership, runbooks, evidence, known issues and service inventory | LCH-019 | OPS-01 | Handover acceptance |
| LCH-022 | Run two-week hypercare with daily finance/stock/error review | LCH-019, LCH-020 | OPS-01 | Daily record and defect closure |
| LCH-023 | Review operating cost, incidents, support capacity, patches and Release 2 evidence | LCH-022 | FUT-01, OPS-01 | Hypercare exit review |
| LCH-024 | Record steady-operation ownership and hypercare exit | LCH-021–LCH-023 | OPS-01 | Gate F completion record |

## Catalog completeness rules

This catalog covers the planned Release 1 outcome but will change when G1/G2 decisions become facts. New tasks must not bypass scope control. A task can be removed only when its requirement is removed, covered elsewhere with equal acceptance, or formally superseded. Update the traceability matrix whenever that happens.
