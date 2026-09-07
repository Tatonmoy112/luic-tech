# Decision and assumption log

**Status values:** Proposed, Approved, Rejected, Superseded.  
**Current record:** All listed business/technology choices remain proposed unless evidence is added below.

| ID | Decision/assumption | Current status | Owner | Needed by | Evidence/date |
| --- | --- | --- | --- | --- | --- |
| D01 | Single merchant, physical goods, Bangladesh, BDT, English launch | Proposed | Sponsor | Gate A | Pending |
| D02 | Up to 10,000 SKUs, 1,000 orders/day, 100 dynamic requests/sec peak planning model | Proposed | Product + technical lead | Gate A | Pending |
| D03 | One stock location; no backorders, split shipments or preorders | Proposed | Operations | Gate A | Pending |
| D04 | Guest checkout and Auth0 email customer login; admin MFA | Proposed | Product + security | Gate A | Pending |
| D05 | SSLCOMMERZ methods, merchant approval, refund access and settlement terms | Proposed/unknown | Finance | Gate B | Pending provider evidence |
| D06 | Manual courier booking/tracking; COD excluded | Proposed | Operations | Gate A | Pending |
| D07 | Cancellation, return, tax, invoice, refund and restock policy | Unknown | Finance + operations | Gate A | Pending |
| D08 | AWS region and service/AZ layout | Unknown | Technical + business leads | Gate B | Pending assessment |
| D09 | Exact Next.js/NestJS/Node/Drizzle/GLIDE/OpenSearch compatibility set | Unknown | Technical lead | Gate B | Pending validation |
| D10 | One approved product CSV up to 10,000 SKUs; no order/password history migration | Proposed | Product + data owner | Gate A | Pending sample/source review |
| D11 | Transactional email provider, sender domain and support mailbox | Unknown | Product + operations | Gate B | Pending |
| D12 | Budget, rates, team allocation, start and deadline | Unknown | Sponsor + delivery manager | Gate A | Pending |
| D13 | Privacy, retention, accessibility and consumer policy | Unknown | Business policy owner | Gate E | Pending approval |
| D14 | Proposed NFR targets become approved product/service targets | Proposed | Sponsor + technical lead | Gate B | Pending |
| D15 | Domain, branding, content, product assets and support hours | Unknown | Product + operations | Gate B | Pending readiness plan |
| D16 | Merchant owns platform accounts and grants delegated delivery access | Proposed | Sponsor | Gate B | Pending ownership record |
| A01 | Modular NestJS monolith with separately deployed web/API/workers | Proposed | Technical lead | Gate B | Pending architecture review |
| A02 | ECS Fargate, RDS Multi-AZ, SQS, OpenSearch, CloudFront and OpenTofu launch baseline | Proposed | Technical lead | Gate B | Pending region/cost review |
| A03 | PostgreSQL is authoritative; Valkey/OpenSearch are replaceable support systems | Proposed | Technical lead | Gate B | Pending architecture review |
| A04 | Transactional outbox and duplicate-safe Standard SQS consumers | Proposed | Technical lead | Gate B | Pending design review |
| A05 | One shipment per order and payment/order/fulfillment/refund as separate state dimensions | Proposed | Product + technical + operations | Gate B | Pending policy/design review |

## A06: Adaptable commerce profiles and policies

**Status:** Proposed design responding to the user's request for adaptable commerce planning, 6 September 2026. **Owner roles:** Product and technical lead; domain owners review their policy types. Named reviewers and merchant acceptance remain pending.

Use one selected synthetic starting profile, typed/versioned policies for supported rules, verified provider bindings and explicit domain extensions for structurally different models. See [commerce adaptability](../11-commerce-adaptability.md). D01-D16 remain evidence decisions. This extends planning options without enabling all capabilities, weakening invariants or changing the baseline schema by implication. Revisit on new goods, units, market, buyer, tenant, payment or fulfillment model; update affected requirements, database/backend designs and ADAPT/BUILD acceptance.

## A07: AI-DLC development process

**Process selection:** Confirmed by user instruction on 6 September 2026. **Local workflow details:** Documented application of that direction; detailed acceptance not inferred. **Owners:** User/task owner and responsible technical/domain reviewers as assigned at execution.

Apply [AI-DLC](../aidlc/README.md) across the existing context, design, implementation and operations packs. Retain requirement IDs and BUILD/ADAPT dependencies; organize execution into bounded Units/Bolts, with human decisions, meaningful verification and persistent handoff. Reuse prior scope authorization and keep real business/provider/production gates explicit. Current request authorizes documentation integration only. No harness, automated gates, multiple agents or AI productivity commitment is implied. Revisit if a tool-specific harness is adopted or scope/authority changes.

## Decision record template

| Field | Value |
| --- | --- |
| ID/title | New stable identifier and concise decision |
| Status | Proposed / Approved / Rejected / Superseded |
| Context | Problem, constraint and affected users/operations |
| Options | Viable choices and material tradeoffs |
| Decision | Exact selected behavior/boundary |
| Reason | Evidence and rationale |
| Consequences | Scope, tasks, data, cost, schedule, security and operations impact |
| Owner/reviewers | Accountable decision maker and consulted roles |
| Date/evidence | Decision date and reviewable source link |
| Revisit trigger | Condition requiring a new review |

When a decision changes, preserve the old record as `Superseded`, create or link the replacing decision, and update every affected context/task/acceptance record.
