# Production e-commerce planning pack

**Status:** Proposed planning baseline, version 1.0

**Prepared:** 5 September 2026

**Purpose:** Turn the existing discovery and proposal outlines into an actionable product, architecture, commercial, and delivery plan. This pack contains documentation only; no application, infrastructure, or deployment has been created.

Detailed continuation packs are maintained in [`context/`](../context/README.md), [`database/`](../database/README.md), and [`backend/`](../backend/README.md). They preserve this pack's requirement, scope, and architecture authority while adding implementation sequencing and specialist design detail.

## What the local review found

The repository contained 23 documents under Step-1 and Step-2. Most were short meeting prompts; the weekly delivery cycle was empty. Architecture examples mentioned Supabase and Vercel, which did not match the supplied stack. This revision preserves all original paths, including the extensionless business discovery file, and fills their intended roles.

## Reading order and document ownership

| Sequence | Documents | Outcome | Accountable role |
| --- | --- | --- | --- |
| 1 | Step-1, Phases 1-10 | Business evidence, requirements, constraints, decision makers | Product manager |
| 2 | [Meeting deliverables](<Step-1/Deliverables After Meeting.md>) | Discovery handoff and unresolved decisions | Product manager |
| 3 | [Internal analysis](<Step-2/Stage 1-Internal Analysis.md>) | Feasibility and risk assessment | Technical lead |
| 4 | [Requirements](<Step-2/Stage 2-Requirement Document.md>) and [scope](<Step-2/Stage 3-Scope Definition.md>) | Traceable release baseline and acceptance conditions | Product owner |
| 5 | [Architecture](<Step-2/Stage 4-Solution Architecture.md>) | System boundaries, data integrity, security, operations | Technical lead |
| 6 | [Estimation](<Step-2/Stage 5-Effort Estimation.md>) and [proposal](<Step-2/Stage 6-Commercial Proposal.md>) | Capacity, sequencing, and commercial model | Delivery manager |
| 7 | Stages 7-9 | Review, negotiation, and agreement checklist | Sponsor |
| 8 | [Kickoff](<Step-2/Stage 10-Project Kickoff.md>) and [weekly delivery](<Step-2/Stage 11-Weekly Delivery Cycle.md>) | Future execution and release governance | Delivery manager |
| 9 | [Thinking ahead](<Step-2/Thinking About Next.md>) | Post-launch improvement and reuse decisions | Product owner |

Step-1 means discovery. Step-2 means analysis through delivery planning. Release 1 and Release 2 mean product releases; they are not folder names. Relative project weeks begin only after commercial and readiness gates are met.

## Confirmed inputs and proposed baseline

**Confirmed:** Custom production-grade e-commerce; documentation-only work; the supplied technology families and named major versions.

**Proposed business baseline:** One merchant selling physical goods in Bangladesh, BDT checkout, one stock location, responsive website and admin console, guest and authenticated checkout, SSLCOMMERZ hosted payments, and manual courier booking with tracking entry. These are assumptions for planning, not facts about the business.

**Proposed technology baseline:** Next.js 16, React, TypeScript, Tailwind CSS, shadcn/ui; NestJS on Node.js 24 LTS; REST/OpenAPI; PostgreSQL 18 through Drizzle; managed Valkey 9.x with GLIDE subject to compatibility verification; OpenSearch; SQS; S3; CloudFront; Auth0; ECS Fargate; RDS PostgreSQL Multi-AZ; Sentry, OpenTelemetry, CloudWatch; GitHub Actions; OpenTofu.

The first supplied stack table controls the launch direction. Alternatives from the second table are evaluated in architecture rather than treated as simultaneous requirements. Aurora, Cloudflare, Elasticsearch, RabbitMQ, Kafka, Kubernetes, and Terraform remain alternatives requiring a recorded reason and impact review.

## Assumption and decision register

Every entry below is open unless explicitly marked confirmed. Owners are proposed roles; no person has been appointed. Resolve G1 items before scope approval, G2 before delivery kickoff, and G3 before production launch.

| ID | Working assumption or missing decision | Owner | Due | Impact if different |
| --- | --- | --- | --- | --- |
| D01 | Single merchant; physical goods; Bangladesh; BDT; English launch UI | Sponsor | G1 | Marketplace, digital goods, languages, or cross-border sales require re-estimation |
| D02 | Up to 10,000 sellable SKUs, 1,000 orders/day, 100 dynamic requests/second peak | Product + technical lead | G1 | These are sizing scenarios, not measured traffic or capacity promises |
| D03 | One stock location; no backorders, split shipments, or preorders | Operations | G1 | Changes inventory and fulfillment rules |
| D04 | Guest checkout and Auth0 email-based customer login; admin MFA | Product + security lead | G1 | Phone OTP, social login, and identity migration add dependencies |
| D05 | SSLCOMMERZ merchant approval, enabled methods, refund access, and settlement terms unknown | Finance | G2 | Payment launch blocker; no direct wallet integration assumed |
| D06 | Manual courier booking and shipment tracking entry; COD excluded initially | Operations | G1 | Courier API or COD requires explicit extra scope |
| D07 | Returns window, cancellation cutoff, tax treatment, invoice fields, and refund authority unknown | Finance + operations | G1 | Business policy and acceptance blocker |
| D08 | AWS region undecided; verify latency, residency, service versions, availability, and recovery costs | Technical + business leads | G2 | Hosting and operating cost baseline remains provisional |
| D09 | Next.js/NestJS/Auth0/Drizzle/GLIDE versions and runtime compatibility need a future validation gate | Technical lead | G2 | Pin supported patches; never infer compatibility from major numbers alone |
| D10 | Import allowance: one agreed product CSV, up to 10,000 SKUs; no historical order or password migration | Product + data owner | G1 | Extra sources and cleanup need re-estimation |
| D11 | Transactional email provider, sender domain, and support mailbox unselected; SMS excluded | Product + operations | G2 | Notification readiness dependency |
| D12 | Business budget, rates, team allocation, start date, and campaign deadline unknown | Sponsor + delivery manager | G1 | No binding quotation or calendar launch date |
| D13 | Privacy, retention, accessibility, and consumer policy approval required; no compliance certification asserted | Business policy owner | G3 | Policies must be approved before collecting production data |
| D14 | Proposed service targets in BRD require capacity and recovery evidence | Sponsor + technical lead | G2 | Targets are not an SLA or verified performance |
| D15 | Domain, branding, product copy, images, and support hours unconfirmed | Product + operations | G2 | Content and operational launch dependencies |
| D16 | Platform accounts owned by merchant; agency gets delegated access | Sponsor | G2 | Ownership and handover need agreement |

## Control rules

AI-DLC is the selected delivery process. Use [its entry point](../context/aidlc/README.md) and [Unit/Bolt map](../context/aidlc/execution-map.md) to apply these discovery, scope and commercial inputs to the next bounded outcome. Preserve this pack's authority and weekly governance while executing short, verified Bolts. Current work is documentation-only; the AI-DLC adoption does not approve commercial assumptions, start code or promise a faster calendar delivery date.

- The requirement IDs in Stage 2 are authoritative for traceability; Stage 3 assigns release scope.
- Stage 4 owns system decisions. Stage 5 owns effort and schedule assumptions. Stage 6 owns the proposed pricing method.
- Mark decisions as proposed, approved, rejected, or superseded, with date, owner, evidence, and affected documents. Do not silently turn assumptions into approved requirements.
- The next stakeholder discussion should resolve D01-D07, D10, and D12 first. Missing answers do not prevent useful planning, but prevent a reliable fixed commitment.
- Vendor links in architecture were checked on the preparation date. Recheck versions, regional availability, prices, and merchant-specific capabilities before procurement.
