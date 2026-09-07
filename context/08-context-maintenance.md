# Context maintenance protocol

This folder is intended to remain useful throughout delivery. Treat it as controlled product and system context, not as static prose that becomes stale after kickoff.

## Update triggers

The persistent AI-DLC handoff is [state](aidlc/state.md), [audit](aidlc/audit.md) and the active Unit/Bolt record. Follow [session guidance](aidlc/session-guide.md) at every new session or context boundary. State is a current pointer; the audit preserves events; requirements and technical facts stay in their owning files.

Update context when any of the following occurs:

- A D-register assumption is approved, rejected, or changed.
- Release scope, acceptance behavior, milestone, staffing, or provider dependency changes.
- A system boundary, data invariant, state transition, API behavior, or operational target changes.
- A task starts, becomes blocked, enters review, or is accepted.
- Verification produces evidence, a defect, an exception, or a new risk.
- A deployment, migration rehearsal, recovery test, pilot, or launch decision occurs.

## Update order

1. Record the decision, risk, or status change in the relevant register.
2. Update the authoritative product, system, data, quality, or operations document.
3. Update affected task dependencies and acceptance conditions.
4. Update the traceability matrix and status board.
5. Link evidence rather than copying results into several files.
6. Check all downstream references and record the reviewer/date.
7. Update the AI-DLC intent/Unit/Bolt pointer, current authorization, observed evidence and next eligible action. Keep actual execution and human acceptance separate; retain still-valid authorization across sessions.

## Status vocabulary

| Status | Meaning |
| --- | --- |
| Not started | Not assessed for immediate execution |
| Ready | Dependencies, decisions, owner, acceptance, and capacity are present |
| In progress | Named owner is actively producing the outcome |
| Blocked | Specific unresolved dependency prevents useful completion |
| In review | Outcome exists and named reviewers are evaluating evidence |
| Done | Acceptance met, evidence linked, reviewer and date recorded |
| Superseded | Replaced by a recorded decision or newer task; history retained |

Avoid percentage-complete reporting. Report accepted outcomes, remaining work, blockers, and forecast.

## Before a task starts

- Confirm the task is in the task catalog or uses the approved template.
- Identify intent/Unit/Bolt and whether the requested action is planning, implementation, real integration or production; check existing authorization before asking again.
- Confirm its requirement IDs and release boundary.
- Resolve its blocking decisions and prerequisites.
- Assign one accountable owner and named reviewers.
- Confirm designs, policy, data samples, provider access, and environments needed by the task.
- Agree where demonstration, test, review, and operational evidence will be stored.
- Split the task if one reviewer cannot assess it as one coherent outcome within roughly one to three focused working days.

## Before a task is marked done

- Demonstrate the stated customer, operator, system, or operational outcome.
- Review expected, negative, permission, failure, retry, and concurrency cases relevant to the task.
- Confirm logs/telemetry/audit behavior where the outcome changes money, stock, identity, or operations.
- Link evidence in the task and traceability matrix.
- Record defects and accepted exceptions; do not hide them in meeting notes.
- Record product acceptance and technical/QA acceptance as applicable.
- Update the status board and unblock dependent tasks.

## Context handoff for a new contributor or tool

Provide, in order: this folder's README, current context, the relevant blueprint sections, the task card, dependencies, related decisions/risks, and required evidence. The contributor should state their understanding of the outcome, authority boundary, unresolved inputs, and completion test before work begins.

For narrow work, do not load every historical note. Supply only the authoritative context needed for the task plus the invariant and release rules that it can affect. Payment, inventory, identity, migration, and production work always includes the relevant quality and operations context.

## Change quality checks

- Requirement IDs remain valid and every P0/P1 requirement has planned task and verification coverage.
- No task is marked done without evidence and a reviewer.
- Release 2 or excluded work is not silently introduced into Release 1.
- Approved decisions replace assumptions consistently across files.
- Money, stock, payment, order, refund, ownership, and audit rules agree across product and system documents.
- Task order still respects dependency and readiness gates.
- Dates are explicit; relative project weeks begin only after ready kickoff.
- Current status distinguishes plans, work performed, evidence obtained, and approvals granted.
