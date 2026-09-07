# Stage 6: Indicative commercial proposal

**Status:** Draft commercial framework for review; no price or agreement has been approved.

**Prepared for:** Merchant legal entity to be provided. **Prepared by:** Delivery organization to be provided.

## Executive proposal

Deliver a custom storefront and operating console that lets customers find and buy products while staff control stock, fulfillment, returns, and payment reconciliation. Proposed Release 1 serves one merchant, one stock location, and BDT checkout using the specified stack.

The principal value is a traceable purchase-to-fulfillment workflow with reliable financial and inventory controls. Actual savings and sales improvements require a measured business baseline.

## Deliverables and acceptance

| Deliverable | Included outcome | Acceptance owner |
| --- | --- | --- |
| Product/design baseline | Approved journeys, scope, business rules and quality criteria | Product owner |
| Commerce platform | Release 1 customer/admin capabilities listed in Stage 3 | Product + operations |
| Payments and finance | Verified SSLCOMMERZ payments, refunds and reconciliation workflows | Finance |
| Cloud and delivery setup | Agreed AWS environment, pipeline, access and observability controls | Technical/platform lead |
| Data readiness | One agreed catalog CSV import within allowance, reconciled opening stock | Data/operations owner |
| Production readiness | UAT, security/load/resilience/recovery evidence, cutover and pilot | Sponsor with specialist reviewers |
| Handover | Account ownership, documentation, staff training and operating runbooks | Operations |

Future source code, infrastructure definitions and deployment artifacts are deliverables of an eventual implementation engagement. **This current task delivers the local planning pack only.**

## Schedule and pricing method

Indicative delivery window is 18-22 elapsed weeks from ready kickoff. Estimated base effort is 340-432 person-days plus 20% contingency, giving 408-519 person-days after rounding. See Stage 5 for assumptions and capacity.

Recommended commercial approach: approve discovery/scope first, then choose a capped time-and-materials arrangement or milestone-based fixed scope with a change mechanism. No daily rates or business budget were supplied, so no currency amount is quoted.

Role-based delivery fee = sum of agreed person-days by role multiplied by each agreed day rate. Show base fee, contingency allowance, pass-through services, applicable commercial taxes, total cap, and payment terms separately. A blended rate may be used only if both parties agree its staffing basis.

## Proposed milestone payment structure

| Trigger | Share of agreed delivery fee | Evidence |
| --- | --- | --- |
| Signed agreement and ready kickoff | 20% | Scope, owners, capacity and dependency plan |
| Foundations, identity and catalog accepted | 20% | Reviewed milestone evidence |
| End-to-end checkout/payment/inventory accepted in staging | 25% | Money/stock correctness scenarios and demonstration |
| UAT and production-readiness accepted | 25% | Agreed acceptance record and release package |
| Handover and supervised launch completed | 10% | Ownership, runbooks, training and launch record |

Percentages total 100% and are negotiation proposals, not invoices. Define invoice due dates, review periods, dispute procedure, and treatment of business-caused launch delay in the actual agreement. Do not make payment contingent on undefined subjective satisfaction.

## Operating costs and responsibilities

Cloud, Auth0, Sentry, email, gateway, domain, courier and support costs are separate from delivery labor unless explicitly itemized. Obtain region-specific usage estimates and merchant quotations. The merchant should own service accounts and pay vendors directly where practical.

Merchant supplies approved business policies, brand/content, usable product data, inventory opening balance, provider onboarding, reviewers and staff training attendance. The delivery team owns delivery quality and evidence within the approved scope.

## Support proposal

Propose two weeks of launch hypercare and a 30-calendar-day defect correction window after accepted launch/handover, overlapping during the first two weeks. Agree funding/coverage separately from the delivery effort allowance. Define a defect against approved acceptance criteria; new features and changed policies use change control.

Ongoing maintenance should specify patching, monitoring, incident response hours, recovery drills, dependency updates, capacity/cost reviews and a monthly fee. No 24/7 support or contractual uptime guarantee is included by default.

## Conditions before issue

Confirm legal entities, budget/rates, scope version, D-register decisions, service cost estimate, milestone reviewers, support terms and proposal validity period. Formalize agreement details in Stage 9. This proposal is ready for discussion once those commercial blanks have accountable owners; it is not a signed offer.
