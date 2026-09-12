# U02: Identity and access

| Field | Value |
| --- | --- |
| Unit / intent | U02 / INT-001 |
| Status | In progress |
| Authorized scope | AUTH-006: BUILD-007/008, synthetic local data and local PostgreSQL; explicit user request 7 September 2026 |
| Requirements | ACC-01, ACC-02, ADM-01, SEC-01; ownership portion of NFR-08 |
| Design inputs | BE-053 through BE-060, BE-063 through BE-067; DBT-029/031; database dictionary, integrity and security rules |
| Profile | DEV-PHYSICAL-BD revision 1, synthetic only |
| Ownership | API identity module owns seven iam tables; protected platform audit records |
| Dependencies | Verified B002 BUILD-005 technical foundation; human foundation acceptance remains pending |
| Owner/reviewer | Codex implementation and AI self-review; human acceptance pending |
| Exclusions | BUILD-034 real Auth0, ADAPT-008 policy administration, guest_order_access (BUILD-018), frontend, providers, cloud and later Units |

## Inception and Bolts

B003 is implemented and verified, **In review**: Windows 161 passed/6 POSIX skips; clean Linux/fresh PostgreSQL 167 passed. See the Bolt and manifest for source/schema/runtime identity, failures/repairs and exact scenarios. U02 remains In progress; BUILD-034 and ADAPT-008 are excluded, and human acceptance is pending. AUTH-006 continues for BUILD-007/008 fixes. AUTH-007 subsequently authorized U03; [B004](../bolts/B004-catalog.md) now records its verified catalog evidence. This does not change U02 acceptance or later identity scope.

[B003](../bolts/B003-identity.md) implements verified local identity, owned profiles/addresses and current staff grants. Separate customer/staff token audiences, database authorization on every operation, and deployment-only first-admin bootstrap preserve identity boundaries. An email never links accounts. Local administrator permissions do not include finance authority.

Synthetic contract refinements: at most ten active saved addresses, BD addresses, E.164 phone, bounded editable profile/address fields, optimistic decimal-string versions, explicit default switching, short-lived RS256 access tokens and staff MFA evidence. These are fixture rules, not merchant acceptance. Access mutations serialize before loading actor/target grants; customer mutations lock the customer parent before addresses. No external calls occur under locks.

BUILD-034 and ADAPT-008 remain future, separately authorized Bolts. No human acceptance is inferred from this instruction or tests.
