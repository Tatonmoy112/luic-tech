# Requirement traceability matrix

**Current coverage:** B001/B002 supply partial foundation evidence; B003 supplies local identity/access; B004 adds catalog lifecycle, synthetic media metadata, exact prices and atomic command evidence. B005 adds bounded stock ledger and owned-cart evidence. No full row is accepted.

The [AI-DLC execution map](../aidlc/execution-map.md) assigns every BUILD outcome and ADAPT addition to a primary Unit. Each Bolt links the exact requirement IDs below to its task/substeps, canonical design and actual evidence. The matrix remains the product acceptance index; Unit membership alone is not requirement coverage or acceptance. Future scoped extensions must receive their own valid requirement IDs before acceptance.

| Requirement | Primary task groups | Primary acceptance evidence | Status |
| --- | --- | --- | --- |
| CAT-01 | DES-006, CAT-001 through CAT-011, WEB-002 through WEB-005; BUILD-009 through BUILD-013 | B004 catalog lifecycle/publication evidence; B005 eligible product-to-cart observations, exact estimates and stale warnings; frontend pending | In progress |
| MED-01 | MED-001 through MED-006, WEB-004, MIG-006; BUILD-009/011 | B004 guarded approved metadata and product/variant mapping; actual upload/inspection/private delivery remains BUILD-030 | In progress |
| SRCH-01 | SYS-013, SEA-001–SEA-009 | Query/facet/freshness/delete/outage/reindex suite | Planned |
| ACC-01 | GOV-006, IAM-001–IAM-012, QLT-003; BUILD-007/008 | B003 synthetic token/MFA-claim/current-grant/revocation matrix; real Auth0/JWKS/MFA remains BUILD-034 | In progress |
| ACC-02 | DES-003/005, IAM-004–IAM-009, ORD-001; BUILD-007/008 | B003 customer mapping/profile/address evidence; B005 customer/guest cart ownership and replay denials; guest order/snapshots pending | In progress |
| CART-01 | CART-001–CART-010; BUILD-015 | B005 owner-only persistence/item lifecycle, explained merge/clamp/cap conflict, expiry/replay/races and restart; cache/frontend acceptance pending | In progress |
| CHK-01 | SYS-008/010, PRC-001–PRC-007, CHK-001–CHK-012, QLT-004 | Authoritative total, tamper, idempotency and rollback suite | Planned |
| INV-01 | SYS-009, INV-001–INV-013, CHK, PAY, RET stock tasks; BUILD-014 | B005 ledger/guarded adjustment/roll-forward/contention/revocation and atomic failure evidence; reservation/expiry/allocation/restock pending | In progress |
| PAY-01 | PAY-001–PAY-012, PAY-019/020, QLT-005 | Initiation/callback/validation mismatch and success suite | Planned |
| PAY-02 | PAY-013–PAY-020, RET refund tasks, RPT-004/006 | Late/double/unknown/settlement reconciliation suite | Planned |
| ORD-01 | SYS-007, CHK-007/008, ORD-001–ORD-007, FUL | Snapshot/state/history and invalid-transition suite | Planned |
| SHIP-01 | GOV-007, PRC-002, FUL-001–FUL-010 | Zone, eligibility, pick-pack-track-deliver/exception suite | Planned |
| RET-01 | GOV-008, RET-001–RET-019, QLT-006 | Cancellation/return/inspection/concurrent-refund suite | Planned |
| ADM-01 | DES-006 through DES-010, IAM-007/010/011, ADM-001 through ADM-004; BUILD-007 through BUILD-013 | B003/B004 grants/catalog evidence; B005 explicit inventory permissions, current revocation, audited adjustment and replay; broader admin/export/UI pending | In progress |
| MKT-01 | PRC-004/005, MKT-001–MKT-007 | Coupon eligibility/cap/expiry and campaign suite | Planned |
| SEO-01 | DES/WEB/SEO tasks, QLT-011/012 | Metadata/sitemap/canonical/structured/accessibility review | Planned |
| NTF-01 | NTF-001–NTF-009, ASY tasks | Lifecycle delivery, provider outage and DLQ/replay suite | Planned |
| RPT-01 | ANL-001, RPT-001–RPT-013, QLT-018 | Metric/report/export and full reconciliation example | Planned |
| MIG-01 | GOV-009, MIG-001–MIG-012, LCH-009–LCH-011 | Validation/rehearsal/restart/final reconciliation | Planned |
| OPS-01 | FND, ASY, QLT-015 through QLT-017, LCH tasks; BUILD-001 through BUILD-013 | B001-B005 runtime regression, four-migration rebuild/preserved upgrade and pending outbox capture; dispatcher/production/restore/runbooks pending | In progress |
| SEC-01 | SYS-014/015, FND security tasks, IAM, PAY-019, QLT-003/013/014; BUILD-003 through BUILD-013 | Foundation/identity/catalog access evidence; B005 current stock permissions, guest capability secrecy, protected ledger and Multer audit repair; full security/upload/export acceptance pending | In progress |
| FUT-01 | GOV-011, LCH-023 | Evidence-based Release 2 review | Parked |
| NFR-01 | GOV-004, SYS-016, QLT-010, LCH-017 | Availability definition/measurement/alert evidence | Planned |
| NFR-02 | GOV-004, QLT-010 | Repeatable mixed-load latency/capacity report | Planned |
| NFR-03 | DES-012, WEB-008, QLT-011 | Critical-page p75 Web Vitals evidence | Planned |
| NFR-04 | SYS-013, SEA-007/008, QLT-009 | Search freshness, backlog alert and reindex evidence | Planned |
| NFR-05 | SYS-018, FND-020, QLT-015, LCH-012 | Timed clean restore and reconciliation evidence | Planned |
| NFR-06 | DES-012, WEB-008, QLT-012 | Automated/manual critical-journey accessibility evidence | Planned |
| NFR-07 | SYS-014, FND-018, QLT-013/014 | Findings/remediation and launch severity review | Planned |
| NFR-08 | Domain integrity tasks, QLT-004 through QLT-007/018; BUILD-007 through BUILD-013 | B003/B004 ownership/price/catalog invariants; B005 stock floor/version/operation and cart merge/ownership races; checkout/refund and full reconciliation pending | In progress |
| NFR-09 | SYS-012/013, CART-008, SEA-009, QLT-008/009/017; BUILD-012/013 | B004/B005 database-loss denial, atomic rollback and lost actual COMMIT reply recovery for catalog/stock/cart; cache/search/queue integration pending | In progress |

## Evidence status values

**7 September 2026 foundation handoff, AUTH-004:** OPS-01 and SEC-01 now link to actual [B001 evidence](../aidlc/bolts/B001-foundation.md) and its artifact manifest for BUILD-001/002/003. Clean install/build, independent lifecycle, invalid-configuration rejection and secret-safe startup output passed; Linux 96 tests, Windows 92 plus 4 POSIX signal skips. Both full requirements remain In progress with human acceptance pending; no full security/operations capability is complete. NFR-08/NFR-09 remain downstream constraints with no new acceptance evidence. See [AUD-007/008](../aidlc/audit.md) for scope and preservation checks.

Use `Planned`, `In progress`, `Evidence ready`, `Accepted`, `Accepted with exception`, or `Rejected`. An accepted exception needs owner, impact, expiry/review date, and sponsor/product/technical approval appropriate to the risk. P0/P1 scope may not be removed by editing this table alone.

## B002 evidence extension

[AUTH-005 / B002](../aidlc/bolts/B002-foundation.md) extends OPS-01/SEC-01 with real local PostgreSQL commit/rollback/lock/precision and runtime privilege tests, bounded HTTP errors/health, correlated safe telemetry and shutdown. Both full requirements remain In progress; human acceptance is pending. These synthetic foundation tests do not close NFR-08 domain money/stock/ownership invariants or NFR-09 complete dependency-loss correctness. No full requirement or ADAPT capability is accepted.


## B003 identity evidence extension

[AUTH-006/B003](../aidlc/bolts/B003-identity.md) provides BUILD-007/008 evidence for ACC-01 (synthetic tokens/MFA claims and current staff permissions), ACC-02 (unique mapping and owned profile/addresses), ADM-01 (grants/revocation/version/audit), SEC-01 (negative tokens/ownership/current authority and protected audit) and the ownership portion of NFR-08 (mapping/address/version/revocation races). All remain In progress, with human acceptance pending. OPS-01 retains regression/clean runtime proof. Real Auth0/JWKS/MFA, guest/order snapshots, broader admin/export, money/stock and production controls remain pending. No frontend or optional-model evidence is implied.

## B004 catalog evidence extension

[AUTH-007/B004](../aidlc/bolts/B004-catalog.md) supplies BUILD-009 through BUILD-013 and bounded CAT-01/MED-01/ADM-01/SEC-01/NFR-08/09 evidence, with full foundation/identity regression supporting OPS-01. Exact prices, lifetime SKU, source-checked publication, current grants and scoped replay remain PostgreSQL-authoritative. Fault injection proves aggregate/audit/event/destination/outcome rollback and safe resolution after a lost real COMMIT reply. Seven Linux suites passed all 210 tests; Windows passed 204 with six POSIX skips. These are local synthetic results with human acceptance pending. Pending search deliveries do not implement SRCH-01; media metadata does not close upload/inspection; archived facts do not prove future order snapshots. All ADAPT, frontend and real-provider/production evidence remain pending.

## Historical B005 planning, 12 September 2026

[AUTH-008/B005 plan revision 1](../aidlc/bolts/B005-stock-cart.md) maps BUILD-014 to INV-01 ledger/adjustment and BUILD-015 to CART-01 persistence/ownership/merge. Its acceptance matrix also covers bounded ACC-02 owner denial, CAT-01 catalog-to-cart observations, ADM-01 stock permissions, SEC-01 current grants/capability redaction, NFR-08 quantity/ownership contention, NFR-09 rollback/ambiguous COMMIT and OPS-01 migration/regression evidence. At that planning checkpoint these cases were unrun and CART-01/INV-01 remained Planned; plan approval and implementation were pending. The execution extension below supersedes that current status. BUILD-019 and all checkout/order/reservation/payment/return behavior remain outside this plan.

## B005 stock/cart evidence extension

[AUTH-009/B005](../aidlc/bolts/B005-stock-cart.md) supplies actual BUILD-014/015 evidence for INV-01/CART-01 and bounded ACC-02/CAT-01/ADM-01/SEC-01/NFR-08/09. OPS-01 gains full regression and preserved upgrade/rebuild. Thirty-three new scenarios cover guards, current authority, ownership, clamping/line-cap conflict, expiry and contention, rollback and unknown COMMIT. Final Windows: 237 passed/six skips; final Linux/PostgreSQL: all 243 passed and audit zero vulnerabilities after scoped Multer repair. Five new tables, local fixture/demo/reconciliation and 81-input manifest are recorded. CART-01/INV-01 now In progress; all full requirements and human artifact acceptance remain pending. No cache integration, checkout/reservation/payment/expiry-worker, frontend or provider evidence is inferred.
