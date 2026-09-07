# Phase 8: Budget discovery

**Owner:** Sponsor and delivery manager. **Outcome:** An affordable scope and operating model.

## Discussion

Ask: "Have you allocated a range for delivery and for monthly operation after launch?" Follow with who approves expenditure, whether there is a fixed ceiling, and which launch capabilities are essential if the budget is constrained.

No budget, rates, vendor quotations, or financial targets were provided. Do not present an invented project price or current cloud bill.

## Separate cost categories

| Category | Included cost drivers | Planning treatment |
| --- | --- | --- |
| Delivery | Discovery, UX, engineering, QA, security/operations preparation, migration, training | Person-day model in Stage 5 |
| Risk reserve | Integration uncertainty, data quality, remediation | Explicit contingency, not hidden markup |
| Recurring infrastructure | Fargate, load balancer, RDS Multi-AZ, Valkey, OpenSearch, S3, CDN, queues, network transfer/NAT | Region-specific estimate before agreement |
| Recurring software/services | Auth0 active users/features, Sentry, email, support tooling | Verify actual plan and usage |
| Variable commercial costs | Payment processing, refunds/adjustments, courier, messaging | Merchant-specific quotations |
| Operations | Monitoring, incident cover, patching, restore drills, customer operations | Named team and support agreement |
| One-time business costs | Branding, photography, data cleanup, policy review, provider onboarding | Owner and allowance required |

## Cost model and controls

Proposed delivery cost = approved role effort multiplied by agreed daily rates, plus separately stated third-party costs and applicable commercial charges. Show contingency separately. Monthly operating cost should have low, expected, and campaign scenarios using the same D02 traffic assumptions.

OpenSearch, Multi-AZ databases, network egress/NAT, logs, and nonproduction environments can be material even at low order volume. Get a service-by-service estimate rather than using a single hosting allowance. No vendor price is quoted in this pack.

Require merchant-owned billing accounts, tagging, budgets/alerts, log retention limits, environment schedules where appropriate, and a monthly cost owner. A budget alert does not automatically cap spending.

## Value and scope discussion

Estimate benefits only after measuring current order correction effort, payment mismatches, fulfillment delays, and customer conversion. Do not guarantee revenue uplift.

If funds are limited, review optional features, content breadth, rollout size, and automation. Payment validation, stock integrity, access control, backup recovery, and release verification remain launch gates.

Complete when D12 records a delivery range, operating ceiling, approval authority, contingency owner, and funding timing. Otherwise label Stage 6 as an indicative proposal.
