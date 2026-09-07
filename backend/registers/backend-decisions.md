# Backend decision register

**Status values:** Proposed, Approved, Rejected, Superseded, Blocked.  
**Rule:** A proposed design is not an implementation fact until the named reviewers record dated evidence.

| ID | Decision | Proposed position | Status | Owner/reviewer | Needed before |
| --- | --- | --- | --- | --- | --- |
| BA-001 | Backend shape | Modular NestJS monolith; one artifact with separate API/worker startup roles | Proposed | Technical lead + platform | Foundation |
| BA-002 | Internal layering | Interface, application, domain, and infrastructure boundaries per module | Proposed | Technical lead | Module implementation |
| BA-003 | Module ownership | One module owns each aggregate/table lifecycle; no cross-module repository mutation | Proposed | Technical lead + DBA | Module implementation |
| BA-004 | Synchronous collaboration | Exported application contracts inside monolith; avoid circular dependencies | Proposed | Technical lead | Module implementation |
| BA-005 | Asynchronous collaboration | Versioned domain events through transactional outbox and Standard SQS | Proposed | Technical lead + platform | Worker foundation |
| BA-006 | Runtime roles | API, dispatcher, payment, notification, search, file, scheduler/reconciler | Proposed | Technical lead + platform | ECS design |
| BA-007 | Browser/API boundary | Next.js owns secure browser session and mediates Release 1 API calls | Proposed | Security + frontend/backend leads | Auth/API implementation |
| BA-008 | API exposure | Separate public/customer/staff/provider/operations paths and policies | Proposed | Security + platform | Edge/API design |
| BA-009 | API version | REST JSON under path-based `/api/v1`, additive compatibility by default | Proposed | Backend + frontend leads | OpenAPI baseline |
| BA-010 | Error model | One safe problem-details format with stable domain codes/correlation | Proposed | Backend + product | OpenAPI baseline |
| BA-011 | Pagination | Opaque keyset cursor for changing/large lists; bounded page sizes | Proposed | Backend + DBA | Query contracts |
| BA-012 | Staff concurrency | Expected aggregate version through ETag/explicit precondition | Proposed | Backend + product | Admin APIs |
| BA-013 | Idempotency | Scoped actor/surface/operation/key plus canonical payload hash and stored outcome | Proposed | Backend + security | Commerce commands |
| BA-014 | Transaction ownership | Application use case owns explicit unit of work; repositories do not hide nested commits | Proposed | Backend + DBA | Persistence foundation |
| BA-015 | Remote calls | No network call inside DB transaction; intent/result/evidence split around call | Proposed | Backend + DBA | Integrations |
| BA-016 | Database retries | Retry whole idempotent unit only for classified transient local errors within deadline | Proposed | Backend + DBA | Persistence foundation |
| BA-017 | Payment callback | Durable redacted receipt then SSLCOMMERZ server validation; browser return has no authority | Proposed | Finance + security + backend | Payment implementation |
| BA-018 | Financial unknown | Query/reconcile unknown session/payment/refund outcome before repeating effect | Proposed | Finance + backend | Payment implementation |
| BA-019 | Queue topology | Separate payment, refund, search, notification, import, export, and maintenance work classes | Proposed | Platform + backend | Queue provisioning |
| BA-020 | Consumer dedupe | Durable consumer receipt with local effect; provider attempts use stored outcome/reconciliation | Proposed | Backend + DBA | Worker implementation |
| BA-021 | Event payload | Bounded safe IDs/facts; consumers reload authority; no secrets/raw PII | Proposed | Security + backend | Event schemas |
| BA-022 | Cache | Valkey read acceleration/rate support only with TTL, version, fallback, and load limits | Proposed | Backend + platform | Cache implementation |
| BA-023 | Search projection | Full product document reload, aggregate version guard, alias-based reindex | Proposed | Backend + search owner | Search implementation |
| BA-024 | Authentication | Validate Auth0 signature/issuer/audience/time/claims then map to active app account | Proposed | Security + backend | Identity implementation |
| BA-025 | Authorization | App permission plus ownership/scope/state/threshold/separation on each command/query | Proposed | Product + security | Protected APIs |
| BA-026 | Grant revocation freshness | Short bounded cache; sensitive actions can require authoritative refresh; failure never allows | Blocked | Security + product | Staff authorization |
| BA-027 | Guest access | Hashed high-entropy expiring/revocable capability with masked response and rate limit | Proposed | Security + product | Guest order access |
| BA-028 | Upload/download | Private S3 objects with bounded grants; upload requires inspection and explicit approval | Proposed | Security + backend | Media/file APIs |
| BA-029 | Telemetry | OpenTelemetry correlation, CloudWatch operations, Sentry errors, strict low-cardinality redaction | Proposed | Platform + security | Platform foundation |
| BA-030 | Health | Shallow liveness and role-specific readiness; dependency dashboards separate | Proposed | Platform + backend | ECS deployment |
| BA-031 | Configuration | Runtime-role validated schema; secrets external, separate by environment, never logged | Proposed | Platform + security | Environment deployment |
| BA-032 | Database connections | Explicit role budgets and reserved operational capacity; worker concurrency capped by pool | Blocked | DBA + platform | Load/sizing |
| BA-033 | Provider client policies | Each adapter declares timeout, retry, idempotency, unknown outcome, redaction, and rate | Proposed | Backend + integration owner | Integrations |
| BA-034 | Import application | Validate/dry-run, approve, bounded idempotent row application, checkpoint/reconcile | Proposed | Data owner + backend | Migration/import |
| BA-035 | Exports | Async bounded job to private expiring object; permission and audit at request/download | Proposed | Product + security | Reporting |
| BA-036 | Scheduling | External trigger plus durable run/lease/checkpoint and per-candidate guarded transaction | Proposed | Platform + backend | Scheduled jobs |
| BA-037 | Deploy artifact | Build once and promote immutable image digest; role selected by validated configuration | Proposed | Platform | CI/CD |
| BA-038 | Migration compatibility | Runtime declares compatible schema range; expand/switch/contract across releases | Proposed | Backend + DBA | First deployment |
| BA-039 | Service split | Split only for measured scaling, isolation, ownership, release, or availability need | Proposed | Architecture board | Future review |
| BA-040 | Exact dependency versions | Set through D09 compatibility spike and lockfile/SBOM evidence | Blocked | Technical lead | Foundation commitment |

## Readiness refinement record

The user requested closure of development gaps on 6 September 2026. The [readiness pack](../readiness/README.md) records concrete architect-selected development defaults while preserving the distinction from stakeholder approval and executed evidence.

- BA-026 now has a specified development policy: authoritative checks on sensitive staff commands and at most 30-second read-grant cache. Production revocation acceptance is still unverified.
- BA-032 now has local pools and a staging/surge capacity equation. Production capacity remains unmeasured.
- BA-040 now has a Linux runtime/client selection and exact-version bootstrap procedure. Exact executable pins and compatibility results remain pending.
- BA-004/014 use a top-level commerce coordinator to avoid Payment/Order module import cycles.
- BA-005/019/020 use per-destination outbox delivery records for fan-out; lease expiry does not prove a financial effect is safe to repeat.
- BA-023 uses per-product/index projection generations instead of comparing unrelated source aggregate versions.
- BA-036 uses proposed workflow job storage with fenced claims; the original schema lacked this record.

These scoped refinements are detailed in [C01–C09](../readiness/03-contract-and-model-corrections.md). Existing Proposed/Blocked statuses mean external or acceptance evidence is still pending, not that the default has no design.

## Relationship to existing decisions

The 6 September consolidation is recorded in the [build guide](../13-consolidated-build-guide.md), updated module/flow documents and diagrams. The dictionary and ERD now include all 78 proposed tables. BA-004/014 coordinator direction, BA-005/019/020 per-destination delivery and BA-023 projection generations are integrated logical decisions. The synthetic expiry policy explicitly releases due unallocated inventory while preserving an order uncertainty hold; definitive verification can resolve only that hold. No merchant approval, compatibility result or implemented schema is implied.

BA-001, BA-005, BA-006, BA-019, and BA-039 refine A01/A04. BA-022 and BA-023 refine A03. BA-017/018 refine D05 and database T04/T08/T09. BA-024–BA-027 refine D04. BA-032/040 depend on D02/D08/D09/D14. Any change to D01–D07, multi-warehouse, COD, split shipment, marketplace, currency, or provider choice requires a backend impact review rather than an isolated route edit.

## BA-041: Typed policy releases and capability gates

**Status:** Proposed; implements the design direction of A06 only after future coding and acceptance. **Owners:** Technical lead and domain policy owners. [Configurable commerce](../14-configurable-commerce.md) defines atomic release selection, immutable accepted terms, current safety guards, provider binding and supported-strategy evaluation. Generic scripts and feature flags cannot enable absent domains. Candidate persistence and the checkout lock-tier change must be integrated into the canonical database design before adaptive implementation. Revisit when selecting another business model or adding policy scope/algorithm types.

## Decision evidence format

### BA-031/040 bounded B001 evidence, 7 September 2026

Under AUTH-004, Codex implemented and self-reviewed the [B001 core](../../context/aidlc/bolts/B001-foundation.md): exact Node/Nest/Express/CommonJS pins, strict build, locked dependency graph, local/test role configuration and safe startup diagnostics. The linked manifest supplies dependency integrity and artifact identity; Windows and Linux verification results are recorded there. This retains the documented Nest 11 candidate, uses TypeScript 5.9.3/Jest 30.5.1 and defers clients until their capability is built. Full BA-031 deployment/secret lifecycle and BA-040/D09 database/auth/telemetry/native-provider compatibility remain pending; no human decision row is silently approved. Revisit pins on dependency/advisory changes and extend configuration with each authorized role/capability.

Record date, approver, context, evaluated options, exact selected behavior, provider/version/load evidence, affected modules/APIs/events/tables, rollout/compatibility effect, consequences, and revisit trigger. Preserve superseded rows and link the replacement.

### BA-031/040 bounded B002 evidence, 7 September 2026

AUTH-005 adds [B002](../../context/aidlc/bolts/B002-foundation.md) configuration version 2, local PostgreSQL/Drizzle compatibility and local OTel/Sentry behavior. The exact pins, esbuild override and declaration-check limitation are recorded in the Bolt/manifest. Database configuration is fixed to loopback and environment/runtime-specific names/logins. Full deployment secret lifecycle, auth/native/provider compatibility and human architecture acceptance remain pending; earlier B001 limitations are historical.
