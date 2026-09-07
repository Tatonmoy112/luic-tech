# Phase 3: E-commerce requirements discovery

**Owner:** Product manager with operations and finance. **Output:** Business rules feeding Stage 2 requirements.

## Proposed customer journey

Browse -> filter/search -> product and variant selection -> cart -> address and delivery quote -> final price confirmation -> SSLCOMMERZ hosted payment -> payment status -> order tracking -> support/return request.

Guest checkout is proposed. Authenticated customers also get address management and order history. A guest order requires a secure, expiring access mechanism; an order number alone must never reveal personal information.

## Discovery and launch assumptions

| Area | Proposed Release 1 behavior | Questions to resolve |
| --- | --- | --- |
| Catalog | Categories, brands, product attributes, variants with unique SKU, images, draft/publish/archive | Product types, units, mandatory attributes, warranty/serial/batch requirements? |
| Pricing | BDT; variant prices; explicit tax and delivery display; order price snapshots | Tax-inclusive or exclusive? Discount rounding? Who approves price changes? |
| Inventory | One stock location, on-hand/reserved/available quantities, adjustment reasons | Returns quarantine, damaged stock, safety stock, opening count? |
| Cart | Guest and customer carts; quantities rechecked at checkout | Retention, merge rules after login, item quantity limits? |
| Checkout | Address validation, supported delivery zone, authoritative totals, reservation before payment | Reservation timeout and payment-session relationship? |
| Payments | Hosted SSLCOMMERZ; methods depend on merchant enablement | Merchant account, refund support, live credentials, risk review? |
| Orders | Separate order, payment, fulfillment, and return states | Cancellation cutoff, support escalation, invoice wording? |
| Shipping | Zone-based charges; manual courier booking and tracking entry | Courier, service zones, delivery estimates, failed-delivery ownership? |
| Returns | Line-level return request, inspection, approved partial/full refund | Return window, eligibility, shipping fee refunds, replacement policy? |
| Accounts | Auth0 customer login; guest order access; account orders and addresses | Is phone-first login required? Existing customer migration? |
| Content | Home, category/product pages, contact, delivery, privacy, returns and terms | Brand assets, approved copy, product photography, language? |

COD, direct bKash/Nagad integrations, bank-transfer proof uploads, wishlists, reviews, subscriptions, loyalty, and referral programs are not assumed launch requirements. Confirm priorities through Stage 3 scope.

## Rules requiring explicit approval

1. Cart placement does not reserve stock. A checkout reservation has a defined expiry and is released exactly once.
2. Price, discount eligibility, delivery charge, and tax are calculated by the backend. A changed total requires customer reconfirmation.
3. Payment confirmation and fulfillment permission are separate. Risk review or missing stock can hold a paid order.
4. Customer cancellation after payment creates a refund workflow; it does not erase the payment record.
5. Returned stock becomes sellable only after inspection. A refund alone does not increase stock.
6. Repeated checkout attempts, notifications, and courier updates must not duplicate orders or financial actions.
7. A late successful payment after reservation expiry goes to review or a new atomic stock allocation; staff must not force negative stock.

## Representative acceptance scenarios

- Two customers try to buy the final unit: at most one active allocation succeeds.
- A price changes while a cart is open: checkout explains the new total before payment.
- A customer closes the gateway tab: the order eventually reflects the verified payment result.
- A delivery zone is unsupported: payment cannot begin and the customer sees the reason.
- A partial return is accepted: refund and stock disposition match the selected order lines.
- A guest cannot access another customer's order by changing a reference number.

Complete when D01-D07 and D10 have owners and approved business rules are reflected in requirement IDs. Details of state transitions belong in Stage 4 architecture.
