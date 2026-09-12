# Backend-only implementation sequence

**Status:** BUILD-001 through BUILD-013 implemented/verified within their bounded local Bolts, In review; human acceptance and later implementation pending.
**Relationship:** BUILD IDs represent implementation outcomes. BE IDs in the older catalog represent design/refinement inputs.  
**Planning unit:** One reviewable change; split a row if it cannot be implemented and verified independently.

No frontend is required. Use an API client, a signed local test issuer, provider doubles, real PostgreSQL and automated HTTP/worker tests. Real sandbox verification is recorded separately.

The selected baseline fixture is [DEV-PHYSICAL-BD](../../context/registers/commerce-profiles.md). If implementing runtime-adjustable business policies, attach the relevant [ADAPT tasks](08-adaptive-development-plan.md) to these BUILD outcomes. The first catalog slice remains independent of policy administration; adaptive checkout requires reviewed policy persistence/evaluation and order bindings. Other commerce models require their selected domain extensions before activation.

## First local foundation and catalog slice

The [AI-DLC execution map](../../context/aidlc/execution-map.md) assigns each BUILD task to a primary Unit. [U01](../../context/aidlc/units/U01-foundation.md) supplies BUILD-001 through BUILD-006 foundation evidence through B001/AUTH-004 and B002/AUTH-005. Track substep evidence and acceptance in Bolt records while preserving the dependencies and full parent-task proof below. Do not rename BUILD IDs or equate a short Bolt with a completed multi-capability release.

**Historical B001 handoff, before AUTH-005, 7 September 2026:** BUILD-001/002/003 are In review. [B001 evidence](../../context/aidlc/bolts/B001-foundation.md) records the pinned core, npm workspaces, independent API/worker lifecycle, configuration guards and clean Linux verification (96 tests passed); Windows passed 92 tests with 4 POSIX signal skips. Codex executed and performed AI self-review; human acceptance remains pending. BUILD-001 evidence covers only the bounded core; future database/auth/telemetry/optional-client compatibility remains with its capability. BUILD-004/005/006 are next in B002 after B001 acceptance and scoped authorization. No BUILD/ADAPT task is human-accepted.

| ID | Implementation outcome | Dependencies and gate | Required proof |
| --- | --- | --- | --- |
| BUILD-001 | Resolve/pin runtime, package manager and exact compatible dependency set; record manifest | Gate L; development-defaults compatibility procedure | Clean install/build/boot; exact versions/digests; no unresolved incompatible peers |
| BUILD-002 | Create proposed API/worker workspace and module composition with boundary rules | BUILD-001 | Both roles start/stop independently; no circular module imports |
| BUILD-003 | Add validated role-specific configuration and synthetic-environment guard | BUILD-002 | Missing required values fail startup; fake issuer/provider rejected outside allowed local tests |
| BUILD-004 | Add request context, safe errors, body limits, correlation and minimal health | BUILD-003 | HTTP validation/error contract; liveness independent of remote failure |
| BUILD-005 | Add pg pool, Drizzle migration runner and explicit transaction context | BUILD-003 | Empty rebuild; commit/rollback; pool release; exact bigint round trip |
| BUILD-006 | Add telemetry/redaction and graceful shutdown | BUILD-004, BUILD-005 | One correlated trace; no token/body leakage; unfinished worker not acknowledged |
| BUILD-007 | Implement seven non-order identity/access tables, protected audit storage for first-admin bootstrap, and local signed-token verification adapter; defer guest_order_access until its order parent exists | BUILD-005 | No unauthenticated bootstrap; auditable initial grants; unique issuer/subject; wrong signature/audience rejected |
| BUILD-008 | Implement customer mapping/profile/address operations, staff grant/revocation operations and ownership policy | BUILD-007 | Cross-user access denied; staff revocation effective according to defaults; bounded profile/address edits |
| BUILD-009 | Implement catalog base/variant/price and media/content metadata migrations/repositories in parent order | BUILD-005, BUILD-007 | Unique normalized SKU including archive; valid FK/price interval; staff attribution; approved-media fixture can reference actual local tables |
| BUILD-010 | Implement draft create/edit/detail/list endpoints and initial OpenAPI contract | BUILD-004, BUILD-008, BUILD-009 | Forbidden role, stale version, invalid fields and pagination all exercised |
| BUILD-011 | Implement publication policy, price selection and published read endpoint | BUILD-010 | Draft hidden; missing approved media/price blocks publication; immutable order prerequisites respected |
| BUILD-012 | Extend/reconcile the early B003 staff audit table for generic actor/target fields while preserving existing evidence; implement idempotency/outbox plus per-destination delivery storage | BUILD-005, BUILD-008; schema supplement | Rollback removes all effects; repeated command creates one outcome/event; replay reauthorized |
| BUILD-013 | Integrate catalog commands with audit/outbox and capture synthetic events | BUILD-011, BUILD-012 | Product publish/archive events committed once; no remote call under transaction |

First demo: a synthetic authorized staff caller creates a variant and price, attaches a test-approved media record through a guarded fixture setup, publishes, and an anonymous test caller reads only public data. A different customer/staff role fails access. No cloud account or frontend is required. Real media security is accepted later at BUILD-030, not by the fixture.

## Commerce core

| ID | Implementation outcome | Dependencies and gate | Required proof |
| --- | --- | --- | --- |
| BUILD-014 | Implement stock position, append-only movement and guarded adjustment | BUILD-009, BUILD-012 | Ledger roll-forward, insufficient sellable balance, duplicate operation and stale version |
| BUILD-015 | Implement customer/guest cart persistence and deterministic merge | BUILD-008, BUILD-009, BUILD-012 | Owner-only access; merge conflict/clamp explained; replay and cart-lock order |
| BUILD-016 | Implement delivery/tax/campaign/target tables and synthetic calculation contracts; defer persisted coupon holds/redemptions until checkout/order parents in BUILD-018 | BUILD-009, BUILD-012 | Golden exact-money example; residual allocation; coupon eligibility; cap concurrency proven with persisted holds in BUILD-018 |
| BUILD-017 | Implement quote/reconfirmation and bounded API contract | BUILD-014–BUILD-016 | Recompute authoritative inputs; changed quote never reserves stock |
| BUILD-018 | Implement checkout/order snapshots, guest order-access table, reservation/allocation schema, coupon holds/redemptions and initial payment intent via coordinator T02 | BUILD-012, BUILD-017 | Parent-before-child FK rebuild; final-unit/coupon-cap race; same/different idempotent payload; injected rollback leaves no partial records |
| BUILD-019 | Implement reservation sweep and durable workflow-job lease | BUILD-018; schema supplement | Expiry race; repeated sweep; stale lease cannot complete; unknown payment retains hold |
| BUILD-020 | Implement synthetic payment session intent/attempt/outcome workflow | BUILD-018 | One active initiation; timeout becomes unknown; no blind retry |
| BUILD-021 | Implement callback inbox, provider validation port and T04 coordinator with synthetic evidence | BUILD-019, BUILD-020 | Callback-before-session-result race; duplicate/forged/mismatch/late/excess/cancelled-order cases; no state downgrade; allocation once |
| BUILD-022 | Implement customer/guest/staff order queries, guest capability exchange and separately idempotent paid-hold resolution | BUILD-008, BUILD-018, BUILD-021 | Snapshot survives catalog changes; guest masked; unauthorized hidden; hold resolution allocates once; callback replay stays a no-op |
| BUILD-023 | Implement cancellation request/history, hold and authorized resolution | BUILD-022; schema supplement | Unpaid cancellation once; paid/unknown resolution; dispatch race contract |
| BUILD-024 | Implement shipment eligibility, one shipment and manual transitions | BUILD-021, BUILD-023 | Cannot dispatch held/unfunded order; no second stock deduction |
| BUILD-025 | Implement return request/approval/receipt/inspection and restock | BUILD-014, BUILD-024 | Cumulative quantity and lock order; only sellable disposition restocks once |
| BUILD-026 | Implement refund request/approval/balance reservation and synthetic provider outcome; integrate pending-refund guards with hold resolution and dispatch | BUILD-021, BUILD-025 | Payment and per-line/component refund caps; refund-versus-dispatch race; unknown reserve persists; paid cancellation resolution accepted here |

## Workers, files and real integrations

| ID | Implementation outcome | Dependencies and gate | Required proof |
| --- | --- | --- | --- |
| BUILD-027 | Implement outbox dispatcher, routing and consumer-local effects | BUILD-012 | Partial fan-out resumes each destination; publish/mark crash and duplicate receipt safe |
| BUILD-028 | Implement financial/notification intent claiming, timeout and reconciliation runner | BUILD-020, BUILD-026, BUILD-027 | Expired claim never licenses blind financial resend; stale worker fencing |
| BUILD-029 | Implement search projection/reindex/query plus Valkey cache and rate-control adapters with bounded fallback | BUILD-013, BUILD-014, BUILD-027 | Independent versions safe; tombstone; reindex catch-up; source publication filter including autocomplete; no shared API cache; cache/rate-store outage behavior |
| BUILD-030 | Implement private upload, media inspection/approval/signed access and backend content revision/publication lifecycle | BUILD-010, BUILD-012; Gate I for S3 acceptance | Type/size/decode cap; unapproved object private; expired grant denied; immutable published content, scheduling and archive visibility |
| BUILD-031 | Implement templates, notification requests/attempts and local email capture | BUILD-022, BUILD-024, BUILD-027, BUILD-028 | Dedupe and retries; no notification changes order/payment state |
| BUILD-032 | Implement validated CSV import, approval, row application and resume | BUILD-014, BUILD-030 | Duplicate SKU/source; row errors; stable restart; opening movement reconciliation |
| BUILD-033 | Implement reports, private async export and artifact expiry | BUILD-022, BUILD-026, BUILD-030 | Monetary definitions reconcile; authorization/download audit; CSV formula safety |
| BUILD-034 | Connect Auth0 nonproduction tenant to existing auth port | BUILD-008; Gate I Auth0 | Real JWKS/token/MFA/revocation evidence; no synthetic issuer accepted in staging |
| BUILD-035 | Connect SSLCOMMERZ sandbox and finalize DB-024 field/status mapping | BUILD-021, BUILD-026, BUILD-028; Gate I payment | Actual session/IPN/validation/refund/unknown matrix; support escalation for unsafe lookup |
| BUILD-036 | Implement settlement source parsing/matching from provider sample | BUILD-026, BUILD-035; Gate I provider file | Duplicate file; partial/unmatched/manual audit; payment/refund/fee/net reconciliation |
| BUILD-037 | Verify SQS/S3/Valkey/OpenSearch in isolated AWS development resources | BUILD-027, BUILD-029, BUILD-030; Gate I each service | IAM denial, TLS, redelivery, failover, object privacy and managed-client versions |
| BUILD-038 | Connect SES or approved email provider with suppression/bounce handling | BUILD-031; Gate I email | Real allowed-recipient send/bounce evidence; unknown-send policy documented |

Gate I tasks can proceed independently once their own prerequisites are met. The table is a dependency graph, not a demand to wait for every preceding row. If a sandbox account is delayed, continue another independent local slice.

## Release evidence

| ID | Implementation outcome | Dependencies and gate | Required proof |
| --- | --- | --- | --- |
| BUILD-039 | Implement CI checks, immutable image, dependency/secret scanning and controlled migrator | BUILD-006, completed slices | Reproducible artifact; schema/OpenAPI compatibility; no shared ORM auto-sync |
| BUILD-040 | Implement approved AWS staging topology and role-specific deployment | BUILD-039; Gate I AWS region/accounts | Private data endpoints; compatible migration; canary/abort/rollback and pool budget |
| BUILD-041 | Complete security, concurrency, outage, mixed-load and worker catch-up acceptance | BUILD-034–BUILD-040; merchant policies for affected cases | All relevant NFR evidence; deterministic fake tests labeled separately from real integration |
| BUILD-042 | Rehearse restore, post-recovery money/stock/outbox reconciliation and operating runbooks | BUILD-040, BUILD-041 | Timed measured RPO/RTO by failure scope; alerts reach named owners |
| BUILD-043 | Replace synthetic policies/data with approved real policy and reconciled catalog; rerun affected acceptance against the resulting release candidate | BUILD-032, BUILD-035, BUILD-036, BUILD-041, BUILD-042; Gate P business/data | No DEV policy identifiers; approved tax/invoice/return behavior; provenance; impacted security/money/stock/load/recovery evidence renewed for this candidate |
| BUILD-044 | Conduct explicitly authorized pilot, reconcile transactions and hand over | BUILD-041–BUILD-043; Gate P release authorization | Finance/stock/notifications reconciliation; named incident owners; sponsor acceptance |

## What every implementation task must contain

Expanded tasks are split into these reviewable substeps when assigned; they do not change the 44 parent-task IDs:

- BUILD-009: catalog/variant parents; attributed price records; media metadata/link tables; content entry/revision tables; FK and fixture verification.
- BUILD-018: checkout/order parents and nullable back-reference; reservation/allocation children; coupon hold/redemption children; guest access and payment intent; T02 concurrency/rollback acceptance.
- BUILD-022: owned customer/staff queries; guest capability issue/exchange/revocation; named hold-resolution command; allocation/replay tests. Pending-refund integration is accepted with BUILD-026.
- BUILD-023: request/history and unpaid cancellation; paid/unknown hold; dispatch serialization with BUILD-024; final paid-refund cancellation with BUILD-026. Do not accept the whole paid path using only a stub.
- BUILD-029: projection generation/tombstone; index backfill/catch-up/switch; public query and autocomplete filtering; Valkey cache adapter; distributed rate-store adapter and capacity-bounded outage behavior.
- BUILD-030: upload intent/private source; decode/inspection/quarantine; media approval/derivatives; content draft/revision permissions; scheduled publication/archive and source-filtered read.

Name an owner when assigned. Reference its BE design task, requirement IDs and database tables/transaction. Include code/migration/contract changes only when future coding work is authorized; record happy path, negative access, applicable race/retry/unknown behavior and operational signal. Do not mark Done on the strength of this plan.

No absolute delivery date is committed. Team capacity and vendor lead times are unknown. First estimate each slice after BUILD-001 reveals integration and toolchain constraints; keep actual elapsed effort in the status board.

## Current readiness verdict

The local foundation, identity and catalog slice have verified implementation evidence through B004. No task is human-accepted. AUTH-009 approved B005 revision 1; [BUILD-014/015 evidence](../../context/aidlc/bolts/B005-stock-cart.md) is implemented/verified, In review. BUILD-019 retains its BUILD-018 checkout/order dependency and remains excluded. Real integrations wait for their own account evidence; production waits for its full acceptance gate.

## B002 task evidence

AUTH-005 authorizes BUILD-004/005/006 using local synthetic data and PostgreSQL. [B002](../../context/aidlc/bolts/B002-foundation.md) records exact versions, checks, failures/repairs, limitations and review status. BUILD-004 delivers safe HTTP/context/body bounds/live-ready; BUILD-005 delivers restricted pg pools, reviewed Drizzle migration/rebuild and explicit atomic transactions with exact bigint; BUILD-006 delivers correlated local OTel/Sentry/logs and safe drain/acknowledgement. Existing BUILD prerequisites are unchanged; the explicit B002 instruction permits technical progression without fabricating B001 acceptance. No BUILD or ADAPT task is human-accepted. U02/BUILD-007/008 subsequently proceeded under AUTH-006; see the B003 evidence extension below.


## B003 task evidence

AUTH-006 explicitly authorizes U02 BUILD-007/008. Both tasks are implemented/verified and **In review**, with [B003 evidence](../../context/aidlc/bolts/B003-identity.md), [U02](../../context/aidlc/units/U02-identity.md) and [local contracts](09-local-identity-contracts.md). BUILD-007 supplies seven non-order IAM tables, protected deployment-only bootstrap audit and pinned local RS256 verification; BUILD-008 supplies owned profile/address CRUD, bounded exact versions, current staff grants/revocation and atomic audit. Windows 161 passed/six POSIX skips; fresh Linux/PostgreSQL all 167 passed. BE-053 through BE-060 and BE-063 through BE-067 are design references; DBT-029/031 carry the database evidence. No full task/requirement is human-accepted. BUILD-034, ADAPT-008 and guest_order_access remain deferred. That handoff proposed BUILD-009 next; AUTH-007 subsequently authorized U03, recorded below.

The B003 handoff required BUILD-012 to reuse/extend early platform.audit_events while preserving bootstrap and staff evidence. B004 now supplies this forward-migration compatibility proof, including unchanged original-field audit hash and generated dictionary aliases.

## Current U03/B004 task evidence

AUTH-007 explicitly authorizes U03 BUILD-009 through BUILD-013. All five tasks are **In review**, implemented and verified, with [B004 evidence](../../context/aidlc/bolts/B004-catalog.md), [U03](../../context/aidlc/units/U03-catalog.md), [local contracts](10-local-catalog-contracts.md) and the initial [OpenAPI artifact](../openapi/catalog-v1.json).

| Task | Concrete implementation | Observed proof |
| --- | --- | --- |
| BUILD-009 | 13 catalog tables, restricted repositories, guarded reference/media/content fixtures | Fresh/upgrade/replay migrations; lifetime SKU; composite FKs; exact bigint and concurrent price interval exclusion; content/history privilege denials |
| BUILD-010 | Draft product/variant create/edit/archive, bounded list/detail and executable OpenAPI | Wrong role, invalid fields/references, stale expected version, pagination/cursor and contract checks |
| BUILD-011 | Publication/unpublication/archive, current price selection and anonymous eligible detail | Missing price/media/description/category rejected; draft hidden; half-open price boundary; source revocation hides public data; historical price/SKU retained |
| BUILD-012 | Forward-compatible generic audit, scoped immutable response replay, outbox and per-destination storage | Prior audit unchanged; same/different key race; reauthorization; deterministic failure replay; full rollback on audit/event/destination failures; lost COMMIT reply resolves on exact retry |
| BUILD-013 | Product/version/audit/event/destination/outcome in one transaction; local capture | Publish/edit and revocation races; one event per mutation; successful editor-to-anonymous demo and five pending captured deliveries |

Windows full check: seven suites, 204 passed/six POSIX skips. Final clean Linux/PostgreSQL: all 210 passed, unchanged locked dependency graph/build/generation and final audit zero known vulnerabilities. The 68-input B004 manifest fixes source/schema/contract identity. BE and DBT references denote these same outcomes, not separate deliveries. No dispatcher, real media inspection, order snapshot, stock, provider, cloud or frontend is implemented by this scope. U01/U02 and all human acceptance remain pending; AUTH-007 continues for routine fixes.

## U04/B005 task evidence, 12 September 2026

AUTH-008 selected synthetic local BUILD-014/015 and AUTH-009 explicitly approved plan revision 1. [B005 revision 1](../../context/aidlc/bolts/B005-stock-cart.md) and [U04](../../context/aidlc/units/U04-stock-cart.md) record contracts, dependencies, ordered substeps, owner/reviewer roles, preservation and expected verification. Codex implemented/verified and performed AI self-review. Human artifact acceptance is separate and pending.

| Task | Implementation status | Bounded plan / evidence required |
| --- | --- | --- |
| BUILD-014 | Implemented/verified, In review | Three inventory tables, current permissions, append-only adjustments/opening fixture and atomic audit/outbox/replay; prove roll-forward, floor/version/operation guards, races, rollback and unknown COMMIT |
| BUILD-015 | Implemented/verified, In review | Two cart tables, customer/guest ownership, item lifecycle/expiry/observations and deterministic merge; prove owner denials, explicit clamp/conflict, sorted locks, persistence and replay/failure behavior |
| BUILD-019 | Not started; excluded | Revisit after BUILD-018 and checkout/order parents/schema are ready and a later bounded Bolt is authorized |

Final evidence: 33 new stock/cart cases; Windows 237 passed/six POSIX skips; fresh Linux/PostgreSQL 243 passed, final audit zero vulnerabilities after scoped Multer 2.3.0 repair. Local upgrade retained 52 prior rows; demo/ledger reconciliation and pending event capture passed. [B005 manifest](../../context/aidlc/evidence/B005-manifest.json) records 81 inputs. No parent dependency is changed; full INV-01/CART-01 and BE/DBT design references remain broader than this local slice. Frontend, providers, cloud, imports, dispatcher/cache adapters, guest order access and all ADAPT stay excluded.
