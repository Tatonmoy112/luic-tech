# Stage 3: Release scope and change control

**Owner:** Product owner. **Status:** Proposed baseline, dependent on G1 approval.

## Release 1: Complete purchase and operating workflow

| Workstream | Included boundary | Requirement IDs |
| --- | --- | --- |
| Storefront | Responsive English website; home, categories, product/variant pages, cart, checkout, order status, essential policy/contact content | CAT-01, CART-01, CHK-01, SEO-01 |
| Search and media | OpenSearch keyword/faceted search and autocomplete; product images in S3/CDN | SRCH-01, MED-01 |
| Identity | Auth0 email-based customer login, guest checkout, own-order/address access, role-based staff access with MFA | ACC-01, ACC-02, SEC-01 |
| Inventory | One stock location, stock ledger, reservations, expiry, adjustments, inspection/restock | INV-01 |
| Payments | SSLCOMMERZ hosted checkout, server validation, multiple tracked attempts, discrepancy queue and reconciliation | PAY-01, PAY-02 |
| Orders and fulfillment | Controlled states, packing/dispatch, one shipment per order, manual courier booking/tracking, delivery exceptions | ORD-01, SHIP-01 |
| Returns and refunds | Line-level requests, cancellation, inspection, approved partial/full refunds, refund status reconciliation | RET-01 |
| Admin and reporting | Role-specific operations, audit, reports/exports defined in Phase 6 | ADM-01, RPT-01 |
| Marketing and messaging | One coupon per order, basic homepage content, transactional email through one selected provider | MKT-01, NTF-01 |
| Data and launch | One agreed CSV up to 10,000 SKUs, rehearsal and final import, operator training, pilot, release and recovery preparation | MIG-01, OPS-01 |
| Quality | All NFR targets and security/integrity acceptance gates in Stage 2 | NFR-01 through NFR-09 |

A limited pilot uses the same integrity controls as public launch, with fewer users/SKUs and closer operational supervision. Pilot is not permission to bypass payment, security, or recovery checks.

## Release 2 candidates

Wishlist/reviews with moderation; loyalty/referrals; abandoned-cart marketing; Bangla localization; COD and collection reconciliation; one courier API integration; advanced coupon combinations; richer merchandising and customer segmentation. Rank after actual launch evidence and separately estimate each addition.

## Explicitly excluded from the estimate

Marketplace/multi-vendor settlement, SaaS multi-tenancy, native mobile apps, subscriptions, international currencies/shipping, direct wallet integrations, manual bank-payment verification, EMI-specific UX, split shipments/payments, backorders/preorders, multiple warehouses, ERP/POS/accounting integration, real-time omnichannel stock sync, historical order migration, password migration, warehouse robotics, serial/batch/expiry tracking, recommendation AI, data warehouse, Kubernetes, Kafka, active-active multi-region operation, and formal external certification.

Domain registrations, content production, legal policy drafting, advertising spend, and ongoing 24/7 service staffing require separate ownership/budget. Essential policy pages are included as containers for business-approved content.

## Boundary examples

- “Order tracking” means staff-maintained shipment reference and status; automatic courier events require new scope.
- “Payments” means methods enabled in the merchant's SSLCOMMERZ account; it does not promise every wallet/card channel.
- “Returns” includes partial monetary refunds; automated exchanges and replacement-order workflows are later work.
- “Inventory” covers the website's single stock location; other selling channels must follow an agreed manual stock procedure or trigger integration scope.
- “Production grade” includes tested operational controls and handover; it is not an uptime warranty by itself.

## Change procedure

Raise a change with business reason, requirement IDs, acceptance conditions, effort/cost, delivery impact, data/security implications, and dependencies. Product owner prioritizes; technical and delivery leads assess; sponsor approves material funding/date changes. Update the baseline and decision log before scheduling the work.

Small clarifications that do not alter acceptance, risk, or effort materially may be resolved by the product owner. Defects against the accepted baseline are not paid scope additions. A swap in scope must name both removed and added outcomes.

## Release exit

All P0 and agreed P1 requirements accepted; no open critical/high security findings or unresolved money/stock defects; UAT and reconciliation approved; restore/rollback evidence reviewed; live provider and policy readiness complete; named operating owners available; sponsor records G3 go/no-go.
