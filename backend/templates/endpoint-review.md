# REST endpoint review template

## `[operationId] METHOD /api/v1/...`

| Field | Value |
| --- | --- |
| Audience and owner |  |
| Requirement/use case |  |
| AI-DLC intent/Unit/Bolt and task |  |
| Action authorization and evidence identity |  |
| Authentication |  |
| Permission/ownership/scope |  |
| Commerce profile/capability gate |  |
| Policy selection and historical behavior |  |
| Request schema and size |  |
| Response schema and fields |  |
| Idempotency/precondition |  |
| Transaction/remote calls |  |
| Cache policy |  |
| Rate class |  |
| Audit and data classification |  |
| Logs/traces/metrics |  |

## Outcomes

| Outcome | HTTP status | Stable code | Safe client action |
| --- | --- | --- | --- |
| Success |  |  |  |
| Validation |  |  |  |
| Unauthorized/hidden |  |  |  |
| Conflict/precondition |  |  |  |
| Dependency/unknown |  |  |  |

## Evidence

- OpenAPI examples and compatibility result:
- Authorization/ownership cases:
- Invalid/oversize/rate cases:
- Idempotency/concurrency/retry cases:
- Dependency loss and telemetry redaction:
- Reviewer/date/exceptions:
