# U03: Governed local catalog

| Field | Value |
| --- | --- |
| Unit / intent | U03 / INT-001 |
| Status | In review; BUILD-009 through BUILD-013 implemented and verified, human acceptance pending |
| Authorization | AUTH-007, explicit 8 September 2026 user instruction, BUILD-009 through BUILD-013 |
| Profile | DEV-PHYSICAL-BD revision 1; synthetic local PostgreSQL |
| Requirements | CAT-01, ADM-01, SEC-01; bounded MED-01 metadata and NFR-08/09 correctness evidence |
| Design inputs | BE-068 through BE-073, BE-081 through BE-084, BE-045/046/047; DBT-033 through DBT-039, DBT-077/078 and audit/idempotency references |
| Dependencies | Actual B003 identity/access and B002 transaction evidence; prior human acceptance remains pending |
| Owner/reviewer | Codex implementation and AI self-review; human acceptance pending |
| Ownership | Catalog owns product/category/attribute/variant/price/media/content metadata; platform owns command reliability/audit; identity exports current permission checks |
| Exclusions | Frontend, real providers/cloud, media inspection/upload/content publication workflow (BUILD-030), dispatcher (BUILD-027), stock/cart/orders, all ADAPT and optional models |

[B004](../bolts/B004-catalog.md) is the bounded catalog Bolt. Local synthetic reference/media setup is an explicit migrator command, never a public approval route. Orders are absent: history verification preserves SKU, price and archived source facts without claiming an implemented order snapshot.

B004 supplies 43 catalog scenarios and full regression evidence: Windows 204 passed/six POSIX skips; clean Linux/PostgreSQL 210 passed/no skips, seven suites. Three migrations now provide 24 logical tables. The 68-input manifest records exact source/schema/contract identity. Local API demo and five-event capture passed. See B004 for expected/observed outcomes, limitations and pending human review. AUTH-007 persists for routine fixes; next planned scope is U04 BUILD-014/015 under a separate bounded instruction. No later behavior is silently enabled.
