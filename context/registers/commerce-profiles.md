# Commerce profile and evidence register

**Status:** Synthetic fixture, updated 7 September 2026. B001/B002 enforce this profile identity in local/test configuration; commerce capabilities and real-profile acceptance remain unimplemented/pending.

## Selected development profile

| Field | DEV-PHYSICAL-BD revision 1 |
| --- | --- |
| Lifecycle and evidence | Selected local/test fixture; synthetic-only; B001/B002 configuration evidence available; no merchant approval |
| Deployment scope | One merchant per deployment; no seller or tenant switching |
| Goods/units | Fictional physical variants; integer units; no lot, serial or expiry obligations |
| Market/money | BD addresses, BDT, scale 2; English and Asia/Dhaka business time; persisted instants UTC |
| Buyer | Customer account or guest capability; synthetic signed issuer locally |
| Inventory/fulfillment | One TEST-WH; no backorders; one shipment/order; manual courier |
| Payments | Hosted-payment simulation locally; SSLCOMMERZ sandbox separately gated; no COD, recurring debit or credit |
| Pricing | One coupon; exact minor units; DEV-ZERO-TAX; authoritative quote at submit |
| Reservation/quote | 15-minute hold; 5-minute quote; expiry/late payment retain documented guarded behavior |
| Delivery | DEV-LOCAL 6,000 minor; DEV-REMOTE 12,000 minor; unsupported zone rejected |
| Returns/refunds | Seven-day fictional window; documented line/component ceilings and distinct refund requester/approver |
| Import/content | Fictional CSV; draft-first; guarded approved-media fixture only for local tests |
| Data/retention | Synthetic-only; existing development retention; no production purge duration inferred |
| Target load | Existing synthetic development profile; no measured capacity or SLA |
| Required evidence | [B001 bounded bootstrap/configuration proof](../aidlc/bolts/B001-foundation.md) available, In review; B002 local foundation evidence is linked below; domain BUILD and merchant evidence remain pending |
| Accountable role | Backend lead for fixture behavior; product/finance/operations for future real decisions; people not named |

The values above reference [development defaults](../../backend/readiness/02-development-defaults.md). Change both documents together when changing this fixture. This is a complete local example, not a universal merchant default.

## Other profile templates

| Profile ID | Intended combination | Status | Required extension before selection for executable scope |
| --- | --- | --- | --- |
| TEMPLATE-PHYSICAL-ADVANCED | Physical retail with multiple locations, splits, lots or measured units as explicitly selected | Disabled template | Each selected inventory/fulfillment extension; no blanket enable-all |
| TEMPLATE-DIGITAL | Single merchant, entitlement delivery | Disabled template | Digital fulfillment and non-shipping checkout |
| TEMPLATE-SUBSCRIPTION | Recurring sale of explicitly chosen goods/service | Disabled template | Subscription agreement, billing schedule and verified collection |
| TEMPLATE-B2B | Organization buyers, negotiated prices and optional approved credit | Disabled template | Organization access, price contracts and credit if selected |
| TEMPLATE-MARKETPLACE | Multiple sellers and seller settlements | Disabled template | Seller ownership, order splitting, payable/payout ledger |
| TEMPLATE-BOOKING-RENTAL | Time or asset capacity obligations | Disabled template | Time/capacity and return/deposit workflows |

Templates may compose only after a joint compatibility review. They are not interchangeable with the baseline. A merchant can also define a new template through the same evidence and extension process.

## Required record for every new profile revision

Record stable profile ID, immutable revision, merchant/deployment scope, environment, parent revision, capability selections, typed policy revision references, adapter/account references without secrets, compatible schema/application versions, scenario results, reviewer and effective time. Record each input's provenance as merchant-supplied, provider-verified, measured, or fictional. Also record accountable person, evidence date and expiration/recheck trigger where applicable.

Lifecycle is draft -> reviewed -> scheduled -> active -> retired. Rejected drafts retain review history. A synthetic profile can only be active in isolated local/test composition; enabling real data or live providers requires a separately reviewed real profile. Lifecycle and evidence are independent: an active test fixture is still synthetic.

## Facts a profile cannot manufacture

Merchant legal identity, actual goods, tax/invoice/retention obligations, provider rights, working credentials, region availability, imported stock, available budget/team, and measured performance/recovery remain pending until supplied or demonstrated. Their exact checklist remains in [external evidence](../../backend/readiness/04-external-evidence.md). Record references to secrets, never their values.

## B002 local evidence, 7 September 2026

[AUTH-005 / B002](../aidlc/bolts/B002-foundation.md) retains this exact synthetic profile/revision with configuration version 2 and local PostgreSQL. No merchant fact, commerce capability, policy lifecycle or optional model was enabled. Identity/payment remain composition labels, with no issuer/simulator/provider implementation.
