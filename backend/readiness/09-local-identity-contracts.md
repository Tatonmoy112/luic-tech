# U02/B003 local identity contracts

**Scope:** Implemented BUILD-007/008, DEV-PHYSICAL-BD revision 1. ACC-01/ACC-02/ADM-01/SEC-01 and ownership NFR-08 evidence; human acceptance pending. These fixture choices do not select real merchant identity policy. [B003 evidence](../../context/aidlc/bolts/B003-identity.md).

## Authentication and composition

The private loopback API accepts bearer RS256 access JWTs verified using jsonwebtoken 9.0.3. Verification follows the [library contract](https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback) with an explicit algorithm/issuer/audience allowlist and additional required claim checks. API composition accepts an optional `IDENTITY_PUBLIC_KEY`: base64-encoded RSA SPKI public PEM, minimum 2048 bits. An absent key denies every protected request while foundation health remains available; malformed, private or weak keys fail startup. This is local composition revision 1 over runtime configuration version 2. The API cannot mint tokens or bootstrap staff.

Claims: issuer `urn:luic:synthetic:local`; one string audience `urn:luic:synthetic:customer` or `urn:luic:synthetic:staff`; matching `kind`, exact `<kind>:access` scope, `synthetic=true`, subject `synthetic:` plus 1–100 ASCII letters/digits/dot/underscore/hyphen. `iat`, `nbf`, `exp` are required integral seconds with zero clock tolerance, no future issue time, maximum age/lifetime 300 seconds. Header type JWT, key ID local-rsa-1; embedded/remote key and critical-header overrides are rejected. Staff also requires signed `amr` containing `mfa`. This is synthetic MFA evidence only. Email, role, permission and caller identity headers grant no authority. Local key replacement requires API restart; real JWKS rotation/outage and Auth0 MFA belong to BUILD-034.

No staff account is created on login. Customer first verified access maps `(issuer,subject)` atomically to one active customer; email never merges identities. Blocked/anonymized customer and absent/disabled staff access are denied. Profile output excludes issuer/subject and raw token claims.

## Wire contract

Paths below have prefix `/api/v1`. All protected responses use no-store and safe correlation/problem conventions. UUID identifiers; decimal-string versions, quoted `If-Match` (example `"1"`) for mutations of existing aggregates, and matching response ETag where an aggregate is returned. Missing version 428; malformed input 400; stale version 412; unauthenticated 401 with Bearer challenge; missing permission/inactive account 403; inaccessible owned target 404; cap/duplicate/final-admin conflict 409; unavailable authority 503. Unknown body fields and empty patch bodies fail. No idempotency storage is introduced here: a lost response requires re-reading authoritative state; bootstrap must not be blindly retried after an uncertain commit.

| Route | Input and checks | Success |
| --- | --- | --- |
| GET /customer/profile | Customer identity; owned mapping | 200 id, displayName, phoneE164, version |
| PATCH /customer/profile | If-Match; displayName (1–100), phoneE164 (E.164); either nullable for clearing | 200 same projection with incremented version |
| GET /customer/addresses | Customer identity; owned active rows only | 200 array, at most 10 |
| POST /customer/addresses | Required recipientName, phoneE164, line1, city, countryCode; optional fields below | 201 address projection with id/version |
| PATCH /customer/addresses/{id} | Same fields partially, If-Match; owner predicate | 200 address projection |
| DELETE /customer/addresses/{id} | If-Match; owner predicate; archive and clear defaults | 200 id/version; no physical delete |
| GET /staff/me | Active mapped staff with signed synthetic MFA | 200 id/displayName/status/permissionEpoch/version/current permissions |
| GET /staff/access/roles | access.read | 200 active code/name array, maximum 100 |
| POST /staff/access/accounts | access.manage; subject, displayName 1–100, reason 1–200; issuer fixed to verified actor issuer | 201 id/displayName/status/permissionEpoch/version; no initial grant |
| GET /staff/access/accounts/{id} | access.read | 200 staff projection plus latest 100 assignment IDs/role codes/start/end/revocation times |
| POST /staff/access/accounts/{id}/grants | access.manage; target account If-Match; roleCode, reason, optional future endsAt in millisecond UTC ISO format | 201 updated staff projection and assignmentId |
| POST /staff/access/accounts/{id}/grants/{assignmentId}/revocation | access.manage; target account If-Match and reason | 201 updated staff projection and assignmentId |
| PATCH /staff/access/accounts/{id} | access.manage; target If-Match, status active/disabled and reason | 200 updated staff projection |

Address fields: label up to 50; recipientName/city/area up to 100; line1/line2 up to 200; postalCode up to 20; phoneE164 `+` followed by 8–15 digits, first nonzero; countryCode exactly BD; boolean isDefaultShipping/isDefaultBilling. Optional text fields can be null. Required strings cannot be blank; control characters are rejected. Values are preserved rather than silently normalized. Per-owner parent locking enforces ten active addresses and single defaults; switching a default increments the previous default's version. Archival does not touch future order snapshots.

## Staff policy and database boundaries

The fixed synthetic access_admin role contains access.read/access.manage only; catalog_editor contains catalog.edit/catalog.publish for later catalog authorization. No finance, operations or policy-admin permission is implied. Role/permission definitions have no runtime mutation API. A deployment command creates the first named, signed-MFA staff parent before self-referencing grants and protected audit. It requires commerce_migrator, empty staff storage and no historical bootstrap marker; the unique marker survives disable/revocation. No unauthenticated/public bootstrap route exists.

Every staff operation takes advisory transaction lock `(2002,1)` before reading current account/grants. All implemented access writers follow that order; no authorization cache or external call is used. This intentionally serializes the small local access module. Revocation committed before another operation gets the lock is effective for that operation, including a reused valid JWT. Deadlines retain B002 bounds. Later domain commands must call a reviewed authorization port and preserve equivalent locking/revalidation; a prior `/staff/me` response is not authority.

Self grant/revoke/status changes are forbidden. Each change increments target account version and permission epoch. At least one active, effective, non-expiring access manager must remain. A timed manager cannot disable the final permanent manager. Expired assignments remain historical and must be explicitly revoked before replacement; the unique unrevoked staff/role index conservatively prohibits overlaps.

Seven iam tables and `platform.audit_events` are implemented. Guest order access stays deferred to BUILD-018. The early audit storage is the bounded staff-only portion of the logical dictionary: nonnull actor_staff_id, action, target_id (staff account), reason, summary, correlation_id, created_at. Assignment IDs and before/after version/status are in a bounded safe summary. Runtime may append audit but cannot read, update, delete or truncate it, insert the deployment marker, or change role definitions. Worker has no IAM access. BUILD-012 must extend/reconcile this early audit table for generic actor/target metadata and the dictionary's broader audit projection; it must preserve existing rows. No extra audit table or duplicate bootstrap storage should be created.

No domain-table drift detector, distributed rate store, real identity lifecycle, real MFA/JWKS acceptance, guest/order behavior or production security acceptance is claimed. Forward additive repairs preserve migration history; B002-only readiness rejects the new two-revision history, so application rollback requires compatible readiness code rather than dropping identity/audit facts.

## B004 audit compatibility continuation

BUILD-012 now extends the shared audit table with generic actor/target metadata and generated aliases over the original fields; existing identity writers and stored evidence remain compatible. [B004 catalog contracts](10-local-catalog-contracts.md) describe the added catalog command replay and current-authority port. Identity endpoints retain their existing response/recovery semantics; B004 does not add idempotency keys to them.
