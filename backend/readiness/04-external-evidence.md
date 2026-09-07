# External inputs and verification

This is the collection checklist for facts that cannot be manufactured by architecture work. The requested information is non-secret; credentials must be delivered through the approved secret manager.

Collect this checklist conditionally using the selected [commerce profile](../../context/registers/commerce-profiles.md) and [capability matrix](../../context/11-commerce-adaptability.md). Mark an input not applicable only with a capability-based reason; unavailable required facts stay pending. Profile templates and synthetic examples do not supply merchant/provider evidence.

## Merchant decision sheet

| Input | Required answer/evidence | Development substitute |
| --- | --- | --- |
| Goods | Actual categories; variants, expiry/batch/serial/warranty needs; restricted/digital/weighted goods | Ordinary fictional unit-count SKUs |
| Commerce | Merchant legal/operating identity, BD/BDT scope, customer service contact | TEST merchant with no legal claims |
| Inventory | Warehouse, stock source owner, oversell/preorder policy, adjustment approval | One TEST-WH, no backorders |
| Reservation | Chosen duration after gateway timing review; late-payment/coupon-expiry handling | 15-minute synthetic expiry plus finance hold |
| Shipping | Zone-to-address mapping, fees, service/courier/tracking process, failed delivery handling | DEV-LOCAL and DEV-REMOTE fixtures |
| Tax/invoice | Accountant-approved inclusion/exclusion, applicable rates, rounding examples, numbering, required identifiers, correction/refund treatment | DEV-ZERO-TAX and operational receipt labeled fictional |
| Returns | Window by goods type, condition/reason exclusions, received/inspection rules and cancellation cutoff | Seven-day synthetic case set |
| Refund | Partial-line/delivery/tax handling, approval separation and thresholds, failure escalation | Distinct requester/approver and no guessed production threshold |
| Privacy | Collection purpose, class-specific durations, legal hold, account deletion and export scope | Synthetic data only |
| Operations | Named finance, stock, support, incident and release owners; hours and escalation | Roles assigned in planning, names pending |
| Delivery | Team availability, funding, launch constraints and approvers | Dependency sequence with no calendar promise |

If the actual goods need lot expiry, serials, weighted units, warranty claims or COD, review the model before building those capabilities. These cannot be inferred from the phrase e-commerce.

## Account readiness matrix

| Service | Non-secret information to supply | Acceptance evidence | First dependent capability |
| --- | --- | --- | --- |
| AWS | Account ID, region candidate, environment ownership, delegated role, billing/security contacts | Role can access only authorized dev resources; quota/availability evidence | Real AWS integration |
| RDS | Engine exact version, instance/AZ topology, private endpoint reference, parameter group, max usable connections | TLS connection, migration, failover/restore drill | Managed DB acceptance |
| Auth0 | Tenant domain, API audience, customer/staff clients, approved callback origins, MFA setup, test subjects | Valid/invalid token, denied role, revoked staff and JWKS rotation | Auth0 integration |
| SSLCOMMERZ | Merchant/store identifier, sandbox status, supported methods, IPN route, refund access, provider support contact | Recorded sandbox matrix below | Gateway integration |
| SQS | Queue/DLQ ARN, encryption, IAM/redrive/retention and role scope | Duplicate, timeout, permission denial, DLQ and replay scenarios | Real queue acceptance |
| Valkey | Managed engine version, endpoint/TLS/auth, topology/failover mode | GLIDE connect, timeout, failover and cache-loss correctness | Managed cache |
| OpenSearch | Engine/client versions, access policy, index/alias naming and sizing | Query, projection, tombstone, reindex and outage | Managed search |
| S3/CloudFront | Bucket/prefix/OAC, KMS access, allowed upload/download origins and lifecycle | Private origin, signed grant expiry, object inspection | Media/files |
| Email | SES region or replacement provider, verified sender/domain, DNS owner, suppression/bounce route, quota | Delivery and bounce to authorized test inbox; production access separately | Actual notifications |
| Monitoring | Sentry project/environment, OTel destination, CloudWatch retention, alert contacts | Correlated trace/error without secrets/PII | Shared environment operations |
| GitHub | Repository ownership, protected environments, reviewers and AWS OIDC role | Short-lived CI access and staging promotion/rollback | CI deployment |

RDS publishes PostgreSQL release support, but this is not proof of account/region/class availability. Verify the exact chosen engine in the intended account. [RDS PostgreSQL release calendar](https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-release-calendar.html).

SES sandbox access and sending restrictions require explicit verification and a separate production-access step. Choosing SES in the design does not authorize live sending. [SES production access](https://docs.aws.amazon.com/ses/latest/dg/request-production-access.html).

## SSLCOMMERZ mapping record

| Provider fact | Internal use | Required verification |
| --- | --- | --- |
| tran_id | Stable merchant payment reference per attempt | Allowed charset/length and uniqueness scope; never reused for a second attempt |
| GatewayPageURL and session reference | Hosted handoff context | HTTPS destination allowlist, expiry and persistence; URL is not success evidence |
| val_id | Validation lookup evidence | Validation response matches original attempt/order; never trust receipt alone |
| amount/currency | Expected exact payable | Validated decimal-to-minor conversion and BDT match |
| store/merchant and environment | Merchant binding | Credentials/endpoint and returned evidence belong to the configured merchant/environment |
| bank_tran_id/provider transaction ID | Financial evidence and refund lookup | Actual provider uniqueness scope; no invented one-success-per-order constraint |
| VALID/VALIDATED and risk_level | Verified success/risk decision candidate | Confirm validation endpoint meanings; risk result can hold fulfillment |
| FAILED/CANCELLED and conflicting outcomes | Terminal evidence candidate | Verify with provider query and preserve contradictory evidence as exception |
| refund_ref_id/refe_id | Provider refund reference/application correlation | Confirm that reference does or does not provide idempotency; do not assume |
| Refund processing/completion status | Reserved/completed refund balance | Exact provider status meanings and query support |
| Settlement file/API fields | Gross, fee, refund, net and date matching | Real redacted schema sample and signed finance reconciliation example |

The provider describes session creation, IPN, server validation and refund/status APIs. These documentation fields are mapping candidates; merchant-specific sandbox evidence remains necessary. [SSLCOMMERZ documentation](https://developer.sslcommerz.com/docs.html).

Some documented refund operations transmit credentials in query parameters. Disable URL/query/body capture for the provider adapter and egress logs, use HTTPS and strict destination allowlists, and verify the actual supported merchant integration method before release. Do not copy documentation credentials or IP lists into production configuration.

Sandbox proof must include success without browser return; invalid amount/currency/reference; duplicate IPN; risk hold; expired reservation plus late success; two successful attempts; initiation timeout; refund unknown query; concurrent refunds; provider terminal failure; real settlement reconciliation. If the provider cannot locate an unknown initiation/refund safely, pause resubmission and require finance/provider resolution.

## Region and recovery decision packet

Evaluate Singapore first as a working candidate, then another region if service/version, latency, data residency, cost or recovery objectives require it. Collect actual BD-to-region latency, RDS/Valkey/OpenSearch versions, AZ coverage, private networking/egress requirements, quotas, itemized monthly usage estimate, support ownership and DR costs.

Choose RDS PostgreSQL Multi-AZ as the existing launch baseline. Aurora remains a change decision; availability of Aurora does not make it mandatory. Keep CloudFront/OpenTofu/SQS choices unless evidence supports a replacement. Do not provision either alternative merely because both appeared in the original stack table.

## Completion rule

An external row closes only with evidence from the account/provider/owner and a named reviewer. Report “account not yet verified” until it is actually checked. The user has authorized documentation here; no service provisioning, payment, email sending, account creation or deployment has occurred.
