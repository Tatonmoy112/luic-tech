# B001: Core runtime, workspace and configuration

| Field | Value |
| --- | --- |
| Bolt / Unit / intent | B001 / U01 / INT-001; BUILD-001 through BUILD-003 |
| Phase and status | Construction / In review; bounded implementation and verification complete |
| Authorization | AUTH-004 in [audit](../audit.md); explicit local implementation instruction |
| Profile | DEV-PHYSICAL-BD revision 1, synthetic-only; optional model templates disabled |
| Owner/reviewer | Codex executes and performs AI self-review; human acceptance pending, reviewer not assigned by inference |
| Inputs | [U01 plan](../units/U01-foundation.md), [development defaults](../../../backend/readiness/02-development-defaults.md), [runtime architecture](../../../backend/02-runtime-architecture.md), [configuration design](../../../backend/10-configuration-deployment.md), [task sequence](../../../backend/readiness/05-implementation-sequence.md) |
| Stage selection | Context/compatibility/composition/configuration/verification included; frontend, domain transactions, database migrations, real providers and cloud deployment excluded because B001 does not deliver them |
| Confidence question | Can one locked core build and boot separate API/worker roles while rejecting unsafe or incomplete configuration? |

## Plan before implementation

Preserve the 96-file documentation working baseline and reuse the prepared Unit acceptance scenarios. Pin the selected Node 24 / Nest 11 / Express 5 / CommonJS core after registry/peer review. Use npm workspaces for two applications and a narrow shared platform package; no empty domain implementations. Compile TypeScript before exercising processes. Bind the API to loopback only. The worker uses a standalone Nest application context with lifecycle only, no consumer or provider adapter.

Require explicit role, local/test environment, build identity, synthetic profile revision and synthetic identity/payment selections. These selections describe isolated composition only; no issuer or payment simulator is implemented here. Reject all shared/staging/production environments and real provider modes before creating either application. Validate listener configuration only for the API. Emit controlled startup/shutdown events and key-only configuration errors; do not print arbitrary environment values or exception payloads.

Verify locked clean install, compile, dependency graph, independent role lifecycle, missing/invalid configuration, environment/provider/profile rejection, secret-safe failure output and local Linux signals. Record actual results below before marking evidence ready. Docker setup is a local test environment, not a deployment artifact or managed-service proof.

## Execution and review record

**Date:** 7 September 2026, Asia/Dhaka. **Reviewer:** Codex, AI self-review; no independent or human acceptance. Starting Git HEAD `aec6f89` with the existing 96-file documentation baseline and dirty working tree. No commit, release, schema or provider identity was created. The [artifact manifest](../evidence/B001-manifest.json) records 30 source/configuration/test/tooling inputs and every direct dependency's exact version, registry artifact and integrity. Documentation is reviewed separately.

**Artifact set SHA-256:** `e75a8fbd13de8c51416bb0cb4258f90c95fb3c084a3d9af423056f13d409b4f8`. **Lockfile SHA-256:** `cf46ce328961db8ba229bef30f734716370b1f303542b4fcbec419b05ef39fff`. The manifest is an identity record, not a claim that every file is executable or that checks constitute acceptance. Regenerate with `node scripts/runtime-inventory.cjs --write` after an implementation change, and renew affected evidence.

### Selected compatible core

| Component | Exact selected version / identity | Evidence boundary |
| --- | --- | --- |
| Node / npm | 24.19.0 / 11.17.0 | Both Windows and Linux; exact root engines and packageManager |
| Linux image | `node:24.19.0-bookworm-slim@sha256:a9f5f7c91a432850b2a8a7797adf5eadb6c733ceed61167806cee7ea7fbc29df` | Debian Bookworm, x64, glibc 2.36; local disposable verification only |
| Windows host | NT 10.0.26200.0, X64 | Host Node executable hash in manifest; no Windows GLIDE claim |
| Docker engine | 29.7.2 | Installed Docker Desktop started for local verification; test containers removed automatically |
| Nest common / core / platform-express | 11.2.3 / 11.2.3 / 11.2.3 | Matching major and peers; both roles compile/boot |
| Express | 5.2.1 | Matches Nest adapter dependency; no business routes |
| reflect-metadata / RxJS | 0.2.2 / 7.8.2 | Installed required Nest peers |
| TypeScript / module format | 5.9.3 / CommonJS | Strict project-reference build, declaration emit, no skipped library checking |
| Jest | 30.5.1 | Runs compiled artifacts without ts-jest/alternate transpilation |
| Node / Express type definitions | 24.13.3 / 5.0.6 | Exact dev pins; Express types required by strict Nest adapter declarations |

Kept the documented Nest 11/CommonJS candidate instead of migrating to a different major during bootstrap. Registry metadata for Nest 11.2.3 declares Node >=20 and compatible Nest 11, reflect-metadata and RxJS peers; the adapter resolves Express 5.2.1. The [current Nest migration guide](https://docs.nestjs.com/migration-guide) covers v12 and does not by itself prove a Nest 11 installation. Actual locked install/build/boot and dependency inspection supply the bounded compatibility evidence. TypeScript 5.9.3 retains the candidate's decorator/compiler path; the newer registry default was not required for this slice. [Node lifecycle information](https://nodejs.org/en/about/previous-releases) was reviewed alongside the exact installed/image versions; no evergreen security/support certification is inferred.

Drizzle/Kit/pg, PostgreSQL, JWT verification, OTel/Sentry and optional GLIDE/AWS/OpenSearch/provider clients remain uninstalled/unverified. Add and pin each at its actual integration Bolt; B001 does not close the full D09/BA-040 multi-capability compatibility decision.

### Behavior, traceability and verification

Configuration contract version 1 is documented in the [root run guide](../../../README.md). API host is fixed to `127.0.0.1`; only API consumes `API_PORT` (0–65535). Required common keys are SERVICE_NAME, RUNTIME_ROLE, APP_ENV, NODE_ENV, RELEASE_ID, DATA_MODE, COMMERCE_PROFILE, PROFILE_REVISION, IDENTITY_MODE and PAYMENT_MODE. Mode labels have no external clients. Worker uses a standalone application context and a lifecycle keepalive, with no HTTP listener or consumed work. Platform exports a frozen configuration injection token; apps cannot import one another or be imported by platform. No domain/contracts placeholder implementation was added.

Requirements: OPS-01 and SEC-01 receive partial foundation evidence; full requirements remain In progress. Design inputs reused: BE-009, BE-019/020/021 and BE-033/034/035; BA-031/040; runtime/configuration designs and the database migration boundary. No BE/DBT design row is independently counted as implemented or approved. ADAPT-001 provenance is retained; profile-ID validation does not claim ADAPT-002's full capability contract/checkout enforcement.

| Scenario / task | Expected observation | Actual result |
| --- | --- | --- |
| Clean locked installation / BUILD-001 | Fresh dependencies from one lock, no install-time engine or peer conflict | Linux `npm ci --ignore-scripts` succeeded; 393 packages added, 397 audited; host install succeeded after retry |
| Dependency graph / BUILD-001 | No missing or invalid installed dependencies | `npm ls --all --json` exited 0 in Linux; host graph also had no problems |
| Compile and module direction / BUILD-001/002 | Strict compile and acyclic imports; platform cannot depend on apps | Windows and Linux `npm run check` passed compilation and boundary check across all 7 TypeScript source files |
| Independent API and worker / BUILD-002 | Separate compositions coexist; closing worker leaves API alive; API socket closes | In-process tests passed on Windows/Linux; loopback listener returned 404, worker had no HTTP server |
| Role process lifecycle / BUILD-002 | Real entrypoints start and exit cleanly on SIGINT/SIGTERM | Linux all four role/signal combinations exited 0 with started/stopped events; Windows skips these POSIX cases explicitly |
| Required values and role mismatch / BUILD-003 | Missing/invalid keys reject before startup | Both-role parser matrix and process-entrypoint rejection tests passed; API port required and bounded; worker ignores API-only settings |
| Unsafe composition / BUILD-003 | Shared/staging/production/recovery, real modes, unsupported profiles and conflicting NODE_ENV rejected | Parser and child-process negative scenarios passed; no started event on rejected process configuration |
| Secret-safe diagnostics / BUILD-003 | Supplied test values absent in success/failure output | Random per-test canaries never appeared; rejected config emitted only known key names; occupied port emitted only startup_failed and exited 1 |
| Package advisory check / BUILD-001 | Capture current known findings | Final `npm audit --audit-level=low` reported 0 vulnerabilities; transitive glob 10.5.0 deprecation warning remains visible |
| Parent review | Bounded results linked without inventing acceptance | BUILD-001/002/003 In review; human acceptance pending; U01 incomplete |

Commands actually executed: host Node/npm version queries; npm registry metadata queries; Docker Desktop start; image pull/inspect and isolated runtime inventory; `npm install --ignore-scripts` (failed first attempt, then retry), exact Express type installation, `npm run check`, dependency-tree inspection; the [Linux verifier](../../../scripts/verify-linux.cjs) via the exact Docker command in README; `node scripts/runtime-inventory.cjs --write`; document/hash/whitespace checks in AUD-008. The Linux verifier uses a read-only repository mount and a fresh temporary source copy excluding host node_modules/dist; no host build output can satisfy its clean-build check. It publishes no ports. Registry access occurs for install/audit only; no real provider call or cloud deployment ran.

**Final observed suite results:** Windows: 2 suites passed, 92 tests passed, 4 explicitly skipped POSIX signal tests, 96 total (25.097 seconds). Linux: 2 suites passed, all 96 tests passed, no skips (15.613 seconds). No concurrency/domain/database/provider/telemetry/load/recovery result is implied. Basic lifecycle output is not the full BUILD-006 logging/tracing capability. Inventory generation was exercised after these suites; runtime/configuration/test inputs were unchanged afterward.

### Failures and repairs

1. The sandbox could not access Docker configuration or the npm registry. Scoped outside-sandbox commands supplied registry access and local runtime bootstrap; this did not broaden application/provider scope.
2. The first dependency install hit `EIDLETIMEOUT`; the incomplete install had no working `tsc`. Retrying with bounded longer fetch timeouts succeeded. No passing build was claimed from the incomplete tree.
3. The first actual strict Windows/Linux compile found missing Express declarations, an unnameable inferred public configuration type and an unchecked nullable/string listener address. Added exact `@types/express` 5.0.6, explicit exported return types and a TCP-address guard. Both final builds passed without weakening strictness.
4. npm emits a transitive `glob@10.5.0` deprecation warning through Jest. Final registry audit reported zero known vulnerabilities; do not treat that as a guarantee or silently force an incompatible transitive override. Recheck when updating test tooling or if an advisory appears.

## Closure and next context

B001 execution substeps 1–5 are complete for the bounded core, with BUILD-001/002/003 **In review**, not human-accepted Done. U01 remains incomplete until BUILD-004/005/006 and applicable acceptance. The code, lockfile, run guide, tests and this evidence are the concrete review artifact. No source commit was created; preserve existing discovery/diagram changes.

AUTH-004 continues to authorize B001 verification and routine fixes. Next action is human review of this result; after B001 acceptance and a scoped B002 implementation instruction, use this exact workspace/toolchain and create the bounded HTTP/PostgreSQL/telemetry foundation. No merchant/provider account is needed for that local work, but actual local PostgreSQL availability is still unproved. Profile revision 1 and config contract version 1 remain fixed; no policy schema or baseline 78-table implementation exists.

## Subsequent B002 authorization

On 7 September 2026, AUTH-005 explicitly authorized [B002](B002-foundation.md). This permits dependent implementation using the verified B001 technical baseline while B001 human acceptance remains pending. The earlier closure describes the handoff at that time; its B002 authorization gate is superseded. B002 changes configuration/dependencies/source and records a new manifest. Preserve B001-manifest.json as historical evidence; the current inventory script writes B002-manifest.json.
