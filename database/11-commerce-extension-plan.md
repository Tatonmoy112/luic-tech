# Database plan for adaptable commerce

**Status:** Proposed extension design only, 6 September 2026. No SQL, Drizzle schema or migration is supplied.

## Relationship to the existing model

The current dictionary and diagrams contain 78 baseline tables. They do not implement the policy lifecycle or the alternative business models described here. Keep that count unchanged until each approved extension has defining dictionary entries, constraints, ownership, migrations, diagram boxes and acceptance scenarios. Existing T01-T10 invariants remain in force.

Start with the [commerce profile context](../context/11-commerce-adaptability.md) and [backend policy behavior](../backend/14-configurable-commerce.md). Use the existing domain tables wherever they already express a concept; avoid a second authoritative tax, stock or pricing system inside generic settings.

## Persistence boundaries

| Data | Storage direction | Integrity boundary |
| --- | --- | --- |
| Commercial identity, money, quantity, ownership, state and relationships | Typed relational columns and explicit FKs | Never move these facts into arbitrary profile JSON or entity-attribute-value storage |
| Descriptive merchant/catalog fields | Existing bounded attribute model | Validate types, length and allowed values; no structural business capability inferred |
| Policy parameters | Versioned owner-validated bounded document where appropriate, with typed identity/scope/status/revision columns | Finite supported schema versions; no arbitrary scripts; DB checks plus domain validation |
| Existing tax/delivery/promotion definitions | Existing owning-domain records, frozen or versioned when released | Policy envelope refers to these facts through explicit typed relationships; no divergent duplicate copy |
| Order contract | Existing immutable snapshots plus proposed release/selection references | Calculation and applied policy must be recoverable after later changes |
| Secrets | External secret manager references | No secret payload inside profile or policy rows |
| Configuration audit | Existing platform.audit_events/outbox plus immutable release history | Changes and rollback remain attributable |

## Candidate policy entities

These six proposed entities are an extension inventory, not additions already present in the dictionary. Platform operations owns their metadata; domain owners validate policy content and authorize affected rules. Final names/types/FKs/indexes and any needed domain link tables are an explicit ADAPT-004 deliverable.

| Candidate entity | Main facts | Required constraints |
| --- | --- | --- |
| platform.commerce_profiles | Stable profile key, deployment scope, name, archive state | Unique key within scope; cannot imply multi-tenant support |
| platform.commerce_profile_revisions | Profile FK, revision, capability selections, compatibility requirements, digest, evidence class | Unique profile/revision; sealed content immutable; lifecycle transition audited |
| platform.commerce_policy_revisions | Scope, policy key/type/schema version/revision, typed applicability, digest, bounded parameters, approval evidence | Unique scoped key/revision; immutable approved content; supported type and interval; explicit owner |
| platform.commerce_policy_releases | Profile-revision FK, environment/scope, release sequence, expected predecessor, effective time, lifecycle and approval reference | Unique scope/environment/release sequence; scope-consistent FKs; no activation without complete validated set |
| platform.commerce_policy_release_items | Release FK, policy-revision FK, declared applicability/priority | Unique release/policy membership; scope consistency; ambiguous matching rejected by domain validation |
| platform.commerce_policy_bindings | Deployment/environment scope and active release FK, pointer revision | Exactly one pointer per supported scope; active release belongs to same scope/environment; compare-and-swap plus row lock |

Use actual parent keys and composite uniqueness/FKs where needed to prevent cross-scope references. Do not represent a relationship to tax/delivery using an unchecked pair of type and arbitrary ID. Specify typed FK columns or separate typed link tables during ADAPT-004; such tables would increase the extension inventory and must then be counted and diagrammed. Initial scope is one merchant per deployment.

Application validation covers cross-row rule ambiguity that a simple uniqueness constraint cannot express; activation serializes the complete release and runs that validation. Where the final scope/interval model allows database enforcement, add the matching constraints as well. No unconditional claim that generic JSON validation proves business compatibility.

## Required changes to existing baseline records

- Orders gain a nullable-during-migration policy release FK and immutable profile/currency-scale contract evidence for newly accepted adaptive orders. After reviewed backfill, enforce required references for the new order format. Preserve existing amount snapshots.
- Applied policy selection needs explicit order and, where applicable, order-line bindings to release membership. Define relational bindings with valid parent FKs during ADAPT-004; do not rely on free-text IDs in JSON. A line may use different return terms from another line, so an order-level release alone is insufficient evidence of which rule matched.
- Tax/delivery versions referenced by a release cannot be edited or deleted in place. Preserve original records or create a new revision. Existing order.tax_policy_version_id and monetary snapshots remain authoritative for their meanings.
- Quote/API contracts gain the selected release revision. Quotes need not become a new persistence table; the confirmed quote hash includes the revision and canonical decision inputs.
- Payment/refund attempts need immutable provider/account/environment identity if more than one binding is supported. Verify existing fields first and add explicit constraints; no callback routes by today's default provider.
- Jobs/events that execute a pinned business decision reference its durable intent/order/release. Add event schema versions and backward-compatible consumers; old messages never invent missing history.

The current schema does not need these extensions to run the original synthetic catalog slice. It does need their completed design/migrations before promising runtime-adjustable policy releases.

## Business-model extension packages

| Package | Proposed new relational concepts | Existing model that must be revisited | Required proof |
| --- | --- | --- | --- |
| Inventory expansion | Location-routing decisions, shipment allocations, lot/serial membership, unit definitions as selected | Allocation lines, positions, movement units, one-shipment uniqueness, returns | Concurrent routing/picking, partial release/return, traceable conservation |
| Digital delivery | Entitlements, fulfillment attempts, access grants/revocations | Required shipping fields, fulfillment completion, refund evidence | Duplicate payment does not grant twice; refund/revocation policy preserves evidence |
| Subscription | Agreements, billing periods, renewal intents, mandate references and dunning | Order creation source, price versions, recurring attempt/refund contracts | Duplicate schedule, paused/cancelled agreement, unknown collection and renewal reconciliation |
| B2B | Organizations, memberships, buyer approvals, price agreements, receivables/credit as selected | Customer ownership, price selection, payment due and invoice lifecycle | Cross-organization denial, credit exposure races and receivable reconciliation |
| Marketplace | Sellers, offers, seller suborders, commissions, balanced financial ledger, payable/payout records | Catalog ownership, order totals, payment allocation, settlement/refund and auth | Every monetary movement balances; cross-seller isolation and payout/refund races |
| Booking/rental | Resources/capacity slots, timed reservations, service occurrences, rental custody and deposits | Quantity/stock semantics, timezone boundaries, completion/cancellation and finance | No overbooking; duration/DST cases; deposit/refund reconciliation |
| COD | Collection obligations, collection evidence, courier remittance and discrepancy records | Dispatch funding eligibility, payment state/evidence, refusal handling | Delivered is not automatically collected; remitted totals reconcile |
| Multi-currency/market | Currency scale definitions, market-specific price/policy bindings, optional explicit FX evidence | API money bounds, address requirements, calculation/settlement/reporting | Scale 0/2/3 fixtures, rounding, currency mismatch rejection and no mixed-currency sum |
| Stored value | Liability accounts, issuance/redemption/expiry and balanced journal entries | Payment tender allocation and refund destination | No double spend or unbalanced liability |
| Multi-tenant deployment | Tenant root, tenant-scoped uniqueness/FKs and identity/resource ownership | Every table/query/job/export/cache/search/secret boundary | Isolation across API, DB, queues, storage, search, support and recovery |

Each row is a separate design project selected by actual business need. Do not create empty tables for all packages at bootstrap. A marketplace ledger design must be completed as its own financial model; this table is not that design. Mixed carts require joint obligation and completion semantics rather than independent feature toggles.

## Migration and historical compatibility sequence

Plan selected extensions as AI-DLC Units/Bolts with [explicit scope and evidence](../context/aidlc/workflow.md). ADAPT-004 design acceptance precedes adaptive migrations; BUILD/ADAPT dependencies still apply. Do not add all candidate entities because a workflow calls for Construction. Each Bolt must make the affected relational integrity and historical compatibility reviewable.

1. For the baseline first slice, use the current parent-first migration plan and fictional fixtures.
2. Before adaptive activation, finalize the selected policy entities/bindings, ownership, keys, constraints and extended lock order. Update dictionary/ERD and re-count only then.
3. Introduce additive policy tables and initially optional historical references. Create the explicit synthetic profile only in synthetic environments.
4. For existing real orders, derive references only from trustworthy historical evidence. If no such evidence exists, mark legacy/unknown provenance and retain original snapshots/manual resolution; never label it as today's policy.
5. Backfill in bounded resumable batches, reconcile counts/digests and prove old application/worker compatibility. Define which legacy formats remain readable before making new-format references mandatory.
6. Deploy readers/evaluators with adaptive creation disabled. Prove quote/order, rollback, activation race and old-message handling.
7. Atomically activate a validated profile release for new work. Monitor rejection, policy mismatch and financial/stock invariant signals.
8. Retain old revisions through all order/return/refund/dispute and retention obligations. Removing a capability or policy cannot cascade-delete commercial evidence.

Add the policy binding shared lock ahead of existing checkout business locks as described in the backend design. Activation must not acquire order/stock locks after taking this pointer lock. Existing-order callbacks/refunds use their pinned contract plus current safety guards and do not require the current policy pointer. Review every new path for lock inversion before implementing it.
