# Initial backend API implementation contracts

**Purpose:** Concrete first-slice and high-risk API contracts to accompany the implementation sequence.  
**Scope:** Markdown specification, not executable OpenAPI or source code. All paths below include /api/v1.

## Shared wire and security rules

Money and aggregate version values are decimal strings. Quantity is an integer. IDs are UUID strings; references are opaque non-secret strings. Instants use UTC ISO 8601. Unknown command fields fail validation. Every response includes a safe correlation ID header; protected responses use Cache-Control: no-store.

Missing valid credentials returns 401. Lack of action permission returns 403 when no protected resource existence is exposed; inaccessible resources return 404. The API never grants customer rights from a workload token alone or staff rights from caller-supplied headers. Read-only tests may use synthetic principals only through an isolated local issuer.

Every command response shape is explicitly limited; do not serialize whole ORM records. Error body fields: type, title, status, code, correlationId, optional violations with field/code. Only safe route templates enter the error body; omit raw URLs containing sensitive query/path tokens.

## Store product detail

**GET /store/products/{slug}; operationId: getPublishedProduct; CAT-01/MED-01.**

No customer token needed for the public representation; deployed route/workload exposure follows BA-008. Slug length 1–160, normalized allowlisted characters. Output: product id, slug, title, description, published media derivatives with alt text, variant id/SKU/title/attribute selections, current unitPriceMinor/currency, indicativeAvailability, updatedAt. Exclude raw stock counts, private object keys, internal prices, draft revisions and actor identities.

200 when published; 404 when absent/unpublished. The strict publication baseline uses Cache-Control: no-store on product/category/search API responses, so each request reaches its source-eligibility check. Internal product/candidate caches may live for 60 seconds, but the API checks current PostgreSQL publication before releasing their contents. Public media derivatives have their separate delivery policy. Shared response caching requires an explicit later decision accepting its unpublish-staleness bound; asynchronous invalidation alone cannot promise immediate removal. Checkout still revalidates all commercial facts.

## Staff product create/edit

**POST /staff/catalog/products; operationId: createProduct; CAT-01/ADM-01.**

Require catalog.edit permission and Idempotency-Key. Input: title 1–200, slug 1–160, optional shortDescription at most 1,000, description at most 20,000, optional brandId, categoryIds at most 20. Create draft only. Output 201: id, slug, status=draft, version, createdAt; Location header points to staff resource. Slug conflict 409, invalid category 422. Transaction inserts product/category links/audit/outbox and idempotent result.

**PATCH /staff/catalog/products/{id}; operationId: updateProduct.**

Same bounded editable fields; status, stock, prices and audit fields cannot be mass-assigned. Require If-Match and current permission. 200 updated projection/version; 428 missing precondition; 412 stale; 404 hidden target.

**POST /staff/catalog/products/{id}/publication; operationId: publishProduct.**

Require catalog.publish, If-Match, Idempotency-Key. Body carries reasonCode and optional bounded reason note. Require published category, at least one eligible variant/current positive price and approved media. Return 200 product/version or 422 publication requirements with safe field codes. No provider calls in transaction.

## Cart and quote

**POST /customer/cart/items; operationId: addCartItem; CART-01.**

Require owned customer or verified guest-cart capability and If-Match. Body: variantId and quantity 1–20 subject to stricter SKU limit. Cart cap 50 distinct lines. Output cart id/version/items/estimated totals with indicative stock. Cart does not reserve inventory.

**POST /customer/checkout/quote; operationId: quoteCheckout; CHK-01/INV-01.**

Body: cartId, cartVersion, contact recipient/email/phone, shippingAddress country/city/area/line1/optional line2/postalCode, deliveryZoneCode, optional couponCode. Validate contact lengths/formats, normalized country BD for synthetic baseline, address lines at most 200 and coupon at most 64. Do not trust cartId or address ownership supplied by client.

200: quoteHash, validUntil, cartVersion, immutable calculation proposal containing lines, exact discount/tax/shipping/payable, currency, policyVersionRefs and eligibility warnings. No reservation/order/attempt inserted. 412 stale cart; 422 invalid zone/coupon/product; 503 required authority unavailable.

## Checkout submit

**POST /customer/checkouts; operationId: submitCheckout; CHK-01/INV-01/ORD-01.**

Require same actor context and Idempotency-Key. Body repeats normalized quote inputs plus confirmedQuoteHash; client amounts are not accepted as authority.

T02 inserts checkout attempt, order snapshots, reservation/coupon hold, initial payment intent, histories/audit and outbox/deliveries in one transaction. Response 201: checkoutId, orderReference, orderState, paymentAttemptId, paymentState, reservationExpiresAt, payableMinor, currency and statusUrl. A gateway URL is not required for this local commit.

Same actor/key/hash returns recorded safe outcome with Idempotency-Replayed header. Changed payload under key returns 409 IDEMPOTENCY_PAYLOAD_MISMATCH. Changed quote returns 422 QUOTE_RECONFIRMATION_REQUIRED with safe fresh quote details; this deterministic outcome is retained and requires a new key after confirmation. Out-of-stock returns 409 STOCK_UNAVAILABLE. Unknown commit recovery loads the idempotency outcome, never guesses.

## Payment session and callback

**POST /customer/payment-attempts/{id}/session; operationId: requestPaymentSession; PAY-01.**

Require order ownership and Idempotency-Key. Empty body except an allowlisted return destination identifier; no arbitrary redirect URL. Local guarded intent returns 202 with paymentAttemptId, state and statusUrl. Worker claims, starts provider call, stores pending/session or unknown evidence. Repeating while in progress does not launch another call.

**GET /customer/payment-attempts/{id}/session; operationId: getPaymentSession.**

Return 200 state and current authorized hostedUrl only if known, unexpired, HTTPS destination validated, and the attempt/order is still eligible for payment. Never return it after verified success, order cancellation or another blocking terminal outcome. Otherwise return state/statusUrl and safe retry guidance. No-store; hostedUrl is redacted from telemetry. A callback that wins the initiation-result race cannot be undone by the later session response.

**POST /integrations/sslcommerz/ipn; operationId: receivePaymentNotification; PAY-01/PAY-02.**

Accept documented provider form encoding under a bounded parser; do not impose the ordinary JSON rule. Persist deduplicated redacted receipt and validation work atomically. Return provider-confirmed acknowledgement only after durable intake; DB outage yields retryable non-success. Correct receipt means received, never paid. Provider-specific acknowledgement body/status and retry policy remain sandbox evidence items.

## Financial approval and shipment

**POST /staff/orders/{id}/hold-resolutions; operationId: resolveOrderHold; ORD-01/PAY-02/INV-01.**

Require permission for the specific hold type, If-Match and Idempotency-Key. Input: holdId, resolutionCode and bounded reason; no caller-supplied amount, payment-success flag or stock override. The T04 resolution use case reloads verified funding minus reserved/completed refunds, independent holds, cancellation, coupon and stock state. It may resolve the named hold and allocate/confirm atomically, or return 409 ORDER_HELD/STOCK_UNAVAILABLE, 412 stale version or 422 UNSUPPORTED_HOLD_RESOLUTION. The safe response contains orderReference, separate order/payment/allocation states and version. Callback replay is not a substitute for this command.

**POST /staff/refunds/{id}/approval; operationId: approveRefund; RET-01/PAY-02.**

Require finance.refund.approve, If-Match, Idempotency-Key and distinct approver under test policy. Input approvedAmountMinor and component/line allocations plus reasonCode. T08 rechecks original successful payment and cumulative refund balance; 200 approved/reserved result. Invalid authority 403, stale version 412, excessive amount 422 REFUND_BALANCE_EXCEEDED. Never return completed before T09 evidence.

**POST /staff/shipments/{id}/dispatch; operationId: dispatchShipment; SHIP-01.**

Require fulfillment.dispatch, If-Match, Idempotency-Key, courierName 1–100 and trackingReference 1–100 under manual test policy. Lock order and shipment path; verified funding/full allocation/no blocking hold/packed state required. 200 shipped/history version; 409 ORDER_HELD or INVALID_SHIPMENT_STATE. No stock decrement.

## Contract evidence and next additions

For every operation, create future executable OpenAPI schemas, response examples, permission checks and meaningful HTTP integration tests. The first catalog slice should demonstrate valid create/edit/publication, stale version, duplicate key, forbidden role and hidden draft. Payment/refund contracts additionally require provider failure and concurrent replay evidence.

The broader endpoint inventory remains in [API design](../04-api-contracts.md). Remaining endpoint schemas are refined just before their BUILD slice; no entire frontend design or 199-task completion is required.
