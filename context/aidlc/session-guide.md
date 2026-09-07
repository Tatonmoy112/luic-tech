# AI-DLC session and handoff guide

## At the start of a session

1. Read the latest user instruction and root AGENTS.md. Read [state](state.md) and the active Unit/Bolt; distinguish documentation, coding, real integration and production authorization.
2. Inspect actual file/repository state and any applicable local instructions. Preserve existing changes; verify that earlier summaries still match the files.
3. Read current profile and only the relevant requirements, decisions, API/domain/dataflow and transaction rules. Load operations/security context when the slice affects them; avoid rereading every historic plan.
4. Determine next ready task/substep from actual dependencies, not Unit number or document order. Identify synthetic inputs, current evidence and unresolved business/provider facts.
5. State the intended outcome and verification briefly. Reuse existing scoped authorization. If a material decision is still needed, prepare the concrete choices and continue independent authorized work while awaiting the answer.

## During execution

Keep one coherent Bolt active unless parallel work is explicitly authorized and ownership is clear. Capture decisions and actual checks as they occur; do not reconstruct fictitious results later. Revisit Inception only for the affected scope when requirements/contracts/invariants change. Keep prior financial/stock/security decisions in context while implementing their dependent paths.

The AI may analyze, propose, edit and verify within authorization. Human judgment supplies business facts, material policy decisions and required acceptance. A second AI review is recorded as AI review, not finance approval or independent human verification. This workflow does not request subagent delegation by default.

## Before a handoff or context limit

Update the active Bolt's completed substeps, actual evidence, failures/limitations, changes in scope and current permission. Update state with intent, Unit, Bolt, phase, next command/action category and pending decision. Link the corresponding audit event and update affected task/traceability/status records. Never include secrets or raw sensitive provider/customer data. Do not turn a planned instruction into a claim it ran.

On resume, continue from verified unfinished work; do not restart planning or ask for permission already granted. If authorization changed or the intended action crosses its environment/scope, resolve that specific boundary first.

## Ready-to-use requests

These are future user prompt examples, not instructions executed by this document:

- Planning: "Use AI-DLC. Review the next Bolt's context and prepare its concrete plan and acceptance cases. Documentation only."
- First implementation: "Use AI-DLC and implement B001 in U01 for DEV-PHYSICAL-BD with synthetic local data. Follow its documented scope and verification; keep frontend, real providers and cloud deployment out of this Bolt."
- Resume: "Resume the currently authorized AI-DLC Bolt from context/aidlc/state.md. Check actual files and evidence, then continue the next unfinished substep."
- Review: "Review the completed Bolt against its requirements and observed evidence. Record gaps and acceptance status without inventing approvals."
- Scope change: "Prepare an AI-DLC impact review for the named commerce capability. Update the affected profile, contracts, database and tasks before implementation."

## Small change path

A typo or narrow documentation correction still gets intent/context inspection, authorized edit, relevant verification and a truthful handoff. It does not need new Units, full business discovery, cloud gates or code tests. A payment/refund/stock/identity defect gets reproduction, relevant design/context, guarded fix, meaningful regression/race evidence and operating impact review, even if the code diff is short.
