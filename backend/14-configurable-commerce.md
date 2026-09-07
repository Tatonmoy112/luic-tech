# Configurable commerce backend design

**Status:** Proposed design extension; no source, executable configuration, database migration or runtime policy engine exists.

## Boundary and ownership

Implement this proposed extension through [AI-DLC](../context/aidlc/README.md) using the selected ADAPT tasks, not an unbounded "enable every commerce model" instruction. Each Bolt identifies profile/policy revisions, business decision provenance, owning domain, DB/API changes and failure/rollback proof. Human policy approval remains separate from code verification and operational activation.

Use the existing modular monolith and coordinator. Add a proposed Policy administration capability to Platform operations for profile metadata, releases, validation orchestration and audit. Owning domains define and validate their own policy types and decisions: Pricing owns calculations, Inventory owns reservation eligibility, Order owns cancellation, Fulfillment owns returns, Finance owns refund approval, Identity owns access rules. A generic configuration service cannot write their aggregates or override their invariants.

The [commerce capability matrix](../context/11-commerce-adaptability.md) distinguishes settings from new domains. Release 1 remains the physical profile. The database proposal is in [the extension plan](../database/11-commerce-extension-plan.md); it is deliberately separate from the 78-table ERD until reviewed.

## Four independent controls

| Control | Authority | Examples | Failure treatment |
| --- | --- | --- | --- |
| Runtime configuration | Deployment owner; immutable deployment revision | Endpoints, pools, limits, queue names | Invalid required config prevents role readiness |
| Commerce policy | Domain owner with versioned approval | Delivery, cancellation, return eligibility | Missing applicable policy rejects dependent new command; no silent fallback |
| Capability release | Compatibility manifest plus accepted implementation evidence | Supported order/quantity/fulfillment modes | Unsupported mode cannot activate, even if a setting requests it |
| Operational stop | Authorized incident role; audited | Stop new checkout, stop refund submissions | Preserve receipts, reconciliation and obligation processing unless explicitly unsafe |

Secrets stay in the secret manager. Runtime tuning cannot silently change an accepted commercial contract. Feature rollout is not evidence of domain support. Operational stops cannot declare payments failed or delete obligations.

## Policy decision contract

| Field | Required semantics |
| --- | --- |
| Policy type and schema version | Allowlisted owner-defined type; reject unknown fields and unsupported schema versions |
| Identity/revision | Stable ID, immutable revision and canonical content digest |
| Scope | Server-resolved deployment/merchant, market and supported category/product scope; never trusted from a public request |
| Effective interval | UTC start inclusive/end exclusive; unambiguous applicability at one evaluation instant |
| Evidence | Synthetic, business-reviewed or provider-verified references as appropriate; independent of lifecycle |
| Inputs | Bounded typed facts required by this policy; no secrets or caller-declared prices/roles |
| Output | Eligibility, reason codes, exact calculation breakdown, applicable revision IDs and any workflow obligation |
| Limits | Explicit numeric bounds, allowed modes, maximum list/rule counts and deterministic precedence |
| Change control | Owner, authorized approver, expected revision, audit reason, scenarios and compatibility report |

First implementation supports fixed typed decision tables and allowlisted strategies only. No executable merchant scripts, SQL, arbitrary expressions, remote URLs or user-selected class names. Product attributes remain bounded descriptive data; they cannot define a new tax algorithm or financial state machine.

## Initial policy catalog

| Policy type / owner | Supported baseline parameters | Validation and examples required |
| --- | --- | --- |
| Market / Pricing + Order | BD/BDT fixture; address and currency bindings | A different country/currency remains extension-gated; reject incompatible provider/price currency |
| Catalog / Catalog | Required descriptive attributes and publication requirements | Field schema, lengths, unique names, approved media/current price; no attribute-based bypass |
| Inventory / Inventory | Reservation duration, supported per-SKU quantity caps | Positive bounded duration; integer units only; expiry versus late payment tests |
| Pricing / Pricing | Existing price selection and exact rounding strategy | Input/output bounds, golden examples and residual conservation; no binary floating money |
| Promotion / Promotion | Existing one-coupon eligibility/limits | Cap races, target scope and allocation examples; stacking needs new reviewed behavior |
| Delivery / Pricing + Fulfillment | Zones, matching priority, fee and eligible methods | Exactly one applicable rule or explicit rejection; unsupported addresses do not receive free shipping |
| Tax and invoice / Finance + Pricing | References to approved implemented strategies and immutable rule versions | Synthetic zero-tax only locally; real worked examples and invoice design where needed |
| Cancellation / Order | Cutoffs and supported request/review behavior | Unknown/paid/dispatched states remain guarded; no direct state override |
| Return / Fulfillment | Window, reasons, condition requirements | Purchased entitlement preserved; cumulative quantity and inspection bounds |
| Refund / Finance | Allowed original components, approval rules and thresholds | Distinct requester/approver where applicable; thresholds cannot waive evidence or refund ceilings |
| Identity / Identity | Supported guest access lifetimes and staff policy options | Minimum security bounds, resource ownership, revocation and MFA evidence |
| Notification / Notification | Event-template/locale and approved sender bindings | Versioned template, bounded variables, authorized destinations and sensitive-field exclusions |
| Retention / Owning modules + policy owner | Data-class action and reviewed duration | Legal hold and commerce obligations checked before purge; production durations remain unset |
| Import / File jobs + Catalog/Inventory | Column mapping version and bounded field transforms | Explicit units, source identity, referenced entities and reconciliation; no arbitrary expressions |

A valid draft has complete values for its policy type. Environment-wide defaults may fill a draft visibly, with provenance; they cannot dynamically supply missing financial policy at checkout. No production-facing edit endpoint is required to start local development: reviewed immutable fixtures can exercise the same decision contracts first.

## Resolution and policy activation

1. Resolve merchant/deployment and actor from trusted routing and verified identity. The current single-merchant deployment has one scope; no new tenant ID is accepted from clients.
2. Load one authoritative active release pointer for the command. It references a complete immutable profile and policy set; never resolve each rule from an independently changing "latest" row.
3. Match policy scope using the declared precedence: exact product, nearest applicable category in the documented category hierarchy, market, then merchant default. Each policy type explicitly declares which scopes it permits. Tied specificity, multiple equal-depth category matches or overlapping matching conditions are errors unless the domain defines and tests a unique priority. Do not use creation time as a tie breaker.
4. Validate capabilities, currency/units, dates, required evidence and current safety restrictions. Resolve once per decision and return a bounded, explainable result.
5. Activation locks the deployment's release pointer and checks its expected revision, compatibility, complete policy references and scheduled time. Switch the pointer and append audit/outbox atomically. Duplicate activation replays safely; conflicting revision returns a conflict/precondition error.
6. New checkout T02 first follows the existing idempotency claim/replay rule. For a new execution it locks its selected pointer for shared access before existing cart/eligibility/campaign/stock locks; activation takes exclusive access to that pointer only. A completed idempotent replay does not require today's policy selection. This is a proposed added lock tier, to integrate into the canonical lock document before implementation. A request admitted under the old release can commit before activation; activation then defines the cutover for subsequent submissions.
7. Cache immutable revisions by ID/digest. A new commercial command still reads its authoritative pointer and current restrictions. If authoritative policy state is unavailable, reject the dependent command; never authorize it using a stale pointer. Discovery caches remain governed by the existing publication rule.

For the initial system, only market/merchant scopes are necessary; product/category precedence is enabled only when its matching contract and tests are implemented. No recurring scheduler or timezone behavior is inferred from an effective date.

## Quote, order and later workflow semantics

- Quote returns a policy release reference with the existing quote hash and calculation. Submit recomputes under the selected current release; changed accepted inputs or policy release require reconfirmation and a fresh idempotency key after the retained rejection.
- Accepted order retains release/profile revision, relevant line-level policy references and immutable money/quantity/currency snapshots. The database extension must add the missing references; existing order fields alone do not provide all of them.
- Idempotent replay returns the original safe result after current authorization. It never recalculates an accepted purchase under new policy. Do not make the server-selected current policy revision part of the client's canonical request in a way that breaks replay.
- Cancellation/return eligibility uses the order's contracted terms and current workflow facts. A later rule cannot silently shorten purchased rights. An explicitly reviewed adjustment can grant a remedy and records its reason/evidence; it never increases refundable money beyond recorded entitlement.
- Sensitive actions always use current actor permissions, risk holds, legal holds and operational stops. Historical policy does not restore revoked staff access. Restrictions that affect execution must be represented by authoritative holds/state and checked under existing transaction locks; a cache flag is insufficient.
- Provider/account binding is immutable on each payment/refund attempt. A profile change routes new eligible attempts only; callbacks and reconciliation find the original binding. Unknown outcomes cannot be rerouted or resent blindly.
- Worker work carries aggregate/intent and pinned decision references where applicable. It reloads current workflow facts and safety controls, preserving the original financial obligation. Never interpret an old event using a newly selected monetary formula.
- Rollback activates a new release referencing an earlier compatible policy set for new work. It does not rewrite prior orders, retract messages or reverse external payments.

## Proposed staff API surface

All routes are under /api/v1/staff/commerce. This is a contract inventory to refine under the existing endpoint template, not executable OpenAPI. No frontend is needed; an API client can exercise it.

| Operation | Access and required input | Result / important failure |
| --- | --- | --- |
| GET /capabilities | commerce.config.read; current deployment scope | Safe implemented/tested capability manifest; no secrets or claim that templates are available |
| POST /profiles and PATCH /profiles/{id} | commerce.config.edit; typed draft; idempotency for create, If-Match for edits | Draft revision; unknown/unsupported type is a validation error |
| POST /profiles/{id}/validations | commerce.config.review; expected revision and bounded fixture references | Report bound to content digest, schema/release and scenarios; no financial side effects |
| POST /profiles/{id}/approvals | commerce.config.approve plus domain approval for finance/security policies | Recorded reviewer and exact revision; same-person sensitive approval rejected |
| POST /releases | commerce.config.release; approved profile revision, expected active revision, effective time, reason and idempotency | Scheduled/active release or compatibility/evidence conflict; never accepts credentials |
| GET /releases/{id} and GET /profiles/{id}/history | commerce.config.read plus audit visibility | Redacted state, provenance, evidence and activation history |
| POST /capability-stops | Narrow operational permission; capability, scope, stop/resume, reason and idempotency | Audited admission/submission stop; receipts and reconciliation remain separately controlled |

All lists need the existing pagination limits. Validation executes only trusted strategies with bounded fixture counts. Draft edits invalidate prior validations/approvals. Scheduled activation revalidates evidence/compatibility at execution; a stale approval digest cannot activate a changed draft. API paths, field lengths, permission grants and all error cases must be finalized before their implementation slice.

## Failure and change acceptance

Use these fictional examples as initial acceptance fixtures:

| Change or request | Expected result |
| --- | --- |
| DEV-LOCAL fee changes from 6,000 to 7,000 minor between quote and submit | New quote/reconfirmation; no stock reservation or payment attempt from the rejected submission |
| An accepted order used a seven-day return window; new orders use three days | Original order retains its seven-day contract; current quantity/condition/security checks still apply |
| A merchant selects fractional quantities against the baseline integer-unit implementation | Profile validation rejects activation and identifies the measured-unit extension |
| Profile switches payment provider while an earlier attempt is unknown | Earlier attempt stays bound to its original provider/account and reconciliation workflow |
| Two staff members activate different releases with the same expected pointer revision | One switch succeeds; the other receives a conflict and must review the newer state |
| Policy store cannot be reached, but Valkey has a previously active release | Dependent new checkout is rejected safely; cached policy cannot authorize a commercial effect |

These fixtures define proposed behavior, not executed test results.

Prove simultaneous activation/checkout, stale drafts, overlapping rules, scheduled duplicate activation, policy cache loss, unsupported schemas, removed adapters, actor revocation, rollback, and old-order refunds after policy changes. Stopping new checkout must not lose incoming payment evidence. Retiring an adapter requires draining old attempts/refunds and reconciliation or a separately verified compatible historical reader. Keep capability templates disabled until their complete DB/API/worker/security combinations pass acceptance.
