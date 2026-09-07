# Phase 7: Technical discovery

**Owner:** Technical lead. **Input:** Supplied stack and business assumptions. **Output:** Compatibility, integration, migration, and operational constraints.

## Technology direction

Use the proposed stack and alternative decisions in [Stage 4 architecture](<../Step-2/Stage 4-Solution Architecture.md>). This stage does not select a replacement platform. There is no existing application in the inspected repository; it contains planning documents only.

| Discovery area | Required evidence | Decision or risk |
| --- | --- | --- |
| Existing website and domain | Ownership, DNS access, URLs, redirects, analytics baseline | SEO preservation and cutover |
| ERP/POS/inventory tools | System owner, data dictionary, export sample, documented API and limits | No live integration included unless explicitly added |
| Product data | Redacted sample CSV, SKU uniqueness, variants, prices, stock, image rights | One source and up to 10,000 SKUs assumed |
| Payments | Merchant account, sandbox access, enabled channels, refunds and settlement sample | SSLCOMMERZ onboarding dependency |
| Identity | Auth0 tenant ownership, login methods, admin roles, customer migration constraints | No password migration assumed |
| Shipping | Courier, zone tables, tracking formats, pickup and exception procedures | Manual booking baseline |
| Notifications | Sender domain access, provider, bounce handling, support inbox | Transactional email provider remains open |
| AWS | Account ownership, target region, service availability, quotas, monthly ceiling | Production topology and cost validation |
| Delivery tooling | Repository ownership, environments, deployment approvers | GitHub Actions and OpenTofu proposed |
| Policy | Approved data retention, processor/residency requirements, business terms | Review before production use |

## Future compatibility validation gate

Before implementation dependency selection, record exact compatible patches for Next.js 16/React, NestJS, Node.js 24, TypeScript, Drizzle driver/tooling, Auth0 SDK, Tailwind/shadcn, Valkey GLIDE and Valkey 9.x, OpenSearch server/client, and the OpenTofu AWS provider. Include runtime architecture, module-format requirements, support lifecycle, security advisories, and license review.

Vendor support and managed service availability are different questions. Verify the chosen AWS region and service mode, including RDS PostgreSQL 18 and ElastiCache Valkey 9.x. Official references and reviewed facts are in Stage 4; no compatibility test has been executed in this documentation task.

## Capacity inputs to collect

Catalog/variant count, image count and size, daily/peak orders, dynamic request rate, simultaneous checkouts, active customers, retention, export size, promotional burst length, and anticipated growth. D02 is an illustrative test envelope, not observed demand.

## Migration discovery

Establish a single owner for source data and a freeze/delta process. Plan sample validation, duplicate SKU handling, currency/price checks, image mapping, stock reconciliation, rehearsal, signoff, and rollback. Imported opening stock requires a physical or otherwise approved count. Reject invalid rows with an actionable report; do not silently repair uncertain prices or stock.

Native mobile applications are excluded from launch. REST/OpenAPI supports future integration planning, but does not imply mobile delivery or unrestricted public API access.

Complete when external owners and dependencies are recorded, data samples are assessed, and unresolved version/region decisions have a due gate.
