# AI-DLC entry point

**Adopted process:** AI-DLC for this repository, by user instruction on 6 September 2026.  
**Current work:** U04/B005 BUILD-014/015 implemented and verified under AUTH-009, In review; U04 remains In progress with BUILD-019 deferred. U03/B004 technical verification complete; B001/B002/B003/B004/B005 human acceptance pending.
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
| 4 | [Active U04 stock/cart Unit](units/U04-stock-cart.md) and [B005 plan](bolts/B005-stock-cart.md) | Current implementation evidence, acceptance status and exclusions; U03/B004 supplies prerequisite evidence |
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

[B003](bolts/B003-identity.md) supplies local identity/ownership and staff access evidence under AUTH-006. [B004](bolts/B004-catalog.md) adds catalog lifecycle, exact prices, anonymous published detail and atomic audit/idempotency/outbox under AUTH-007. U03 is In review; U01/U02 remain In progress. Real identity/media, dispatcher, reservations/orders, policy administration and human acceptance remain pending. The current state identifies next eligible work and continuing fix authorization.

AUTH-008 selected U04 BUILD-014/015 and AUTH-009 approved B005 revision 1 for implementation. [B005 evidence](bolts/B005-stock-cart.md) now records five tables, stock/cart APIs, 243 passing Linux tests, preservation and audit repair. Human artifact acceptance is pending; BUILD-019 remains excluded until checkout/order parents and later authorization are ready.
