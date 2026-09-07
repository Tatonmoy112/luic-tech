# Phase 10: Decision making and governance

**Owner:** Sponsor. **Outcome:** Clear authority for product, technical, financial, and launch decisions.

## Proposed responsibility matrix

R = prepares or executes; A = final accountable decision; C = consulted.

| Decision | Sponsor | Product owner | Technical lead | Operations/finance | Delivery manager |
| --- | --- | --- | --- | --- | --- |
| Business goals and funding | A | R | C | C | C |
| Requirement priority and acceptance | C | A/R | C | C | C |
| Architecture and technical controls | C | C | A/R | C | C |
| Tax/refund/settlement rules | C | C | C | A/R through named policy owner | C |
| Fulfillment and returns procedures | C | C | C | A/R through operations lead | C |
| Schedule and capacity forecast | C | C | C | C | A/R |
| Contract or material scope/cost change | A | R | C | C | R |
| Production go/no-go | A | R | R | R | R |

Replace role labels with named people before kickoff. Where operations/finance share a cell, name one accountable person for the specific decision. Give each critical approver a delegate.

## Decision process

1. Raise a decision with context, options, recommended choice, cost/schedule/risk impact, and due date.
2. Consult affected owners and record evidence.
3. Accountable owner accepts, rejects, or asks for changes.
4. Update the decision register and affected scope, architecture, estimate, or policies.
5. Escalate overdue blockers to the sponsor; no response is not consent.

The delivery manager manages the record. Routine decisions within approved scope go to the designated owner; only material changes escalate to the sponsor.

## Gates

| Gate | Required approval evidence |
| --- | --- |
| G1: Discovery and scope | Business model, Release 1 requirements, exclusions, data allowance, budget direction |
| G2: Ready kickoff | Agreement, staffing, architecture baseline, compatibility/region plan, dependency owners, measurable service targets |
| G3: Production launch | UAT, payment and reconciliation evidence, stock checks, security/recovery evidence, operating readiness, launch decision |

Technical validation work described for later gates is a future delivery activity. This planning task does not authorize provisioning or implementation.

Complete when the sponsor identifies signatories, product acceptance owner, policy owner, launch approver, and escalation route.
