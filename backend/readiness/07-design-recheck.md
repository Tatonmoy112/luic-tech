# Backend design recheck

**Review date:** 6 September 2026.  
**Scope:** Local backend/database/context documentation and editable diagrams.  
**Verdict:** The recheck found substantive gaps beyond the earlier structural checks. The corrections below are incorporated in the proposed design. No software or production readiness is certified.

## Findings and corrections

| ID | Finding | Incorporated correction | Future implementation proof |
| --- | --- | --- | --- |
| RV-01 | Verified callback could precede session-result persistence, but created-to-succeeded was absent | Database payment state model permits fully verified direct success; late session result cannot downgrade it; session GET suppresses an ineligible hosted URL | Force callback validation before initiation response and verify final state/URL behavior |
| RV-02 | Paid-but-unallocated order had no usable repair path because T04 callback replay exits early | Separate scoped, idempotent staff hold-resolution command rechecks net funding, holds, cancellation, coupon and stock before one complete allocation | Resolve hold after replenishment; repeat command; replay callback; verify no duplicate allocation |
| RV-03 | Return quantity enumeration omitted inspected cases; broad refund-balance wording could permit repeated refund of one line | Count each approved/received/inspected/resolved return once; enforce receipt/inspection bounds and payment plus line/component refund entitlements | Inspected return followed by another request; two refunds for the same line; partial tax/shipping residual checks |
| RV-04 | A refund could reserve money while dispatch still treated historical successful payment as full funding | Pre-dispatch refund approval opens a finance hold under the order lock; dispatch/hold-resolution funding excludes reserved/completed refunds | Race approval against dispatch; exactly one applicable guarded transition succeeds |
| RV-05 | Early migrations/fixtures referenced missing parents or tables | Staff attribution precedes catalog prices; audit bootstrap storage is early; media metadata precedes publication fixtures; guest access and coupon holds follow orders/checkout | Clean rebuild at each BUILD boundary with real FKs enabled |
| RV-06 | Content and Valkey were named in architecture but lacked explicit implementation outcomes | BUILD-008/022/029/030 explicitly include profile/address, guest exchange/hold resolution, Valkey/rate adapters and content lifecycle; substeps keep work reviewable | API/client behavior, permission, outage and content publication evidence for each substep |
| RV-07 | Public HTTP caching could bypass the promised source publication check | Strict default uses no-store for discovery API responses; internal cached candidates, including autocomplete, are filtered at source; shared caching requires approved staleness semantics | Warm cache, archive product, then request detail/search/suggestions through the deployed route |
| RV-08 | Replacing synthetic policies after acceptance could leave evidence tied to the previous candidate | BUILD-043 depends on prior hardening/recovery and renews affected evidence after policy/data replacement | Release artifact/config/policy identifiers match the pilot's accepted evidence |
| RV-09 | Older correction text still described diagram page 2 as the pre-consolidation interaction view; return history used a different rejection name | Corrected the diagram description and normalized the documented return branch to rejected/cancelled | Import-boundary review and state-contract verification |

## Authoritative changed documents

- [Transaction and state rules](../../database/04-integrity-and-transactions.md): callback race, paid-hold resolution, cumulative return/refund bounds and refund/dispatch serialization.
- [Migration sequence](../../database/06-environments-and-migrations.md): parent-first foundation and feature boundaries.
- [API contracts](06-initial-api-contracts.md): strict publication caching, session eligibility and hold-resolution request.
- [Implementation sequence](05-implementation-sequence.md): corrected dependencies, explicit substeps and final-candidate evidence.
- [Commerce flows](../06-commerce-dataflows.md), [acceptance checklist](../12-validation-checklist.md) and [backend diagram](../diagrams/backend-architecture.drawio): corresponding behavior and proof requirements.

## Verification boundary

Structural validation checks local links, Markdown table shape, task IDs/dependencies, XML page/cell/edge integrity and dictionary/ownership/ERD table coverage. Semantic review traces selected high-risk interleavings against the documented states, amounts, ownership and transaction boundaries. These checks support the documentation; they do not execute the design.

Completed check result: 78 Markdown files, 169 local links, 78 matching dictionary/ownership/ERD table definitions, six database diagram pages, eight backend diagram pages, and contiguous 199 BE / 44 BUILD / 115 DBT task catalogs passed the checked structural conditions. Dependency fields contained no checked forward/self references. Git whitespace checking reported no errors; the source-file scan found no TypeScript, JavaScript, SQL, Terraform or package manifest artifacts.

The pack still has proposed merchant policies, unverified account/provider capabilities, unpinned executable dependencies and endpoint details intentionally refined at each BUILD slice. It contains no executable OpenAPI artifact, migrations, application tests, deployed services or observed recovery/load results. Diagrams are checked as editable XML, not visually rendered in diagrams.net. Real evidence is required by the [external checklist](04-external-evidence.md) before the affected integration or release gate can pass.

## Handoff

Keep all 44 BUILD tasks marked future work. Start with compatibility and the first local slice when coding is requested. Treat this recheck as corrected design context, and use the listed race/failure scenarios when later implementing each affected capability.
