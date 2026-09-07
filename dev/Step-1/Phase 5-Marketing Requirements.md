# Phase 5: Marketing requirements

**Owner:** Product manager and marketing lead. **Output:** A bounded launch acquisition and promotion plan.

## Proposed release boundary

Release 1 includes editable homepage campaign content, product/category SEO, a single coupon per order, and transactional email. Release 2 may include abandoned-cart campaigns, loyalty, referrals, reviews, wishlists, and advanced promotion combinations. Marketing automation is not implied by selecting a queue or email provider.

| Area | Discovery questions | Release 1 acceptance |
| --- | --- | --- |
| SEO | Existing domain, indexed URLs, redirects, brand search terms? | Unique titles/descriptions, canonical policy, sitemap, crawlable public pages, redirects where supplied |
| Product content | Who owns descriptions, images, alt text, and attribute completeness? | Publication requires agreed mandatory fields and image approval |
| Coupons | Fixed/percentage amount, eligible items, start/end, minimum spend, cap, usage limits? | Backend enforces eligibility and prevents concurrent limit overruns |
| Campaign content | Who schedules banners and landing content? | Draft/preview/publish flow; expired offers do not remain active |
| Measurement | Which acquisition channels, analytics destination, consent rules? | Approved event definitions, duplicate prevention, and privacy review |
| Communications | Which messages are transactional versus promotional? | Transactional templates approved; promotional messaging requires separate scope and consent rules |

## Coupon policy to approve

Propose one coupon per order, no stacking, explicit eligible products, start/end interpreted in Asia/Dhaka, a maximum discount, and atomic reservation of limited redemptions during checkout. Release unused redemptions on checkout expiry; finance/product must decide whether a refunded order restores eligibility. Prevent negative payable amounts and exclude delivery from discounts unless explicitly configured.

Record rounding order alongside tax policy in D07. Do not advertise an offer before its catalog eligibility, inventory, and support instructions are ready.

## Analytics event plan

Proposed events: product viewed, search submitted, cart updated, checkout started, payment result verified, order confirmed, refund completed. Use order/payment references for deduplication, without names, email addresses, phone numbers, or addresses in analytics.

A browser payment-return event is not a completed purchase. Successful-order reporting must follow authoritative server state. Marketing attribution may be incomplete when consent is absent or tracking is blocked; financial reports remain independent.

## Launch SEO and content checks

Public pages should be useful without login, with stable product URLs, appropriate product/offer structured data, image descriptions, and an explicit policy for filter URLs. Admin, account, checkout, preview, and staging pages must not be indexed. Structured availability and price must align with the published product, with purchase eligibility rechecked at checkout.

Complete when coupon rules, content ownership, redirects, measurement destination, and communications boundaries are approved. No paid advertising budget or conversion uplift is assumed.
