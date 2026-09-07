# Stage 2: Business and product requirements

**Status:** Draft baseline for review. **Owner:** Product owner.

**Business:** Identity and commercial details not provided; single-merchant physical-goods retail in Bangladesh/BDT assumed under D01.

## Product objective

Enable customers to find products and complete a trustworthy purchase, while staff maintain accurate inventory, fulfill orders, resolve returns, and reconcile payments from one controlled operating workflow.

Proposed outcomes are reduced order correction, fewer payment discrepancies, better stock accuracy, and shorter fulfillment time. Baselines and improvement targets require discovery evidence; no revenue uplift is promised.

## Actors and journeys

| Actor | Primary journey |
| --- | --- |
| Guest | Browse, cart, checkout, pay, securely access order status, request support |
| Registered customer | Authenticate through Auth0, manage addresses, buy, view own orders, request return |
| Catalog manager | Prepare products/variants/images, validate import, publish and maintain content |
| Fulfillment operator | Review eligible order, pick/pack, dispatch, track exceptions, inspect returned stock |
| Support agent | Find authorized order context, explain status, request cancellation/return |
| Finance operator | Review discrepancies, authorize refunds, reconcile settlements and exports |
| Platform administrator | Assign permissions, review audits, maintain approved settings |
| Service operator | Monitor failures, recover services, replay approved jobs, execute incident procedures |

## Functional requirements and acceptance

P0 = mandatory launch integrity/control. P1 = launch capability within the assumed scope. P2 = later candidate. All P0 and P1 entries are included in Release 1 unless changed through Stage 3.

| ID | Priority | Requirement | Observable acceptance |
| --- | --- | --- | --- |
| CAT-01 | P1 | Products, categories, variants, attributes, prices, publication | Unique sellable SKU; incomplete/archived products cannot be purchased |
| MED-01 | P1 | Product media and protected documents | Authorized upload checks type/size; public product images and private exports use different access rules |
| SRCH-01 | P1 | Keyword search, autocomplete, filters, facets, pagination | Approved sample queries return correct filters; unpublished items excluded; stale availability cannot bypass checkout |
| ACC-01 | P0 | Auth0 login and application permissions | Wrong/expired tokens rejected; customers access only their records; admin MFA enforced |
| ACC-02 | P1 | Guest checkout and customer address/order history | Guest access requires verified secret link/session; address changes do not rewrite past order addresses |
| CART-01 | P1 | Persistent cart and controlled merge | Refresh/login preserve intended items; stock/price changes are explained; duplicate items merge within limits |
| CHK-01 | P0 | Authoritative, repeat-safe checkout | Same checkout key returns same result; changed payload conflicts; tampered price/discount ignored |
| INV-01 | P0 | Stock ledger, reservation, expiry, allocation | Concurrent final-unit attempts cannot oversell; release/commit occurs once; stock adjustments are audited |
| PAY-01 | P0 | SSLCOMMERZ hosted payment and verification | Browser return cannot mark paid; transaction, currency, amount, and successful provider result validated |
| PAY-02 | P0 | Payment reconciliation and exception management | Missing/duplicate/out-of-order notifications resolve safely; unmatched/late payments remain visible |
| ORD-01 | P0 | Controlled order/payment/fulfillment histories | Invalid state transitions fail; fulfilment blocked for unverified or held payment; no destructive history edits |
| SHIP-01 | P1 | Delivery zones, charges, manual booking/tracking | Unsupported zone blocks checkout; permitted staff record dispatch/tracking and delivery exceptions |
| RET-01 | P0 | Cancellation, line returns, partial/full refunds | Approvals logged; pending/completed refund totals cannot exceed paid balance; return inspection controls restock |
| ADM-01 | P0 | Role-based operating console and audit | Support cannot approve refunds; changes and exports are attributable; concurrent edits cannot silently overwrite |
| MKT-01 | P1 | Basic coupon and homepage campaign content | One coupon/order; eligibility, expiry, caps, and concurrent redemption limits enforced |
| SEO-01 | P1 | Discoverable, accessible public storefront | Canonicals, sitemap, metadata, appropriate structured data, keyboard journeys, and explicit empty/error states |
| NTF-01 | P1 | Transactional order/payment/shipment/refund email | Durable queued requests, bounded retries, delivery status visible; notifications never authorize financial actions |
| RPT-01 | P1 | Sales, orders, inventory, returns, reconciliation reports | Definitions match Phase 6; duplicates/refunds reconcile; freshness and export permissions visible |
| MIG-01 | P1 | One agreed catalog CSV source, up to 10,000 SKUs | Rehearsal and row errors reviewed; approved prices/stock/image mapping reconcile before launch |
| OPS-01 | P0 | Deployment, monitoring, backup, incident and recovery readiness | Rollback and restore rehearsals pass; actionable alerts and named responders exist |
| SEC-01 | P0 | Data protection and abuse controls | Least privilege, safe secrets/logging, upload controls, ownership checks, rate controls, reviewed retention |
| FUT-01 | P2 | Loyalty, referrals, reviews, wishlists, advanced marketing | Separate business case and acceptance design required before inclusion |

## Proposed nonfunctional targets

Targets are planning objectives requiring D02/D14 approval and later measurement; they are not measured results or contractual SLA commitments.

| ID | Target | Measurement and acceptance boundary |
| --- | --- | --- |
| NFR-01 | 99.9% monthly availability for first-party storefront/API | Successful valid requests over eligible requests; exclude expected user validation failures, report planned downtime separately and include it in availability; report provider-caused end-to-end failures separately |
| NFR-02 | p95 first-party read API <= 400 ms; local checkout transaction <= 1 second | Steady 100 dynamic requests/sec mixed workload, 10 checkout attempts/sec within that total, 10,000 SKUs; excludes remote gateway time, measured separately |
| NFR-03 | LCP <= 2.5 seconds, INP <= 200 ms, CLS <= 0.1 at p75 | Public critical journeys on agreed mobile/network profile in prelaunch testing; confirm with field measurements once sufficient real traffic exists |
| NFR-04 | Search index freshness p95 <= 60 seconds; alert when oldest pending update > 5 minutes | From committed catalog change to searchable result under agreed load; checkout still validates DB truth |
| NFR-05 | RPO <= 5 minutes; RTO <= 60 minutes for regional DB/service recovery | Restore/failover drill including access, secrets, application readiness, and reconciled payment backlog; multi-region disaster recovery excluded |
| NFR-06 | Accessibility target WCAG 2.2 AA for critical journeys | Keyboard, focus, labels, error identification, contrast and screen-reader review alongside automated checks; independent certification excluded |
| NFR-07 | No unresolved critical/high security findings at launch | Documented review and issue triage; any severity reclassification requires evidence |
| NFR-08 | No duplicate financial side effects, no unauthorized order access, no negative available stock from checkout | Concurrency, replay, ownership, rollback and recovery scenarios; sample evidence retained |
| NFR-09 | Orders/transactions never depend on cache or search durability | Simulated cache/search loss preserves committed records and prevents stale-price purchase |

Core Web Vitals targets follow [Google's Web Vitals guidance](https://web.dev/articles/vitals). Accessibility target references [W3C WCAG 2.2](https://www.w3.org/TR/WCAG22/); selecting this target does not establish conformance.

## Business rules and policy ownership

Money uses exact minor-unit or fixed-decimal arithmetic with explicit currency and rounding. Freeze item description/SKU, price, discount/tax allocation, delivery charges, and addresses on the order. Finance must approve tax rules, invoice numbering/content, return eligibility, refund thresholds, and settlement treatment. Do not infer a tax rate or legal retention period.

Proposed operational defaults: no backorders; payment reservation initially 15 minutes subject to provider/session validation; cancellation before dispatch subject to payment/refund status; returned stock requires inspection. A late payment after expiry must be resolved through safe reallocation or a refund/review queue.

## Traceability and approval

Each future delivery item must include one or more requirement IDs, relevant D-register entries, owner, acceptance examples, and evidence location. Weekly reports use these IDs. Product owner approves journeys and scope; finance/operations approve policy; technical lead approves technical acceptance; sponsor approves funding and launch.

Open business decisions are centralized in the README. This document is populated for review, not signed off.
