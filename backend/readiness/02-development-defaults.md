# Concrete backend development defaults

These are selected working engineering defaults and fictional test policies. They can be revised through evidence without pretending that a merchant has approved real operating rules.

These commerce values belong to [DEV-PHYSICAL-BD revision 1](../../context/registers/commerce-profiles.md). They are not universal defaults for digital, subscription, B2B, marketplace or other models. Apply the [configurable-commerce design](../14-configurable-commerce.md) to introduce validated policy versions; select a domain extension where the underlying behavior is absent. Existing security and financial invariants remain mandatory.

## Runtime and repository

| Concern | Development selection | Verification boundary |
| --- | --- | --- |
| Backend architecture | NestJS modular monolith, explicit application services; no mandatory CQRS framework/event sourcing | Dependency graph and transaction tests |
| Execution | Node.js 24 LTS; Linux GNU/glibc runtime; Debian-based Node container candidate, x86_64 initially | Pin exact supported image digest and patch at bootstrap |
| Windows workspace | Keep docs here; execute GLIDE-dependent backend in WSL2/Linux containers; verify filesystem watching and line endings | No assumption that Node GLIDE supports native Windows |
| Framework | NestJS 11 + Express 5 as conservative candidate; evaluate available supported patches at bootstrap; do not mix Nest major versions | Current support/security/peer dependencies; revisit if 11 is unsuitable |
| Module format | CommonJS candidate for Nest 11 build; deliberate ESM decision if selecting Nest 12 | Test Drizzle, auth, test runner and telemetry together |
| Persistence | Drizzle ORM + node-postgres driver; explicit transactions; Drizzle Kit reviewed migration generation/application | Exact compatible ORM/Kit/driver pins and schema round trip |
| Package manager | npm bundled with selected Node distribution; one committed lockfile; clean locked installs | Pin npm version in evidence; no floating dependency baseline |
| Cache | GLIDE Node client on Linux; Valkey 9.x remains requested major | Managed availability and native client compatibility separately verified |
| Search | Amazon OpenSearch Service target; matching official JS client; one product document | Actual managed engine/client compatibility required |
| Queue/storage | AWS SDK for JavaScript v3 clients for SQS/S3; small owned adapters | Real sandbox IAM/network/transport proof |
| Authentication | Standards-based JWT verification adapter, Auth0 issuer/audience allowlist; no Auth0 Management API on request path | Choose compatible maintained library and verify JWKS rotation |
| Testing | Nest-compatible Jest and HTTP integration client; real PostgreSQL for concurrency; provider doubles for local tests | Verify runner/TypeScript/module compatibility before pinning |
| Observability | OpenTelemetry owns tracing; Sentry owns error reporting; avoid duplicate automatic instrumentation | One request/worker trace with no duplicate spans |
| Future paths | apps/commerce-api; apps/commerce-worker; packages/domains; packages/platform; packages/contracts; database/migrations; tests/integration | These are proposed source paths, not created directories |

Node's release page identifies its lifecycle; the selected patch must be checked at bootstrap. [Node releases](https://nodejs.org/en/about/previous-releases).

Current Nest documentation describes a v12 ESM transition. Framework/module-format selection therefore needs an explicit version-specific review; “latest Nest” is not a reproducible dependency decision. [Nest migration guide](https://docs.nestjs.com/migration-guide).

GLIDE's installation documentation lists Linux/glibc requirements and currently limits Windows support to Java/C#. That makes Linux execution the chosen path for the Node client in this Windows workspace. [GLIDE installation](https://glide.valkey.io/how-to/installation/).

Drizzle documents node-postgres integration and a generate/review/migrate workflow. This project requires committed reviewed migrations rather than direct shared-schema push. [Drizzle PostgreSQL](https://orm.drizzle.team/docs/get-started/postgresql-existing), [migration workflow](https://orm.drizzle.team/docs/migrations).

## Exact-version acceptance record

**B001 execution update, 7 September 2026:** The [B001 evidence](../../context/aidlc/bolts/B001-foundation.md) and manifest now pin the bounded Node 24.19.0/npm 11.17.0, Nest 11.2.3/Express 5.2.1/CommonJS core and test compiler/runner. Clean Linux build and all 96 tests passed; human acceptance pending. The two app paths and `packages/platform` now exist. B002 subsequently adds database migrations, pg/Drizzle and local OTel/Sentry evidence; domain/contracts paths and other client proofs remain future work. The table above remains the cross-capability design; it does not claim all clients were installed in B001.

At BUILD-001, record the resolved version and integrity/digest for Node, npm, Nest packages, Express, TypeScript, Drizzle ORM/Kit, pg, GLIDE, AWS SDK clients, OpenSearch client, JWT library, test runner, OTel and Sentry. Include OS/libc/CPU, PostgreSQL and managed engine versions, peer dependencies and known vulnerabilities.

Bootstrap exit requires clean locked core install, compile and boot/stop. The first slice then proves pg rollback, migration rebuild, bigint round trip, JWT verification and one trace/error capture. Add optional client pins and GLIDE load/TLS evidence when that integration slice starts; do not require all remote dependencies before local catalog work. See the B001/B002 records for actual core/database/telemetry execution; JWT and optional-provider checks remain pending. If a native library fails, first verify selected Linux runtime; any client substitution requires a recorded compatibility decision.

## First environments and resource budgets

Local initially needs only API, PostgreSQL and the test harness. Add workers/Valkey/OpenSearch as their slices arrive. Email is captured locally; SSLCOMMERZ is simulated locally; S3/SQS doubles test contracts but do not certify AWS compatibility.

Local starting pools: API maximum 5, combined worker maximum 3, migrator 1, test runner maximum 3 concurrent connections. A PostgreSQL database must have additional administrative reserve. Do not start a production-sized OpenSearch cluster just to build the order domain.

Staging capacity illustration: two API tasks at 10 connections = 20; one dispatcher at 2; two financial workers at 3 = 6; one notification worker at 2; one search worker at 2; one file worker at 3; one scheduler at 2. Normal runtime ceiling = 37. A 100% deployment overlap could use 74 runtime connections; reserve 20 more for admin, migration and monitoring, requiring at least 94 usable connections after database-managed reservations. This is budget arithmetic, not a recommended RDS instance size or measured safe throughput.

Recompute sum(maximum simultaneous tasks × per-task pool), including deployment surge, manual tasks and autoscaling maxima before scaling. If the measured database cannot support it, reduce pools/concurrency or change capacity; never merely raise connection limits.

## Initial technical limits

| Setting | Local/staging default | Behavior |
| --- | --- | --- |
| JSON body | 256 KiB; IPN 64 KiB initial candidate | Reject oversized input before parsing; verify provider size needs |
| List pagination | 20 default, 100 maximum | Keyset with opaque filter-bound cursor; no unbounded totals |
| Search | Query 2–128 characters; 10 suggestions; 50 results maximum | Allowlisted fields/sorts, 1-second dependency deadline |
| Commerce limits | 50 distinct cart lines; maximum 20 units/line unless lower SKU cap | Reject or return explicit merge adjustment; no silent quantity loss |
| Idempotency | Random UUID key; 7-day retained deterministic outcome for test baseline | Scoped actor/operation; active unresolved effects never purged |
| Staff mutation | If-Match with aggregate version; missing 428, stale 412 | Body validates before resource-specific authorization/load |
| Database deadlines | 200 ms lock, 750 ms statement, 1-second local checkout transaction target | Test/tune; timeout rolls back complete unit, not partial SQL |
| API deadline | 5 seconds for local commercial command | Session creation returns async status; remote provider call runs separately |
| Safe provider queries | 2-second connect, 10-second total starting budget | At most two query attempts with jitter, within overall work budget |
| Provider mutations | No automatic HTTP resubmit after ambiguity | Persist unknown; query or finance review if no safe lookup |
| Cache | Internal product/candidate cache 60 seconds; cart accelerator 30 seconds; public catalog/search API responses no-store under strict publication policy | Source publication check before release; bounded PostgreSQL load; shared response caching requires approved staleness semantics |
| Staff permissions | Sensitive actions: DB account/grants each command; ordinary reads: cache at most 30 seconds | Revalidate authorization at mutation; no failed-open behavior |
| Upload/download grants | 5 minutes | Bind object key and request constraints; credentials/grants never logged |
| Images | JPEG/PNG/WebP; 10 MiB input, 25 megapixel decoded cap | Quarantine/decode/normalize; reject SVG/HTML and decompression abuse initially |
| Imports | 10,000 variant rows; 20 MiB CSV; batches of 100 | Deterministic checkpoint and row result; field/row limits also apply |
| Export | 100,000 rows maximum per job; pages of 1,000 | Split larger requests explicitly; private object |
| Financial queue | Long poll 20 seconds; visibility 60 seconds; heartbeat every 20 seconds; initial concurrency 2 | Remote call and persistence must fit; no heartbeat without progress |
| File queue | Visibility 120 seconds; heartbeat every 30 seconds; initial concurrency 1 | Checkpoint short chunks; no transaction across file |
| Queue retention | Source 4 days, DLQ 14 days; redrive after 5 receives | Unresolved finance facts persist in DB beyond queue retention |
| Scheduler | Reservation sweep every minute; candidate batch 100 | Recheck DB time/state; provider reconciliation schedule below |
| Financial reconciliation | Query due unknown/pending at 1, 5, 15, 60 minutes then hourly | Provider capability/rate confirmation required; aged cases remain visible |
| Alerts | Any financial DLQ or invariant failure; search lag >5 minutes; outbox age >60 seconds | Alert routing must be staffed before production |

These values are test inputs and initial tuning choices. They are not contractual limits or proof of vendor capability. AWS explains visibility/redelivery behavior in its [SQS documentation](https://docs.aws.amazon.com/AWSSimpleQueueService/latest/SQSDeveloperGuide/sqs-visibility-timeout.html).

Rate-limit starting policy: public 120 requests/minute/IP-derived key, search 30, quote 20/actor, checkout 5/actor, guest verification 5 failures/order/IP combination per 15 minutes, payment session 3 new attempts/order/hour. Apply a global admission ceiling as well; do not lock victims out solely by guessed order ID. Finance/provider limits need merchant validation. Distributed limiter failure uses conservative per-instance admission caps and authoritative business guards.

## Fictional commerce policy for development

| Rule | Test behavior | Production dependency |
| --- | --- | --- |
| Units/currency | Integer quantities; 100 minor units = 1 BDT; positive prices | Merchant goods and currency confirmation |
| Reservation | 15 minutes; expiry releases due unallocated stock/coupon once even with pending/unknown payment, while order stays on an uncertainty hold; definitive verification resolves only that uncertainty hold | Provider timing and operations policy; terminal orders and other holds still guard late allocation |
| Quote | 5-minute quote expiry, recompute at submit; fresh key for newly accepted changed quote | UX/policy agreement |
| Coupon | One coupon; merchandise-only; largest-remainder discount allocation with order-line-number tie break | Finance rules |
| Tax | Explicit version DEV-ZERO-TAX, synthetic goods only | Accountant-supplied actual treatment; no zero-tax assumption in production |
| Shipping | DEV-LOCAL = 6,000 minor; DEV-REMOTE = 12,000 minor; unsupported zone rejected | Real zone map and charges |
| Cancel | Unpaid safe cancellation immediate; confirmed unshipped order goes on hold for staff resolution | Merchant cutoff/refund rule |
| Return | Fictional seven days from delivered timestamp; unopened or defective reasons | Product-specific exclusions/window and legal review |
| Refund | Original paid line amount after allocated discounts; shipping separately approved; unknown keeps balance reserved | Provider refund rights and finance allocations |
| Approval separation | For test cases every refund needs distinct requester/approver; no automatic approval by platform-admin | Staffing and actual thresholds |
| Guest | 256-bit opaque cart capability, 30-day cart inactivity; order capability 24 hours, rotated on issue | Real expiry/delivery policy |
| Retention | Synthetic exports 24 hours, import source 7 days, telemetry 14 days; preserve commerce/history while testing | Real-data periods remain unset |

Example: two units at 12,500 minor plus one at 9,999 minor give gross 34,999. A synthetic 10% coupon rounded half-up gives 3,500 discount. Largest remainder allocates 2,500 and 1,000; net lines are 22,500 and 8,999. With DEV-LOCAL delivery and DEV-ZERO-TAX, payable is 37,499 minor (BDT 374.99). Refund of one first-line unit is 11,250 minor, with zero delivery refund unless separately approved. Per-unit residuals must be allocated deterministically so repeated partial refunds never exceed the original line.

## Import field contract and fixtures

UTF-8 CSV, one row per sellable variant, fixed headers: source_product_key, product_slug, product_title, category_code, sku, variant_title, unit_price_minor, currency, opening_quantity, stock_location_code, weight_grams, attribute_values, media_asset_reference. Price/quantity are digit strings with validated bounds. Attribute values use an agreed escaped representation; lookup references must resolve to approved records. Do not infer price units or create missing categories silently.

All rows begin as drafts. Use valid fictional rows plus duplicate normalized SKU, missing price, unsupported currency, negative stock, unknown location/category, invalid attribute, unapproved media and oversized field cases. An import is validated before apply; source fingerprint and mapping version fix its meaning.

## Frontend-free acceptance

Use a private API client and automated harness to create fictional staff/customer contexts, call contracts, assert responses and inspect durable state. Local signed test identities use distinct issuer/keys and test-only composition; shared real-auth staging accepts only its configured Auth0 issuer. Capture emails locally. The payment-return diagnostic endpoint displays only a masked status/reference; no frontend screen is needed. Provider redirects/IPN still need a real HTTPS reachable sandbox route for final integration.

## B002 compatibility refinement, 7 September 2026

AUTH-005 retains the B001 Node/Nest/Express/CommonJS baseline and adds pg 8.23.0, Drizzle ORM 0.45.2 / Kit 0.31.10, PostgreSQL 18.4, OTel API 1.9.1 / trace SDK 2.11.0, Sentry Node 10.73.0 and pg types 8.23.1. See [B002](../../context/aidlc/bolts/B002-foundation.md) for exact identities and observed checks. Published Drizzle declarations failed library checks; application source remains strict with skipLibCheck enabled. A scoped esbuild 0.25.12 override repairs the legacy Kit loader advisory chain; generation/replay is verified. Sentry uses only a local transport and OTel manual spans; no account or remote exporter is used. Human acceptance and full D09/BA-040 compatibility remain pending.
