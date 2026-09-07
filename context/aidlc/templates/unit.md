# Unit of Work template

| Field | Required value |
| --- | --- |
| Unit / intent IDs | Stable IDs and outcome title |
| Status | Not started / Ready / In progress / Blocked / In review / Done / Superseded |
| Scope and exclusions | Cohesive capability; actual selected model and boundaries |
| Requirement IDs | Existing valid product/NFR IDs or recorded new-scope requirements |
| Primary tasks | Exact BUILD IDs; selected ADAPT additions and BE/DBT design inputs |
| Profile and policy | ID/revision, evidence class and applicable capability IDs |
| Domain ownership | Owning modules/tables and coordinator/port boundaries |
| Dependencies | Exact task/substep evidence; do not require unrelated whole Units |
| People and authority | Actual owner/reviewer, role and applicable user authorization reference |
| Context | Links to canonical requirements/contracts/invariants/decisions |

## Inception outcome

State actor, business result, examples, open questions, supplied/synthetic facts, compatibility constraints and conditional stages with reasons. Define intended success independently of proposed code.

## Bolts

List the next concrete Bolt and later candidate slices with entry, expected result and acceptance. Split by reviewable behavior; no invented calendar commitment. A parent task closes only when all its required evidence exists.

## Quality and operation

Record relevant denial, replay, race, failure, unknown, migration, policy/history and recovery scenarios. Include observability and rollback/repair. Mark irrelevant categories Not applicable with a reason.

## Acceptance and handoff

Link actual artifacts and results, environment/schema/profile identity, defects/exceptions, human acceptance and date. Separate AI self-review from independent/human review. Record next eligible tasks and unresolved decisions. Leave unavailable evidence pending.
