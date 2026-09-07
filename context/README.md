# E-commerce implementation context

**Document set status:** Planning baseline ready for stakeholder review  
**Prepared:** 5 September 2026  
**Implementation status:** B001/B002 foundation evidence available; human acceptance and later capabilities pending  
**Purpose:** Give a product, design, engineering, QA, platform, and operations team one ordered source of context for building Release 1.

This folder translates the discovery and architecture in [`dev/`](../dev/README.md) into small, traceable delivery tasks. It contains plans, specifications, checklists, and working registers only. It does not contain application or infrastructure code and it does not claim that any build task has been completed.

## How to use this folder

Start each development session with [AI-DLC](aidlc/README.md) and [workflow state](aidlc/state.md). The user selected AI-DLC for this project. It connects intent, Units of Work, Bolts, human decisions, verification and persistent handoff to the existing requirements and BUILD/ADAPT tasks. [B001](aidlc/bolts/B001-foundation.md) and [B002](aidlc/bolts/B002-foundation.md) have bounded implementation evidence; human acceptance remains pending.

For backend-only development, start with the [consolidated backend architecture and build guide](../backend/13-consolidated-build-guide.md). It connects the 78-table database design, eight-page backend diagram, commerce data flows and 44 future implementation tasks. Use [backend design context](10-backend-design-context.md) for the current handoff and pending evidence. Frontend development is not required for the local backend sequence.

Read the files in this order before starting work:

| Order | File | Why it exists |
| --- | --- | --- |
| 0 | [AI-DLC entry and execution map](aidlc/README.md) | Identify current authorization, active Unit/Bolt, required context and evidence before selecting work |
| 1 | [Current context](00-current-context.md) | Understand the product boundary, approved direction, assumptions, and present status |
| 2 | [Product blueprint](01-product-blueprint.md) | Understand customers, staff, journeys, pages, policies, and feature behavior |
| 3 | [System blueprint](02-system-blueprint.md) | Understand components, boundaries, integrations, and authority of each data source |
| 4 | [Domain and data rules](03-domain-and-data-rules.md) | Preserve money, stock, order, payment, and refund correctness |
| 5 | [Master build plan](04-master-build-plan.md) | Follow the dependency-based sequence and phase gates |
| 6 | [Task catalog](05-task-catalog.md) | Select the next ready, small, traceable task |
| 7 | [Quality and acceptance](06-quality-and-acceptance.md) | Know how every requirement will be verified and evidenced |
| 8 | [Operations and launch](07-operations-and-launch.md) | Prepare environments, support, migration, release, and recovery |
| 9 | [Context maintenance](08-context-maintenance.md) | Keep this folder accurate as decisions and delivery status change |
| 10 | [Database design context](09-database-design-context.md) | Find the detailed PostgreSQL model, diagrams, development sequence, and open database decisions |
| 11 | [Backend design context](10-backend-design-context.md) | Find the NestJS module, REST, data-flow, worker, security, operations, and backend build plans |
| 12 | [Commerce adaptability](11-commerce-adaptability.md) | Select a profile, distinguish policies from domain extensions and collect only applicable missing inputs |

Use the live registers during delivery:

| Register | Use |
| --- | --- |
| [Status board](registers/status-board.md) | Current phase, work in progress, blockers, and next eligible tasks |
| [Decision log](registers/decision-log.md) | Business and technical decisions, owner, date, reason, and impact |
| [Risk register](registers/risk-register.md) | Active delivery, provider, security, data, and operational risks |
| [Traceability matrix](registers/requirement-traceability.md) | Requirement-to-task-to-evidence coverage |
| [Commerce profiles](registers/commerce-profiles.md) | Selected synthetic profile, disabled model templates and per-input provenance |

Create future backlog items from the [task card template](templates/task-card.md). Do not mark a task complete until its stated evidence exists and has an accountable reviewer.

## Authority and conflict rules

1. Signed commercial or policy decisions outrank planning assumptions.
2. [`dev/Step-2/Stage 2-Requirement Document.md`](<../dev/Step-2/Stage 2-Requirement Document.md>) owns requirement IDs and target outcomes.
3. [`dev/Step-2/Stage 3-Scope Definition.md`](<../dev/Step-2/Stage 3-Scope Definition.md>) owns Release 1 inclusions and exclusions.
4. [`dev/Step-2/Stage 4-Solution Architecture.md`](<../dev/Step-2/Stage 4-Solution Architecture.md>) owns the proposed technical direction and integrity model.
5. This folder owns implementation sequencing, task decomposition, working status, and evidence links.
6. If two documents conflict, stop the affected task, record the conflict in the decision log, and ask the accountable owner to resolve it. Never silently choose the more convenient interpretation.
7. AI-DLC owns lifecycle routing and execution/handoff records. It does not override current user instructions, replace business/schema authority, or turn generated plans into approvals. Reuse authorization already given for unchanged scope.

## Release 1 in one paragraph

Build a responsive, English-language, single-merchant physical-goods store for Bangladesh and BDT. Customers can browse and search, use guest or Auth0-based checkout, pay through SSLCOMMERZ, and view order status. Staff can manage a catalog, one warehouse, stock, orders, one shipment per order, manual courier tracking, cancellations, returns, refunds, content, reports, and reconciliation. The system uses Next.js, NestJS, PostgreSQL, Drizzle, Valkey, OpenSearch, SQS, S3/CloudFront, Auth0, ECS Fargate, RDS, OpenTelemetry/Sentry/CloudWatch, GitHub Actions, and OpenTofu, subject to readiness decisions and compatibility validation.

## Delivery control

- Work on one coherent customer or operator outcome at a time.
- Every task must reference requirement IDs, dependencies, acceptance conditions, and an evidence location.
- PostgreSQL is authoritative for products at checkout, orders, money, and stock. Cache and search are replaceable projections.
- A browser redirect, notification, queue message, cache value, or search document cannot independently authorize fulfillment or financial state.
- Money, inventory, ownership, security, migration, restore, and rollback scenarios are release gates.
- Keep status honest: use `Not started`, `Ready`, `In progress`, `Blocked`, `In review`, or `Done`. Planning text is not completion evidence.

## Backend-only starting path

The [readiness pack](../backend/readiness/README.md) selects technical and synthetic development defaults, corrects model gaps, and provides 44 implementation outcomes. It distinguishes local bootstrap, real sandbox integration and production gates. Missing production policies/accounts block their dependent capabilities rather than all local backend work.

## Current starting point

The planning documents are populated. All implementation tasks remain `Not started`. Full-project scope and delivery commitments depend on the G1 decisions listed in [Current context](00-current-context.md). Independent local backend slices can start with the selected synthetic profile when coding is requested. Before each real integration or cloud environment task, its relevant G2 inputs must be available. Production launch requires the G3 evidence in [Operations and launch](07-operations-and-launch.md).
