# Risk register

**Scale:** Probability and impact are Low, Medium, or High planning judgments until owners review them.  
**Status:** All entries Open.

| ID | Risk | Probability | Impact | Early signal | Treatment | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| R01 | Business rules remain undecided and force checkout/return redesign | High | High | D01–D07 overdue; conflicting stakeholder answers | Resolve G1 before scope lock; use signed examples | Product owner |
| R02 | SSLCOMMERZ merchant/refund capability or status behavior differs from plan | Medium | High | Sandbox/live access delayed; undocumented/ambiguous status | Complete PAY-001/002 early; reconcile unknowns; provider escalation | Finance + technical |
| R03 | Incomplete/dirty product and stock source delays catalog/migration | High | High | Duplicate SKUs, missing prices/media, unclear opening stock | Profile representative sample early; assign data owner; rehearse | Data + operations |
| R04 | Exact technology versions or region services are incompatible/unavailable | Medium | High | Client/runtime install or TLS/architecture validation fails | Complete SYS-002/003 before foundation commitment; record fallback | Technical lead |
| R05 | Payment notification, reservation expiry and retry races cause incorrect stock/money | Medium | High | Duplicate events, unallocated paid orders, negative stock | Preserve invariants; transactional guards; concurrency suite; alerts | Technical lead |
| R06 | Refund timeout/retry causes duplicate or excessive refund | Medium | High | Unknown provider outcome or simultaneous approvals | Atomic balance reservation; stable references; query before retry | Finance + technical |
| R07 | Search/cache becomes accidental authority and sells stale price/stock | Medium | High | Checkout trusts projected values or fails unsafe during outage | PostgreSQL revalidation; NFR-09 failure testing | Technical lead |
| R08 | SQS duplicate/out-of-order behavior repeats external side effects | Medium | High | Repeat emails/refunds/updates or old event overwrites new | Outbox, processing keys, state/version guards, DLQ/replay controls | Technical lead |
| R09 | Role or record-ownership gap exposes customer/financial data | Medium | High | Cross-account access, broad admin exports, token-role assumptions | Threat model; server ownership checks; role matrix; security suite | Security lead |
| R10 | Team capacity/role bottleneck makes 18–22 weeks unrealistic | High | High | Named allocation below plan; payment/platform reviews queue | Confirm role capacity; reforecast at gates; reduce scope explicitly | Delivery manager |
| R11 | Content, policy, domain or email readiness blocks an otherwise complete launch | High | Medium | D11/D13/D15 has no owner/date | Dependency calendar; content readiness reviews; escalation | Product owner |
| R12 | Recovery target is assumed from backups but cannot be achieved | Medium | High | Restore untested, credentials/config missing, drill exceeds RTO | Clean restore drill and post-restore payment reconciliation | Platform lead |
| R13 | Logging/tracing or support artifacts expose secrets/personal data | Medium | High | Provider URLs/payloads or user fields appear in telemetry | Classification/redaction rules; production-like review | Security + platform |
| R14 | OpenSearch/Valkey operating load or fallback overloads PostgreSQL | Medium | Medium | Evictions, search backlog, fallback DB saturation | Capacity/load tests; bounded fallback; alerts; scaling plan | Platform + technical |
| R15 | One-shipment/manual-courier assumptions do not fit real operations | Medium | High | Need partial fulfillment, COD or courier API during build | Validate D03/D06; scope change and re-estimation | Operations |
| R16 | Release/data migration cannot be rolled back safely after real orders | Low | High | Destructive migration or snapshot rollback plan | Compatible schema path; forward repair; live transaction preservation | Technical + platform |
| R17 | Proposed NFRs are accepted as guarantees without capacity evidence | Medium | Medium | Contract/report uses targets as achieved SLA | Keep target/evidence language; approve and measure D14 | Sponsor + technical |
| R18 | Operating cost or support responsibility is discovered too late | Medium | Medium | No billing owner/budget alerts/on-call coverage | Service inventory, cost dashboard, handover and funding decision | Sponsor + platform |

## Risk update rule

Review risks weekly and at every phase gate. Record changed probability/impact, evidence, action owner/date, and residual risk. Convert an occurring risk into an issue with an immediate owner and forecast impact; do not close it merely because a treatment task started.
