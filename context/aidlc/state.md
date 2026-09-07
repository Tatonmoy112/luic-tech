# AI-DLC current state

**Updated:** 7 September 2026. **Record type:** Current pointer, not an execution log.

| Field | Current value |
| --- | --- |
| Intent | INT-001: Prepare and build the scoped ecommerce backend using AI-DLC |
| Active request | Implement and verify U02 BUILD-007/008 with synthetic local data and local PostgreSQL; update workflow/handoff |
| Current action scope | AUTH-006: B003 identity/access source, migration, local fixtures, tests and routine fixes; excludes frontend, real providers including Auth0, cloud and later tasks |
| AI-DLC activity | Construction: B003 implemented/verified, In review; U02 In progress |
| Product scope | Backend/database/workers/operations; frontend excluded |
| Commerce profile | DEV-PHYSICAL-BD revision 1, synthetic only; optional templates disabled |
| Architecture baseline | Modular backend, eight ownership schemas; seven IAM tables and bounded staff audit implemented out of the 78-table proposed model |
| Implementation status | BUILD-001 through BUILD-008 bounded evidence ready; no task or full requirement human-accepted; later BUILD and all ADAPT behavior pending |
| Active Unit / Bolt | U02 Identity and access / B003 local identity and ownership |
| Bolt verification | Windows: 161 passed / 6 POSIX skips; clean Linux and fresh PostgreSQL: all 167 passed; 6 suites |
| Authorization record | AUTH-006 in audit; AUTH-004/005 retain foundation fix scope; current instruction permits U02 progression without inventing B001/B002 acceptance |
| Human review | Codex implementation and AI self-review complete; applicable human acceptance/reviewer assignment pending |
| Artifact identity | B003-manifest.json: 55 inputs; artifact set ff3a8462b1864e9dfc30bc665ecf1bb0ca21d60f278f8674cbc8a4a6be6194e5 |
| Schema / configuration | Two immutable migrations through 0001_identity, SHA-256 9d7a5f5db79ab27e7d12034882a6e921baa01070d8a66a30319a691dff45177c; config version 2, identity composition revision 1 |
| Runtime evidence | Node 24.19.0/npm 11.17.0; Windows x64 and Linux x64/glibc 2.36; PostgreSQL 18.4 Debian; JWT 9.0.3/types 9.0.10 |
| Local environment | Existing luic-b002-1fbad6effef6 PostgreSQL at 127.0.0.1:61875 preserved; both databases migrated; local synthetic administrator/customer smoke passed; keys/tokens/credentials in ignored .local; verification containers removed |
| Local start gate | Foundation and local identity/ownership proved; catalog/commerce/later integrations remain |
| Real integration/production gates | BUILD-034 real Auth0/JWKS/MFA and I/P/D01-D16 evidence remain pending per capability |
| Tooling | Markdown AI-DLC and local scripts/tests; no workflow plugin/harness, subagents or CI enforcement installed |

## Resume next

Read [B003 evidence](bolts/B003-identity.md), [U02](units/U02-identity.md), [identity contracts](../../backend/readiness/09-local-identity-contracts.md), [run guide](../../README.md) and actual diff. Preserve historical B001/B002 manifests; current artifact identity is [B003](evidence/B003-manifest.json). Do not repeat database/key setup destructively or rerun the one-time administrator bootstrap. Mint a fresh five-minute local token when needed.

Human review of the concrete B003 artifacts is pending. AUTH-006 authorizes routine U02 BUILD-007/008 fixes/verification without another permission ceremony. Next planned local implementation is U03 starting BUILD-009 with its own bounded instruction. BUILD-034, ADAPT-008, guest/order access and all later tasks remain outside this authorization. U01/B001/B002 human acceptance is unchanged.

## Known limits and pending decisions

Local RS256/MFA claims are synthetic evidence only. Missing verification key denies protected access; absent/malformed/currently ungranted identities cannot become allow. Every access operation reloads PostgreSQL grants under the local access lock; no distributed authorization cache or performance acceptance is claimed. Staff-only early audit must be extended/reconciled for generic actor/target metadata in BUILD-012 while preserving evidence. No generic idempotency/outbox, guest order access, role-definition API, real issuer rotation, optional policy administration or production security is implemented. Order/address snapshot evidence awaits orders.

Source remains strict TypeScript with skipLibCheck for Drizzle declarations and the documented scoped esbuild override. Final clean audit reported zero known vulnerabilities; legacy deprecations remain. Migration checks cover history and ownership-schema presence rather than arbitrary table/index drift. B002-only readiness rejects the new migration history; rollbacks require compatible application code, not deletion of identity/audit facts.

## State maintenance

Keep audit, Unit/Bolt evidence, BUILD/DBT references, traceability and status board consistent with observed results. Passing checks do not imply acceptance; later planned capability is not implemented capability.
