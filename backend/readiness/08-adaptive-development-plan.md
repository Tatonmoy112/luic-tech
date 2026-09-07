# Adaptive commerce: gap treatment and development sequence

**Status:** Documentation treatment specified; implementation and external evidence pending. **Date:** 6 September 2026.

## Development verdict

Use [DEV-PHYSICAL-BD](../../context/registers/commerce-profiles.md) for the first local synthetic slice. The user has requested adaptable planning, not code. Core backend work still follows BUILD-001 through BUILD-044 when coding is requested. The ADAPT tasks below refine or extend those outcomes; they are not a second mandatory implementation of the same modules.

Architecture documents now define a repeatable way to collect varying merchant inputs, select supported behavior and reject incompatible combinations. They cannot fill real account access, goods, tax rules, budget, staff or measured performance automatically. Do not change pending evidence to complete because a profile contains a placeholder.

## Treatment of all prior missing information

| Gap | Dynamic treatment | Local starting value | Evidence still needed and capability blocked |
| --- | --- | --- | --- |
| D01 goods/merchant/market | Profile selects goods, quantity, buyer, market and fulfillment capabilities; compatibility report routes extensions | DEV-PHYSICAL-BD | Actual merchant facts before affected real behavior; nonbaseline modes require completed extensions |
| D02 capacity | Versioned load scenario and deployment budget associated with profile | Existing fictional load scenario | Measured load and forecast before capacity/SLA commitment |
| D03 inventory | Typed inventory policy plus extension selection for locations, units and tracking | One location, integer units, 15-minute hold | Operations rules and selected extension acceptance before real stock handling |
| D04 identity | Access-policy type and verified auth adapter binding | Synthetic issuer and existing guest fixtures | Auth0 configuration/MFA/revocation before real auth |
| D05 payment | Capability-checked provider registry; immutable binding per attempt | Existing local simulation | Provider sandbox/live/query/refund/settlement evidence before those operations |
| D06 shipping | Versioned zone/rule selection and courier capability binding | Existing fictional fees/manual courier | Real zone mapping, rates and workflow; splits/COD need extensions |
| D07 finance/returns | Versioned tax, invoice, return, cancellation and refund policies with worked scenarios | Existing fictional rules | Merchant/accountant decisions and implementation of actual strategies before real finance |
| D08 cloud | Environment-specific resource manifest and compatibility/cost assessment | Local API/PostgreSQL | Account, region, quotas, version, access and cost evidence before cloud work |
| D09 compatibility | Immutable runtime/dependency manifest with schema/adapter compatibility | Existing candidate stack, no exact pins claimed | Clean install/build/boot and client tests before executable acceptance |
| D10 imports | Versioned mapping and source provenance; explicit units/keys | Fictional CSV fixtures | Representative real sample, rights, reconciliation and quality before cutover |
| D11 email | Provider binding and event/template/sender policy | Local capture | Sender/domain/provider rights and bounce evidence before actual delivery |
| D12 delivery resources | Named task ownership and dependency/effort records per selected scope | Owner roles; no dates promised | Named team, capacity and budget before commitments |
| D13 privacy | Per-data-class retention policy and hold-aware execution | Synthetic data only | Actual reviewed purposes/durations/deletion process before real-data use |
| D14 objectives | Versioned acceptance scenario set for selected topology/profile | Existing proposed NFR targets | Actual security/load/restore evidence before release acceptance |
| D15 assets/support | Conditional input checklist for the selected backend capability | Fictional content and contacts | Real catalog/policy text/domain/support only before dependent real use; branding does not block backend |
| D16 accounts | Scope-specific account registry with named ownership and secret references | No fabricated account bindings | Actual delegated access before each integration |
| Physical schema | Baseline model plus explicitly selected extension package | Current 78-table logical model | Migrations and constraint/concurrency evidence before persistence acceptance |
| API completeness | Contract template includes profile, capability and policy semantics | Existing first-slice field contracts | Final bounded fields/errors/OpenAPI and negative cases per implemented slice |
| Code and verification | BUILD outcomes with targeted ADAPT additions | All implementation Not started | Executable artifacts, tests and deployment evidence cannot be replaced by configuration |

## Small ordered adaptation tasks

For AI-DLC execution, use the primary Unit assignments in [the execution map](../../context/aidlc/execution-map.md). Attach selected ADAPT substeps to the affected Bolt and preserve the dependencies below. A profile/policy extension receives its own scope, compatibility, historical-order and activation acceptance; process adoption alone does not authorize or complete the extension.

All rows are **Not started** as implementation/refinement tasks; the present documents are their design inputs. Complete only tasks needed for the selected scope. ADAPT-001/002 can be recorded in planning now; their executable enforcement comes later.

| ID | One reviewable outcome | Dependencies / BUILD attachment | Acceptance evidence |
| --- | --- | --- | --- |
| ADAPT-001 | Record chosen profile/revision and distinguish fixtures from real facts | BUILD-001 scope input; profile register | Every field has value or explicit unavailable status, provenance and accountable role |
| ADAPT-002 | Enumerate supported capability IDs and reject unknown/incompatible selections | ADAPT-001; BUILD-002/003 | Disabled digital/marketplace/COD requests cannot reach baseline checkout |
| ADAPT-003 | Specify first domain policy types, limits, examples and precedence | ADAPT-002; before affected BUILD-016/017 behavior | Unambiguous matched policy; missing/tied/unsupported inputs rejected |
| ADAPT-004 | Finalize selected policy tables/order bindings, constraints, ownership and lock-order change; update dictionary/ERD | ADAPT-003; before adaptive migrations under BUILD-005/018 | Complete relational review, parent order, exact table coverage and no generic unchecked references |
| ADAPT-005 | Add reviewed policy persistence migrations and immutable fixture records | ADAPT-004 plus BUILD-005/007/012 | Clean rebuild, invalid scope/FK rejection, sealed revision immutability and rollback |
| ADAPT-006 | Add pure bounded evaluation for the baseline policy types | ADAPT-003, ADAPT-005; BUILD-016 | Exact-money/eligibility fixtures, no network call or side effect, unsupported algorithm rejected |
| ADAPT-007 | Bind quote and checkout to one policy release and immutable order selections | ADAPT-006 plus BUILD-017/018 | Reconfirmation, activation race, rollback and idempotent replay under later policy |
| ADAPT-008 | Define and implement draft/edit/validation permissions and contracts | ADAPT-005, ADAPT-006 plus BUILD-008/010 | Bounds, stale revision, cross-scope denial, safe validation report |
| ADAPT-009 | Add approval, scheduled activation and audited pointer switch | ADAPT-007, ADAPT-008 plus BUILD-012/019 | Changed draft invalidates approval; duplicate schedule safe; no half-activated set |
| ADAPT-010 | Bind provider/account and pending intents to historical profile decisions | ADAPT-007 plus BUILD-020/021/028 | Provider switch cannot redirect old callback/refund or blindly retry unknown mutation |
| ADAPT-011 | Integrate purchased policy with current cancellation/return/refund guards | ADAPT-007 plus BUILD-023/025/026 | New return window does not rewrite old order; current access/holds and refund ceilings still apply |
| ADAPT-012 | Add scoped operational stop/resume and obligation-draining behavior | ADAPT-009, ADAPT-010, ADAPT-011 | Stop new checkout; still persist callbacks and reconcile already accepted payments |
| ADAPT-013 | Include policy revision and compatibility in cache/job/event/telemetry contracts | ADAPT-007 plus BUILD-027/029/031 | Stale pointer not trusted; events replay under correct historical decision; no sensitive payload logs |
| ADAPT-014 | Collect conditional merchant/provider inputs for one real profile | ADAPT-002; alongside BUILD-034 through BUILD-038 | Only selected integrations require accounts; actual evidence replaces fictional values explicitly |
| ADAPT-015 | Rehearse policy rollout/rollback and restore with old/new orders | ADAPT-009 through ADAPT-013 plus BUILD-039 through BUILD-042 | Restored pointers/revisions/jobs reconcile; old obligations survive rollback |
| ADAPT-016 | Accept one real profile against final artifact/schema/policy evidence | ADAPT-014, ADAPT-015 plus BUILD-043/044 gates | No fictional inputs in live profile; selected capabilities fully accepted; named operating owners |

The table is a dependency graph. ADAPT-014 can proceed while local implementation continues. Baseline catalog BUILD-001 through BUILD-013 does not require a policy administration service. Adaptive checkout requires ADAPT-003 through ADAPT-007 before it can claim dynamic behavior. Staff policy activation can follow once the immutable fixture evaluator is proven.

## Adding a different commerce model later

For each selected extension from the [capability matrix](../../context/11-commerce-adaptability.md), create a separate EXT requirement/task set:

1. Describe purchased obligation, actor/ownership, units, money flow and completion/cancellation meaning using concrete examples.
2. Define compatible and forbidden combinations with all already enabled capabilities.
3. Specify entities/FKs/invariants, state transitions, lock order, API fields, event contracts and provider capability evidence.
4. Design migration/backfill, historical read compatibility, reconciliation, rollback and operating ownership.
5. Implement and verify the isolated extension through API/worker tests when coding is authorized.
6. Exercise mixed workflows, failure/race cases, security, load and recovery; update dictionary/ERD and traceability.
7. Enable only the verified combination in a new profile release. Document remaining exclusions rather than marking the template universally supported.

No EXT task is selected by default. Additional business models are not prerequisites for starting the current backend.

## Ready-to-start checklist

- Selected profile is visible in context and every task identifies its applicable capabilities.
- Required local fields are supplied by explicit synthetic fixtures; unknown real facts remain pending.
- Unsupported capabilities reject selection before commercial side effects.
- Core compatibility and PostgreSQL foundation are verified during bootstrap.
- Each affected module has bounded contracts, policy examples and negative/race acceptance scenarios.
- Real integrations and real-data operation retain their separate gates.

These documents close the missing design mechanism for adaptation. They do not certify production behavior, universal model coverage or runtime policy support.

## Documentation verification

The 6 September 2026 update checked 83 Markdown files and 210 local file links across backend, database, context and dev. Local link resolution and Markdown table shape passed; ADAPT-001 through ADAPT-016 were contiguous and their explicit ADAPT prerequisites preceded the dependent task. Git whitespace checking reported no errors. The artifact scan found no application, SQL migration or infrastructure source files. Existing diagrams were not changed or rendered in this update. Runtime compatibility, migrations, policy activation, provider behavior and acceptance scenarios remain unexecuted.
