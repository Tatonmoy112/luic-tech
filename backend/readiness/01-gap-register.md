# Gap closure and evidence register

**Status definitions:** Specified = concrete documentation exists; Synthetic default = usable only with test data; External evidence pending = requires an owner/account/provider; Execution pending = must be demonstrated during future implementation.

The rows below describe the selected physical-goods fixture. For varying merchant models, the [adaptive treatment of every gap](08-adaptive-development-plan.md) defines profile selection, versioned policies, conditional evidence and extension gates. A value becomes configurable only after its supported behavior is implemented; missing facts remain pending rather than becoming guessed production defaults.

| Gap | Decision or development treatment | Evidence still required | Blocks | Owner role |
| --- | --- | --- | --- | --- |
| D01 merchant/market/goods | Single merchant, physical SKU goods, BD/BDT, English as synthetic baseline | Merchant confirms actual product types and exclusions | P; affected product-specific features | Product owner |
| D02 sizing | Synthetic 10,000 SKUs, 1,000 orders/day, 100 dynamic requests/sec; separate checkout test mix in defaults | Real forecasts and repeatable load report | Production capacity commitment | Technical lead |
| D03 inventory | One location, integer units, no backorders/splits; 15-minute reservation for synthetic tests | Operations confirms policy and observed payment duration | P inventory behavior | Operations |
| D04 identity | Auth0 access-token verification; local signed synthetic issuer only in test; secure guest capabilities | Tenant/client/audience/MFA and guest policy evidence | I Auth0; P customer access | Security |
| D05 payment | Direct SSLCOMMERZ adapter; documented simulator outcomes, no real payments | Sandbox account; session/IPN/validation/refund/query behavior | I payment; P live payments | Finance + backend |
| D06 shipping | Manual courier, deterministic development zone fees, unsupported zone rejected | Zone list, costs, tracking fields and courier process | P checkout/dispatch | Operations |
| D07 finance/returns | Exact arithmetic and synthetic scenarios specified; tax and return windows are test policy | Accountant/merchant-approved tax, invoice, refund, cancellation and return examples | Real pricing/invoice/refund rules | Finance |
| D08 cloud | ECS, RDS PostgreSQL Multi-AZ, SQS, S3/CloudFront, OpenSearch, OpenTofu retained; Singapore is assessment candidate only | Account-scoped engine/service/AZ availability, latency and cost assessment | Cloud provisioning and production topology | Platform |
| D09 compatibility | Node 24; Nest/Express candidate, Drizzle with node-postgres, GLIDE on Linux; exact-pin procedure specified | Clean dependency install, build, migration, native-client, auth and telemetry evidence | Executable bootstrap baseline | Backend |
| D10 imports | Documented synthetic CSV field contract and fixtures | Representative merchant CSV and rights/quality review | Real catalog/opening-stock cutover | Data owner |
| D11 email | SES proposed within AWS; local capture adapter first | Domain control, sender verification, quota, sandbox/production access, bounce handling | Real email sending | Platform + product |
| D12 delivery | Role responsibilities and capacity-neutral implementation sequence supplied | Named contributors, availability, budget and start date | Delivery date/cost commitment | Sponsor |
| D13 privacy | Synthetic-only development, minimized logs, no automatic deletion of commerce evidence | Retention/legal-hold/account deletion policy for actual business | P or any real-data use | Policy owner |
| D14 objectives | Existing NFRs retained as targets with measurable scenarios | Approved regional RPO/RTO plan, mixed-load and restore results | SLA and production acceptance | Technical + sponsor |
| D15 assets | Backend uses fictional product/email/content fixtures | Actual domain, policy text, sender and support ownership | Relevant production capability | Product |
| D16 account ownership | Merchant-owned accounts with delegated named access | Account/resource inventory and working least-privilege grants | I/P for each account | Sponsor + platform |
| A01–A05 architecture | Working development baseline: modular monolith, PostgreSQL authority, separate workers, Standard SQS, separate states | Runtime architecture/concurrency proof during implementation | P acceptance, not local scaffolding | Technical lead |
| BA-007/008 API boundary | Backend can be called by API clients now; later web forwards verified access token over private route; guest capability is independent | Edge/workload and browser-session integration evidence | Public deployment, not backend tests | Security + platform |
| BA-026 revocation | Authoritative staff account/grant check on every sensitive command; at most 30-second cache for staff read permissions | Revoke role/account during active session test | Sensitive staff acceptance | Security |
| BA-032 DB pools | Explicit initial local and staging connection formula in defaults | Actual RDS max/usage and surge/load measurement | Scaling beyond tested budget | DBA |
| BA-040 versions | No invented exact compatibility claim; lock all installed versions/digests in bootstrap evidence | Complete version manifest and smoke results | Shared executable baseline | Backend |
| DB-022 tax | Versioned synthetic zero-tax policy only for fictional fixtures | Actual tax treatment, rounding, policy versions | Real checkout/invoice | Finance |
| DB-023 retention | No real-data purge period selected | Per-class approved durations and restore/legal-hold process | Production deletion/retention | Policy owner |
| DB-024 provider model | Concrete mapping/checklist; no generic one-success-per-order restriction | Merchant-scoped IDs/status/refund semantics | Provider schema freeze | Finance + backend |
| DB-027 invoice | Operational order reference is not an invoice number | Invoice fields, numbering, tax identifiers and correction rules | Invoice feature | Finance |
| Executable backend artifacts | Concrete BUILD tasks replace an open-ended “define” backlog | Source, migration, tests, pipeline and runtime evidence | Implementation remains not started | Backend + platform |
| Design contradictions | Explicit correction decisions C01–C09 | Migration-level review and executable assertions | First affected module migration | Backend + DBA |

## Evidence recording

For each pending row, attach date, named reviewer, environment, source/account identifier with secrets removed, conclusion, affected capability, and next action. Never replace “pending” with “complete” because a template or URL exists. Credentials themselves belong only in the secret store.

## Permission to progress

Missing SSLCOMMERZ access blocks the real adapter acceptance, not inventory concurrency tests. Missing shipping policy blocks real checkout pricing, not the quote engine with synthetic rates. Missing final return policy blocks real eligibility, not quantity/refund invariants. Missing AWS region blocks provisioning, not the local application composition. Recheck any actual goods category that would change the data model before developing category-specific rules.
