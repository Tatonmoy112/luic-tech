# Luic commerce backend

U01/B001-B002 supplies a synthetic local NestJS API/worker foundation, PostgreSQL migrations and transactions, safe HTTP errors and local telemetry. See [workflow state](context/aidlc/state.md) and [B002 evidence](context/aidlc/bolts/B002-foundation.md) for results and pending human acceptance. Commerce endpoints, identity, payment simulation, queue consumers, real providers and deployment remain future work.

## Run locally

Use Node **24.19.0**, npm **11.17.0** and a running Docker engine:

```sh
npm ci --ignore-scripts
npm run db:local
npm run db:migrate
npm run check
npm run local:api
```

In a second terminal run `npm run local:worker`. On PowerShell use `npm.cmd` if execution policy prevents `npm.ps1`. Stop processes with Ctrl+C.

`db:local` creates a uniquely named PostgreSQL 18.4 container with a random loopback port, isolated `commerce_local`/`commerce_test` databases and separate migrator/API/worker logins. Random disposable credentials and role environment files stay under ignored `.local/`. Subsequent setup preserves the databases; incomplete bootstrap is reported instead of resetting data. The container name is recorded in `.local/postgres.json`; use Docker Desktop to stop/start that container. Retain it while you need its local data.

`db:migrate` applies reviewed migrations to `commerce_local`; tests apply them to `commerce_test`. `db:migrate:test` migrates the test database explicitly. Runners serialize with a PostgreSQL advisory lock and reject changed/unknown history. Runtime startup never applies DDL. The foundation creates eight ownership schemas and Drizzle history, with no domain tables. Tests create/remove their own `b002_probe` schema. Run one test suite at a time against a given test database.

The API listens on `127.0.0.1:3000`. `GET /health/live` is shallow and independent of PostgreSQL. `GET /health/ready` checks connectivity, migration identity and ownership-schema presence, returning 503 on failure. Both return minimal JSON with `no-store`. Unimplemented routes return safe 404 problems. The worker has no HTTP listener or queue connection.

## Configuration contract, version 2

| Key | Required value |
| --- | --- |
| SERVICE_NAME | `commerce` |
| RUNTIME_ROLE | `api` or `worker`, matching the entrypoint |
| APP_ENV / NODE_ENV | `local` / `development`, or `test` / `test` |
| RELEASE_ID | 1-64 alphanumeric/dot/underscore/hyphen characters; first alphanumeric |
| DATA_MODE | `synthetic` |
| COMMERCE_PROFILE / PROFILE_REVISION | `DEV-PHYSICAL-BD` / `1` |
| IDENTITY_MODE / PAYMENT_MODE | `synthetic` / `simulated`; composition labels only |
| API_PORT | API only: integer 0-65535; 0 requests an ephemeral loopback port |
| DB_PORT | Integer 1-65535; populated by local setup |
| DB_PASSWORD | Nonempty role password, at most 256 characters; generated locally |

Database host is fixed to loopback; database and login follow the environment/runtime role. Arbitrary PG variables or connection URLs cannot redirect this composition. Pools are capped at API 5 / worker 3 / migrator 1. Runtime connection acquisition and statement limits are 750 ms, locks 200 ms, client query and idle-transaction limits 1000 ms. These local bounds are not production capacity evidence.

Existing environment variables override Node's environment-file values; incompatible configuration fails startup. `start:api`/`start:worker` require caller configuration. Example files contain synthetic nonsecret settings; setup supplies database values.

## Foundation contracts

HTTP accepts JSON objects/arrays up to 256 KiB. Malformed/scalar JSON, unsupported content types/encodings, invalid correlation/trace headers and URLs over 2048 characters are rejected. Headers and transport timeouts are bounded. `x-correlation-id` accepts a UUID or is generated; version-00 W3C `traceparent` is validated, and baggage is ignored. Problems carry safe code/title/status/detail, correlation and route path. Unknown paths become `/unmatched` to avoid reflecting private values. Domain DTO validation and authorization belong to later endpoints.

Repositories receive an explicit transaction context bound to one pg connection. Nested transactions and expired contexts are rejected. Failure rolls back the whole unit; swallowed SQL errors cannot masquerade as commits. Connections are released or discarded. Unrestricted bigint remains decimal strings through pg and bigint through Drizzle's bigint mode; later money/version DTOs must use decimal strings. An uncertain commit becomes `COMMIT_UNKNOWN` and is never automatically retried. Later idempotent commands must resolve it from authoritative facts.

OpenTelemetry manually owns request/work and transaction spans. Local logs carry safe correlation, outcomes and durations, with bounded event counters. Sentry uses a local transport and fixed sanitized error events, with automatic instrumentation disabled. No raw request body, token, cookie, query, SQL, password or exception stack is logged; no remote exporter/provider is used. Sink failures cannot change application outcomes.

Shutdown stops admission, fails readiness, drains admitted work, then closes PostgreSQL and telemetry. A process that cannot drain exits unsuccessfully after five seconds. Unfinished worker work is never acknowledged; real queue lease/acknowledgement behavior remains unimplemented.

## Verification

`npm run check` builds source, checks dependency direction/cycles, exercises Drizzle Kit TypeScript generation/replay and runs Jest against local PostgreSQL. Windows skips six POSIX signal cases. Drizzle Kit may need an ordinary host terminal because restricted Windows sandboxes can deny its OS user-info query.

```sh
npm run verify:linux
```

This uses digest-pinned Node/PostgreSQL images, a read-only checkout mount, fresh source/dependencies and a fresh database. It verifies locked installation, dependency graph, build, migration generation/rebuild, tests and audit. No ports are published. Both verification containers and the temporary credential file are removed afterward; the developer container is preserved. Registry/image access is required.

Application source remains strict TypeScript. `skipLibCheck` is enabled because Drizzle's published declarations have errors and reference unused drivers; their types are not certified. The scoped esbuild override repairs Drizzle Kit's advisory chain; older loader deprecations remain recorded.

Apps depend on `@luic/platform`; platform cannot import apps and apps cannot import one another. All 78 proposed domain tables, real integrations, production security/load/recovery and full operational telemetry remain future work. Preserve immutable migration bytes and LF endings. Future domain migrations must review the existing ownership schemas when generating SQL; no snapshot of domain tables is present yet.
