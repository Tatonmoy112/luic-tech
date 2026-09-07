# Database architecture and schema map

## Database boundary

Use one PostgreSQL 18 database for the Release 1 modular monolith. Logical schemas express ownership; they are not separate services or separate consistency zones. Transactions may cross these schemas only through reviewed domain commands such as checkout, payment confirmation, refund reservation and returned-stock disposition.

| PostgreSQL schema | Owner | Main responsibility | May write across boundary only when |
| --- | --- | --- | --- |
| `iam` | Identity/customer module | Customers, saved addresses, guest access and staff authorization | An order snapshots identity/address or an audit records the actor |
| `catalog` | Catalog/media module | Products, variants, attributes, price history, media and campaign content | Pricing/checkout reads active records; outbox records committed publication |
| `pricing` | Pricing/promotion module | Delivery, coupon, tax-policy reference and coupon usage | Checkout reserves a coupon and snapshots results |
| `inventory` | Inventory module | Position, movement ledger, reservation and allocation | Checkout/payment/return invokes the inventory transaction contract |
| `sales` | Checkout/order module | Cart, checkout attempt, immutable order facts, order state and holds | Checkout composes price/stock facts; payment/fulfillment changes guarded order state |
| `finance` | Payment/refund module | Provider attempts/evidence, exceptions, refunds and settlement matching | Verified payment allocates stock; authorized refund references returns/order lines |
| `fulfillment` | Fulfillment/return module | Shipment, manual tracking, returns and inspection | Eligible order creates shipment; sellable inspection invokes inventory restock |
| `platform` | Platform/reporting module | Idempotency, outbox, consumer deduplication, audit, import/export, notifications and search progress | Written atomically with owning domain effect where required |

## Dependency direction

These schemas describe data ownership, not NestJS imports. A commerce application coordinator depends on leaf-module ports for checkout, payment confirmation, cancellation and fulfillment resolution. Leaf payment and order modules do not import each other. `platform` supplies transaction, audit and delivery facilities but never decides commercial eligibility. Reporting reads reviewed views or read models and cannot write source facts.

Circular data access is avoided through identifiers and domain commands:

- catalog never edits order-line snapshots;
- fulfillment never mutates stock positions directly;
- finance never edits order totals to make reconciliation pass;
- reports never repair source facts;
- notification delivery never changes commerce state;
- Valkey and OpenSearch never become referenced parents of PostgreSQL rows.

## Table inventory

| Schema | Tables |
| --- | --- |
| `iam` | `customers`, `customer_addresses`, `guest_order_access`, `staff_accounts`, `roles`, `permissions`, `staff_role_assignments`, `role_permissions` |
| `catalog` | `brands`, `categories`, `products`, `product_categories`, `attributes`, `attribute_values`, `product_variants`, `variant_attribute_values`, `price_records`, `media_assets`, `product_media`, `content_entries`, `content_revisions` |
| `pricing` | `delivery_zones`, `delivery_zone_rules`, `coupon_campaigns`, `coupon_targets`, `coupon_holds`, `coupon_redemptions`, `tax_policy_versions` |
| `inventory` | `stock_locations`, `stock_positions`, `stock_movements`, `reservations`, `reservation_lines`, `allocations`, `allocation_lines` |
| `sales` | `carts`, `cart_lines`, `checkout_attempts`, `orders`, `order_lines`, `order_addresses`, `order_discounts`, `order_state_history`, `order_holds`, `cancellation_requests`, `cancellation_request_history` |
| `finance` | `payment_attempts`, `payment_callback_receipts`, `payment_validations`, `payment_state_history`, `payment_exceptions`, `refunds`, `refund_lines`, `refund_submissions`, `refund_state_history`, `settlement_imports`, `settlement_entries`, `settlement_matches` |
| `fulfillment` | `shipments`, `shipment_items`, `shipment_state_history`, `returns`, `return_items`, `return_inspections`, `return_state_history` |
| `platform` | `idempotency_records`, `outbox_events`, `outbox_deliveries`, `workflow_jobs`, `consumer_receipts`, `audit_events`, `import_jobs`, `import_rows`, `export_jobs`, `notification_templates`, `notification_requests`, `notification_attempts`, `search_projection_state` |

There are 78 proposed tables: iam 8, catalog 13, pricing 7, inventory 7, sales 11, finance 12, fulfillment 7 and platform 13. This count reflects distinct integrity or lifecycle concerns, not a service count. Tables can be removed during review only if their invariant and evidence remain represented elsewhere.

## Aggregate roots and ownership

| Aggregate root | Owned records | Required concurrency token | Terminal/history rule |
| --- | --- | --- | --- |
| Customer | Saved addresses | Customer `version` | Deactivation does not rewrite orders |
| Staff account/role | Assignments and permissions | Account/role `version` | Revocation retained and audited |
| Product | Categories, variants, media ordering | Product/variant `version` | Archive preserves SKU and order references |
| Variant price | Effective price records | Serialized price activation | Closed intervals retained |
| Cart | Cart lines | Cart `version` | Expired carts may be purged under approved retention |
| Coupon campaign | Targets, holds and redemptions | Campaign `version` and counters | Hold terminal action applies once |
| Stock position | Movements, reservation/allocation lines | Position `version` | Ledger corrected by compensating movement |
| Checkout attempt | Idempotency outcome and order link | Attempt `version` | Same request hash returns same outcome |
| Order | Lines, address, discount, state history and holds | Order `version` | Accepted snapshots and history are immutable |
| Payment attempt | Validations, state history and exceptions | Attempt `version` | Verified terminal result never disappears |
| Shipment | Items and state history | Shipment `version` | One shipment/order under Release 1 |
| Return | Items, inspections and state history | Return `version` | Resolved record retained |
| Refund | Lines, submissions and history | Refund `version` | Completed/failed evidence retained |
| Settlement import | Entries and matches | Import state/version | Source fingerprint and matches retained |
| Import/export job | Row outcomes or private artifact | Job `version` | Outcome record retained for approved period |
| Notification request | Delivery attempts | Request `version` | Delivery never becomes business authority |

## Relationship summary

- A customer owns many saved addresses, carts and orders. An order may have no customer for guest checkout.
- A guest-access record belongs to exactly one order; several rotated/expired records may exist, but only policy-permitted active access is usable.
- A product owns variants; categories and products are many-to-many. Attributes describe variant selections through allowed attribute values.
- A variant owns price history and has one position per stock location.
- A cart owns lines. A checkout attempt may create one order and one initial payment attempt.
- An order owns snapshot lines, one address snapshot set, optional discount snapshots, state history, holds, several payment attempts, one Release 1 shipment, and several returns/refunds.
- A reservation belongs to an order and contains variant/location lines. A committed reservation produces one allocation with matching allocation lines.
- A shipment item references an order line. A return item also references an order line and may have several inspection records.
- A refund references an original successful payment attempt and has component allocations back to order/return lines.
- A settlement entry may match a payment success or refund result through explicit nullable foreign keys with an exactly-one-target check.
- Every important domain commit can create outbox and audit records in the same transaction. Workers record their event processing key with their local effect.

## Standard column conventions

| Concern | Convention |
| --- | --- |
| Primary key | `id uuid`, proposed database default `uuidv7()` after compatibility approval |
| Foreign key | `<parent>_id uuid`; index when used for joins, ownership checks or parent lifecycle |
| Time | `<event>_at timestamptz`; `created_at` required; `updated_at` only on mutable rows |
| Optimistic edit | `version bigint` beginning at 1 and incremented by guarded updates |
| Human reference | `<entity>_reference varchar`; unique, opaque, non-secret and separate from primary key |
| Normalized text | Store display value and explicit normalized companion where equality/uniqueness matters |
| Currency | `currency char(3)`; Release 1 check is `BDT` after D01 approval |
| Money | `<component>_minor bigint`; nonnegative unless the row is explicitly a signed adjustment |
| Quantity | `<quantity> integer`; positive on lines, signed only for movements |
| State | `state varchar` with named allowed-value check and state-history row |
| Request/evidence hash | SHA-256 bytes or lower-case hex; never store a secret itself as a lookup token |
| Provider evidence | Bounded redacted `jsonb`, schema/version label and received/verified time |
| Reason | Stable reason code plus optional bounded note; sensitive data prohibited |

## Delete and update policy

Use `RESTRICT` for parents referenced by orders, stock, payment, refund, settlement or audit history. Use `CASCADE` only for true composition with no independent evidence value, such as role-permission joins or an unsubmitted cart's lines under an approved purge. Use `SET NULL` only where the historical row also stores an immutable actor/target snapshot and deleted identity is permitted by policy.

Primary keys and historical foreign keys never change. Business corrections append a replacement, reversal, new version, new state-history record or compensating movement.

## Diagram use

The native diagrams.net file separates the model into readable pages. Cross-page reference boxes use the same fully qualified table name. Connector labels name the cardinality or business relation. The diagram is conceptual/logical: the data dictionary and integrity plan decide exact nullability and constraints when a box intentionally omits secondary columns.
