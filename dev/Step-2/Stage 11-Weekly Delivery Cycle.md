# Stage 11: Weekly delivery, quality and launch cycle

**Owner:** Delivery manager. **Status:** Proposed operating procedure for future implementation.

**Objective:** Deliver small accepted outcomes while preserving scope, financial/stock correctness, and operational readiness.

## Weekly cadence

Development executes through [AI-DLC Units and Bolts](../../context/aidlc/execution-map.md). The weekly cadence below summarizes accepted Bolts, capacity and decisions; it is not a requirement to wait a week for review or feedback. Each Bolt carries intent, scope, profile, parent task/substeps, authorization, meaningful checks and a persistent handoff. Financial/stock/security review remains proportionate to the affected behavior.

| When | Activity | Required output |
| --- | --- | --- |
| Start of week | Review accepted work, capacity, dependencies and risk | One weekly outcome, ready work items, owner and acceptance scenario |
| Daily | Short blocker and integrity-risk review | Decisions/escalations; no surprise blocked work |
| Midweek | Product/technical review of an integrated slice | Early correction of business-rule or design misunderstandings |
| End of week | Demonstration and acceptance | Evidence against requirement IDs, defects and outstanding decisions |
| End of week | Forecast and retrospective | Remaining effort, milestone confidence, improvement action and updated risk log |

Demonstrate a customer or operator outcome, not only individual screens. Product owner accepts behavior, QA provides evidence, technical lead checks integrity/operability, and finance/operations review their flows.

## Weekly reporting template

- **Week and milestone:** Relative week, milestone, and owner.
- **AI-DLC delivery:** Active/accepted Unit and Bolt IDs, evidence, actual review/rework and next eligible slice; no generated-output completion metric.
- **Outcome accepted:** Requirement IDs, scenario, reviewer, evidence link.
- **Not accepted:** Reason, impact, owner and next action.
- **Plan versus actual:** Available person-days, accepted scope, remaining effort; avoid subjective percent-complete.
- **Quality:** Open defects by severity, money/stock discrepancies, security findings, relevant service-target results.
- **Dependencies/decisions:** D-register IDs, due date, escalation owner.
- **Forecast:** Earliest/latest milestone view, changed assumptions and budget/contingency use.
- **Next week:** One outcome, ready work, capacity and business input needed.

No actual delivery metrics are available yet. Do not populate a status report with invented completed features or passing checks.

## Requirement-to-verification matrix

| Coverage | Required scenarios | Reviewer |
| --- | --- | --- |
| Identity and ownership: ACC/SEC | Invalid token, expired session, cross-customer order access, revoked staff, admin permissions, guest-link expiry | QA + technical lead |
| Catalog/cart: CAT/MED/CART/SEO | Variant and publish rules, image validation, cart merge, stale price, keyboard/mobile journey | Product + QA |
| Checkout/inventory: CHK/INV | Last-unit concurrency, multi-line rollback, idempotency payload conflict, coupon cap contention, expiry/payment race | Technical lead + QA |
| Payment: PAY | Success without return, forged callback, duplicate/out-of-order event, validation timeout, late success, double payment | Finance + QA |
| Fulfillment/returns: ORD/SHIP/RET | Invalid dispatch, failed delivery, cancellation after payment, inspected restock, partial return, concurrent/uncertain refund | Operations + finance |
| Async/search: SRCH/NTF/OPS | Duplicate job, worker crash, visibility timeout, DLQ/replay, stale/delete events, reindex and cache loss | Technical + platform |
| Reporting/migration: RPT/MIG | Refund-period totals, settlements/fees mismatch, invalid CSV rows, duplicate SKU, opening balance reconciliation | Data + finance |
| Operations/NFR | Agreed peak and burst load, DB failure, restore, deployment rollback, alert escalation, private caching, accessibility | Platform + QA |

Verify features continuously. Reserve W11 for integrated load, security, resilience, accessibility and recovery evidence. Do not postpone correctness verification until launch week.

## Defect and incident triage

| Severity | Example | Planned response |
| --- | --- | --- |
| Critical | Duplicate charge/refund, unauthorized personal data access, corrupted order/stock, widespread checkout failure | Stop affected release/flow, alert technical/finance/security owner, preserve evidence |
| High | Core purchase/refund/fulfillment blocked without safe workaround | Prioritize immediately; cannot pass the launch gate unresolved |
| Medium | Incorrect noncritical behavior with controlled workaround | Owner, fix date, acceptance impact reviewed |
| Low | Minor presentation/documentation issue | Prioritized backlog and reviewer decision |

Severity reflects impact and likelihood, not how easy the fix is. Critical/high security findings and money/stock defects block launch. Any reclassification requires evidence; a deadline is not justification.

## Future deployment review

Before promotion: accepted scope, relevant checks, reviewed artifact/infrastructure changes, database compatibility, release notes, rollback owner, and on-call cover. Use the same immutable artifact across environments. Deployment success requires business smoke checks and telemetry review, not just running containers.

Initially propose a 30-minute supervised release observation window. Immediate stop/rollback triggers include any duplicate financial effect, unauthorized access, unexplained stock discrepancy, or sustained checkout/5xx regression beyond agreed thresholds. Define numerical regression thresholds from staging and pilot baselines before G3. For database incompatibility, use the reviewed forward-repair/recovery plan rather than an untested destructive rollback.

## Cutover and pilot sequence

1. Confirm all release gates, staff cover, live merchant/refund readiness, approved policies, support channels and communications owner.
2. Rehearse final catalog import, price and image mapping, opening stock reconciliation, and rollback before the launch date.
3. Define any legacy content/order freeze. With no legacy system assumed, freeze the approved source CSV and stock count; changes require a controlled delta.
4. Verify backups, access recovery, operational dashboards, queue health, provider configuration, secrets and DNS/certificate readiness.
5. Import the approved final data and reconcile SKU counts, stock, prices and publication; sign off discrepancies before opening sales.
6. Conduct an explicitly approved low-value live purchase and refund with finance oversight; verify ledger and provider records. No real transaction is performed by this planning task.
7. Open a limited pilot, monitor purchase/fulfillment/refund behavior and customer support, and resolve blocking issues.
8. Sponsor records public-launch go/no-go based on the evidence checklist; gradually expand traffic/campaign exposure.
9. Reconcile every pilot order/payment and review unsettled/unknown attempts, stock changes and notification failures.
10. Handover to named operating owners and enter the agreed hypercare period.

If stopping after any real order, preserve and reconcile all live financial and stock records. Never overwrite the live database with a prelaunch snapshot merely to revert a storefront release.

## Go-live evidence checklist

| Gate | Evidence | Accountable reviewer |
| --- | --- | --- |
| Product | P0/P1 acceptance and approved exceptions for minor issues | Product owner |
| Finance | Live merchant readiness, payment/refund mapping, reconciliation procedure and smoke evidence | Finance lead |
| Operations | Stock reconciliation, fulfillment/returns training, support cover | Operations lead |
| Security | No open critical/high findings; access, secrets, ownership and upload review | Technical/security lead |
| Reliability | NFR measurements, alerts, regional restore and rollout rollback rehearsal | Platform lead |
| Data/policy | Import approval, customer-facing policies and retention decisions | Business/data owner |
| Handover | Account ownership, runbooks, escalation contacts and service cost owner | Delivery manager |
| Final decision | Recorded release/hold decision with reasons and date | Sponsor |

All evidence remains to be produced. A checklist item is complete only when its linked evidence has been reviewed.

## Hypercare and steady operation

Propose two weeks of hypercare after launch with daily payment/stock reconciliation, queue/error review and defect triage. Finance owns settlement review; operations owns fulfillment/returns; platform owns alerts/recovery; product owns journey feedback. Support hours and response commitments must be funded and agreed separately.

At hypercare exit, confirm no unresolved launch blockers, named maintenance/on-call responsibility, remaining backlog owners, and a scheduled review of operating cost, incidents, restore readiness and dependency patches.
