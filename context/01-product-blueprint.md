# Product blueprint

**Scope:** Release 1 customer and staff experience  
**Status:** Proposed until G1 policy and product decisions are approved

## Product outcomes

During AI-DLC Inception, translate only the selected backend outcome into a bounded Unit/Bolt with actor, examples, exclusions and applicable policy evidence. Use [the workflow](aidlc/workflow.md) for human validation and the commerce profile to distinguish fictional rules from merchant facts. The frontend inventory below remains full-product context and is not part of the current backend-only intent.

The product must let a customer discover a valid sellable variant, understand the complete payable amount, reserve available stock, complete a verified payment, and receive a trustworthy order status. It must let staff maintain the same commercial truth, fulfill only eligible orders, resolve exceptions, and reconcile stock and money without editing history.

Success measures require baselines after launch. The initial measurement set is conversion by checkout stage, payment success and reconciliation age, order cancellation/return rates, stock discrepancy count, fulfillment lead time, search zero-result rate, service availability, and support volume by reason.

## Roles and authority

| Role | Can do | Cannot do without separate authority |
| --- | --- | --- |
| Guest | Browse, search, cart, checkout, access own order through secure expiring mechanism | View another order, use staff operations, bypass validation |
| Customer | Manage own addresses, cart, checkout, orders, eligible return requests | Change historical order snapshots or another customer's records |
| Catalog manager | Draft/publish/archive products, variants, prices, media, categories, homepage content | Adjust physical stock or approve refunds unless separately assigned |
| Fulfillment operator | See eligible orders, pick, pack, dispatch, record tracking and delivery exceptions | Fulfill held/unverified orders, edit payment evidence |
| Support agent | Find authorized order context, explain state, request permitted cancellation/return | Approve refunds, change stock, export unrestricted customer data |
| Finance operator | Review payment exceptions, settlements, approvals, refund and reconciliation records | Change provider evidence or silently correct transactional history |
| Platform administrator | Manage application roles/settings and inspect audit | Gain automatic business approval authority through technical access |
| Service operator | Monitor, diagnose, deploy approved releases, replay approved work, recover services | Alter business facts to make an incident appear resolved |

Access combinations, refund limits, export rights, and approval separation require a G1/G2 decision and must be reviewable through audit.

## Customer journey and page inventory

| Step | Page/view | Required behavior and states | Requirement IDs |
| --- | --- | --- | --- |
| 1 | Home | Brand/navigation, campaign slots, featured/category discovery, search entry, policy/support links | MKT-01, SEO-01 |
| 2 | Category/listing | Published products, sort, pagination, filter/facet controls, empty/error/loading states | CAT-01, SRCH-01, SEO-01 |
| 3 | Search/autocomplete | Bounded suggestions and results; clear no-result and unavailable states | SRCH-01 |
| 4 | Product detail | Variant choice, price, indicative availability, media, description, delivery/policy summary | CAT-01, MED-01, SEO-01 |
| 5 | Cart | Persistent items, quantities, estimated total, stale price/stock notice, controlled account merge | CART-01 |
| 6 | Sign-in/guest choice | Auth0 login path and permitted guest continuation; safe return to checkout | ACC-01, ACC-02 |
| 7 | Checkout information | Contact, address, delivery zone/method, validation, privacy/policy acknowledgement | ACC-02, CHK-01, SHIP-01 |
| 8 | Checkout review | Authoritative item/discount/tax/shipping total, changed-total confirmation, coupon result | CHK-01, INV-01, MKT-01 |
| 9 | Payment handoff | One active attempt context, hosted-gateway redirection, retry/reconciliation-safe behavior | PAY-01, PAY-02 |
| 10 | Payment return/status | Pending/verified/failed/cancelled explanation based on API truth; no browser-declared success | PAY-01, ORD-01 |
| 11 | Order detail | Masked guest or owned customer view, item/total snapshot, payment and fulfillment dimensions, support action | ACC-02, ORD-01 |
| 12 | Return/cancellation request | Eligibility, line quantities, reason, expected review/refund path | RET-01 |
| 13 | Account | Profile, addresses, order history, sign-out, failure/session-expiry handling | ACC-01, ACC-02 |
| 14 | Content/legal | Contact, delivery, cancellation, returns/refunds, privacy, terms and accessibility information supplied by owner | SEO-01, SEC-01 |

### Customer experience rules

- Show BDT and finance-approved rounding consistently.
- Identify the selected variant and price clearly. An unavailable or unpublished variant cannot be ordered.
- Treat listing/cart availability as indicative; explain any checkout correction without losing the customer's input.
- Preserve a cart across refresh and intended sign-in. Merge quantities only within stock/quantity rules.
- Never promise payment, cancellation, refund, shipment, or delivery completion before the authoritative state confirms it.
- Keep primary journeys keyboard-operable, screen-reader understandable, mobile usable, and explicit during loading, empty, invalid, pending, failure, and recovery states.
- Do not expose customer personal data, internal risk reasons, credentials, or provider payloads in page URLs or public caches.

## Staff workspace inventory

| Workspace | Core views/actions | Required controls | Requirement IDs |
| --- | --- | --- | --- |
| Dashboard | Action queues and trends: orders, payment exceptions, low stock, returns, queue issues | Definitions/freshness shown; permissions filter data | RPT-01, ADM-01 |
| Catalog | Product list/detail, categories, variants, prices, publication, media, import results | Unique SKU, validation, audit, edit conflict handling | CAT-01, MED-01, MIG-01 |
| Inventory | Stock position, reservation/allocation visibility, movement history, adjustments, returned stock disposition | Reason and actor required; no direct history rewrite | INV-01 |
| Orders | Search, order detail, state history, address/item/total snapshots, holds, cancellation | State and permission guards; personal-data minimization | ORD-01, ADM-01 |
| Fulfillment | Eligible queue, pick/pack/dispatch, tracking, failed delivery/return-to-origin | Cannot dispatch unpaid/held/unallocated order | SHIP-01, ORD-01 |
| Payments | Attempts, provider evidence summary, unknown/late/duplicate queue, settlement reconciliation | Finance-only sensitive actions; provider truth retained | PAY-01, PAY-02 |
| Returns/refunds | Request, approval, receipt, inspection, restock/quarantine, refund approval/submission/status | Eligible quantities/balance; separate stock and money decisions | RET-01 |
| Promotions/content | Coupon rules/caps and homepage campaign entries | Eligibility, dates, concurrency cap, audit | MKT-01 |
| Notifications | Template/version, delivery jobs/outcomes, retry visibility | No notification changes business state | NTF-01 |
| Reports/exports | Sales, order, payment, return, inventory, settlement exports | Definition, date/time basis, freshness, scope, export audit | RPT-01 |
| Access/audit | Staff role assignment/revocation and attributable activity | MFA, least privilege, separation, immutable audit | ACC-01, ADM-01, SEC-01 |
| Operations | Service status, queue/DLQ, replay request, import/reindex progress | Bounded approved action; reason and evidence | OPS-01 |

## Business behavior by capability

### Catalog and pricing

A product contains shared commercial content; a variant is the sellable unit with a unique SKU. Draft, published, archived, and unavailable behavior must be explicit. Historical orders keep snapshots after catalog edits. Price activation, comparison pricing, tax inclusion, rounding, and publication approval require product/finance decisions.

### Search and discovery

Search includes keyword, autocomplete, category, approved facets, sort, and pagination. Unpublished items must disappear. Stale search results may lead to a corrected product or checkout state, never a stale-price purchase. SEO rules cover canonical URLs, sitemap membership, metadata, filter-indexing policy, structured data, redirects, and unavailable products.

### Cart, promotion, and checkout

Cart totals are estimates. Checkout recalculates the entire quote from authoritative rules, checks product publication and quantity, applies no more than one Release 1 coupon, reserves cap/stock atomically, and snapshots the accepted commercial result. The same idempotency key and payload returns the existing result; a changed payload conflicts.

### Payment and order

Each order may have several attempts. A validated successful attempt changes payment state once; an additional success becomes an excess-payment exception. Customer-facing order, payment, fulfillment, return, and refund states remain separate so one dimension never erases another.

### Fulfillment

Release 1 uses one shipment per order and manual courier booking/tracking. Only verified, allocated, non-held orders become eligible. Picking, packing, dispatch, delivery, failed delivery, and return-to-origin require explicit transitions and history. Dispatch must not deduct stock already deducted on allocation.

### Cancellation, return, and refund

Eligibility follows approved policy and actual state. A customer can request; authorized staff decide. A return can affect item disposition without automatically completing money movement. Refund approval, provider submission, uncertain processing, and final result remain visible. Pending plus completed refunds cannot exceed the eligible paid balance.

### Reporting

Reports use documented definitions, Asia/Dhaka display dates with UTC storage, explicit currency, refund allocation, freshness, and authorized export boundaries. Finance must reconcile order totals, successful payments, refunds, settlement, and fees rather than assuming they are identical measures.

## Critical edge cases that designs must show

- Last unit is requested by two customers.
- Price, delivery fee, stock, or coupon changes between cart and checkout.
- Checkout is submitted twice or the same key is reused with different input.
- Payment gateway initiation times out after it may have created a session.
- Customer closes the gateway; notification arrives without browser return.
- Forged, duplicate, late, or out-of-order payment event arrives.
- Reservation expires at the same moment a payment succeeds.
- Two attempts for one order eventually succeed.
- Cancellation or refund is requested while another staff member acts.
- Refund request times out with an unknown provider result.
- Returned item is damaged and must not re-enter sellable stock.
- Search, cache, email, queue, Auth0, or payment provider is unavailable.
- Staff permission is revoked during an existing session.
- Guest order link is expired, guessed, forwarded, or reused.
- Product CSV has duplicate SKU, invalid price/stock, missing image, or partial failure.

## Product approval package

Before development of each journey, the product owner must approve wireflows, all states, copy ownership, business rules, acceptance examples, mobile behavior, accessibility intent, analytics event names, and nearby exclusions. Finance/operations separately approve money, stock, delivery, cancellation, return, and refund behavior.
