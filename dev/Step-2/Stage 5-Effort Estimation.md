# Stage 5: Effort estimation and delivery roadmap

**Owner:** Delivery manager with technical, design, and QA leads.

**Status:** Indicative planning range, not a quotation. No actual team capacity, start date, or rates were supplied.

## Estimation basis

Release 1 follows Stage 3: one merchant, one warehouse, BDT/English, one catalog CSV up to 10,000 SKUs, manual courier workflow, SSLCOMMERZ and Auth0, and the proposed AWS stack. No existing application is available for reuse.

One person-day means eight hours of focused work. Work packages include their own design clarification, implementation, review, and feature verification. System hardening covers cross-system security, load, resilience and release verification rather than repeating feature work. Coordination effort is explicitly included.

## Work breakdown

| ID | Work package | Person-days low-high | Key dependency and reviewable outcome |
| --- | --- | --- | --- |
| W01 | Requirements refinement and UX | 24-30 | Approved rules; customer/admin journeys and error states |
| W02 | Platform and operating foundations | 26-32 | Environment, pipeline, access/secrets, telemetry, backup design |
| W03 | Identity and permissions | 20-24 | Auth0 integration, guest access, roles and ownership checks |
| W04 | Catalog, media and storefront | 30-38 | Product/variant administration, public pages, media workflow |
| W05 | Search and SEO | 16-22 | Indexed catalog, filters/autocomplete, freshness and discoverability |
| W06 | Cart, pricing, checkout and inventory | 46-58 | Atomic reservations, totals, coupon holds, expiry and contention rules |
| W07 | Payments, reconciliation and refunds | 46-58 | Verified payments, late/duplicate cases, partial returns/refunds |
| W08 | Admin orders and fulfillment | 26-34 | Pick/pack/dispatch, tracking, returns inspection, audit workflows |
| W09 | Promotions, notifications and reports | 28-36 | Basic coupons/content, transactional email, finance/stock reports |
| W10 | Data migration and reconciliation | 16-20 | Source validation, rehearsal, approved final catalog/stock import |
| W11 | Integrated quality and hardening | 30-38 | Security, load, accessibility, resilience, restore/rollback evidence |
| W12 | Training, pilot and launch preparation | 12-16 | Operator readiness, cutover rehearsal, supervised release |
| W13 | Delivery coordination and scope governance | 20-26 | Planning, dependency/risk management, acceptance and handover |
| | **Base total** | **340-432** | Full assumed release |
| | **20% contingency, rounded up at total** | **68-87** | Uncertain integration/data issues and remediation |
| | **Planning allowance** | **408-519** | Base plus contingency; not additional feature budget |

Contingency is an explicit allowance, not a statistical confidence interval. Known exclusions, staff absences, or new requirements require re-estimation rather than silently consuming it.

## Staffing and capacity assumptions

| Role | Proposed allocation | Main responsibility |
| --- | --- | --- |
| Technical lead | 0.5 FTE | Architecture, integrity, reviews, complex decisions |
| Backend engineers | 2.0 FTE | Domain, data, payments, workers, integrations |
| Frontend engineers | 1.5 FTE | Storefront, admin, accessibility and interaction |
| QA engineer | 1.0 FTE | Acceptance, regression, cross-system evidence |
| Platform/DevOps engineer | 0.5 FTE | Delivery, cloud, security/observability/recovery |
| Product/delivery manager | 0.5 FTE | Backlog, clarification, acceptance, risk and coordination |
| UX/product designer | 0.5 FTE during first eight weeks | Journeys, page/state design and usability |

The continuing team totals 6.0 FTE. At five working days/week and 80% usable capacity, that is 24 person-days/week. Design contributes about 16 usable person-days over eight weeks. Over 18-22 weeks, modeled total capacity is about 448-544 person-days, against the 408-519 allowance. Role bottlenecks and sequencing still matter; total capacity is not interchangeable expertise.

The unused capacity margin covers scheduling constraints and uneven specialist demand; it is not another feature allowance. Named staffing must be checked by role before committing the range. Halving engineers does not preserve the same launch date.

## Dependency-based roadmap

Weeks are relative to a ready kickoff. Windows overlap where dependencies permit; they are not durations to add together.

| Window | Focus | Exit evidence |
| --- | --- | --- |
| Weeks 1-2 | W01, begin W02 | Requirements/rules, UX journeys, architecture and provider access reviewed |
| Weeks 2-5 | W02-W03, begin W04 | Staging path, identity/roles, basic catalog and operational visibility |
| Weeks 4-8 | W04-W05, begin W06 | Usable browsing/search and admin product workflow; stock/pricing model reviewed |
| Weeks 7-12 | W06-W07 | Full sandbox purchase; concurrent stock, duplicate/late payment cases demonstrated |
| Weeks 10-15 | W07-W09 | Fulfillment, return/refund, notification and reconciliation journeys integrated |
| Weeks 14-18 | W10-W11 | Migration rehearsal, UAT, load/security/accessibility and restore/rollback evidence |
| Weeks 18-22 | W11-W12 as needed | Issue closure, pilot, final cutover and public launch approval |
| Throughout | W13 | Weekly forecast, decisions, risk and acceptance record |

Indicative elapsed window: **18-22 weeks**, assuming timely approvals, the stated team, and ready external dependencies. W01 is refinement of the approved planning baseline; initial sales discovery/contracting may precede kickoff. After launch, propose two weeks of hypercare under the support arrangement; this is separate from the delivery allowance above.

## Critical path and estimation changes

Critical path: approved checkout/return rules -> inventory and checkout -> payment reconciliation -> fulfillment/refunds -> integrated acceptance -> migration/recovery rehearsal -> pilot/go-live.

Payment onboarding, late product data, unapproved policy, or staff shortages can extend the calendar independently of engineering effort. Reforecast after W01, after the first complete sandbox purchase, and before UAT using accepted work remaining and actual role capacity.

For a smaller budget, negotiate scope explicitly. Keep payment/stock correctness, access control, recovery, and essential QA. Get role day rates and service quotations before translating the effort range to currency.
