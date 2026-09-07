# Backend security and access design

## Trust boundaries

| Boundary | Trust decision |
| --- | --- |
| Browser to edge | all input is untrusted; TLS, WAF, size/method/rate policies apply |
| Edge to Next.js | only configured origins/routes; secure browser session remains at the web boundary |
| Web to API | authenticate workload and propagate a bounded verified user context/token under the accepted design |
| Provider to callback | route/network controls reduce noise; only server validation establishes payment truth |
| API/worker to PostgreSQL | private network, workload-specific credentials, least privilege, TLS |
| Worker to SQS/S3/provider | IAM/secret scoped per runtime role and queue/object prefix/egress need |
| Operator to service/data | named identity, MFA, least privilege, approved break-glass, audit |

## Authentication design

### Customer and staff

1. Auth0 authenticates the external identity using the approved flow.
2. The API validates token signature against trusted keys and checks issuer, audience, expiry/not-before, algorithm, and required scopes/claims.
3. The backend maps `(issuer, subject)` to an active application customer or staff account.
4. The application loads effective role grants/revocation state within the approved freshness bound.
5. The command authorizes action and record ownership against current business state.

Customer and staff identities use separate audience/client/scope policy where feasible. Admin MFA is an Auth0/tenant requirement plus an application check for sensitive staff access. The backend never stores passwords or treats email as the immutable identity key.

### Workload identity

Web, API, and worker tasks use AWS workload identity for AWS resources. Inter-service calls use the selected private network and workload authentication design; they do not share human credentials or accept a caller-supplied role name.

### Guest capability

A guest order link contains a high-entropy random capability delivered only through an approved channel. Store its cryptographic hash, order, purpose, expiry, issuance, revocation, and use metadata. Verification is constant-time where applicable, rate-limited, masked, and protected from enumeration. Rotation invalidates the prior active capability under policy.

## Authorization model

An authorization decision includes:

- actor type and active account;
- permission code and current grant version;
- action and target resource;
- ownership or operational scope;
- aggregate state and hold status;
- amount/export threshold;
- requester/approver separation or dual approval;
- environment and support/break-glass context.

Controllers declare the required application permission but do not decide row ownership. Application use cases enforce ownership in the authoritative load/update predicate.

## Proposed permission families

| Family | Representative permissions |
| --- | --- |
| Catalog | read internal catalog, edit product, publish/archive, manage price, approve media |
| Inventory | view position/ledger, adjust stock, approve high-value adjustment, apply opening balance |
| Order/support | view scoped order, place/release hold, request cancellation, view masked customer data |
| Fulfillment | view eligible queue, pick, pack, dispatch, record delivery exception |
| Return | review, approve/reject, receive, inspect, resolve |
| Finance | view payment evidence, resolve exception, request/approve refund, reconcile settlement |
| Reporting | view report, create export, access sensitive export, view finance report |
| Access | view staff, grant/revoke role, manage permission definitions |
| Operations | view health/jobs/DLQ, replay bounded work, request reindex, invoke repair |

Exact codes, combinations, thresholds, and separation rules require approval. Platform administrator is not automatically a finance approver.

## Resource ownership controls

- Customer profile/address/cart/order/return queries include the current customer ID in the predicate.
- Guest access loads by order plus valid token hash/purpose/expiry and returns a reduced view.
- Staff scopes are explicit; a broad list permission does not automatically grant full PII or provider evidence.
- Objects in S3 require an authorized backend decision before a short-lived upload/download grant.
- OpenSearch results are for public discovery only and never answer customer ownership or staff authorization.
- Valkey authorization caches include account/grant version and short TTL; sensitive commands may require authoritative refresh. Failure cannot become allow.

## Input and output security

- Validate allowlisted fields, Unicode/normalization policy, length, count, range, enum, content type, and nested depth.
- Reject unsafe dynamic sort/filter/template/SQL identifiers.
- Encode output for its target context; backend stores validated content while frontend still escapes rendering.
- Product rich content uses an approved sanitized format and rendering contract.
- Free-form notes are bounded, access restricted, and excluded from routine telemetry/events.
- CSV import treats formulas, encodings, delimiters, archive bombs, duplicate headers, and oversized rows as explicit threats.
- CSV export neutralizes spreadsheet formula execution under the approved export format.
- SSRF controls apply to any future remote-media fetch; Release 1 should prefer direct controlled upload.

## HTTP and session controls

- TLS only, secure headers, explicit CORS allowlist, and no credentialed wildcard origin.
- Secure, HttpOnly, SameSite cookie policy at the web session boundary and CSRF protection for cookie-authenticated state changes.
- Access tokens never appear in URLs, logs, analytics, or browser-readable storage under the accepted web design.
- Public and protected cache headers are explicit; cart, account, checkout, order, staff, callback, and errors are never shared-cacheable.
- Redirect targets are allowlisted, especially after Auth0 and payment returns.
- Correlation IDs, idempotency keys, filenames, and human references are syntax/size bounded.

## Provider callback security

1. Isolate the path, method, media type, size, rate, and network controls.
2. Do not log the raw callback.
3. Persist a bounded redacted receipt and unique fingerprint before successful acknowledgement.
4. Validate through the provider-approved server validation mechanism.
5. Match merchant, environment, application reference/transaction, expected amount, BDT currency, status, and risk result.
6. Reject or quarantine unexpected card data or secrets.
7. Use current state and database locks before any payment/order/stock transition.
8. Monitor forged/mismatched/replayed/burst patterns without blocking legitimate reconciliation blindly.

## Secrets and configuration

Secrets live in the approved AWS secret/config service, encrypted and scoped to the runtime role. Separate local, development, staging, sandbox, and production values. Validate presence and format at startup without emitting values. Rotation plans cover overlapping credentials, rollback, provider coordination, and task restart. No secret belongs in source, container image, migration, database table, queue payload, trace, error, fixture, diagram, or support ticket.

## Data protection

Use the classifications in [database security](../database/07-security-privacy-and-audit.md). Apply encryption in transit and at rest, narrow column selection, role-based masking, private object storage, short-lived grants, bounded retention, legal hold, and controlled anonymization. Field encryption is added only with an approved query/key rotation/recovery design.

## Abuse and rate classes

| Class | Examples | Key dimensions |
| --- | --- | --- |
| Public read | listing/search/autocomplete/product | edge IP/risk, query, global dependency capacity |
| Guest verification | guest order capability | IP-derived key, order reference, token failure pattern |
| Identity | login callback/account endpoints | Auth0 protections plus account/IP-derived signals |
| Cart | line changes/merge | owner, cart, IP-derived signal |
| Checkout/payment | quote, checkout, payment session | actor, cart/order, idempotency key, global/provider capacity |
| Provider callback | IPN | network/source signal, merchant, transaction fingerprint, global burst |
| Staff write | publish/adjust/transition/refund | staff, permission, target, amount/action risk |
| Export/operations | export, replay, reindex | staff, scope, concurrent job and daily volume |

Valkey may support distributed counters, but outage behavior is specified per class. High-risk operations also rely on database uniqueness/state constraints; cache failure never removes the business guard.

## Audit policy

Audit all actions identified in database security with actor, action, target, reason, safe change summary, correlation, and time. Domain state histories and stock/payment/refund evidence remain separate and linked. Runtime actors cannot update/delete audit. Sensitive read/export audit follows D13 policy.

## Security verification scenarios

- invalid signature, issuer, audience, expiry, algorithm, and scope;
- inactive customer/staff and revoked grant within target bound;
- customer A attempts every read/write against customer B identifiers;
- guessed/expired/revoked/forwarded guest capability and brute-force pattern;
- support attempts refund approval, catalog attempts stock adjustment, platform admin attempts business approval;
- missing/invalid CSRF and disallowed CORS origin for cookie-authenticated flow;
- mass assignment, unknown fields, oversized/nested payload, unsafe filter/sort;
- callback forgery, duplicate, wrong merchant/environment/amount/currency, and risk hold;
- object-key guessing, expired signed URL, unapproved media, private export access;
- CSV formula, malformed encoding, duplicate SKU, oversized row/file, and partial failure;
- logs/traces/errors/events inspected for secrets and PII;
- break-glass and DLQ replay are attributable and bounded;
- API/worker database and IAM roles cannot exceed their declared resources.
