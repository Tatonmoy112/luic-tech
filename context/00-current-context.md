# Current project context

**Snapshot date:** 5 September 2026  
**Lifecycle state:** Local B001/B002 Construction, human acceptance pending; broader product governance pre-kickoff  
**Release:** Proposed Release 1  
**Delivery forecast:** 18–22 relative weeks after a ready kickoff  
**Effort allowance:** 408–519 person-days including the documented 20% contingency

## Confirmed intent

**AI-DLC update, 7 September 2026:** The user requires AI-DLC throughout development and authorized B001 under AUTH-004 and B002 under AUTH-005. [Workflow state](aidlc/state.md) owns current scope and next work; [the execution map](aidlc/execution-map.md) covers all BUILD/ADAPT tasks. B001 supplies core evidence; B002 extends HTTP, local PostgreSQL and telemetry. Current results and human review status are recorded in state. No merchant policy or human acceptance is inferred.

The client wants a custom, production-grade e-commerce system and has selected the technology families listed below. [B001](aidlc/bolts/B001-foundation.md) now supplies bounded local source and tests. B002 adds ownership-schema migrations; domain commerce, cloud provisioning, merchant integration and launch remain unimplemented.

## Proposed product boundary

| Area | Release 1 baseline |
| --- | --- |
| Commercial model | One merchant selling physical goods |
| Market | Bangladesh, BDT, English interface |
| Channels | Responsive storefront and staff administration console |
| Catalog | Up to 10,000 sellable SKUs for the planning load profile |
| Stock | One location; no backorders, preorders, or split shipments |
| Customer access | Guest checkout and Auth0 email-based account access |
| Payment | SSLCOMMERZ hosted payment; provider validation and reconciliation |
| Shipping | Delivery zones and charges; manual courier booking/tracking entry |
| Operations | Catalog, stock, orders, fulfillment, return/refund, reports, audit |
| Import | One agreed product CSV and opening stock source |
| Later candidates | Bangla, COD, courier API, loyalty, reviews, wishlists, advanced promotion |

These are working assumptions until the relevant owners approve them.

**Adaptability update, 6 September 2026; implementation boundary updated 7 September:** These assumptions identify [DEV-PHYSICAL-BD revision 1](registers/commerce-profiles.md), the selected synthetic starting profile. [Commerce adaptability](11-commerce-adaptability.md) defines versioned policies and separate extensions for other goods, fulfillment, buyer and payment models. B001 validates only the selected profile identity and local environment; alternative models, policy behavior and real evidence remain pending. The original full-project forecast is not a forecast for these optional extensions or backend-only delivery.

## Proposed system direction

| Concern | Direction |
| --- | --- |
| Application shape | Modular NestJS monolith, separate Next.js web, API, and workers |
| Transaction authority | PostgreSQL 18 on RDS Multi-AZ through explicit Drizzle transactions |
| Cache | Managed Valkey 9.x; disposable acceleration only |
| Search | Amazon OpenSearch product projection; checkout revalidates against PostgreSQL |
| Async work | SQS Standard queues, dead-letter queues, transactional outbox, duplicate-safe consumers |
| Media | Private S3 origin and CloudFront distribution |
| Identity | Auth0 authentication; application-owned roles and record authorization |
| Compute | ECS Fargate behind the approved AWS edge/load-balancing path |
| Observability | OpenTelemetry correlations, CloudWatch operations, Sentry errors |
| Delivery/IaC | GitHub Actions and OpenTofu with reviewed, staged promotion |

Alternatives in the original stack list are not simultaneous requirements. Aurora, Cloudflare, Elasticsearch, RabbitMQ, Kafka, Kubernetes, and Terraform need a recorded replacement decision.

## Required business decisions before scope lock: G1

| ID | Decision needed | Accountable owner | Tasks affected |
| --- | --- | --- | --- |
| D01 | Confirm merchant model, goods type, country, currency, and launch languages | Sponsor | All product tasks |
| D02 | Confirm SKU/order/traffic sizing assumptions and seasonal peaks | Product + technical lead | Capacity, search, performance |
| D03 | Confirm warehouse count, oversell policy, preorder/backorder, and shipment rules | Operations | Inventory, checkout, fulfillment |
| D04 | Confirm guest/login methods, customer identity fields, and admin MFA | Product + security | Identity, checkout, admin |
| D06 | Confirm courier process, zones, pricing, delivery status, and COD exclusion | Operations | Checkout, fulfillment, reports |
| D07 | Confirm cancellation, return, tax, invoice, refund, and restock policies | Finance + operations | Orders, payments, returns, reports |
| D10 | Confirm import source, ownership, size, quality, and historical-data exclusion | Product + data owner | Migration, catalog |
| D12 | Confirm budget, team, rates, timing, campaign deadline, and approval authority | Sponsor | Roadmap and commitment |

## Required readiness decisions before integration/build commitment: G2

| ID | Readiness item | Accountable owner | Required evidence |
| --- | --- | --- | --- |
| D05 | SSLCOMMERZ merchant capability, sandbox/live access, refund rights, settlement terms | Finance | Merchant/provider confirmation and sandbox plan |
| D08 | AWS region, service/version availability, latency, residency, and cost | Technical + business leads | Recorded region assessment |
| D09 | Exact supported patch versions and client/runtime compatibility | Technical lead | Compatibility matrix and short validation record |
| D11 | Transactional email provider, sender domain, support mailbox | Product + operations | Provider/account ownership and sending plan |
| D14 | Proposed availability, performance, freshness, accessibility, recovery targets | Sponsor + technical lead | Approved measurable targets |
| D15 | Domain, brand, product copy/media, policy content, and support hours | Product + operations | Asset/content readiness plan |
| D16 | Merchant ownership and delegated access for platform accounts | Sponsor | Named account owners and access model |

## Required approvals before production launch: G3

- Approved privacy, retention, accessibility, consumer, returns, cancellation, shipping, and refund policies.
- Production merchant configuration, controlled refund egress, settlement and reconciliation procedures.
- Final catalog/opening-stock reconciliation and approved content.
- Requirement acceptance evidence and no unresolved critical/high release blockers.
- Security, load, accessibility, cache/search loss, queue recovery, database restore, and deployment rollback evidence.
- Named operations, finance, support, incident, release, and cost owners.
- Sponsor-recorded pilot and public-launch decisions.

## Nonfunctional planning targets

These are proposed targets and are neither measured results nor contractual SLAs.

| ID | Target summary |
| --- | --- |
| NFR-01 | 99.9% monthly availability for the first-party storefront/API |
| NFR-02 | Read API p95 at or below 400 ms; local checkout transaction at or below 1 second under the agreed model |
| NFR-03 | Core Web Vitals: LCP 2.5 s, INP 200 ms, CLS 0.1 at p75 |
| NFR-04 | Search freshness p95 at or below 60 seconds; alert when oldest pending update exceeds 5 minutes |
| NFR-05 | Regional recovery RPO at or below 5 minutes and RTO at or below 60 minutes |
| NFR-06 | WCAG 2.2 AA target for critical journeys |
| NFR-07 | No unresolved critical/high security findings at launch |
| NFR-08 | No duplicate financial effect, unauthorized order access, or negative available stock from checkout |
| NFR-09 | Orders and transactions remain correct when cache/search are unavailable |

## People required for delivery

The proposed continuing team is 6.0 FTE plus 0.5 FTE design support during the first eight weeks: technical lead, two backend engineers, 1.5 frontend engineers, QA engineer, half-time platform engineer, half-time product/delivery manager, and early half-time product designer. Names and actual availability have not been supplied.

## Context a contributor must never assume

- That a proposal or unchecked box is approved or implemented.
- That payment success follows from a browser return or unverified notification.
- That stock displayed in search or cache is the checkout authority.
- That SQS delivers exactly once or that external providers make unknown outcomes safe to retry.
- That Auth0 roles alone enforce commerce record ownership.
- That a backup proves the recovery target.
- That a major version combination is compatible without exact-version evidence.
- That policy, tax, retention, refund timing, service cost, or legal language can be invented by the delivery team.
