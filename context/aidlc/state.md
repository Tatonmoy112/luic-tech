# AI-DLC current state

**Updated:** 12 September 2026. **Record type:** Current pointer, not an execution log.

| Field | Current value |
| --- | --- |
| Intent | INT-001: Prepare and build the scoped ecommerce backend using AI-DLC |
| Active request | Implement and verify approved B005 revision 1, BUILD-014/015, synthetic local PostgreSQL; implementation/handoff complete |
| Current action scope | AUTH-009 approved B005 revision 1 under AUTH-008 boundaries; routine fixes/verification carry forward. AUTH-004/005/006/007 retain earlier fix scope. Frontend, real integrations, cloud, BUILD-019 and later Units excluded |
| AI-DLC activity | Construction: U04 In progress; B005 implemented and verified, In review pending human artifact acceptance |
| Product scope | Backend/database/workers/operations; frontend excluded |
| Commerce profile | DEV-PHYSICAL-BD revision 1, synthetic only; optional templates disabled |
| Architecture baseline | Modular backend, eight ownership schemas; 29 of 78 proposed logical tables implemented; 49 remain |
| Implementation status | BUILD-001 through BUILD-015 bounded evidence ready, In review; no task/full requirement human-accepted; later BUILD and all ADAPT behavior pending |
| Active Unit / Bolt | U04 Stock and cart / B005 stock ledger and owned cart lifecycle |
| Bolt verification | 33 new stock/cart cases; final Windows eight suites 237 passed/six POSIX skips; fresh Linux/PostgreSQL all 243 passed; final audit zero known vulnerabilities |
| Authorization record | AUTH-008 scope selection, AUTH-009 explicit user plan approval; user continuation preserved scope; prior acceptance unchanged |
| Human review | User approved plan revision 1; Codex implementation and AI self-review complete; human artifact acceptance/reviewer assignment pending |
| Artifact identity | B005-manifest.json: 81 inputs; artifact set c31c4b16309ec06555ffe0b069c29e420c1ce8eefd0c2c6d2b871279d09f8823 |
| Schema / configuration | Four immutable migrations through 0003_stock_cart, SHA-256 3b3870573157727ecf20c6fbdc770f80f163eaabd6adecdf4cc9086f02aca329; config version 2, identity revision 1, catalog revision 1, stock/cart contract/composition revision 1 |
| Dependency identity | Scoped Multer 2.3.0 override repairs audit findings; other pinned dependencies unchanged; lock SHA-256 9b64f4a5832ff8d3ee788dc60b9b9692d8237bd2a4001a45db66711f7bbe9cd7 |
| Runtime evidence | Node 24.19.0/npm 11.17.0; Windows x64 and Linux x64/glibc 2.36; PostgreSQL 18.4 Debian; pinned container digests unchanged |
| Local environment | Existing luic-b002-1fbad6effef6 at 127.0.0.1:61875 restarted/preserved; both databases upgraded; all 52 prior rows across 24 tables retained; bootstrap not repeated; stock/cart demo passed, three pending stock deliveries captured; disposable verifiers removed |
| Local start gate | Foundation, identity, catalog, stock ledger and owned carts proved; quote/checkout/reservation/order/payment and later integrations remain |
| Real integration/production gates | BUILD-030 media, BUILD-034 identity and I/P/D01-D16 evidence remain pending per capability |
| Tooling | Markdown AI-DLC and local scripts/tests; no workflow harness, subagents or CI enforcement installed |

## Resume next

Read [B005 evidence](bolts/B005-stock-cart.md), [U04](units/U04-stock-cart.md), [local stock/cart contracts](../../backend/readiness/11-local-stock-cart-contracts.md), [manifest](evidence/B005-manifest.json), [run guide](../../README.md) and actual diff. AUTH-009 remains valid for routine BUILD-014/015 repairs and verification; do not repeat the approved plan gate. B005 is awaiting human review of its concrete artifacts/evidence.

Preserve existing PostgreSQL, identity/bootstrap, catalog and stock/cart records, immutable migrations and historical manifests. The stock/cart demo is additive: repeated execution appends net +7 synthetic units, so inspect its recorded result before rerunning. The initial demo helper failed after committing +10; that movement was retained and the corrected demo reconciled the final 17-unit ledger. No reset/rebootstrap is needed.

Next planned scope is U05 starting BUILD-016/017 with its own bounded instruction. BUILD-017 needs BUILD-016; BUILD-018 checkout supplies parents for BUILD-019. BUILD-019, guest order access, real providers/cloud/frontend and all ADAPT remain outside authorization. U01/U02/U04 remain In progress, U03 In review, and B001/B002/B003/B004/B005 human artifact acceptance remains pending.

## Known limits and pending decisions

Cart quantities do not reserve/deduct stock and estimated merchandise amounts are not checkout quotes. Guest tokens are opaque hashed capabilities with 30-day inactivity expiry; no guest order access, token recovery, purge or expiry worker exists. Merge preserves terminal source history and explains quantity clamping; over-50-line union conflicts atomically. Initial stock/role fixtures require deployment access and current access manager; adjustment role is explicit and the 1,000-unit bound is synthetic per-command policy.

Public catalog still reports unknown availability; owned-cart reads expose only indicative stock, never raw counts. Synthetic media is metadata only. No dispatcher/consumer/cache/search projection is implemented; deliveries stay pending. No reservation/allocation/payment/refund/order snapshot exists. Generic audit supports staff/customer, while guest cart commands use protected outcomes and redacted telemetry. Conservative identity/customer locking and bounded observations have no production capacity or distributed authorization acceptance.

The first Linux run passed tests but audit failed on Multer; the scoped 2.3.0 repair and final passing checks are in AUD-016 and B005. Historical prior manifests and all old migration bytes remain unchanged; current lock/source identity is B005. Local commit-reply fault injection is not managed failover evidence. Strict TypeScript retains skipLibCheck for Drizzle declarations and the existing esbuild override. Full D09, production security/load/restore, merchant decisions and human acceptance remain pending.

## State maintenance

Keep audit, Unit/Bolt evidence, BUILD/DBT references, traceability and status board consistent with observed results. Passing checks do not imply human acceptance; later planned capability is not implemented capability.
