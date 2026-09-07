# Phase 2: Identify and prioritize pain points

**Owner:** Product manager. **Input:** Business discovery and examples of recent orders. **Output:** Evidence-backed problem backlog.

## Discovery method

Ask staff to describe the most recent occurrence of a problem: what triggered it, who corrected it, time spent, customer impact, and whether money or stock was lost. Observe one order from each active channel. Separate symptoms, suspected causes, and verified causes.

No operational evidence has been supplied. The following are hypotheses to validate, not findings.

| ID | Hypothesized problem | Evidence needed | Proposed response | Related requirements |
| --- | --- | --- | --- | --- |
| P01 | Stock shown as available is already committed | Stock adjustments, oversold orders, channel overlap | Transactional reservations and stock ledger | INV-01, CHK-01 |
| P02 | Payment completed but order remains unpaid | Redacted gateway/order mismatches | Server validation and reconciliation queue | PAY-01, PAY-02 |
| P03 | Staff lose track of order progress | Time from payment to dispatch, support tickets | Controlled order workflow and audit history | ORD-01, ADM-01 |
| P04 | Customers cannot find suitable products | Search examples, zero-result terms, abandoned journeys | Structured attributes and faceted search | CAT-01, SRCH-01 |
| P05 | Refunds and returns depend on informal messages | Return cases, approval delays, finance adjustments | Return records and refund approvals | RET-01 |
| P06 | Sales totals differ between spreadsheets | Period definitions, settlement and refund examples | Reconciled operational reports | RPT-01 |

## Prioritization

Score each validated problem from 1 to 5 for frequency, financial/customer impact, and urgency. Add scores for an initial rank; then apply a mandatory override to security, payment integrity, or stock integrity risks. Record confidence separately as low, medium, or high. Do not give unsupported monetary loss figures.

For the top three problems, record: baseline period, numerator and denominator where relevant, evidence location, process owner, proposed outcome, and measurement date. Product prioritization must use customer value and dependencies, not just staff preference.

## Interview prompts

- Which task takes longest each day, and what proportion is correction or re-entry?
- Which mistake most often causes a refund, complaint, or stock adjustment?
- Which information does support have to ask another team to obtain?
- What happens during a promotion or when a key employee is absent?
- What would prevent launch even if every customer-facing screen looked complete?

## Completion criteria

Operations validates the problem descriptions, finance validates claimed financial impact, and the product owner agrees on three priorities. Unverified items remain hypotheses in Stage 1 internal analysis. Use the findings to refine scope; do not automatically expand Release 1.
