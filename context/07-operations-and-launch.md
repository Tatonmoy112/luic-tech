# Operations and launch plan

**Scope:** Environment ownership, observability, routine operations, migration, release, recovery, pilot, and handover.  
**Status:** Planned; no production action has occurred.

## Environment model

AI-DLC Operations receives the accepted Unit/Bolt context, actual release/schema/profile identity and unresolved evidence from Construction. Use [the workflow checkpoints](aidlc/workflow.md) together with this plan's deployment/recovery/launch gates. A coding or documentation instruction does not authorize live payments, production data changes or public launch; any still-required decision must reference the concrete prepared action and evidence. Incidents and observations return as scoped follow-up Bolts with regression and operating checks.

| Environment | Purpose | Data/provider rule | Promotion rule |
| --- | --- | --- | --- |
| Local/development | Fast isolated development and component checks | Synthetic data and mocks/sandbox only | No production credentials or data |
| Shared development | Integration of incomplete work | Synthetic/approved sanitized data; sandbox providers | Automatically deploy reviewed development artifacts as agreed |
| Staging | Release-like acceptance, load, resilience, migration/recovery rehearsal | Representative synthetic/sanitized data; provider sandbox | Immutable candidate promoted after checks |
| Production | Live customer and staff operation | Live merchant/customer data and production provider configuration | Explicit approved release and named observation owner |

Use separate accounts/tenants/configuration where practical. Secrets, Auth0 applications, payment credentials/callbacks, queues, data stores, domains, and observability identity must clearly indicate environment.

## Service ownership inventory

Before production, record for every service: business owner, technical owner, account owner, billing owner, environment, region, tier, configuration source, secret owner/rotation, data classification, backup/recovery, alert/runbook, support route, renewal/cost review, and exit/export procedure.

Services include AWS organization/account, DNS/domain, certificate, CloudFront/WAF/load balancer, ECS/ECR, RDS, Valkey, OpenSearch, SQS, S3, Auth0, SSLCOMMERZ, email provider, GitHub, OpenTofu state, Sentry, and any third-party monitoring/support service.

## Operating dashboards and alerts

| Area | Signals | Action owner |
| --- | --- | --- |
| Customer/API | Availability, request rate, p50/p95/p99 latency, 4xx/5xx, Core Web Vitals | Platform + product |
| Checkout | Attempts, validation failures, completed local transactions, latency, idempotency conflicts | Technical + product |
| Payment | Initiation/validation success, pending/unknown age, late/double/unallocated paid orders | Finance + technical |
| Refund | Requested/approved/submitted/unknown/completed age and balance anomalies | Finance |
| Inventory | Available/reserved/allocated, expiry backlog, negative/impossible positions, adjustments | Operations + technical |
| Fulfillment | Eligible/picking/packed/shipped, aged orders, failed delivery/return-to-origin | Operations |
| Async | Outbox age, queue depth/oldest age, retry and DLQ by work type | Platform + owning domain |
| Search/cache | Search freshness/errors/reindex, Valkey latency/evictions/fallback load | Platform + technical |
| Data services | DB connections, locks, storage, replica/failover/backup; OpenSearch/Valkey health | Platform |
| Security | Auth failures, suspicious ownership/rate events, WAF, secret/config/scan findings | Security + platform |
| Cost | Daily/monthly spend, forecast, unexpected service/resource growth | Billing + platform |

Alerts must have a specific condition, severity, named responder, channel, expected response, escalation, and runbook. Avoid alerts that nobody can act on.

## Routine operating cadence

| Frequency | Activity | Owner |
| --- | --- | --- |
| Continuous | Actionable availability, security, queue, payment and stock alerts | On-call/domain owner |
| Daily | Pending/unknown payment, refund, settlement, stock anomaly, failed notification and aged fulfillment review | Finance + operations |
| Weekly | Release/change review, access exceptions, defects, capacity, cost, dependency risk | Delivery + technical/platform |
| Monthly | Access recertification, restore/backup status, patch/dependency plan, service cost, SLO and incident trends | Platform + owners |
| Quarterly or after material change | Recovery exercise, incident/runbook review, provider/account ownership audit | Sponsor + platform/business owners |

Actual frequency may be tightened during launch/hypercare or changed through an approved decision.

## Required runbooks

- Deployment promotion, observation, halt and compatible rollback/forward repair.
- Database failover, point-in-time restore to clean environment, access/config recovery, and post-restore reconciliation.
- Payment initiation/validation outage, aged unknown attempts, late or double payment, settlement mismatch.
- Refund timeout/unknown/failure and provider status escalation.
- Paid-but-unallocated order resolution.
- Reservation expiry backlog and stock discrepancy investigation/correction.
- SQS/outbox backlog, DLQ inspection, bounded replay, and poison-message handling.
- OpenSearch outage, stale projection, full reindex, validation and alias switch.
- Valkey outage/eviction and bounded fallback protection.
- Auth0 outage or staff access revocation.
- S3/media/CDN outage or unsafe object response.
- Email outage, delivery backlog and customer communication alternative.
- Catalog import validation, rehearsal, final import, reconciliation and safe restart.
- Security incident evidence preservation, containment, access rotation and business escalation.

Each runbook needs triggers, impact, prerequisites, safe checks, ordered actions, stop/escalation conditions, verification, reconciliation, communications owner, evidence, and follow-up.

## Deployment procedure

1. Confirm artifact identity, approved change, requirement/task links, checks and reviewer.
2. Confirm backward-compatible schema/infrastructure path, backup status and forward/rollback procedure.
3. Confirm environment configuration/secrets and production approval if applicable.
4. Promote the same immutable artifact used in staging.
5. Execute automated health/readiness and migration compatibility gates.
6. Execute business smoke checks for browse, auth boundary, cart, checkout-safe boundary, admin and telemetry as appropriate.
7. Observe defined metrics for at least the approved initial window; 30 minutes is the proposed launch baseline.
8. Stop or recover on duplicate money effect, unauthorized access, unexplained stock difference, migration incompatibility, or agreed sustained error/checkout regression.
9. Record result, incidents, reconciliation and next action.

Do not restore an old database snapshot merely to roll back application presentation after live orders exist. Preserve live facts and use the reviewed compatible release or forward-repair plan.

## Backup and recovery procedure

The proposed baseline is encrypted automated database backups with 14-day point-in-time retention, protected snapshots where required, S3 versioning/lifecycle, restorable configuration/state, and access recovery. Business retention approval may change it.

A recovery drill must restore into a clean controlled environment, restore application configuration and access, prove the application starts safely, verify core queries and invariants, identify financial events after the recovery point, replay/reconcile them without duplication, and measure actual RPO/RTO. Multi-AZ failover and a backup's existence do not prove NFR-05.

Release 1 has a regional recovery target but no committed active-active or region-wide disaster target. Cross-region recovery requires separate architecture, cost, and business approval.

## Production data cutover

1. Approve field mapping, source fingerprint, rehearsal result and reconciliation thresholds.
2. Announce source freeze and controlled-delta process.
3. Confirm production importer identity, private source storage, backup, monitoring and rollback/restart procedure.
4. Execute final import job once using stable identity.
5. Review row/file errors without opening sales.
6. Reconcile product, variant, SKU, category, price, publication, media, and opening-stock counts/totals.
7. Resolve or explicitly accept every discrepancy with data/product/operations owners.
8. Record approval and preserve source/mapping/job/evidence according to retention policy.

## Go-live checklist

### Product and content

- P0/P1 requirement evidence accepted; only documented nonblocking exceptions remain.
- Responsive, browser, accessibility, SEO and content review complete.
- Domain, brand, product media/copy, support/contact and approved policies are live.

### Finance and payment

- Production merchant methods, callbacks, validation, queries, refund egress/IPs and support route verified.
- Transaction/refund mapping and reconciliation procedures approved.
- Named finance coverage and authority limits active.

### Operations and data

- Production catalog/opening stock reconciled.
- Fulfillment, tracking, cancellation, return, inspection, refund and support procedures exercised.
- Staff roles, MFA and emergency/revocation process verified.

### Security and reliability

- No unresolved critical/high finding or integrity defect.
- Secrets, workloads, origins, private data, upload/export, rate and audit controls reviewed.
- Load, dependency failure, alert, restore, deployment rollback/repair and queue/search recovery evidence accepted.
- On-call contacts and provider escalation routes tested.

### Release control

- Approved release artifact and infrastructure plan identified.
- Pilot population/SKUs/traffic, observation window, communication and stop criteria defined.
- Every live order/payment will be preserved and reconciled if the pilot stops.
- Sponsor has recorded authorization for the controlled live transaction and pilot.

## Pilot and public launch

Perform one explicitly approved low-value live purchase/refund with finance oversight and reconcile provider, order, payment, refund and stock records. Then open a limited pilot using production integrity controls. Monitor and reconcile every pilot transaction, exception, failed notification, stock movement, service regression and support issue.

Immediate stop/escalation triggers include any duplicate charge/refund, unauthorized access, corrupted order, unexplained stock difference, unsafe migration, or sustained checkout/service regression beyond the approved threshold. A stop preserves and resolves all real transactions; it does not erase them.

The sponsor approves public launch after finance, operations, product, security, platform, data and delivery owners accept their evidence. Expand traffic/campaign exposure gradually and keep a named release observer.

## Hypercare and handover

Use the proposed two-week hypercare period for daily payment/stock/refund/queue/error reconciliation and rapid defect triage. Record support volume and operator workload to guide steady-state staffing and Release 2.

Handover includes account/service inventory, access ownership, architecture/context, repository/build/release process, data dictionary, dashboards/alerts, runbooks, restore/release evidence, payment/refund/settlement procedures, import/reindex/replay procedures, training records, known issues, cost owners, support/on-call contacts, maintenance/patch plan, and remaining backlog.

Exit hypercare only when no launch blocker remains, all unexplained commercial differences are resolved, steady-state owners accept responsibility, and a post-launch review date is scheduled.
