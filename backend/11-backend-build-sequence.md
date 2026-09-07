# Backend build sequence

**Purpose:** Small, dependency-ordered planning tasks for future backend implementation.  
**Status:** Every task is Planned unless separately recorded.  
**Rule:** This sequence is documentation only; completing a design task does not mean software exists.

## How to use this plan

Under [AI-DLC](../context/aidlc/README.md), select these BE rows as design inputs to the active Unit/Bolt. Completing a BE design review does not close a BUILD implementation task. The [execution map](../context/aidlc/execution-map.md) assigns BUILD/ADAPT ownership and retains task-level prerequisites; review only the relevant subset before the next authorized slice.

Use this as a design/refinement catalog. For actual backend implementation, follow the [44-task implementation sequence](readiness/05-implementation-sequence.md) and its local/sandbox/production gates; all 199 design rows are not prerequisites for local bootstrap. Select design rows by relevant dependency. Before a task starts, confirm its inputs and owner. Before it closes, attach the stated reviewable evidence, update requirement traceability, decisions, risks, OpenAPI/data-flow artifacts, and the status board. Money, stock, authorization, provider, migration, and replay tasks require negative and concurrency evidence appropriate to their risk.

## Phase A — decisions and readiness

| ID | Small outcome | Depends on | Completion evidence |
| --- | --- | --- | --- |
| BE-001 | Confirm Release 1 merchant, market, currency, language, and excluded capabilities | None | D01 approval linked |
| BE-002 | Confirm SKU, order, traffic, concurrency, and seasonal planning envelope | BE-001 | D02 capacity inputs |
| BE-003 | Confirm warehouse, reservation, oversell, backorder, and shipment rules | BE-001 | D03 signed scenarios |
| BE-004 | Confirm customer login, guest checkout, staff MFA, and session expectations | BE-001 | D04 signed identity flow |
| BE-005 | Obtain SSLCOMMERZ sandbox/live/refund/settlement capability evidence | BE-001 | D05 provider evidence |
| BE-006 | Confirm delivery zones, charges, manual courier flow, and COD exclusion | BE-001 | D06 signed scenarios |
| BE-007 | Approve cancellation, return, restock, tax, invoice, and refund rules | BE-001 | D07 signed examples |
| BE-008 | Select AWS region and validate required managed-service availability | BE-002 | D08 assessment |
| BE-009 | Select exact Node, NestJS, package manager, Drizzle, driver, and client versions | BE-002; regional managed-version confirmation before cloud deployment | D09 compatibility matrix |
| BE-010 | Confirm import sources, sample, mapping ownership, and excluded history | BE-001 | D10 source profile |
| BE-011 | Select email provider, sender domain, mailbox, and ownership | BE-001 | D11 readiness record |
| BE-012 | Approve privacy, retention, accessibility, and consumer policies | BE-001 | D13 policy record |
| BE-013 | Approve availability, latency, freshness, recovery, and security targets | BE-002 | D14 approved targets |
| BE-014 | Record merchant ownership and delegated access for all service accounts | BE-008 | D16 account matrix |

## Phase B — architecture and contracts

| ID | Small outcome | Depends on | Completion evidence |
| --- | --- | --- | --- |
| BE-015 | Approve modular-monolith and separate API/worker runtime decision | BE-009 | Architecture decision A01 |
| BE-016 | Approve PostgreSQL authority and cache/search projection boundaries | BE-015 | Architecture decision A03 |
| BE-017 | Approve Standard SQS, transactional outbox, and duplicate-safe consumer model | BE-015 | Architecture decision A04 |
| BE-018 | Approve one-shipment and separate commerce state dimensions | BE-003, BE-007 | Architecture decision A05 |
| BE-019 | Define backend repository/workspace ownership and review rules | BE-015 | Repository blueprint |
| BE-020 | Define API, dispatcher, payment, notification, search, file, and scheduler startup roles | BE-015 | Runtime composition map |
| BE-021 | Define module layering and allowed dependency direction | BE-015 | Dependency rules accepted |
| BE-022 | Assign every database aggregate/table lifecycle to a backend module | BE-016 | Ownership matrix |
| BE-023 | Define cross-module synchronous application contracts | BE-022 | Interaction matrix |
| BE-024 | Define domain-event catalog owners, consumers, and schema governance | BE-017, BE-023 | Event catalog |
| BE-025 | Choose browser-to-web-to-API session/token propagation design | BE-004, BE-021 | Threat-reviewed sequence |
| BE-026 | Choose API exposure, private routing, provider callback, and operations boundaries | BE-008, BE-025 | Trust-boundary design |
| BE-027 | Define `/api/v1` naming, versioning, deprecation, and compatibility policy | BE-020 | API convention |
| BE-028 | Define stable problem response and backend error taxonomy | BE-027 | Error catalog |
| BE-029 | Define money, timestamp, identifier, enum, and pagination representations | BE-027; synthetic money rules now, D07 before real pricing | Shared contract conventions |
| BE-030 | Define idempotency-key canonicalization, scope, conflict, and retention contract | BE-028; retention defaults for synthetic use, D13 before real data | Idempotency decision |
| BE-031 | Define expected-version/ETag precondition behavior | BE-028 | Concurrency contract |
| BE-032 | Review OpenAPI audience, operation metadata, examples, and change gates | BE-027 | OpenAPI governance approval |

## Phase C — backend platform foundation

| ID | Small outcome | Depends on | Completion evidence |
| --- | --- | --- | --- |
| BE-033 | Define validated configuration schema for each runtime role | BE-024, BE-026 | Configuration inventory |
| BE-034 | Define environment isolation and naming rules | BE-008, BE-014, BE-033 | Environment matrix |
| BE-035 | Define secret sources, access, rotation, and startup redaction | BE-014, BE-033, BE-034 | Secret lifecycle review |
| BE-036 | Define service identity, release identity, correlation, and request-deadline context | BE-026 | Request context contract |
| BE-037 | Define structured logging fields and prohibited data | BE-012, BE-036 | Redaction review |
| BE-038 | Define OpenTelemetry resource, trace, metric, and propagation conventions | BE-036, BE-037 | Telemetry specification |
| BE-039 | Define Sentry error capture, grouping, sampling, and PII controls | BE-037, BE-038 | Error telemetry policy |
| BE-040 | Define liveness, startup, and role-specific readiness semantics | BE-026 | Probe matrix |
| BE-041 | Define PostgreSQL pool budgets by API and worker role | BE-002, BE-024 | Connection budget |
| BE-042 | Define transaction/unit-of-work ownership and retry classification | BE-022, BE-023, BE-041 | Unit-of-work contract |
| BE-043 | Define Drizzle repository boundaries and prohibition on controller ORM access | BE-021, BE-022, BE-042 | Repository standard |
| BE-044 | Define stable clock, UUID/reference generation, and canonical hashing services | BE-009, DB decisions | Platform service contract |
| BE-045 | Define application audit writer and safe change-summary contract | BE-012, BE-023, BE-037, BE-043 | Audit contract |
| BE-046 | Define idempotency coordinator lifecycle and recovery behavior | BE-030, BE-042–BE-044 | Idempotency state diagram |
| BE-047 | Define outbox writer, publisher routing, lease, and retry behavior | BE-017, BE-024, BE-042, BE-043 | Outbox design |
| BE-048 | Define SQS envelope validation and consumer lifecycle | BE-017, BE-024, BE-047 | Consumer contract |
| BE-049 | Define provider HTTP client timeout/retry/unknown/redaction policy | BE-036, BE-044; D05 required only for real provider mappings | External adapter standard |
| BE-050 | Define Valkey namespaces, TTLs, stampede controls, and fallback limits | BE-016, BE-044 | Cache registry |
| BE-051 | Define OpenSearch aliases, projection schema/version, and query bounds | BE-016, BE-044 | Search contract |
| BE-052 | Define S3 private key namespaces and signed upload/download rules | BE-012, BE-044 | Object policy |

## Phase D — identity, authorization, and customer context

| ID | Small outcome | Depends on | Completion evidence |
| --- | --- | --- | --- |
| BE-053 | Define customer and staff Auth0 issuers/audiences/scopes and claim checks | BE-004, BE-025 | Token-validation matrix |
| BE-054 | Define JWKS caching, rotation, outage, and clock-skew behavior | BE-053 | Key-rotation scenario |
| BE-055 | Define external identity to application-account mapping | BE-053 | Identity-link contract |
| BE-056 | Define inactive account and unlinked identity responses without enumeration | BE-055 | Negative-case matrix |
| BE-057 | Define application role, permission, grant, and revocation evaluation | BE-022, BE-055 | Authorization policy |
| BE-058 | Define grant-cache freshness and fail-closed behavior for sensitive actions | BE-050, BE-057 | Revocation target proof plan |
| BE-059 | Define customer profile read/update use cases and field classifications | BE-055, BE-057 | Profile contract |
| BE-060 | Define saved-address create/list/edit/remove ownership and version rules | BE-031, BE-057, BE-059 | Address contract |
| BE-061 | Define guest cart owner capability lifecycle | BE-030, BE-055 | Guest cart security review |
| BE-062 | Define guest order access issue, hash, verify, rotate, revoke, and mask flow | BE-030, BE-055, BE-057 | Guest order threat scenarios |
| BE-063 | Define staff permission families and role matrix | BE-007, BE-057 | Approved action matrix |
| BE-064 | Define refund/export/adjustment thresholds and requester-approver separation | BE-007, BE-063 | Approval matrix |
| BE-065 | Define support, service-operator, platform-admin, and break-glass boundaries | BE-057, BE-063 | Privileged-access record |
| BE-066 | Trace every protected endpoint to permission and ownership predicates | BE-029, BE-032, BE-057–BE-065 | Authorization inventory |
| BE-067 | Review identity/authorization audit events and sensitive-denial policy | BE-045, BE-057, BE-063, BE-065 | Audit matrix |

## Phase E — catalog, media, pricing, and promotion

| ID | Small outcome | Depends on | Completion evidence |
| --- | --- | --- | --- |
| BE-068 | Define product, variant, category, attribute, and SKU application contracts | BE-023, database schema | Catalog use-case map |
| BE-069 | Define catalog draft/published/archived state and transition guards | BE-001, BE-068 | Catalog state matrix |
| BE-070 | Define publication-readiness checklist across content, variant, price, and media | BE-069 | Publication scenarios |
| BE-071 | Define staff catalog list/detail filters, sort, cursor, and field scope | BE-029, BE-068 | Query plan contract |
| BE-072 | Define product/variant edits with expected-version conflict behavior | BE-031, BE-068 | Conflict scenarios |
| BE-073 | Define price schedule/activate/close use cases and interval serialization | BE-009, BE-068; database price-interval rules | Price activation matrix |
| BE-074 | Define exact quote arithmetic, allocation order, and finance rounding examples | BE-007 | Golden calculation examples |
| BE-075 | Define delivery-zone/rule lookup and charge calculation | BE-006 | Delivery examples |
| BE-076 | Define tax-policy version selection and order snapshot handoff | BE-007, DB-022 | Tax contract or blocked record |
| BE-077 | Define coupon campaign lifecycle, targeting, time, cap, and one-coupon policy | BE-007 | Coupon rule matrix |
| BE-078 | Define coupon preview versus atomic hold/release/redemption behavior | BE-042, BE-077 | Concurrency scenarios |
| BE-079 | Define media upload intent constraints and private object key policy | BE-052, BE-067 | Upload contract |
| BE-080 | Define media inspection/quarantine/derivative status workflow | BE-079 | Media processing matrix |
| BE-081 | Define media approval/publication and product ordering behavior | BE-079, BE-080 | Public/private access evidence plan |
| BE-082 | Define catalog/price/media events and complete search projection input | BE-024, BE-047, BE-068, BE-073, BE-077, BE-081 | Projection mapping |
| BE-083 | Define archive/unpublish cache, search tombstone, sitemap, and order-history effects | BE-050, BE-051, BE-069, BE-082 | Removal scenarios |
| BE-084 | Map catalog/media/pricing/promotion APIs into OpenAPI operations | BE-032, BE-068–BE-083 | Reviewed contract section |

## Phase F — search and cart

| ID | Small outcome | Depends on | Completion evidence |
| --- | --- | --- | --- |
| BE-085 | Define published-product OpenSearch document and projection schema version | BE-051, BE-082 | Document mapping |
| BE-086 | Define keyword, autocomplete, facet, category, sort, and cursor query contract | BE-029, BE-032, BE-051, BE-085 | Search API examples |
| BE-087 | Define search input bounds, timeouts, result limits, and safe highlighting | BE-051, BE-086 | Abuse/performance review |
| BE-088 | Define projection apply rule using aggregate version and full source reload | BE-024, BE-047, BE-051, BE-085 | Stale-event scenarios |
| BE-089 | Define tombstone/delete handling for unpublished and archived products | BE-069, BE-083, BE-088 | Delete freshness proof plan |
| BE-090 | Define reindex create/catch-up/verify/alias-switch/rollback workflow | BE-051, BE-085, BE-088, BE-089 | Reindex runbook |
| BE-091 | Define bounded database fallback and explicit degraded-search response | BE-050, BE-051, BE-086 | Search outage plan |
| BE-092 | Define durable guest/customer cart ownership and active-cart policy | BE-057, BE-061, database T01 | Cart ownership contract |
| BE-093 | Define cart line add/change/remove use cases and quantity bounds | BE-092 | Cart state examples |
| BE-094 | Define observed price/availability response and stale indication | BE-073, BE-085, BE-092, BE-093 | Stale cart scenarios |
| BE-095 | Define guest-to-customer cart merge conflict and quantity policy | BE-057, BE-061, BE-092, BE-093 | Merge matrix |
| BE-096 | Define cart Valkey acceleration, invalidation, and DB fallback | BE-050, BE-092, BE-093 | Cache-loss scenarios |
| BE-097 | Define cart expiry/purge under retention and active-checkout guards | BE-012, BE-092 | Retention/job contract |
| BE-098 | Map search/cart APIs and errors into OpenAPI operations | BE-032, BE-084–BE-097 | Reviewed contract section |

## Phase G — inventory, checkout, and order

| ID | Small outcome | Depends on | Completion evidence |
| --- | --- | --- | --- |
| BE-099 | Define authoritative stock-position and movement query contracts | BE-003, database design | Inventory read contract |
| BE-100 | Define stock adjustment permission, reason, threshold, version, and operation key | BE-031, BE-044, BE-063, BE-064, BE-099; database T05 | Adjustment scenarios |
| BE-101 | Define opening-stock import effect through the movement contract | BE-010, BE-099, BE-100 | Opening balance reconciliation |
| BE-102 | Define reservation header/line creation and stable lock ordering | BE-003, database T02 | Final-unit concurrency plan |
| BE-103 | Define reservation release/expiry terminal-operation behavior | BE-102, database T03 | Duplicate expiry scenarios |
| BE-104 | Define verified-payment allocation and fresh late-allocation behavior | BE-102, BE-103, database T04 | Late payment scenarios |
| BE-105 | Define return-restock movement contract by inspection disposition | BE-099, BE-100, BE-102, database T07 | Disposition scenarios |
| BE-106 | Define quote request inputs, authoritative source reads, and canonical hash | BE-029, BE-073–BE-078, BE-092–BE-094, BE-099 | Quote contract |
| BE-107 | Define quote-change/reconfirmation outcome without reservation | BE-106 | Price/stock/coupon change scenarios |
| BE-108 | Define checkout command actor, idempotency, validation, and response contract | BE-030, BE-062, BE-106, BE-107 | Checkout API contract |
| BE-109 | Define T02 orchestration across modules and exact lock/write order | BE-023, BE-042, BE-068, BE-073–BE-078, BE-102, BE-106, BE-108 | Transaction walkthrough |
| BE-110 | Define immutable order item, address, discount, tax, and total snapshot mapping | BE-074–BE-076, BE-108, BE-109; database T02 | Snapshot reconciliation |
| BE-111 | Define initial payment-attempt intent creation inside checkout commit | BE-109, BE-110 | Atomicity review |
| BE-112 | Define checkout failure mapping for validation, reconfirmation, contention, and dependency loss | BE-028, BE-041, BE-042, BE-107–BE-111 | Failure matrix |
| BE-113 | Define order customer/guest/staff query projections and PII masking | BE-029, BE-057, BE-062, BE-110 | Response visibility matrix |
| BE-114 | Define order state, hold, cancellation, and completion command guards | BE-007, BE-018, BE-031, BE-110 | Order transition matrix |
| BE-115 | Define reservation-expiry/payment-race orchestration under global lock order | BE-103, BE-104, BE-111, BE-114 | Race schedule evidence plan |
| BE-116 | Define inventory/order events, cache effects, and operational work queues | BE-024, BE-047, BE-102–BE-115 | Event mapping |
| BE-117 | Map inventory/checkout/order APIs into OpenAPI operations | BE-032, BE-099–BE-116 | Reviewed contract section |
| BE-118 | Review all order amount and reservation/allocation reconciliation assertions | BE-102, BE-104, BE-109–BE-111 | Invariant checklist |

## Phase H — payment, refund, and settlement

| ID | Small outcome | Depends on | Completion evidence |
| --- | --- | --- | --- |
| BE-119 | Map SSLCOMMERZ session, IPN, validation, risk, refund, and status fields | BE-005, DB-024 | Provider field/status mapping |
| BE-120 | Define sandbox/live endpoint and merchant/environment separation | BE-005, BE-014, BE-026, BE-119 | Environment mapping |
| BE-121 | Define payment-attempt numbering/reference and one-active-attempt policy | BE-111, BE-119, BE-120 | Attempt lifecycle |
| BE-122 | Define session initiation request, response, timeout, and unknown outcome | BE-049, BE-120, BE-121 | Initiation failure matrix |
| BE-123 | Define provider return-page navigation flow without payment mutation | BE-026, BE-120, BE-121 | Return route sequence |
| BE-124 | Define IPN route size/rate/fingerprint/redaction/durable acknowledgement | BE-026, BE-035, BE-037, BE-045, BE-120 | Callback intake contract |
| BE-125 | Define callback duplicate and unsupported/malformed handling | BE-124 | Callback negative cases |
| BE-126 | Define server validation call and merchant/reference/amount/currency/status/risk checks | BE-049, BE-119, BE-120, BE-124, BE-125 | Validation matrix |
| BE-127 | Define immutable validation evidence and redacted provider data | BE-012, BE-037, BE-045, BE-126 | Evidence schema review |
| BE-128 | Define T04 verified-success transaction and allocation/hold outcomes | BE-042, BE-104, BE-114, BE-121, BE-126, BE-127 | Payment success walkthrough |
| BE-129 | Define late success and multiple successful attempt exception handling | BE-121, BE-128 | Late/excess scenarios |
| BE-130 | Define failed/cancelled/expired/unknown mappings and permissible transitions | BE-126 | Payment state matrix |
| BE-131 | Define pending/unknown payment reconciliation cadence and query behavior | BE-049, BE-120, BE-121, BE-126, BE-130 | Aging/reconciliation plan |
| BE-132 | Define finance payment exception assignment and resolution controls | BE-063, BE-064, BE-128–BE-131 | Exception workflow |
| BE-133 | Define refund eligibility and component allocation examples | BE-007, BE-074, BE-118, BE-128 | Refund calculation examples |
| BE-134 | Define refund request/approval/rejection authority and separation | BE-063, BE-064, BE-133 | Refund approval matrix |
| BE-135 | Define T08 refundable-balance reservation under concurrent requests | BE-042, BE-128, BE-133, BE-134 | Over-refund concurrency plan |
| BE-136 | Define refund submission stable reference, attempt, timeout, and unknown state | BE-049, BE-120, BE-135 | Submission workflow |
| BE-137 | Define refund status query and T09 verified completion/failure handling | BE-049, BE-126, BE-136 | Provider outcome matrix |
| BE-138 | Define settlement source fingerprint, parsing schema, and amount/sign conventions | BE-005, BE-119; actual provider settlement sample | Settlement mapping |
| BE-139 | Define automatic and manual settlement matching with audit | BE-138 | Match/reconciliation examples |
| BE-140 | Define payment/refund/settlement reports and aged work queues | BE-029, BE-132–BE-139 | Finance query definitions |
| BE-141 | Define payment/refund events and notification/report consumers | BE-024, BE-047, BE-128–BE-140 | Event mapping |
| BE-142 | Map payment/refund/settlement APIs into OpenAPI operations | BE-032, BE-119–BE-141 | Reviewed contract section |

## Phase I — fulfillment, cancellation, and returns

| ID | Small outcome | Depends on | Completion evidence |
| --- | --- | --- | --- |
| BE-143 | Define fulfillment eligibility query from order/payment/allocation/hold facts | BE-018, BE-104, BE-114, BE-128 | Eligibility matrix |
| BE-144 | Define one-shipment creation and shipment-item allocation mapping | BE-018, BE-104, BE-114, BE-128, BE-143 | Shipment creation contract |
| BE-145 | Define picking transition, actor, state/version, and history | BE-144 | Picking scenarios |
| BE-146 | Define packing transition and completeness guard | BE-145 | Packing scenarios |
| BE-147 | Define dispatch transition, manual courier/tracking fields, and guard | BE-006, BE-146 | Dispatch scenarios |
| BE-148 | Define delivery, failed-delivery, and return-to-origin transitions | BE-147 | Exception state matrix |
| BE-149 | Verify fulfillment transitions never modify stock position/movement | BE-144–BE-148 | Stock non-effect review |
| BE-150 | Define customer/staff cancellation request policy and concurrency guards | BE-114, BE-128, BE-143–BE-148 | Cancellation matrix |
| BE-151 | Define return-request eligibility, window, ownership, lines, and reasons | BE-007, BE-057, BE-113, BE-114 | Return request contract |
| BE-152 | Define cumulative return-quantity lock/check across existing cases | BE-151 | Concurrent return plan |
| BE-153 | Define return approval/rejection authority and transition | BE-063, BE-064, BE-151, BE-152 | Approval scenarios |
| BE-154 | Define receipt quantities and discrepancies | BE-153 | Receipt scenarios |
| BE-155 | Define inspection dispositions and sellable-restock relationship | BE-105, BE-154 | Inspection matrix |
| BE-156 | Define return resolution and independent refund handoff | BE-133, BE-155 | Return/refund boundary |
| BE-157 | Define fulfillment/return events and notification/report effects | BE-024, BE-047, BE-144–BE-156 | Event mapping |
| BE-158 | Map fulfillment/cancellation/return APIs into OpenAPI operations | BE-032, BE-143–BE-157 | Reviewed contract section |

## Phase J — files, notifications, reporting, and operations

| ID | Small outcome | Depends on | Completion evidence |
| --- | --- | --- | --- |
| BE-159 | Define notification template lifecycle, approval, versioning, and locale | BE-011, BE-012; versioned synthetic templates while email access is pending | Template contract |
| BE-160 | Define lifecycle-event to notification-request mapping and dedupe keys | BE-024, BE-141, BE-157, BE-159 | Notification event matrix |
| BE-161 | Define safe render model, recipient protection, and missing-data behavior | BE-012, BE-159, BE-160 | Render data review |
| BE-162 | Define email send attempt, provider result, retry, and terminal states | BE-011, BE-049, BE-160, BE-161 | Delivery state matrix |
| BE-163 | Define required message timeliness and failure work queue | BE-013, BE-162 | Notification SLO/alert |
| BE-164 | Define import upload, source fingerprint, type/size, and mapping-version contract | BE-010, BE-052 | Import intake contract |
| BE-165 | Define row validation codes and full dry-run summary | BE-010, BE-164 | Invalid source scenario set |
| BE-166 | Define import approval and requester/approver control | BE-063, BE-064, BE-165 | Import approval matrix |
| BE-167 | Define bounded apply batches, row operation keys, checkpoints, and resume | BE-068, BE-100, BE-164–BE-166 | Partial/restart plan |
| BE-168 | Define post-import counts, sums, orphan, SKU, price, stock, and media reconciliation | BE-167 | Import reconciliation report |
| BE-169 | Define report dictionary, source facts, timezone, currency, and freshness | BE-007, requirements | Approved metric definitions |
| BE-170 | Define bounded synchronous dashboard/report query paths | BE-029, BE-041, BE-169 | Query/index review |
| BE-171 | Define async export request, filters, definition version, and permission | BE-063, BE-064, BE-169, BE-170 | Export contract |
| BE-172 | Define export generation pages, private object, fingerprint, expiry, and download grant | BE-052, BE-171 | Export security flow |
| BE-173 | Define report/export audit and CSV formula safety | BE-045, BE-052, BE-171, BE-172 | Export threat review |
| BE-174 | Define operational job model for reindex, replay, reconciliation, and repair | BE-048, BE-063, BE-065; schema supplement | Job-control contract |
| BE-175 | Define DLQ view/replay permission, batch, reason, abort, and evidence | BE-048, BE-057, BE-063, BE-174 | Replay workflow |
| BE-176 | Map notification/import/export/report/operations APIs into OpenAPI | BE-032, BE-159–BE-175 | Reviewed contract section |

## Phase K — integrated quality and production readiness

| ID | Small outcome | Depends on | Completion evidence |
| --- | --- | --- | --- |
| BE-177 | Create backend requirement-to-module/API/event/evidence traceability | BE-084, BE-098, BE-117, BE-142, BE-158, BE-176 | All 31 requirements covered |
| BE-178 | Review module dependency graph for cycles and cross-schema mutation | BE-021, BE-022 | Architecture conformance report |
| BE-179 | Review OpenAPI completeness, lint, operation IDs, security, and compatibility | BE-032, BE-084, BE-098, BE-117, BE-142, BE-158, BE-176 | Contract validation report |
| BE-180 | Review database schema/migration compatibility with every runtime role | BE-041–BE-043; database sequence and schema supplement | Compatibility report |
| BE-181 | Run planned identity, ownership, role, revocation, and guest-access scenario suite | BE-053–BE-067 | Security acceptance evidence |
| BE-182 | Run planned final-unit, quote-change, idempotency, rollback, expiry, and allocation suite | BE-099–BE-118 | Commerce correctness evidence |
| BE-183 | Run planned forged/duplicate/late/unknown/excess payment suite | BE-119–BE-142 | Payment correctness evidence |
| BE-184 | Run planned return quantity, disposition, concurrent refund, and over-refund suite | BE-133–BE-137, BE-150–BE-156 | Return/refund evidence |
| BE-185 | Run planned duplicate/out-of-order/termination/outbox/DLQ/replay suite | BE-024, BE-047, BE-048, BE-174, BE-175 | Async reliability evidence |
| BE-186 | Run planned Valkey, OpenSearch, SQS, Auth0, S3, email, and provider outage suite | BE-049–BE-054, BE-091, BE-096; relevant feature implementations | Dependency-loss evidence |
| BE-187 | Run planned telemetry redaction and secrets/PII inspection | BE-035–BE-039, BE-045, BE-127, BE-161 | Redaction report |
| BE-188 | Run planned mixed-load, contention, callback-burst, worker-catch-up, and export tests | BE-002, BE-013 | Capacity/latency report |
| BE-189 | Prove graceful API and worker shutdown under in-flight work | BE-020, BE-040, BE-048 | Termination evidence |
| BE-190 | Rehearse additive migration, application rollback, and forward repair | BE-009, database migration plan | Release rehearsal |
| BE-191 | Perform timed database restore and post-recovery commerce reconciliation | BE-013, database recovery plan | RPO/RTO evidence |
| BE-192 | Validate dashboards, alerts, runbooks, ownership, and escalation | BE-038, BE-039, BE-163, BE-174, BE-175 | Operations acceptance |
| BE-193 | Run production-like end-to-end sandbox purchase, fulfillment, return, refund, and settlement | All domain phases | Journey reconciliation pack |
| BE-194 | Review all blocked decisions, exceptions, and launch-severity defects | BE-001–BE-014 | Gate E decision |
| BE-195 | Prepare canary rollout, feature enablement, abort, rollback, and forward-repair plan | BE-177–BE-194 | Release plan |
| BE-196 | Execute controlled production smoke/live transaction only after G3 approval | BE-195 and G3 approval | Authorized transaction evidence |
| BE-197 | Reconcile pilot orders, payments, allocations, shipments, refunds, notifications, and settlement | BE-196 | Pilot reconciliation |
| BE-198 | Record public-launch decision and activate hypercare ownership | BE-197 | Sponsor decision and roster |
| BE-199 | Complete backend runbook, contract, decision, diagram, and operating handover | BE-198 | Accepted handover pack |

## Execution controls

- A task is not ready when an upstream policy, provider fact, API convention, database decision, or owner is missing.
- A task is not done when only the happy path is described. Include authorization, invalid input, conflict, retry, timeout, duplicate, stale state, dependency loss, telemetry, and recovery where applicable.
- Preserve the database global lock order and T01–T10 transaction specifications.
- Keep remote calls outside database transactions and reconcile unknown external outcomes.
- Update OpenAPI, module ownership, events, data flows, operations, and acceptance together when behavior changes.
- Do not split the modular monolith into services without a new reviewed architecture decision and operational ownership.

**Task count:** 199 backend planning/build tasks.

