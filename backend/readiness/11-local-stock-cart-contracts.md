# U04/B005 local stock and cart contracts, revision 1

Approved B005 revision 1 under AUTH-009 on 12 September 2026. Implemented and verified, In review; human artifact acceptance pending. DEV-PHYSICAL-BD revision 1, local synthetic PostgreSQL only. The [B005 plan](../../context/aidlc/bolts/B005-stock-cart.md) owns the acceptance matrix and exclusions.

All paths have `/api/v1` prefix. Inventory requires current local signed-MFA staff permission; cart accepts customer bearer identity or `X-Guest-Cart-Token`, never both. Raw guest capabilities are 32 random bytes encoded as canonical unpadded base64url (43 characters), returned only by creation, stored as SHA-256 hashes and omitted from logs/audit/outbox/replay. All responses are no-store. UUID IDs and decimal-string versions/money apply. Mutations of existing aggregates require quoted If-Match and UUID Idempotency-Key; customer get/create is intrinsically idempotent, guest issuance is deliberately not replayable.

| Method / path | operationId | Input / result |
| --- | --- | --- |
| GET /staff/inventory/positions | listStockPositions | Optional variantId, bounded limit/cursor; internal balances/version |
| GET /staff/inventory/positions/:id | getStockPosition | Position/version; inventory.read |
| GET /staff/inventory/positions/:id/movements | listStockMovements | Bounded keyset ledger; inventory.read |
| POST /staff/inventory/adjustments | adjustStock | positionId, deltaSellable (nonzero integer -1000..1000), operationKey UUID, reasonCode, optional reasonNote <=200; inventory.adjust and expected position version |
| POST /customer/cart | getOrCreateCart | Empty body; customer bearer only; current active cart or newly created one |
| POST /guest/carts | createGuestCart | Empty body, no bearer/guest header; new cart plus one-time guestToken |
| GET /customer/cart | getOwnedCart | Customer active cart, or guest's cart by capability; no caller-supplied owner |
| POST /customer/cart/items | addCartItem | cartId, variantId, quantity 1..20; increments existing quantity |
| PATCH /customer/cart/items/:variantId | changeCartItem | cartId, quantity 1..20; replaces quantity |
| DELETE /customer/cart/items/:variantId | removeCartItem | cartId; removes owned line |
| DELETE /customer/cart/items | clearCart | cartId; removes all owned active lines |
| POST /customer/cart/merge | mergeGuestCart | Customer bearer plus dedicated guest header; sourceCartId, targetCartId, sourceVersion decimal string and target If-Match |

Stock has one TEST-WH, integer counters and no backorders. New positions start at zero. Appending a validated movement advances the position through a restricted database trigger; direct runtime counter/version mutation is denied. Delta reserved remains zero. Every adjustment atomically includes staff audit, stock.position.changed event, pending search-projection delivery and scoped command outcome. Deployment-only fixture installs inventory.manager/read/adjust definitions with current access-manager evidence, without granting it to the access manager or repeating bootstrap; assignments use existing administration. Opening fixture uses the same movement command.

Cart owner context is immutable, exactly customer or guest. One active customer cart, BDT/web only. Mutations refresh 30-day inactivity expiry; reads do not. Request-time expiry marks active carts expired and retains rows. Merge locks both carts by UUID, verifies ownership and both versions, sums duplicates, clamps to min(20, current SKU cap) with requested/accepted explanations, rejects a union over 50 lines atomically, preserves unavailable lines and marks source merged with target linkage. Fresh commands cannot revive terminal carts. Expired guest capability cannot replay. Successful merge may replay for the same current customer and matching unexpired source capability despite its terminal merged state; another customer cannot replay it.

Cart observations are advisory. New additions/increases require current source eligibility and price; existing lines remain visible/removable on archive, price loss or stock loss. Output includes stored/current exact unit-price observations, warnings, merchandiseEstimateMinor (null if incomplete), and indicative availability only. No shipping/tax/discount/payable quote, reservation or stock change occurs. Catalog and inventory supply read ports using the caller transaction, with no nested transaction. Later checkout must revalidate all inputs and lock authority.

Idempotency precedes current identity/ownership, then sorted aggregate locks. Replays reauthorize, compare canonical request hash and return immutable snapshots. Deterministic failure rolls back domain effects before saving its safe error. Expiry discovered during ownership validation is committed as terminal state without reviving the cart. Internal failures roll back everything; ambiguous COMMIT is resolved only by explicit exact retry. Generic audit actor types remain staff/customer; guest cart commands use protected outcomes and redacted telemetry. No dispatcher, purge worker or guest order access is implemented.

Schema plan: five tables in 0003_stock_cart; reservations/allocation/order/workflow-job tables and reservation_line_id FK remain deferred. Preserve prior migration/audit/history bytes, fail closed with incompatible readiness, and fix forward. B005 records the final 0003_stock_cart hash, four-migration rebuild/upgrade, 243 Linux tests and local demo.
