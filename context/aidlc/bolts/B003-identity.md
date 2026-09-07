# B003: Local identity and ownership

| Field | Value |
| --- | --- |
| Bolt / Unit / intent | B003 / U02 / INT-001; BUILD-007/008 |
| Phase / status | Construction / In review; BUILD-007/008 implemented and verified |
| Authorization | AUTH-006, explicit 7 September 2026 user instruction; local synthetic PostgreSQL implementation, verification and handoff |
| Profile | DEV-PHYSICAL-BD revision 1 |
| Owner/reviewer | Codex implementation and AI self-review; human acceptance pending |
| Inputs | [U02](../units/U02-identity.md), [B002](B002-foundation.md), [BUILD sequence](../../../backend/readiness/05-implementation-sequence.md), [security](../../../backend/08-security-and-access.md), [contracts](../../../backend/readiness/06-initial-api-contracts.md), [dictionary](../../../database/03-data-dictionary.md), [integrity](../../../database/04-integrity-and-transactions.md), [audit rules](../../../database/07-security-privacy-and-audit.md) |
| Stage selection | Context, access/migration design, implementation, negative/race/failure verification and handoff; frontend/provider/cloud stages omitted by user scope |

## Plan before implementation

1. Preserve clean starting files and historical B001/B002 manifests; record AUTH-006 without converting prior review into acceptance.
2. Add immutable additive migration for seven non-order iam tables and append-only audit storage, explicit runtime grants, keys/constraints/indexes, and readiness identity for both migrations.
3. Add maintained pinned JWT verification with isolated local RS256 keys, fixed issuer and customer/staff audiences, expiry/not-before/required claims and MFA checks. No public issuer or bootstrap endpoint; deployment-only bootstrap verifies a signed synthetic staff token, creates parent before self-grants, records provenance atomically and can succeed only once.
4. Implement customer mapping/profile/address CRUD with bounded field allowlists, owner predicates, parent locks, address count/default constraints and If-Match versions. Implement staff provisioning/grant/revocation/status operations using current PostgreSQL permissions and audited, serialized transactions; prevent self privilege changes and preserve a final administrator.
5. Prove invalid token/claims/role and cross-user denial, blocked accounts, stale edits, bootstrap replay/race, unique concurrent mapping, address cap/default races, revocation versus mutation, immutable audit and rollback. Run existing foundation checks and fresh Linux/PostgreSQL suite where available.
6. Review actual diff and evidence; update BUILD/DBT references, traceability, status, state, manifest and handoff. Keep In review pending human acceptance.

## Acceptance and execution evidence

Executed 7 September 2026, Asia/Dhaka, under AUTH-006. Starting HEAD `4986b1b62e0d79b1baa2bb1f7cb673d383e52c8a`, clean working tree. Codex performed implementation and AI self-review; no independent/human acceptance, commit or deployment is claimed. The implementation lives in `apps/commerce-api/src/identity`, reviewed `0001_identity.sql`, two local operator scripts, updated foundation error/readiness handling and `tests/identity.test.cjs`. The [wire/security contract](../../../backend/readiness/09-local-identity-contracts.md) records exact fields, errors, local policies and limits.

Current artifact set: **55 inputs**, SHA-256 `ff3a8462b1864e9dfc30bc665ecf1bb0ca21d60f278f8674cbc8a4a6be6194e5`; lock SHA-256 `b92a712f8ab017ae8254bea2932d96c718861d1496231021a9619bea10bf51d6`. All 55 hashes were checked against actual files; historical B001/B002 manifests and 0000 migration matched HEAD. Handoff validation checked 17 changed/new Markdown documents for local links and table structure.

| Scenario / requirement | Expected | Observed |
| --- | --- | --- |
| Migration / BUILD-007, DBT-029/031 | Seven non-order IAM tables, protected audit and FK-safe parent order; replay and clean rebuild | Existing local/test B002 history upgraded to two revisions; fresh PostgreSQL built both; concurrent replay, immutable history and failed migration rollback passed |
| First administrator / BUILD-007 | Verified staff token, deployment role, one atomic bootstrap, auditable self-grants | Customer token and API role denied; injected audit failure left zero staff; two migrator runners produced exactly one success and one marker; replay and missing public bootstrap route denied |
| Token matrix / ACC-01, SEC-01 | Signature/issuer/audience/algorithm/time/claims/type/kid required, staff MFA enforced | Wrong key/issuer/audience, multi-audience, expired/future/missing times, blank/real subject, wrong scope/kind, non-synthetic, excessive lifetime, wrong key ID/type, HMAC confusion, unsigned/malformed and absent credentials rejected; no caller header/role claim escalation |
| Composition / SEC-01 | Local-only public verification key; missing authority fails closed | Missing key denied tokens; malformed/private key rejected; existing configuration suite rejects nonlocal/real-provider composition |
| Customer mapping / ACC-02 | Unique issuer/subject under concurrent first access; email never authority | Five parallel requests returned one customer ID; second subject with identical email remained separate; minimal output omitted issuer/subject |
| Profile / BUILD-008 | Bounded owner edits, exact versions, inactive denial | Unknown/protected fields, empty/oversized/malformed edits and missing/stale versions denied; nullable clearing passed; blocked/anonymized denied; race at version 9,007,199,254,740,993 admitted one update and returned exact next string |
| Addresses / ACC-02, NFR-08 ownership | Owned CRUD/archive, ten-address ceiling, one default of each kind, no stale overwrites | Cross-user PATCH/DELETE hidden with 404; other list empty; archive retained row; invalid country/field/type/length denied; last-slot race returned 201/409; concurrent defaults remained unique; old default version invalidated |
| Staff grants / ACC-01, ADM-01 | PostgreSQL grants govern every operation; no self escalation or accidental finance role | Unlinked and ungranted staff denied; catalog editor lacked access management; administrator had only access.read/manage; duplicate/stale/self mutations denied |
| Revocation and time / BUILD-008 | Current permissions, no cache-based allow, permanent administrator retained | Reused signed token lost access on next request after revocation/disable; expired grant denied; timed manager could not disable last permanent manager |
| Revocation race / SEC-01 | Revocation admitted before a queued grant blocks that grant | Both requests observed waiting on PostgreSQL advisory lock; release yielded revoke 201 and revoked actor grant 403; no target grant persisted |
| Audit and rollback / BUILD-007/008 | Access change/version/epoch/audit atomic, history protected | Injected audit failure left no assignment and unchanged version/epoch; successful create/grant/revoke/status produced four events; stale replay added none; runtime read/update/delete/truncate and bootstrap marker insertion denied; runtime role-definition writes and worker IAM reads denied |
| Dependency loss / SEC-01 | No authorization on unavailable PostgreSQL | Protected access returned 503; safe logs omitted token, subject, contact/address, private keys and injected raw error |
| Local operator smoke | Setup preserves keys, bootstrap once, signed staff/customer work through HTTP | Local setup and initial bootstrap succeeded; staff/me and customer/profile each returned 200/version 1; CLI bootstrap replay refused with original audit retained |
| Foundation regression | B002 transaction/error/drain/precision behavior retained | All existing tests passed on Windows/Linux, including Linux signal cases; module boundaries/cycles and Drizzle generation/replay passed |

**Windows final:** `npm.cmd run check`: 6 suites, **161 passed, 6 POSIX skips, 167 total**, 23.115 seconds. **Clean Linux final:** `node scripts/verify-postgres.cjs`: 6 suites, **167 passed, no skips**, 26.383 seconds. Fresh locked install added 454 packages, audited 458; dependency graph had no invalid/missing dependencies; final audit reported zero known vulnerabilities. This does not constitute full security acceptance.

**Runtime:** Retained Node 24.19.0/npm 11.17.0/Nest 11.2.3/Express 5.2.1/TypeScript 5.9.3/CommonJS, pg 8.23.0/Drizzle 0.45.2/Kit 0.31.10 and PostgreSQL 18.4 Debian. Linux x64/glibc 2.36; exact Node/PostgreSQL image digests remain pinned in the existing verification script. Added jsonwebtoken **9.0.3** and @types/jsonwebtoken **9.0.10**, with registry integrity recorded in the [B003 manifest](../evidence/B003-manifest.json). Registry metadata and the [official verification API](https://github.com/auth0/node-jsonwebtoken#jwtverifytoken-secretorpublickey-options-callback) were checked; this library performs offline verification and makes no Auth0/provider call.

**Schema:** `0000_foundation` remains byte-identical; `0001_identity` SHA-256 `9d7a5f5db79ab27e7d12034882a6e921baa01070d8a66a30319a691dff45177c`. Runtime configuration remains version 2; local identity composition revision 1 adds the optional public key. Profile remains DEV-PHYSICAL-BD revision 1. Readiness requires both exact hashes and all eight ownership schemas. Existing B001/B002 manifests remain historical and unchanged; current inventory generation writes B003 only.

### Repairs and review

The first build found that published JwtHeader typings omit `jwk`; an explicit property-existence check now rejects embedded key claims. The first targeted run passed 34/36; two missing-claim fixtures were rejected by the signing library before reaching the verifier. Corrected fixture construction to omit absent properties and added missing-iat coverage; all 37 identity tests then passed. No authorization assertion was weakened. Registry/Docker checks needed scoped host execution; local database access and test commands succeeded. The existing developer container and databases were preserved; disposable Linux verification containers were removed.

AI self-review checked signature-versus-claims separation, current PostgreSQL identity/grants, owner predicates, lock order, version precision, immutable migration history, initial actor provenance, audit privileges/rollback and safe projections/logs. The early staff-only audit schema deliberately implements a bounded subset of the logical dictionary; BUILD-012 must extend/reconcile actor/target fields without replacing existing evidence. This compatibility obligation is recorded in the contract and canonical task sequence.

### Limits

Real issuer/JWKS rotation/outage and real MFA/revocation integration remain BUILD-034. Local configuration only, fixed synthetic roles, no role-definition mutation, policy administration, distributed rate store or production acceptance. Staff access is serialized by one local advisory lock; no capacity claim. Staff grant detail is bounded to the latest 100 rows; audit remains a restricted database/operator surface. Address changes do not yet prove order snapshots because orders are outside this scope. No generic idempotency/outbox is added; uncertain results require authoritative reads. Schema readiness checks history/schemas, not arbitrary table/index drift. The early audit is staff-only, and future BUILD-012 must preserve/extend it. Compiler/dependency limitations from B002 remain.

## Closure and next context

BUILD-007/008 and B003 are **In review** with technical evidence ready. U02 remains In progress because real integration/policy extensions are excluded and human acceptance is pending. B001/B002 and U01 human acceptance are unchanged. AUTH-006 carries forward for routine B003 fixes/verification; no later Unit/provider/cloud work is authorized. Next planned local slice is U03 starting BUILD-009, with its own bounded instruction. BUILD-034 separately requires real Auth0 evidence and authorization. Resume from [state](../state.md), this record, the manifest, contracts and actual diff; do not recreate databases or rerun bootstrap as initialization.
