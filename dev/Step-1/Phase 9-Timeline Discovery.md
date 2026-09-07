# Phase 9: Timeline discovery

**Owner:** Delivery manager. **Goal:** Identify the business deadline and what must be true to meet it.

## Questions to resolve

- Is launch tied to a campaign, season, contract, or replacement-system deadline?
- Is a limited pilot acceptable before public launch?
- When can product data, brand assets, policies, and staff reviewers be available?
- Who will approve requirements and UAT, and how quickly can they respond?
- Are payment onboarding, domain access, courier arrangements, and email verification already underway?
- Are there blackout dates for operations, finance, or deployment?

No start date or deadline was supplied. The proposed full launch window is **18-22 elapsed weeks from a ready kickoff**, subject to the capacity and scope in Stage 5. It is not a delivery promise. Discovery, contracting, unavailable credentials, and delayed approvals can extend calendar time before or during that window.

## Dependencies and response assumptions

| Dependency | Proposed needed-by point | Owner |
| --- | --- | --- |
| Business rules, scope, budget, team allocation | Before kickoff | Sponsor + product owner |
| AWS/Auth0 ownership and region/version decisions | Before foundation completion | Technical lead |
| Payment sandbox access | Before payment workflow starts | Finance |
| Representative catalog and shipping rules | Before catalog/checkout acceptance | Operations |
| Brand assets and approved content | Before storefront acceptance | Marketing |
| Merchant live approval and refund process | Before live-payment rehearsal | Finance |
| Staff, inventory opening balance, support cover | Before UAT and cutover | Operations |
| Production go/no-go approval | Before public launch | Sponsor |

Propose feedback within two business days for routine questions and five for milestone review. These are planning assumptions to negotiate, not automatic acceptance rules. Record the effect of late inputs in the risk log and revised forecast.

## Planning approach

Build a dependency-based roadmap, review it weekly, and reserve hardening and launch time. The critical path is approved rules -> checkout and inventory -> verified payments -> fulfillment/refunds -> integrated acceptance -> migration/recovery rehearsal -> pilot -> public launch.

A fixed business date may require a smaller release or different staffing. Re-estimate explicitly; do not compress testing or remove integrity controls to make a date appear achievable.

Complete when the sponsor records the desired date, flexibility, pilot option, blackout periods, and dependency owners in D12.
