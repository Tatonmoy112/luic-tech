# Requirement traceability matrix

**Current coverage:** B001/B002 supply partial OPS-01/SEC-01 foundation evidence; remaining evidence is planned. No row is accepted.

The [AI-DLC execution map](../aidlc/execution-map.md) assigns every BUILD outcome and ADAPT addition to a primary Unit. Each Bolt links the exact requirement IDs below to its task/substeps, canonical design and actual evidence. The matrix remains the product acceptance index; Unit membership alone is not requirement coverage or acceptance. Future scoped extensions must receive their own valid requirement IDs before acceptance.

| Requirement | Primary task groups | Primary acceptance evidence | Status |
| --- | --- | --- | --- |
| CAT-01 | DES-006, CAT-001–CAT-011, WEB-002–WEB-005 | Catalog lifecycle and product-to-cart scenarios | Planned |
| MED-01 | MED-001–MED-006, WEB-004, MIG-006 | Upload/quarantine/public-private access/media mapping | Planned |
| SRCH-01 | SYS-013, SEA-001–SEA-009 | Query/facet/freshness/delete/outage/reindex suite | Planned |
| ACC-01 | GOV-006, IAM-001–IAM-012, QLT-003 | Token/MFA/role/revocation matrix | Planned |
| ACC-02 | DES-003/005, IAM-004–IAM-009, ORD-001 | Guest/customer ownership and address snapshot suite | Planned |
| CART-01 | CART-001–CART-010 | Persistence/merge/stale/cache-loss suite | Planned |
| CHK-01 | SYS-008/010, PRC-001–PRC-007, CHK-001–CHK-012, QLT-004 | Authoritative total, tamper, idempotency and rollback suite | Planned |
| INV-01 | SYS-009, INV-001–INV-013, CHK, PAY, RET stock tasks | Ledger roll-forward, contention, expiry/allocation/restock suite | Planned |
| PAY-01 | PAY-001–PAY-012, PAY-019/020, QLT-005 | Initiation/callback/validation mismatch and success suite | Planned |
| PAY-02 | PAY-013–PAY-020, RET refund tasks, RPT-004/006 | Late/double/unknown/settlement reconciliation suite | Planned |
| ORD-01 | SYS-007, CHK-007/008, ORD-001–ORD-007, FUL | Snapshot/state/history and invalid-transition suite | Planned |
| SHIP-01 | GOV-007, PRC-002, FUL-001–FUL-010 | Zone, eligibility, pick-pack-track-deliver/exception suite | Planned |
| RET-01 | GOV-008, RET-001–RET-019, QLT-006 | Cancellation/return/inspection/concurrent-refund suite | Planned |
| ADM-01 | DES-006–DES-010, IAM-007/010/011, ADM-001–ADM-004 | Role/action/conflict/audit/export suite | Planned |
| MKT-01 | PRC-004/005, MKT-001–MKT-007 | Coupon eligibility/cap/expiry and campaign suite | Planned |
| SEO-01 | DES/WEB/SEO tasks, QLT-011/012 | Metadata/sitemap/canonical/structured/accessibility review | Planned |
| NTF-01 | NTF-001–NTF-009, ASY tasks | Lifecycle delivery, provider outage and DLQ/replay suite | Planned |
| RPT-01 | ANL-001, RPT-001–RPT-013, QLT-018 | Metric/report/export and full reconciliation example | Planned |
| MIG-01 | GOV-009, MIG-001–MIG-012, LCH-009–LCH-011 | Validation/rehearsal/restart/final reconciliation | Planned |
| OPS-01 | FND, ASY, QLT-015–QLT-017, LCH tasks; B001/B002 BUILD-001 through BUILD-006 foundation | B001 core plus B002 HTTP/DB/local telemetry/drain evidence; production deployment, restore, operational telemetry and runbooks pending | In progress |
| SEC-01 | SYS-014/015, FND security tasks, IAM, PAY-019, QLT-003/013/014; B001/B002 BUILD-003/004/005/006 | B001 isolation plus B002 role denials and HTTP/log redaction evidence; domain access, threat/upload/export/security evidence pending | In progress |
| FUT-01 | GOV-011, LCH-023 | Evidence-based Release 2 review | Parked |
| NFR-01 | GOV-004, SYS-016, QLT-010, LCH-017 | Availability definition/measurement/alert evidence | Planned |
| NFR-02 | GOV-004, QLT-010 | Repeatable mixed-load latency/capacity report | Planned |
| NFR-03 | DES-012, WEB-008, QLT-011 | Critical-page p75 Web Vitals evidence | Planned |
| NFR-04 | SYS-013, SEA-007/008, QLT-009 | Search freshness, backlog alert and reindex evidence | Planned |
| NFR-05 | SYS-018, FND-020, QLT-015, LCH-012 | Timed clean restore and reconciliation evidence | Planned |
| NFR-06 | DES-012, WEB-008, QLT-012 | Automated/manual critical-journey accessibility evidence | Planned |
| NFR-07 | SYS-014, FND-018, QLT-013/014 | Findings/remediation and launch severity review | Planned |
| NFR-08 | Domain integrity tasks, QLT-004–QLT-007/018 | Concurrency/replay/ownership/reconciliation evidence | Planned |
| NFR-09 | SYS-012/013, CART-008, SEA-009, QLT-008/009/017 | Cache/search/dependency-loss correctness evidence | Planned |

## Evidence status values

**7 September 2026 foundation handoff, AUTH-004:** OPS-01 and SEC-01 now link to actual [B001 evidence](../aidlc/bolts/B001-foundation.md) and its artifact manifest for BUILD-001/002/003. Clean install/build, independent lifecycle, invalid-configuration rejection and secret-safe startup output passed; Linux 96 tests, Windows 92 plus 4 POSIX signal skips. Both full requirements remain In progress with human acceptance pending; no full security/operations capability is complete. NFR-08/NFR-09 remain downstream constraints with no new acceptance evidence. See [AUD-007/008](../aidlc/audit.md) for scope and preservation checks.

Use `Planned`, `In progress`, `Evidence ready`, `Accepted`, `Accepted with exception`, or `Rejected`. An accepted exception needs owner, impact, expiry/review date, and sponsor/product/technical approval appropriate to the risk. P0/P1 scope may not be removed by editing this table alone.

## B002 evidence extension

[AUTH-005 / B002](../aidlc/bolts/B002-foundation.md) extends OPS-01/SEC-01 with real local PostgreSQL commit/rollback/lock/precision and runtime privilege tests, bounded HTTP errors/health, correlated safe telemetry and shutdown. Both full requirements remain In progress; human acceptance is pending. These synthetic foundation tests do not close NFR-08 domain money/stock/ownership invariants or NFR-09 complete dependency-loss correctness. No full requirement or ADAPT capability is accepted.
