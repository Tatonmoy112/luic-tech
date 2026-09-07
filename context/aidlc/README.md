# AI-DLC entry point

**Adopted process:** AI-DLC for this repository, by user instruction on 6 September 2026.  
**Current work:** U02/B003 BUILD-007/008 identity and ownership implemented/verified, In review; B001/B002/B003 human acceptance pending.
**Execution scope:** Backend, database, workers and operations. Frontend work is excluded from the current intent.

## Method and local application

AWS describes AI-DLC around Inception, Construction and Operations, with AI preparing/executing work, humans validating consequential decisions, and repository artifacts carrying context between short delivery cycles. This repository applies those principles to its existing ecommerce plans. [AWS method overview](https://aws.amazon.com/blogs/devops/ai-driven-development-life-cycle/).

This is a documented local workflow, not an installation or unmodified copy of an AWS workflow harness. The upstream workflow guide reviewed on 6 September 2026 separately describes Initialization and Ideation alongside Inception, Construction and Operation. Here, initialization and intent framing are explicit Inception activities. If a harness is adopted later, pin and review its version and map its states to these records; do not infer that upstream automated gates, agents or commands already exist. [Upstream phase guide](https://github.com/awslabs/aidlc-workflows/blob/main/docs/guide/04-phases-and-stages.md).

## Read in this order

| Order | Document | Purpose |
| --- | --- | --- |
| 1 | [Current workflow state](state.md) | Active intent, authorization, selected profile, actual progress and next action |
| 2 | [Workflow and human decisions](workflow.md) | Phase activities, readiness, review, evidence and change control |
| 3 | [Unit and Bolt execution map](execution-map.md) | Map all 44 BUILD tasks and 16 ADAPT additions without changing dependencies |
| 4 | [Active U02 identity Unit](units/U02-identity.md) | Current scope, B003 evidence and exclusions; U01 foundation remains historical context |
| 5 | [Session guide](session-guide.md) | Start/resume/finish consistently with minimal relevant context |
| 6 | [Evidence and decision log](audit.md) | Provenance, current authorization and review events; no invented acceptance |

Use [the Unit template](templates/unit.md) and [Bolt template](templates/bolt.md) for future delivery records. Use the existing [task card](../templates/task-card.md) for the contained tasks. The [backend build guide](../../backend/13-consolidated-build-guide.md) and [database pack](../../database/README.md) retain technical authority.

## Source ownership

| Concern | Authoritative local source |
| --- | --- |
| User intent and action scope | Current user instructions, with an accurate reference in workflow state/audit |
| Product requirements and release scope | dev requirement/scope documents and project decision register |
| Business facts and synthetic profile | Commerce profile register and D01-D16 evidence |
| Architecture and correctness | Backend/database canonical design, invariants and accepted decisions |
| Task prerequisites | BUILD implementation sequence; ADAPT dependencies for selected extensions |
| AI-DLC routing and next work | This folder's state, execution map and selected Unit/Bolt record |
| Implementation evidence | Actual reviewed artifacts, commands/results, environment and reviewer records |
| Delivery summary | Existing status board and requirement traceability, referencing these records |

Keep authoritative facts in their owning file and link them. AI-DLC artifacts add execution context rather than copying complete requirements, schemas or API contracts into another folder. Existing A-E/G1-G3 governance and L/I/P readiness gates retain their meaning; the workflow maps them instead of replacing them.

## Current applicability

The repository has substantial proposed Inception and design inputs, including the 78-table baseline and adaptable-commerce extension plans. [B001](bolts/B001-foundation.md) supplies local core evidence under AUTH-004; [B002](bolts/B002-foundation.md) extends it with HTTP, PostgreSQL and local telemetry under AUTH-005. This foundation does not implement domain commerce or optional models, or establish human/operational acceptance. Further work follows the scoped authorization and next-action record in state.

[B003](bolts/B003-identity.md) subsequently supplies local identity/ownership and staff access evidence under AUTH-006. U02 remains In progress; real Auth0, guest/order access, policy administration, other Units and human acceptance remain pending.
