# Task card template

Copy this template for any new task. Keep one customer, operator, system, or operational outcome per card.

## `[TASK-ID] Short outcome title`

| Field | Required value |
| --- | --- |
| Status | Not started / Ready / In progress / Blocked / In review / Done / Superseded |
| AI-DLC execution | Intent ID, Unit ID, Bolt ID and lifecycle activity |
| Action authorization | Existing user/decision reference, exact scope and environment; separate from acceptance |
| Phase and work package | Phase number and W01–W13 mapping |
| Requirement IDs | One or more valid IDs from Stage 2 |
| Accountable owner | One role/person who owns completion |
| Reviewers | Product, technical, QA, security, finance, operations, or platform as relevant |
| Estimate | Focused person-day range; re-estimate after clarification |
| Dependencies | Task IDs, decision IDs, assets, access, or provider readiness |
| Commerce scope | Profile ID/revision, selected capabilities, policy release or explicit baseline-fixture reference |
| Adaptation and gate | Applicable BUILD/ADAPT/EXT IDs; local synthetic, real integration or production evidence |
| Evidence location | Planned and final link/path |

### Outcome

State the observable customer, operator, system, or operational result.

### Included

- List the exact behavior, states, data, or procedure delivered.

### Excluded

- State nearby work that belongs to another task or release.

### Acceptance

- Describe the normal case.
- Describe relevant validation, permission, failure, retry, concurrency, and recovery cases.
- For policy changes, cover activation/rollback, historical orders and incompatible capability selection; use Not applicable with a reason for unrelated tasks.
- State the reviewer and what evidence proves each condition.

### Operational considerations

State logging, metrics, audit, alert, reconciliation, support, migration, rollback, and privacy needs. Use `Not applicable` only with a reason.

### Completion record

| Item | Value |
| --- | --- |
| Completed by/date | Pending |
| Evidence reviewed by/date | Pending |
| Review type and acceptance | AI self-review / human review / independent verification; exact result and unresolved scope |
| Decisions created/changed | None yet |
| Defects/exceptions | None recorded |
| Dependent tasks released | None yet |
