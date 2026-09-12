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


## B003 local identity evidence

DEV-PHYSICAL-BD revision 1 now has BUILD-007/008 synthetic signed customer/staff identities, verified MFA claims, owned profile/address operations and audited current staff grants/revocation. [B003](../aidlc/bolts/B003-identity.md) records real local PostgreSQL negative/race/failure and CLI/HTTP smoke evidence. Ten-address cap, BD fields, five-minute local tokens and fixed access/catalog roles are technical fixture refinements documented in the local identity contract; no merchant profile revision or real identity acceptance is inferred. All optional templates stay disabled. Human acceptance and BUILD-034 real Auth0 evidence remain pending.

## B004 local catalog evidence, 8 September 2026

DEV-PHYSICAL-BD revision 1 now has BUILD-009 through BUILD-013 synthetic catalog metadata, draft/publication/anonymous-read behavior, exact BDT prices and atomic audit/idempotency/outbox evidence. [B004](../aidlc/bolts/B004-catalog.md) records guarded fixture setup, a fictional editor publishing a product at 19,900 minor units, public read and wrong-role denial, plus five captured pending deliveries. Category/brand/attribute/content/media references are local fixtures; approved pixel metadata is not real media inspection or file delivery. Availability is unknown until stock exists. No merchant fact, tax/retention policy, profile revision or optional template changed; no provider/production acceptance is inferred.

## B005 local stock/cart evidence, 12 September 2026

DEV-PHYSICAL-BD revision 1 gains BUILD-014/015 local stock ledger/adjustments and owned customer/guest cart lifecycle with explicit deterministic merging under AUTH-009. [B005](../aidlc/bolts/B005-stock-cart.md) records runtime evidence and limits. Fixture refinements are synchronized with [development defaults](../../backend/readiness/02-development-defaults.md) and [local contracts](../../backend/readiness/11-local-stock-cart-contracts.md): one TEST-WH, nonzero signed adjustments bounded to 1,000 units, 20 units/50 lines, 30-day inactivity expiry and explicit merge clamping/conflict. Cart observations do not reserve stock or constitute checkout quotes. No merchant fact, profile revision, real-provider policy or optional template changed. Human artifact acceptance, reservation/payment/expiry workflow and production remain pending.
