# Backend development readiness

**Updated:** 7 September 2026  
**Scope:** Backend and database preparation; no frontend implementation  
**Evidence:** [B001](../../context/aidlc/bolts/B001-foundation.md) supplies locked local core build/lifecycle/configuration proof, In review. [B002](../../context/aidlc/bolts/B002-foundation.md) adds local PostgreSQL, HTTP and telemetry evidence; real integration, performance and production evidence remain pending.

The earlier readiness assessment was too restrictive: local backend foundations do not require live merchant credentials, final marketing content, all production cloud resources, or every business policy. Development should advance by capability, with unresolved inputs blocking only dependent features.

This pack supplies concrete working decisions for reversible engineering choices and synthetic development behavior. They are architect-selected development defaults under the user's request to resolve the gaps. They do not constitute merchant policy, commercial approval, cloud availability evidence, tested compatibility, or permission to collect real customer data.

## Use these documents in order

Execution follows [AI-DLC](../../context/aidlc/README.md). Read [workflow state](../../context/aidlc/state.md), select the Unit/Bolt, then use the relevant readiness documents below. Local/sandbox/production gates remain capability-specific; AI-DLC does not turn all external-input rows into blockers for local bootstrap or mark a written plan as tested software.

| Document | Outcome |
| --- | --- |
| [Gap register](01-gap-register.md) | Every prior missing input has a disposition, owner role, exact evidence and affected start gate |
| [Development defaults](02-development-defaults.md) | Backend choices, versions policy, resource budgets, security limits and synthetic commerce rules |
| [Contract and model corrections](03-contract-and-model-corrections.md) | Resolve transaction, module, event, API and persistence ambiguities found in the prior design |
| [External evidence checklist](04-external-evidence.md) | Account setup inputs, provider verification and merchant decisions that cannot be fabricated |
| [Backend implementation sequence](05-implementation-sequence.md) | Concrete implementation outcomes and verification, independent of frontend work |
| [Initial API contracts](06-initial-api-contracts.md) | Field bounds, authentication, outputs and error behavior for the first slice and critical commands |
| [Adaptive development plan](08-adaptive-development-plan.md) | Profile-driven treatment of D01-D16, conditional inputs and 16 targeted adaptation tasks |

For different commerce models, first read [commerce profiles and adaptability](../../context/11-commerce-adaptability.md). The selected fictional profile keeps local work concrete. Configurable policies and separately gated domain extensions allow the design to evolve; they do not make every model supported by the current schema.

## Three start gates

| Gate | Required before proceeding | Items that can wait |
| --- | --- | --- |
| L: local synthetic implementation | Scoped coding instruction; compatible local runtime (proved for B001); PostgreSQL for DB-dependent work; documented technical defaults; synthetic inputs | Cloud accounts, live payment access, real catalog, branding, final tax/return policy |
| I: real sandbox integration | Only the relevant nonproduction account, service endpoint, network route, secret access and current provider contract | Other integrations, live credentials, production sizing |
| P: production or real-data operation | Merchant policy, approved deployment account/region/cost, provider live rights, security/load/recovery evidence, named operating owners | Nothing required for the launched capability |

A developer can complete catalog persistence, transaction infrastructure, inventory and API contract tests locally using synthetic identities/provider doubles. These do not count as Auth0, SQS, RDS, SSLCOMMERZ or end-to-end acceptance. Keep simulation visibly isolated and impossible to enable in production.

## Source authority

The project requirement IDs and database invariants remain authoritative. This pack resolves engineering omissions and states synthetic defaults. Its [corrections](03-contract-and-model-corrections.md) explicitly identify changes to older diagrams and proposed schema assumptions. No legacy task, decision or requirement is silently marked approved.

The original [199-task catalog](../11-backend-build-sequence.md) remains a design/refinement inventory. Use the implementation sequence here for future coding work; do not require all 199 rows to finish before creating the first local vertical slice.

## Remaining honest limits

Account access, merchant policies, actual data, staffing, dependency compatibility beyond the B001/B002 local foundation, production service availability and measured capacity remain unverified. They are assigned evidence gates rather than presented as solved facts. No frontend is needed to exercise HTTP contracts, database concurrency or workers; API clients and automated integration tests supply callers for each implemented slice.

## Documentation validation

Local checks verified that Markdown links resolve and table columns are consistent across backend, context and database. Both task catalogs have unique contiguous identifiers: BE-001 through BE-199 and BUILD-001 through BUILD-044. Every explicit task-ID dependency exists and precedes its task. The older catalog's mismatched semantic prerequisites and corrupted dash encoding were corrected. Runtime, concurrency, vendor and production tests remain execution-pending.
