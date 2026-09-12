# U04: Stock and owned carts

| Field | Value |
| --- | --- |
| Unit / intent | U04 / INT-001 |
| Status | In progress: B005 BUILD-014/015 implemented/verified, In review; BUILD-019 deferred |
| Authorization | AUTH-008 scope selection, AUTH-009 explicit approval of B005 revision 1 on 12 September 2026; routine fixes/verification remain authorized |
| Profile | DEV-PHYSICAL-BD revision 1; fictional physical variants, integer units, BDT scale 2, one TEST-WH, no backorders |
| Primary tasks | BUILD-014, BUILD-015; BUILD-019 belongs to this Unit but is explicitly deferred until prerequisite parents and separate scope authorization are ready |
| Requirements | INV-01, CART-01; bounded ACC-02, CAT-01, ADM-01, SEC-01, OPS-01, NFR-08/09 |
| Design inputs | BE-061, BE-092 through BE-098 (cart portions), BE-099/100/101, BE-116/117 (inventory portions); DBT-043/044/045/048 and reuse DBT-049/077/078/081/082 |
| Dependencies | BUILD-014: BUILD-009/012; BUILD-015: BUILD-008/009/012. B002/B003/B004 technical evidence exists; BUILD-013 supplies reusable event storage. Human acceptance remains pending |
| Ownership | Inventory owns inventory.stock_locations/stock_positions/stock_movements; Cart owns sales.carts/cart_lines; identity supplies current authorization; catalog supplies observation ports; platform owns reliability/audit |
| People | User approved plan revision 1; Codex implemented/verified and performed AI self-review; human artifact acceptance/reviewer assignment pending |
| Exclusions | Frontend, real third-party integrations, cloud, BUILD-019 execution, orders/quotes/payments/reservations/allocations, dispatcher/cache/search adapters, imports, guest order access, all ADAPT and optional models |

## Inception outcome

An authorized local stock operator can read and reconcile balances and append bounded, attributed adjustments. A customer or verified guest can retain desired items, change quantities and merge a guest cart into a customer cart with an explained deterministic result. Cart actions never reserve or deduct stock; prices and availability remain observations until future checkout revalidation.

The existing requirements are [CART-01 and INV-01](../../../dev/Step-2/Stage%202-Requirement%20Document.md). The [profile](../../registers/commerce-profiles.md), [BUILD sequence](../../../backend/readiness/05-implementation-sequence.md), [module boundaries](../../../backend/03-module-boundaries.md), [initial API contract](../../../backend/readiness/06-initial-api-contracts.md), [dictionary](../../../database/03-data-dictionary.md), [T01/T05 and lock rules](../../../database/04-integrity-and-transactions.md), [security](../../../database/07-security-privacy-and-audit.md) and [events](../../../backend/07-events-queues-jobs.md) retain technical authority.

Stock permissions/thresholds and deterministic merge details were approved for local B005 under AUTH-009; they are synthetic, not merchant-approved operating policy. Review access, stock, exact money and forward migrations. Frontend design, cloud provisioning, provider integration and policy administration stages are omitted because they are excluded. Source was inspected; an audit-triggered scoped Multer repair and maintainer advisory review are recorded in B005.

## Bolts

| Bolt | Entry | Bounded result / exit |
| --- | --- | --- |
| [B005 stock and cart](../bolts/B005-stock-cart.md) | AUTH-008/009 and verified prerequisite evidence | Implemented/verified: five tables, 33 new cases, 243 Linux tests passed; B005 In review pending human acceptance |
| Later reservation-expiry Bolt, not assigned | BUILD-018 and relevant checkout/order/payment-state schema ready; explicit bounded authorization | BUILD-019 sweep/lease/expiry evidence; not part of B005 |

## Quality and handoff

B005 defines independent success, denial, replay, contention, rollback, unknown COMMIT, migration and recovery expectations. Preserve historical migrations/manifests, local PostgreSQL, bootstrap audit and catalog records. Fix forward; do not reset existing databases. Observability must explain rejected stock operations and cart conflicts without logging raw guest capabilities or personal data.

B005 supplies runtime, migration and demo evidence with an 81-input manifest. U03/B004 remains technically verified and In review; no prior Bolt or full requirement is human-accepted. AUTH-009 carries routine fixes/verification forward; review the concrete B005 artifacts/evidence for human acceptance. BUILD-017 still needs BUILD-016 as well as BUILD-014/015; U05 BUILD-016/017 needs a separate bounded instruction.
