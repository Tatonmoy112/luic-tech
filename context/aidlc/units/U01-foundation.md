# U01: Backend foundations

**Unit state:** In progress; B001 In review, B002 In review under AUTH-005. **Intent:** INT-001.  
**Scope:** BUILD-001 through BUILD-006. **Profile:** DEV-PHYSICAL-BD revision 1, synthetic-only.  
**Execution owner/reviewer:** Codex implements and performs AI self-review under AUTH-004 (B001) and AUTH-005 (B002). Human acceptance remains pending; no independent reviewer or user role is inferred.

## Intended outcome and context

Produce a reproducible local backend foundation that later identity/catalog Units can use. This Unit proves runtime/configuration, HTTP context, database transactions and basic operational signals; it does not certify any real provider or commerce workflow.

Read [development defaults](../../../backend/readiness/02-development-defaults.md), [implementation sequence](../../../backend/readiness/05-implementation-sequence.md), [runtime architecture](../../../backend/02-runtime-architecture.md), [configuration design](../../../backend/10-configuration-deployment.md) and [database migration plan](../../../database/06-environments-and-migrations.md). Preserve existing uncommitted documentation. No frontend or production account is required.

Requirements traced by this foundation: OPS-01 and SEC-01; NFR-08/NFR-09 provide downstream integrity constraints, not accepted outcomes in this Unit. Read the [requirement register](../../registers/requirement-traceability.md) before assigning exact acceptance to later tasks.

## B001: Core compatibility, workspace and configuration

| Field | Prepared plan |
| --- | --- |
| Parent tasks | BUILD-001, BUILD-002, BUILD-003 |
| Goal | A locked compatible core can build and start the API and worker roles independently with validated local configuration |
| Authorization | AUTH-004 explicitly authorizes B001 implementation and verification using local synthetic data |
| Inputs available | Proposed stack/paths, synthetic profile, role/configuration and safety requirements |
| Inputs verified | Pinned Node/Nest/Express/CommonJS core built on Windows and Linux; dependency tree, role lifecycle and negative configuration tests passed; exact evidence in B001 record |
| Conditional work | Optional provider clients pinned/proved with their own integrations; no GLIDE/cloud success assumed from core build |
| Stage selection | Run intent/context, core compatibility, role/configuration design, implementation and relevant verification after authorization; omit frontend design, nonexistent-code reverse engineering, cloud provisioning and domain transaction tests because this Bolt does not deliver those capabilities |
| Excluded | Domain APIs, full migration/model implementation, actual queue processing, Auth0/payment connections, frontend, cloud provisioning and real data |
| Relevant adaptation | Record ADAPT-001 profile provenance; ADAPT-002 capability contract planning only unless explicitly included in this Bolt's implementation scope |
| Confidence question | Can the selected core runtime/module format build and boot both bounded roles without incompatible peers or unsafe configuration defaults? |
| Evidence location | [B001 execution record](../bolts/B001-foundation.md) and [artifact manifest](../evidence/B001-manifest.json); human acceptance pending |

### Authorized execution substeps (B001 evidence ready)

1. Inspect workspace/tool availability and preserve changes. Select exact compatible core pins from the documented candidate stack; record a reviewed change if the candidates fail compatibility.
2. Establish the minimal API/worker workspace and module composition needed to perform clean locked install/build/boot checks. BUILD-001/002 share this limited compatibility probe inside the Bolt; a package list alone cannot satisfy BUILD-001.
3. Add role/environment configuration with required-field validation and local synthetic safeguards. A worker smoke process demonstrates startup/shutdown only; it must not claim real queue-consumer behavior.
4. Verify clean install/build, both roles starting/stopping, invalid/missing configuration rejection, synthetic composition rejected outside allowed environments and absence of exposed secret values.
5. Review the actual diff and record exact versions/OS/architecture, commands/results, remaining optional-client checks and any design changes. Update the B001 record, parent tasks and handoff without marking unfinished tasks complete.

### Acceptance scenarios (observed results in B001 record)

| Scenario | Required observed result |
| --- | --- |
| Clean locked core installation/build | Reproducible success; exact runtime/package versions captured; no unresolved incompatible core peers |
| API startup and shutdown | Expected bounded listener/process lifecycle; no business endpoint acceptance implied |
| Worker startup and shutdown | Independent role composition; no unintended provider calls or claim of consumed work |
| Missing required configuration | Fails startup with safe key-level diagnostic |
| Synthetic identity/payment mode selected outside allowed local/test composition | Startup/configuration rejection before any real operation |
| Secret supplied for validation test | Value absent from output/logs and never committed as a fixture |
| Review and traceability | Changed artifacts linked to BUILD-001/002/003, reviewer type/date and unresolved evidence visible |

### B001 handoff to B002

Record compatible pins, module-format choice, runtime/image identity if used, paths actually created, role start/stop behavior, configuration keys without values, checks performed and limitations. B002 then creates and proves the PostgreSQL/HTTP/telemetry foundation. B001 cannot close BUILD-005 or claim that the 78-table database exists.

### Resume readiness record: 7 September 2026 (historical, before AUTH-004)

**Scope and review:** INT-001 / U01 / B001, AUTH-003 and AUD-005 in [audit](../audit.md). AI inspection and self-review only. The user requested continuation within existing authorization; documentation and read-only readiness checks are authorized. Construction, named implementation responsibility and human acceptance remain pending. DEV-PHYSICAL-BD revision 1 remains the selected synthetic fixture; no profile, schema or dependency baseline changed.

**Last completed work:** AI-DLC documentation integration, 12-Unit mapping and B001 plan, recorded in AUD-003/004. Actual workspace inspection agrees: 93 Markdown files, one extensionless discovery document and two Draw.io diagrams; no application, package manifest, lockfile, migration, infrastructure or executable configuration artifact. Git HEAD is `aec6f89`; the starting working tree contains 23 modified tracked discovery/planning files and 73 untracked documentation/diagram files. These existing changes are the baseline to preserve, not evidence of a new implementation.

**Bounded work completed this session:** Reconcile that baseline, inspect available host tools, distinguish immediate B001 prerequisites from later capability gates, and update the task/traceability/status handoff. No install, build, process boot, container start, migration or application test ran.

| Check on Windows NT 10.0.26200.0 / X64 | Expected evidence | Observed result | Limit / next action |
| --- | --- | --- | --- |
| `node --version` | Installed host runtime version | Exit 0; `v24.19.0` | Host inventory only; no Linux runtime or supported/secure dependency baseline accepted |
| `npm.cmd --version` | Installed host package-manager version | Exit 0; `11.17.0` | No packages installed or lockfile created |
| `docker --version` | Docker CLI availability | Exit 0; CLI `29.7.2`, build `a7dcaa6`; sandbox config-access warning | CLI version does not establish engine availability |
| `wsl --list --verbose` | Registered distribution and state | Sandbox access denied; read-only retry outside sandbox listed only `docker-desktop`, Stopped, WSL 2 | No general-purpose development distribution listed; Linux execution remains unproved |
| `docker version --format '{{.Server.Version}}'` | Reachable server version | Exit 1 inside and outside sandbox; engine pipe not found; outside sandbox target was `dockerDesktopLinuxEngine` | Engine unreachable at check time; no server version observed; establish runtime during authorized bootstrap |
| `Get-Command` for `psql` | Discover PostgreSQL CLI on PATH | No command found | Does not prove PostgreSQL absent elsewhere; no DB connection attempted; real local DB proof belongs to B002 |

The combined outside-sandbox inspection ended with exit 1 from Docker; WSL returned the distribution listing above. Its permission scope was read-only host inspection, not authorization to start/install services or implement B001. No secret values or Docker configuration contents were read into the record.

| Task / input | Current evidence and dependency | Remaining work |
| --- | --- | --- |
| BUILD-001 | Plan and host inventory only; no predecessor BUILD task | With coding authorization, establish the execution environment, review current supported core versions/peers, select pins and prove locked install/build/boot; D09 and BA-040 remain pending |
| BUILD-002 | Proposed paths and dependency rules; depends on BUILD-001 | Create and verify API/worker composition after compatibility selection; small compatibility probe may span BUILD-001/002 as already planned |
| BUILD-003 | Role/environment configuration and negative cases specified; depends on BUILD-002 | Implement required-field validation and synthetic guards, then observe rejection and secret-safe diagnostics |
| ADAPT-001 / ADAPT-002 | Existing profile provenance and capability design are planning inputs only | No new runtime capability scope selected; parent task acceptance/enforcement remains pending |
| B002 / BUILD-004/005/006 | Depends on accepted B001 environment and relevant BUILD-003/004/005 outcomes | Plan exact commands after B001 evidence; prove PostgreSQL transactions, HTTP and telemetry in that Bolt |
| Real merchant/provider/production facts | D01-D16 remain proposed, unknown or evidence-pending in their owning registers | Collect only for the dependent capability; accounts, tax decisions and release ownership do not block B001 local composition |

**Pending decisions:** A scoped B001 implementation instruction is the next scope decision. Record actual execution responsibility at start and identify the human acceptance reviewer without assigning the user a role by inference. Exact runtime/package pins, module-format confirmation and runtime setup remain technical bootstrap decisions; the installed host versions do not settle them. No new merchant decision is necessary for this synthetic Bolt.

**Next action:** Once B001 implementation is requested, carry that authorization forward, recheck the runtime, resolve its availability and continue execution substep 1. Keep the documented Linux target and optional GLIDE proof boundary; do not silently substitute a native Windows production baseline. Until then, the readiness review is complete and B001 remains Not started. Verification of this documentation handoff is recorded in AUD-006; no BUILD/ADAPT or requirement is accepted.

## B002: HTTP, PostgreSQL and telemetry foundation

**Historical B001 handoff, before AUTH-005, 7 September 2026:** Execution substeps 1–5 are complete for the bounded core; BUILD-001/002/003 are In review. Node 24.19.0/npm 11.17.0, Nest 11.2.3/Express 5.2.1, CommonJS and strict TypeScript 5.9.3 are locked. API/worker source exists under the proposed app paths with shared configuration/lifecycle in `packages/platform`; config version 1 binds DEV-PHYSICAL-BD revision 1 to local/test only. Windows passed 92 tests (4 POSIX signal skips); clean Linux passed all 96. No migration/schema exists. See the linked B001 record for exact image digest, all pins, commands, failures/repairs and source identity. Human acceptance remains pending; B002 implementation requires its own scope instruction.

The B002 plan is now implemented under AUTH-005; see its linked execution record. Scope BUILD-004/005/006: bounded request context/errors, pg pool/migration runner/shared transaction context, logging/tracing/redaction and graceful shutdown. Verify commit/rollback, connection release and exact bigint round trip against real local PostgreSQL, plus error contract and correlated safe telemetry. Use synthetic fixtures and required minimal migrations; do not create all optional model tables by default. Final commands/tooling come from the accepted B001 environment, not guesses in this document.

## Unit completion boundary

U01 is accepted only after all six parent outcomes have evidence and applicable human review. Local results do not establish RDS failover, GLIDE/native client support, real Auth0, SSLCOMMERZ, SQS, search, email, production load or recovery. Continue U02/U03 according to the task dependencies and the next authorized Bolt.

### B002 execution handoff, 7 September 2026

BUILD-004/005/006 are In review: Windows 124 tests passed with six POSIX skips; fresh Linux/PostgreSQL all 130 passed. Five suites and final dependency audit passed; no human acceptance is inferred.

AUTH-005 explicitly authorizes BUILD-004/005/006 with synthetic local data and local PostgreSQL. At entry all 30 B001 artifact hashes matched; its technical prerequisites were reused while human acceptance remained pending. [B002](../bolts/B002-foundation.md) and [B002 manifest](../evidence/B002-manifest.json) own current source/dependency/schema identity and verification results. Configuration is now version 2; DEV-PHYSICAL-BD revision 1 is unchanged. B002 adds bounded HTTP problems/health/context, a separate Drizzle runner and restricted pg transactions, manual local OTel/Sentry telemetry and shutdown/work acknowledgement controls. No domain tables or real providers were added. U01 remains In progress until applicable human acceptance. Next planned Unit is U02 with BUILD-007/008, subject to its own scoped instruction; AUTH-005 continues for B002 fixes.
