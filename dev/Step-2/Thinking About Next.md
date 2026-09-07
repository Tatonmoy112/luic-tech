# Thinking about the next stage

**Owner:** Sponsor and product owner. **Purpose:** Improve the launched business and preserve reusable knowledge without expanding the current release.

## First 30/60/90 days after launch

| Period | Focus | Evidence and decision |
| --- | --- | --- |
| First 30 days | Stabilize and establish baselines | Payment mismatches, stock adjustments, fulfillment delay, support demand, technical errors and actual operating bill |
| Days 31-60 | Improve customer and staff friction | Search zero-results, checkout drop-off, usability findings, repeated manual tasks |
| Days 61-90 | Prioritize the next release | Benefit, effort, dependency and operational readiness for each candidate |

Compare cohorts and periods consistently using the Phase 6 definitions. Avoid attributing revenue change to the platform without considering campaigns, stock availability, seasonality and pricing.

## Candidate roadmap decisions

| Candidate | Evidence that would justify evaluation | Additional design needed |
| --- | --- | --- |
| Courier API | Manual booking/status effort or errors are materially high | Courier contract, retry/idempotency, label/tracking and exception mapping |
| COD | Meaningful demand and acceptable collection risk | Cash collection ledger, courier remittance, failed-delivery/fraud controls |
| Bangla localization | Customer need and approved translation ownership | Translation workflow, URLs/SEO, font/layout/accessibility review |
| Loyalty/referrals | Repeat purchase opportunity and sustainable economics | Reward liability, abuse rules, cancellation/refund reversal |
| Multi-warehouse | Measured stock-routing or fulfillment need | Location ownership, transfers, allocation, partial shipment scope |
| ERP/POS integration | Manual cross-channel stock and finance reconciliation is insufficient | Source-of-truth rules, mapping, replay/conflict handling |
| Aurora or service extraction | Measured database pressure, failure isolation or independent team ownership | Benchmarks, cost, data/transaction boundaries and migration plan |
| Kubernetes/Kafka | Requirements that existing ECS/SQS cannot reasonably meet | Funded specialist operations, migration and recovery design |

Do not set arbitrary order-volume thresholds as proof that a new architecture is required. Use actual bottlenecks, service objectives, cost and team capability.

## Reusable assets

Keep the BRD, scope, estimate method, decision records, acceptance matrix, payment/stock scenario library, runbooks, training guides and handover checklist reusable. Remove merchant-specific personal data, secrets, pricing and confidential terms before reuse.

A shared foundation may benefit later merchants, but multi-tenancy is not an implied feature. Evaluate tenant isolation, billing, customization boundaries, support burden, upgrade ownership and commercial demand before proposing a platform product.

## Case study and learning

Capture the original problem, approved scope, measurable baseline, operating changes, results, limitations and lessons. Seek separate written permission before publishing a merchant name, screenshots, metrics or testimonials. Do not claim launch success or results before they exist.

## Recurring ownership

Product owns monthly outcome review. Finance owns reconciliation and commercial cost checks. Operations owns stock/fulfillment/return procedures. Technical/platform leads own dependency lifecycle, security patching, capacity, incident learning and recovery rehearsal.

The immediate next action is to resolve the highest-impact open business decisions in the README and review the populated plan. Implementation begins only under a later authorized delivery engagement.
