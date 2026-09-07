# Master build plan

**Delivery model:** Dependency-ordered increments with continuous verification  
**Planning window:** 18–22 relative weeks after all kickoff entry conditions are met  
**Task source:** [Task catalog](05-task-catalog.md)

The week ranges show a feasible overlap for the proposed team. They are not promises, and they cannot begin until scope, staffing, ownership, and external dependencies are ready.

## Phase sequence

Execution now follows the [AI-DLC Unit/Bolt map](aidlc/execution-map.md). The phase/week table below remains the full-product forecast; it is not the AI-DLC lifecycle or a deadline for the backend-only intent. Inception refines the next eligible slice, Construction builds/verifies it, and Operations accepts/releases/operates it. Continuous quality and small Bolts run inside existing governance; no AI speed multiplier or automatic forecast reduction is assumed.

| Phase | Indicative window | Outcome | Entry condition | Exit gate |
| --- | --- | --- | --- | --- |
| 0. Business and delivery readiness | Before/Weeks 1–2 | Approved rules, scope, team, dependencies, task/evidence system | Sponsor authorizes refinement | G1 decisions resolved; ready kickoff and backlog |
| 1. Experience and contract design | Weeks 1–3 | Approved customer/admin flows, system contracts, data/security models | Product/policy owners available | Critical journeys and technical contracts reviewable |
| 2. Platform foundations | Weeks 2–5 | Isolated environments, delivery controls, baseline telemetry, recovery skeleton | Region/accounts/version direction | Staging promotion path and access review pass |
| 3. Identity, catalog, media | Weeks 3–7 | Secure access and a staff-managed published catalog | Flows/contracts/foundations | Browseable catalog with role/ownership controls |
| 4. Search, storefront, cart | Weeks 5–9 | Usable discovery and persistent cart across intended identity states | Published catalog projection | Product-to-cart slice accepted; stale states handled |
| 5. Pricing, checkout, inventory | Weeks 7–12 | Atomic authoritative quote/order/reservation behavior | Approved finance/stock rules | Concurrency and idempotency evidence passes |
| 6. Payment and reconciliation | Weeks 9–14 | Verified SSLCOMMERZ payment with late/duplicate/unknown resolution | Sandbox, checkout/order model | Complete sandbox purchase and exception matrix pass |
| 7. Fulfillment, return, refund | Weeks 11–16 | Eligible dispatch, tracking, cancellation, inspection, safe refunds | Payment/order states stable | Staff can complete and reconcile lifecycle cases |
| 8. Content, notification, reporting | Weeks 12–17 | Campaign/content, reliable email, operational/finance reports | Source events/definitions stable | Reports reconcile and async failures remain operable |
| 9. Migration and integrated hardening | Weeks 14–19 | Reconciled data plus security, performance, accessibility, resilience evidence | Feature-complete staging | UAT and launch gates have reviewable evidence |
| 10. Pilot, launch, handover | Weeks 18–22 | Controlled production release and owned operation | G3 approvals and rehearsals | Public launch accepted; hypercare ownership active |

## Work-package mapping

| Original package | Context phases |
| --- | --- |
| W01 Requirements refinement and UX | 0–1 |
| W02 Platform and operating foundations | 1–2 |
| W03 Identity and permissions | 1–3 |
| W04 Catalog, media and storefront | 1, 3–4 |
| W05 Search and SEO | 1, 4, 8–9 |
| W06 Cart, pricing, checkout and inventory | 1, 4–5 |
| W07 Payments, reconciliation and refunds | 1, 6–7 |
| W08 Admin orders and fulfillment | 1, 3, 7 |
| W09 Promotions, notifications and reports | 1, 8 |
| W10 Data migration and reconciliation | 0, 9–10 |
| W11 Integrated quality and hardening | Every phase, concentrated in 9 |
| W12 Training, pilot and launch | 10 |
| W13 Delivery coordination and governance | Every phase |

## Critical path

1. Approve price, tax, stock, shipping, return, and refund rules.
2. Design states, data, security, interfaces, and acceptance contracts.
3. Establish platform, identity, and catalog foundations.
4. Complete atomic inventory, pricing, and checkout behavior.
5. Complete verified payment and reconciliation behavior.
6. Complete fulfillment, cancellation, return, and refund behavior.
7. Complete integrated acceptance and migration rehearsal.
8. Pass restore, rollback, security, accessibility, resilience, and load gates.
9. Complete a controlled pilot and reconcile every transaction.
10. Record the sponsor's public-launch decision.

Payment onboarding, product data, policy content, AWS account/region, identity configuration, and actual team availability can extend the calendar independently of development effort.

## Increment plan

Each increment should end with an integrated demonstration and evidence, even if the product is not yet releasable.

| Increment | Demonstrable result | Main task groups |
| --- | --- | --- |
| I0 | Approved task-ready baseline and working governance | GOV, DSC, DES |
| I1 | Staff signs in and creates a draft/published product with media | FND, IAM, CAT, MED |
| I2 | Customer browses/searches a published variant and preserves a cart | WEB, SEA, CART |
| I3 | Customer receives authoritative totals and creates one stock-reserved pending order | PRC, INV, CHK |
| I4 | Sandbox payment becomes verified and order allocation occurs once | PAY, ASY, OBS |
| I5 | Staff picks, packs, dispatches, tracks and completes an eligible order | ORD, FUL, ADM |
| I6 | Customer/staff complete cancellation, return, inspection and refund scenarios | RET, PAY, INV |
| I7 | Notifications, reports, reconciliation, promotion and content operate together | NTF, RPT, MKT |
| I8 | Approved source data is migrated and the complete system passes integrated gates | MIG, QLT, SEC, REL |
| I9 | Controlled live transaction, pilot, public release and handover | LCH, OPS |

## Continuous work in every phase

- Refine only ready tasks and keep one accountable owner.
- Review product behavior, permissions, failure states, accessibility, audit, and telemetry with the feature.
- Maintain OpenAPI and operational documentation with behavior changes.
- Verify negative, retry, replay, and concurrency cases when the domain can affect money or stock.
- Review dependencies, risks, decisions, forecast, and accepted evidence weekly.
- Use backwards-compatible data and release changes and retain recovery options.
- Keep personal information and secrets out of tickets, fixtures, demonstrations, logs, and screenshots.

## Phase gates

### Gate A: Ready kickoff

- G1 decisions and Release 1 boundary reviewed.
- Named sponsor, product, finance, operations, technical, QA, platform, and design ownership.
- Capacity and relative roadmap accepted.
- Merchant-owned accounts and safe delegated-access plan.
- Initial product data sample and provider onboarding plans.

### Gate B: Foundation ready

- Exact version/region decision, architecture, threat model, data/API conventions reviewed.
- Development/staging delivery path, secrets/access, telemetry, and backup design demonstrated.
- Critical-flow designs and acceptance matrix approved.

### Gate C: Commerce core ready

- Catalog/search/cart journey integrated.
- Checkout idempotency and all-or-nothing stock reservation verified.
- Price/discount/delivery/tax snapshots reconcile.
- Ownership and permission cases pass.

### Gate D: Money and operations ready

- Provider initiation, callback receipt, validation, late/duplicate/unknown handling verified.
- Allocation happens once and fulfillment eligibility is correct.
- Return/refund/concurrent balance cases and daily reconciliation work.
- Operators can process controlled exception queues.

### Gate E: Release candidate ready

- All P0/P1 behavior accepted or a nonblocking exception is explicitly approved.
- Migration rehearsal and reconciliation pass.
- Security, accessibility, performance, resilience, restore, rollback, and operational exercises pass.
- Policies, content, production accounts, alert ownership, and support coverage are ready.

### Gate F: Public launch

- Low-value controlled live purchase/refund and limited pilot reconcile.
- No unresolved critical/high blocker or unexplained money/stock discrepancy.
- Sponsor records launch decision; operational ownership and hypercare are active.

## Task selection rule

At weekly planning, choose the earliest dependency-ready tasks that complete the current increment. Do not start downstream interface work to hide an unresolved business rule. If a task is larger than one coherent outcome or requires different accountable reviewers, split it using the task template and preserve the parent requirement/dependency links.

## Reforecast points

Re-estimate elapsed time and remaining effort after: G1 scope approval; exact-version/provider readiness; approved critical designs; first complete sandbox purchase; refund reconciliation demonstration; migration rehearsal; integrated UAT; and any accepted scope change. Use actual remaining work and role capacity, not percent-complete intuition.
