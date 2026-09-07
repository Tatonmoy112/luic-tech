# REST API contract design

## Contract stance

The Release 1 contract is REST over HTTPS with a reviewed OpenAPI document. The baseline prefix is `/api/v1`. Resource names are nouns; commands that represent guarded business transitions use explicit action subresources when ordinary resource replacement would hide their preconditions.

The public contract, staff contract, and machine integration contract share error/correlation conventions but have separate security schemes, rate limits, documentation audiences, and exposure paths.

## API surfaces

| Surface | Route family | Caller | Authentication | Cache rule |
| --- | --- | --- | --- | --- |
| Public discovery | `/api/v1/store/*` | Next.js web service | trusted service identity plus anonymous customer context as needed | explicit public/private policy per operation |
| Customer | `/api/v1/customer/*` | Next.js session boundary | Auth0-derived customer principal or verified guest capability | private, no shared cache |
| Staff | `/api/v1/staff/*` | staff web session boundary | Auth0 staff principal plus current application grants | private, no shared cache |
| Provider callback | `/api/v1/integrations/sslcommerz/*` | SSLCOMMERZ | provider validation controls, network/WAF policy, payload verification | never cache |
| Operations | `/api/v1/operations/*` | restricted service/operator path | workload identity or privileged staff permission | never public/cache |
| Health | `/health/live`, `/health/ready` | ECS/load balancer/operations | network restricted; minimal public detail | never cache |

Edge exposure and web-to-API identity are decisions BA-007 and BA-008. Backend-only access and first implementation schemas are specified in the [readiness contracts](readiness/06-initial-api-contracts.md). Route names may change during OpenAPI review; ownership and security separation must remain.

## Common request contract

- Accept and return JSON unless an operation explicitly issues an upload/download grant.
- Require a supported content type and cap body, header, query, path, and multipart metadata sizes.
- Reject unknown fields on command payloads after compatibility policy is approved.
- Normalize only fields with a documented normalization rule; preserve customer display values separately.
- Use ISO 8601 timestamps with offsets in contracts and UTC instants internally.
- Represent money as an amountMinor decimal integer string plus currency; bigint versions are strings too. Quantities remain bounded JSON integers. Never convert unrestricted PostgreSQL bigint to JavaScript Number.
- Represent opaque UUID/resource references as strings and never expose database sequence assumptions.
- Send and return a correlation identifier; reject attempts to inject an invalid or oversized value.
- Use a canonical request representation for idempotency hashing that excludes transport-only headers and volatile metadata.

## Response and error contract

Success shapes are operation-specific and documented. Errors use one problem-details shape with:

- stable machine code;
- HTTP status;
- safe title and customer/staff-appropriate detail;
- request path and correlation ID;
- optional field violations using stable field/code pairs;
- optional retry guidance when safe;
- no stack, SQL, provider credentials/payload, internal host, secret, or unnecessary personal data.

| Status | Meaning in this system |
| --- | --- |
| 400 | malformed syntax, unsupported content, or invalid transport shape |
| 401 | authentication absent, expired, or invalid |
| 403 | authenticated caller lacks action authority; use carefully to avoid record enumeration |
| 404 | resource absent or deliberately hidden from this caller |
| 409 | state conflict, duplicate business reference, changed idempotent payload, or merge conflict |
| 412 | version/precondition does not match current aggregate |
| 422 | well-formed request violates a business eligibility or reconfirmation rule |
| 429 | caller exceeded a named rate or abuse boundary |
| 503 | required authoritative dependency unavailable; response does not claim a write succeeded |

Never translate all database errors to 500. Map known constraint, timeout, serialization, and conflict outcomes to stable domain codes while retaining redacted internal evidence.

## Concurrency and idempotency

| Operation class | Client contract | Backend contract |
| --- | --- | --- |
| Checkout submission | required `Idempotency-Key` and confirmed quote identity | same actor/operation/key/hash returns same outcome; different hash conflicts |
| Payment attempt/session request | stable attempt/reference and idempotency where provider supports it | unknown initiation reconciled before creating another charge path |
| Refund approval/submission | version precondition plus stable refund reference | reserve balance once; provider submission history preserved |
| Stock adjustment/import effect | operation key plus expected stock version | one movement/effect per operation key |
| Staff aggregate edit | `If-Match` or explicit expected version | guarded update; return current version/conflict guidance safely |
| Lifecycle transition | expected state/version and reason where required | only declared edge executes; repeated terminal effect is stable |

Idempotency keys are scoped by surface, actor, operation, and approved retention. They are not authorization credentials and must not contain PII.

## Pagination, filtering, and sorting

- Default to keyset/cursor pagination for changing operational lists and large catalog results.
- Cursor contents are signed or opaque, versioned, filter-bound, and expire when required.
- Cap page size and total export scope independently.
- Allow only documented sort and filter fields; never pass arbitrary field names to SQL or OpenSearch.
- Return stable ordering with a unique tie-breaker.
- Include next cursor and applied filter summary; avoid expensive exact total counts unless the product needs them.
- Staff exports use asynchronous jobs rather than raising API timeouts or pool pressure.

## Endpoint inventory

This is the design inventory for OpenAPI planning, not implemented routes.

### Store discovery

| Method and resource | Purpose | Authority/source | Key controls |
| --- | --- | --- | --- |
| `GET /store/categories` | published navigation tree | PostgreSQL/internal cache projection | source publication filter; no-store under strict publication baseline |
| `GET /store/products` | published listing by category/filter | OpenSearch or bounded fallback | approved filters, cursor, stale indication |
| `GET /store/products/{slug}` | published product/variant detail | PostgreSQL/cache projection | versioned cache, no draft leakage |
| `GET /store/search` | keyword/facet/sort results | OpenSearch | query bounds, timeout, degraded response |
| `GET /store/search/suggestions` | bounded autocomplete | OpenSearch | minimum/maximum query length and result cap |

Under the strict publication baseline, all discovery API responses use no-store. Internal caches may supply candidates, but product/category/search/autocomplete responses apply current source publication checks before releasing content. Suggestions retain product references for filtering rather than exposing unchecked stale completion strings. A shared public response cache requires an explicit approved staleness policy.

### Customer identity, cart, and checkout

| Method and resource | Purpose | Required controls |
| --- | --- | --- |
| `GET/PATCH /customer/profile` | read/update owned profile | authenticated owner, field/version validation |
| `GET/POST /customer/addresses` | list/create saved address | authenticated owner, capped count |
| `PATCH/DELETE /customer/addresses/{id}` | edit/remove owned address | ownership and expected version |
| `GET /customer/cart` | get owned active cart | customer/guest owner context |
| `POST /customer/cart/items` | add variant | cart version, quantity/product validation |
| `PATCH/DELETE /customer/cart/items/{id}` | change/remove line | ownership and expected cart version |
| `POST /customer/cart/merge` | merge verified guest cart | explicit conflict/quantity policy, idempotency |
| `POST /customer/checkout/quote` | calculate authoritative review | full validation, no mutation/stock promise |
| `POST /customer/checkouts` | create order/reservation/attempt | idempotency key, confirmed quote, T02 transaction |
| `GET /customer/checkouts/{id}` | retrieve stable attempt outcome | actor ownership; safe pending state |
| `POST /customer/payment-attempts/{id}/session` | create hosted session intent; return 202 with status reference | attempt eligibility, idempotency and unknown-call protection |
| `GET /customer/payment-attempts/{id}/session` | retrieve current state and authorized unexpired hosted URL | order ownership, no-store, URL redaction |

### Customer orders and returns

| Method and resource | Purpose | Required controls |
| --- | --- | --- |
| `GET /customer/orders` | owned order history | authenticated owner, cursor, minimal fields |
| `GET /customer/orders/{reference}` | owned order detail | ownership; separate state dimensions |
| `POST /customer/orders/{reference}/guest-access` | exchange guest capability for masked view | hash verification, expiry, rate limit, rotate/revoke policy |
| `GET /customer/orders/{reference}/payment-status` | safe authoritative status | owner/guest permission; browser return not authority |
| `POST /customer/orders/{reference}/cancellation-requests` | request eligible cancellation | state/policy/idempotency |
| `POST /customer/orders/{reference}/returns` | request return lines | ownership, window, cumulative quantity, idempotency |
| `GET /customer/returns/{reference}` | return/refund progress | ownership and masked staff/internal details |

### Staff catalog, inventory, and operations

| Route family | Representative operations | Controls |
| --- | --- | --- |
| `/staff/catalog/products` | list/create/detail/edit/publish/archive | catalog permission, expected version, audit |
| `/staff/catalog/variants` | variant/SKU/attribute lifecycle | uniqueness, publication and archive rules |
| `/staff/catalog/media` | upload grant/status/approve/reject/order | private object access, scan state, audit |
| `/staff/content` | create/edit revision, approve/publish/schedule/archive content | content permission, schema bounds, immutable published revision, audit and publication filter |
| `/staff/pricing/prices` | schedule/activate/close prices | finance/catalog permission, interval guard |
| `/staff/promotions/coupons` | campaign lifecycle/utilization | caps, dates, target rules, audit |
| `/staff/inventory/positions` | list/detail/movement history | inventory permission, data minimization |
| `/staff/inventory/adjustments` | append adjustment | operation key, expected version, reason, threshold |
| `/staff/orders` | list/detail/hold/cancel/resolve | scoped permission, state/version/reason |
| `/staff/shipments` | eligible queue and transitions | fulfillment permission and dispatch guards |
| `/staff/returns` | approve/receive/inspect/resolve | policy, quantity, version, disposition |
| `/staff/refunds` | request/approve/reject/status | finance authority, threshold/separation, balance guard |
| `/staff/payments` | attempts/exceptions/reconciliation | finance-only evidence view, redaction |
| `/staff/settlements` | upload/import/match/reconcile | private source, approval, audit |
| `/staff/reports` | bounded synchronous summaries | definition, freshness, timezone, scope |
| `/staff/exports` | create/status/download grant | export permission, async job, private expiry, audit |
| `/staff/imports` | create/upload/validate/approve/apply/status | data owner approval, dry run, idempotent rows |
| `/staff/access` | staff/role/grant management | administrator plus separation rules, MFA, audit |
| `/staff/operations` | job/DLQ/reindex/replay/invariant views | service-operator permission, bounded audited action |

### Provider and operational endpoints

| Method and resource | Behavior |
| --- | --- |
| `POST /integrations/sslcommerz/ipn` | bound payload, derive safe receipt fingerprint, persist receipt, respond according to durable-intake result, enqueue validation |
| `GET/POST /integrations/sslcommerz/return/{outcome}` | treat as navigation signal and direct web to backend-derived status; never apply payment success |
| `GET /health/live` | process alive; no dependency or sensitive detail |
| `GET /health/ready` | role can serve safely; dependency checks are bounded and role-specific |

## OpenAPI governance

- Give every operation a stable ID, audience, owner, requirement IDs, permission, request/response schema, error set, idempotency statement, cache rule, rate class, audit rule, and sensitive-data classification.
- Review contract diffs in delivery changes and classify additive, behavior-changing, or breaking.
- Keep examples fictional and include failure, conflict, pending, and degraded cases.
- Generate client artifacts only from an accepted contract in future implementation work; generated output is never the policy source.
- Run schema linting, duplicate operation-ID checks, compatibility checks, and authorization inventory checks before promotion.

## API lifecycle

Version the public contract at the path boundary for Release 1. Prefer additive changes within `v1`. Deprecation requires an owner, usage evidence, replacement path, communicated date, monitoring, and removal decision. Internal implementation refactoring does not create an API version; a changed client-visible meaning may.
