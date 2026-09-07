# Bolt plan and evidence template

| Field | Required value |
| --- | --- |
| Bolt / Unit / intent | Stable IDs and one bounded outcome |
| Phase and status | Inception / Construction / Operations activity plus task status |
| Parent tasks and substeps | Exact BUILD/ADAPT IDs; identify partial parent acceptance |
| Profile/policy/capabilities | Selected immutable revisions and synthetic/real classification |
| Inputs/dependencies | Canonical context links, actual prerequisite evidence and pending facts |
| Authorized actions | User/decision reference, environment, scope, limits; permission is separate from acceptance |
| Owner/reviewer | Actual person/role and review type; no simulated independent reviewer |
| Stage selection | Required/omitted activities and scope-specific reasons |
| Intended confidence gain | What concrete uncertainty this Bolt will resolve |

## Plan before implementation

State intended behavior, exact included/excluded changes and ordered substeps. Identify material decision options and existing authorization. Prepare reviewable scope before asking about a genuinely missing decision. Never infer new real-data/provider/release permission from a local coding instruction.

## Acceptance scenarios

| Scenario / requirement | Preconditions and input | Expected result | Verification method | Actual result / evidence |
| --- | --- | --- | --- | --- |
| Fill for this Bolt | Explicit environment/profile | Observable independent expectation | Appropriate test/review | Pending until executed |

Include applicable negative access, invalid input, replay, concurrency, unknown provider, migration, policy-change and recovery cases. Documentation-only Bolts use document validation. Scale checks to risk instead of generating tests that merely mirror implementation.

## Execution and review record

Record artifact/diff/commit identity, exact environment/toolchain/schema/policy/provider mode, commands/scenarios actually executed, observed outputs, evidence locations, defects and repairs. Label unrun checks and limitations. Record AI self-review and required human acceptance separately; generated artifacts and passing checks do not imply stakeholder approval.

## Closure and next context

Record accepted/rejected result, reviewer/date and authorization scope still in force. Update parent substeps/tasks, Unit, traceability, status board, AI-DLC state and audit. State next eligible action, blocked decisions and files that changed. If the result is still awaiting review, keep In review rather than Done.
