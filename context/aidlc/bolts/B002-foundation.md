# B002: HTTP, PostgreSQL and telemetry foundation

| Field | Value |
| --- | --- |
| Bolt / Unit / intent | B002 / U01 / INT-001; BUILD-004 through BUILD-006 |
| Phase and status | Construction / In review; bounded implementation and verification complete |
| Authorization | AUTH-005: explicit user instruction on 7 September 2026 to implement B002 with synthetic local data and local PostgreSQL |
| Profile | DEV-PHYSICAL-BD revision 1; optional templates disabled |
| Owner/reviewer | Codex implementation and AI self-review; human acceptance pending |
| Dependencies | B001's 30 recorded artifact hashes match actual files; its technical evidence is available, human acceptance remains pending. The new instruction authorizes dependent B002 work without inventing B001 acceptance |
| Inputs | [U01](../units/U01-foundation.md), [B001](B001-foundation.md), [BUILD sequence](../../../backend/readiness/05-implementation-sequence.md), [HTTP contract](../../../backend/04-api-contracts.md), [request flow](../../../backend/05-request-dataflow.md), [operations](../../../backend/09-resilience-observability-operations.md), [database migration rules](../../../database/06-environments-and-migrations.md), [integrity](../../../database/04-integrity-and-transactions.md) |
| Stage selection | Context, contract, database privilege/migration review, implementation, failure/concurrency testing and handoff included; frontend, real providers and cloud deployment omitted per instruction |
| Confidence question | Can bounded HTTP and worker operations use explicit atomic local PostgreSQL work and correlated safe telemetry while failing and stopping safely? |

## Plan before implementation

1. Preserve the 129-file nonignored starting baseline and existing discovery changes. Retain the B001 toolchain and review exact pg, Drizzle and telemetry additions.
2. BUILD-004: request context, validated bounded correlation/trace headers, 256 KiB JSON limit, safe problem responses and minimal live/ready routes. No business endpoints or identity implementation.
3. BUILD-005: separate local migrator/API/worker roles, bounded pools and timeouts; reviewed additive ownership-schema migration using Drizzle. Serialize migration application and reject history drift. Expose an explicit client-bound transaction context, prohibit hidden nested transactions, preserve bigint precision and release connections on all paths. No automatic transaction retries or domain tables.
4. BUILD-006: local structured allowlisted logs and OpenTelemetry spans, error capture without raw exception/request data, readiness/drain/connection and telemetry shutdown. A synthetic work harness tests acknowledgement only after completion; no queue adapter is implied.
5. Verify HTTP errors/limits/context isolation, fresh migration and replay/concurrent runners/drift/failure, role denials, commit/rollback/release/exact bigint/lock timeout on real PostgreSQL, liveness during DB outage, correlated safe traces and unfinished work on shutdown. Record observed results and exact artifact/schema identities before review.

## Execution and review record

**Date:** 7 September 2026, Asia/Dhaka. **Review:** Codex implementation and AI self-review, not independent/human acceptance. Starting HEAD `aec6f89`; all 129 pre-existing nonignored files were captured by hash and all 30 B001 implementation artifact hashes matched. Existing discovery changes and diagrams were preserved. No commit or deployment was made.

The [B002 manifest](../evidence/B002-manifest.json) identifies **46** source/configuration/build/test/migration inputs and direct dependency integrity. Artifact set SHA-256: `369d84170d6a328a6d9d6e20cfece17c29b0bde436d2ae2e902a396630900138`. Lock SHA-256: `575d6c3d47afdff15702f1020df0fb14c141d15f74eabb83fa694b88134be7e0`. Migration `0000_foundation` SHA-256: `699076c71a6da2cc4a7f2c88bbab2f5976fde815ac60fe978c236f8dc1f3a201`. Profile remains DEV-PHYSICAL-BD revision 1; configuration becomes version 2. B001's manifest is preserved as historical evidence, not regenerated over changed files.

### Runtime and compatibility

| Component | Exact identity / observed boundary |
| --- | --- |
| Retained core | Node 24.19.0, npm 11.17.0, Nest 11.2.3, Express 5.2.1, TypeScript 5.9.3, Jest 30.5.1, CommonJS |
| PostgreSQL | 18.4, Debian 18.4-1.pgdg12+1, Linux x86_64, 64-bit |
| PostgreSQL image | `postgres:18.4-bookworm@sha256:882236b897e39051d2368c5ccc6cda944904723506b2dfc97f2a8f5bc9afa382` |
| Linux Node image | `node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df`; x64, glibc 2.36 |
| Host | Windows NT 10.0.26200.0, X64; Docker engine 29.7.2 |
| PostgreSQL integration | pg 8.23.0, Drizzle ORM 0.45.2, Drizzle Kit 0.31.10, pg types 8.23.1 |
| Local telemetry | OTel API 1.9.1, trace SDK 2.11.0, Sentry Node 10.73.0 |
| Dependency repair | Scoped `@esbuild-kit/core-utils -> esbuild 0.25.12` override; generated TypeScript migration/replay verified |
| Compiler limitation | Application source stays strict; skipLibCheck enabled because Drizzle's published declarations fail checks and reference unused drivers |

The [pg transaction contract](https://node-postgres.com/features/transactions), [Drizzle migration workflow](https://orm.drizzle.team/docs/migrations), [OTel instrumentation guide](https://opentelemetry.io/docs/languages/js/instrumentation/) and [PostgreSQL version policy](https://www.postgresql.org/support/versioning/) were reviewed alongside registry metadata. Actual locked builds and integration checks supply the bounded compatibility evidence. No managed PostgreSQL, cloud, Auth0, GLIDE or real-provider compatibility is inferred.

### Implemented behavior and acceptance evidence

BUILD-004 creates validated request correlation/trace context, bounded JSON/URL/header handling, safe problems and live/ready routes. BUILD-005 creates restricted local API/worker logins, a separate migrator, eight ownership schemas plus Drizzle history and explicit transaction context. No domain tables exist. BUILD-006 adds manual OTel tracing, structured allowlisted local logs/event counters, fixed sanitized Sentry events through a local transport and graceful work/connection/telemetry shutdown. See [run guide](../../../README.md) for commands, configuration and precise limits.

Design inputs: BE-027/028/029, BE-033 through BE-044; DBT-023 and DBT-025 through DBT-028; BA-031/040; OPS-01/SEC-01. These are traceability inputs, not separately accepted duplicate implementations. NFR-08/NFR-09 remain downstream domain constraints; all ADAPT behavior remains pending.

| Scenario / task | Expected result | Observed result |
| --- | --- | --- |
| Clean Linux install/build / foundation | Fresh lock install with valid peers and strict source build | 439 packages added, 443 audited; npm ls --all exit 0; build and 13-file module/cycle check passed |
| Drizzle Kit / BUILD-005 | TypeScript schema generates SQL once and unchanged replay adds nothing | Passed on Windows host and clean Linux, including bigint SQL inspection |
| Empty migration / BUILD-005 | Fresh DB builds from reviewed history | Fresh Linux database reported empty-database rebuild; eight schemas/history applied; no domain tables |
| Replay/concurrent runners / BUILD-005 | One immutable migration history without duplicate DDL | Concurrent runners both returned revision count 1 and one matching history row |
| Drift/failure/repair / BUILD-005 | Reject changed/unknown history; failed additive DDL/history rolls back; release lock | Changed hash rejected; test schema rolled back; never-applied test migration repaired successfully; future history and missing live ownership schema made readiness false |
| Atomic exact values / BUILD-005 | Two operations share one session and commit exact values | pg decimal strings and Drizzle bigint round trips passed at 9,007,199,254,740,993 and signed-bigint maximum; same backend PID |
| Rollback and context / BUILD-005 | Exceptions/constraints undo prior statements; expired/nested contexts reject | No partial rows; swallowed SQL error yielded ROLLED_BACK; connections reusable; concurrent transactions had isolated sessions |
| Contention/connection loss / BUILD-005 | Lock/statement timeout rolls back all effects; no connection leak or blind replay | Contended row and pg_sleep timeout cases passed; terminated connection recovered; pool returned to idle |
| Ambiguous commit / BUILD-005 | Retain committed effect, return unknown and never retry | A test shim discarded an actual COMMIT reply; one persisted row, one callback execution, COMMIT_UNKNOWN. This is injected reply-loss evidence, not a network failover test |
| Runtime privileges / BUILD-005 | API and worker cannot perform DDL, create temp objects or mutate history | All denials passed; both roles could check readiness |
| HTTP bounds/errors / BUILD-004 | Malformed/scalar/oversized JSON, unsupported types/encoding and invalid headers rejected safely | 400/413 problems passed; unmatched 404 did not reflect private path/query/body; no raw exception data |
| Health outage / BUILD-004 | PostgreSQL failure affects readiness, not liveness | 503 readiness within 2-second test bound; liveness 200; minimal no-store responses |
| Correlation/redaction / BUILD-006 | Isolate concurrent contexts; one HTTP span with one DB child; capture safe errors | Eight concurrent request contexts isolated, trace/parent links matched, one local error report; random canaries absent from responses/logs |
| Worker acknowledgement / BUILD-006 | Acknowledge successful completed work only | Failure and shutdown-abandoned work not acknowledged; stopped worker rejects admission; throwing log sink did not change success |
| OS lifecycle / BUILD-006 | Both roles SIGINT/SIGTERM stop; unfinished worker never acknowledged | All six Linux signal cases passed, including cooperative drain exit 0 and noncooperative five-second deadline exit 1 |
| Dependency audit | Record current findings, do not infer full security acceptance | Final Linux audit reported zero known vulnerabilities; legacy Kit loader and existing glob deprecations remain |

**Final results:** Windows `npm.cmd run check`: **5 suites passed, 124 tests passed, 6 POSIX cases skipped, 130 total**, 36.266 seconds. Clean Linux `node scripts/verify-postgres.cjs`: **5 suites passed, 130 tests passed, no skips**, 81.477 seconds; locked install, dependency graph, build, migration-tooling check and audit passed. Manifest generation and its 46 hashes were checked; no source/test/migration/dependency file changed afterward.

Commands actually executed include exact npm metadata/install/update/audit queries, PostgreSQL image pull, `node scripts/local-postgres.cjs`, local and test `scripts/migrate.cjs`, source builds, targeted and full Jest suites, Drizzle Kit generation, clean Linux/PostgreSQL verification and inventory/hash/ignore/diff checks. Scoped host execution was used for registry/Docker access and Drizzle Kit's OS-user lookup. Verification containers have no published ports and are removed; the developer PostgreSQL container `luic-b002-1fbad6effef6` remains at `127.0.0.1:61875`, with credentials only under ignored .local. No real-provider request occurred.

### Failures and repairs

1. Drizzle's declaration graph failed the first build, including unused-driver declarations. Retained source strictness and documented skipLibCheck rather than claiming verified dependency declarations. Fixed Sentry's required sanitized event shape.
2. Drizzle Kit introduced four moderate advisory records through old esbuild. A scoped override initially left npm's old nested lock entry invalid; refreshing only the Kit subtree resolved it. Final dependency tree/audit and actual generation/replay passed. Deprecated loader packages remain.
3. Windows Kit schema paths needed forward slashes. In the restricted sandbox, Kit's OS-user query failed while its CLI returned zero; the generated-artifact assertion correctly rejected that false success. Ordinary host execution and Linux generation passed.
4. The first combined suite had 117 passing tests, four skips and one unhandled checked-out pg connection error. Added checked-out error handling and disposal; targeted failure/concurrency tests then passed.
5. A later Windows run alongside the container build hit the ten-second child watchdog in two invalid-configuration cases. Configuration preflight now runs before importing telemetry/application modules; the final Windows and Linux suites passed without extending the watchdog or weakening configuration rejection.

### Limits and review conclusion

Codex self-review checked explicit transaction ownership, rollback/disposal and ambiguous-commit handling; local role restrictions; schema-history identity; safe HTTP/log/error behavior; trace ownership and shutdown order. Live drift detection is limited to migration history and ownership-schema presence, not arbitrary future table/index drift. Synthetic transactions do not prove domain money/stock rules, idempotency resolution or managed failover. No public business/API authorization, full telemetry metrics/exporter service, real queue/provider, load, recovery or production operation is accepted.

## Closure and next context

BUILD-004/005/006 bounded outcomes have verified evidence and are **In review**. B001 remains In review; U01 remains In progress until applicable human acceptance. Current AUTH-005 authorizes routine B002 verification/fixes; AUTH-004 remains for B001 fixes. Human acceptance and reviewer assignment are pending; the explicit B002 instruction did not silently approve B001 artifacts.

Review the source, migration, manifest, run guide and this record. Next planned implementation scope is U02/BUILD-007/008 after review and its own bounded instruction. Keep frontend, real providers, cloud deployment, all optional models and later domain migrations outside this authorization. Preserve existing changes and resume from these results rather than replaying bootstrap.
