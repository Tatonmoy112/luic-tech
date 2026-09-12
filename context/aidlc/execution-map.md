# AI-DLC execution map

**Status:** U01/U02 In progress; U03 In review; U04 In progress with BUILD-019 deferred. B001/B002/B003/B004/B005 In review with technical evidence; BUILD-014/015 implemented/verified under AUTH-009. Other Units remain Not started. This is an execution index over existing task dependencies, not a replacement backlog.

## Existing plan to AI-DLC lifecycle

| Existing artifact/activity | Lifecycle use | What carries forward |
| --- | --- | --- |
| dev discovery, requirements, scope, architecture and decisions | Inception inputs; refine the affected intent | Business provenance, constraints, requirement IDs and unresolved decisions |
| context blueprints, profile register and D01-D16 evidence | Inception and continuing context | Selected model, synthetic versus real facts, readiness gates |
| Backend BE and database DBT catalogs | Design inputs used in Inception/Construction as needed | Module/data/transaction/API design; no duplicate implementation count |
| BUILD-001 through BUILD-038 | Construction, with integration gates per capability | Executable slices and local/real-provider proof when implemented |
| ADAPT-001 through ADAPT-016 | Cross-cutting refinement/Construction/Operations for selected policy extensions | Profile/policy compatibility, historical contracts and rollout proof |
| BUILD-039 through BUILD-042 | Construction release engineering and Operations rehearsal | Artifact, CI/deployment, security/load/restore and runbooks |
| BUILD-043/044 | Operations release acceptance and controlled pilot | Final candidate, real policies/data, finance/stock reconciliation and owners |
| Incidents, defects and product feedback | New scoped Inception followed by relevant Construction/Operations | Reproduction, impact, regression proof and updated operating context |

UI stages in the full-product plan remain outside this intent. Weekly governance remains a reporting cadence; Bolts are the execution slices inside it. No new date or AI productivity multiplier is inferred from this mapping.

## Unit inventory and task ownership

Each BUILD ID below has exactly one primary Unit. Cross-unit dependencies stay at task/substep level according to the [implementation sequence](../../backend/readiness/05-implementation-sequence.md). Unit numbers are not a global serial execution order: a later Unit can supply a prerequisite for an earlier Unit's later Bolt.

| Unit | Coherent outcome | Primary BUILD tasks | Primary ADAPT additions | Main acceptance concern |
| --- | --- | --- | --- | --- |
| U01 Foundations | Reproducible local API/worker/DB/telemetry foundation | BUILD-001 through BUILD-006 | ADAPT-001, ADAPT-002 | Compatibility, configuration, transaction and shutdown evidence |
| U02 Identity and access | Customer/staff ownership and real identity adapter | BUILD-007, BUILD-008, BUILD-034 | ADAPT-008 | Wrong identity, cross-user access, staff revocation and policy-admin grants |
| U03 Catalog | Governed product lifecycle with audit and events | BUILD-009 through BUILD-013 | None | Valid publication, historical stability and atomic audit/outbox |
| U04 Stock and cart | Stock ledger, owned carts and reservation expiry | BUILD-014, BUILD-015, BUILD-019 | None | Quantity conservation, merge and expiry/payment race |
| U05 Pricing and checkout | Authoritative quote and atomic accepted order | BUILD-016 through BUILD-018 | ADAPT-003 through ADAPT-007, ADAPT-009 | Exact totals, idempotency, stock/coupon race and policy activation |
| U06 Payment and settlement | Verified financial outcomes and reconciliation | BUILD-020, BUILD-021, BUILD-028, BUILD-035, BUILD-036 | ADAPT-010 | Unknown/excess/late payment, claims and original provider binding |
| U07 Orders and fulfillment | Order access, hold/cancellation resolution and dispatch | BUILD-022 through BUILD-024 | ADAPT-012 | Current holds/net funding, dispatch race and preserved obligations |
| U08 Returns and refunds | Traceable return/inspection and bounded refunds | BUILD-025, BUILD-026 | ADAPT-011 | Cumulative entitlements, no duplicate restock/refund and original terms |
| U09 Async, cache and search | Durable dispatch and source-checked discovery | BUILD-027, BUILD-029 | ADAPT-013 | Fan-out/replay, generation/tombstone, cache loss and historical event meaning |
| U10 Media, content and files | Private media/content lifecycle and reconciled data jobs | BUILD-030, BUILD-032, BUILD-033 | None | Approved publication, resumable imports and protected reports/exports |
| U11 Notifications | Durable local and real-provider email delivery | BUILD-031, BUILD-038 | None | Dedupe, unknown send, bounce/suppression and sensitive content |
| U12 Release and operations | Real managed-service proof and accepted operated release | BUILD-037, BUILD-039 through BUILD-044 | ADAPT-014 through ADAPT-016 | Access, final artifact/policy, security/load/recovery and pilot evidence |

ADAPT tasks extend these Units only when runtime-adjustable policy behavior is selected. Their [dependency plan](../../backend/readiness/08-adaptive-development-plan.md) still applies. For example, U02 policy administration needs U05 policy persistence; U04 expiry needs U05 checkout; U06 sandbox acceptance needs U08 refunds and U09 dispatch. This does not prevent earlier local Bolts in those Units. All ADAPT mappings are primary ownership, not permission to alter another domain's data directly.

Existing BE/DBT rows and requirement groups are referenced within each Bolt by the exact affected IDs/sections. A Unit ID does not replace a requirement ID. Optional EXT models require their own reviewed requirement/Unit/Bolt records and are not silently assigned to these 12 Units.

## First Bolts

| Bolt | Unit | Planned bounded result | Entry | Exit |
| --- | --- | --- | --- | --- |
| B001 | U01 | Compatible pinned core, API/worker skeleton and validated local configuration | AUTH-004; DEV-PHYSICAL-BD revision 1 | [BUILD-001/002/003 evidence ready, In review](bolts/B001-foundation.md); human acceptance pending |
| B002 | U01 | Request/error foundation, PostgreSQL transactions and basic telemetry/shutdown | AUTH-005 and verified B001 technical evidence; B001 human acceptance remains pending | [BUILD-004/005/006 evidence](bolts/B002-foundation.md); real local PostgreSQL, human acceptance pending |
| B003 | U02 | Signed local identity, protected bootstrap, owned profiles/addresses and audited current staff grants | AUTH-006 and verified B002 technical foundation; prior human acceptance pending | [BUILD-007/008 evidence](bolts/B003-identity.md); 167 Linux tests pass, human acceptance pending; BUILD-034/ADAPT-008 excluded |
| B004 | U03 | Catalog metadata/drafts/publication/read, exact price history and atomic audit/idempotency/outbox | AUTH-007 and verified B003 technical evidence; prior human acceptance pending | [BUILD-009 through BUILD-013 evidence](bolts/B004-catalog.md); 210 Linux tests pass, local catalog demo/event capture passed; human acceptance pending |
| B005 | U04 | Stock ledger/adjustment and owned customer/guest cart lifecycle with deterministic merge | AUTH-008/009 and BUILD-008/009/012 technical evidence | [BUILD-014/015 evidence](bolts/B005-stock-cart.md): 243 Linux tests pass; five tables, local demo/reconciliation; human acceptance pending; BUILD-019 excluded |

The [U01 record](units/U01-foundation.md) links both foundation Bolts; [U02](units/U02-identity.md) and [U03](units/U03-catalog.md) link identity and catalog evidence. [U04](units/U04-stock-cart.md) links implemented/verified B005 under AUTH-009. Next action is human review of B005 artifacts/evidence or routine authorized fixes; future U05 BUILD-016/017 requires a separate bounded instruction. BUILD-019 still requires BUILD-018 and checkout/order parents plus later bounded authorization. No later capability or human acceptance is inferred.

## Record dependencies without duplicating truth

For each Bolt, list exact parent BUILD tasks and completed substeps, referenced design documents, prerequisite tasks/evidence, selected ADAPT additions and required external inputs. Read the canonical task table at planning time. If a newly found dependency changes sequencing, update that table and the affected Bolt/Unit records together. Keep task acceptance atomic: a partial mock-based path cannot close a parent requiring real integration.

## Delivery feedback

At each accepted Bolt, record actual effort, review/rework, defects found before/after acceptance, unblocked work and the next smallest meaningful outcome. Use these observations to adjust later Bolt size and forecasts. Token usage or AI-generated output volume is not evidence of delivery value. Weekly reports summarize accepted Bolts and unresolved dependencies without changing the existing commercial forecast by assumption.
