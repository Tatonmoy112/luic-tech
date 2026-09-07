# Phase 4: Admin and operating requirements

**Owner:** Product manager and operations lead. **Outcome:** A usable operating console with least-privilege access.

## Proposed role matrix

| Capability | Owner/admin | Catalog manager | Fulfillment staff | Support | Finance |
| --- | --- | --- | --- | --- | --- |
| Manage staff access | Yes, audited | No | No | No | No |
| Edit products and images | Yes | Yes | Read | Read | Read |
| Adjust stock | Oversight | Only if separately granted | With reason and permission | No | Read |
| Pack and dispatch orders | Oversight | No | Yes | Read | Read |
| View customer contact | Need-based | No | Delivery fields only | Assigned support need | Billing need only |
| Request cancellation/return | Yes | No | Operational request | Yes | Read |
| Approve and submit refunds | Separately granted | No | No | Request only | Yes, within authority |
| Export financial reports | Separately granted | No | No | No | Yes |
| Change payment credentials | Restricted platform operator | No | No | No | No |

Role names are proposed. The backend enforces permissions and record ownership; hiding controls in the UI is insufficient. High-value refunds and large stock adjustments should require a second approver once finance defines thresholds. No one approves their own elevated action where dual approval applies.

## Release 1 workspaces

- **Dashboard:** Orders awaiting action, payment discrepancies, low stock, aging returns, shipment exceptions, and reporting freshness.
- **Catalog:** Product/variant editing, publication checks, category and attribute management, image ordering, controlled CSV import with validation and row-level error reporting.
- **Inventory:** Stock position, reservations, adjustment history, inspection disposition, and opening balance approval.
- **Orders:** Search/filter, immutable order-line details, payment timeline, pick/pack/dispatch actions, tracking entry, and cancellation restrictions.
- **Customers:** Necessary profile/order context, consent status, and restricted data export workflow.
- **Finance:** Payment attempts, refund requests/results, settlements, unmatched records, and downloadable reconciled reports.
- **Administration:** Role assignments, business settings, and searchable audit events.

## Workflow quality and security

Admin MFA is mandatory in the proposed baseline. Require clear confirmations for refunds, stock adjustments, access changes, and bulk publication. Record actor, timestamp, reason, object, previous state, resulting state, and correlation reference. Exclude secrets and unnecessary personal data from audit content.

Use optimistic conflict detection for concurrent edits. Show clear loading, empty, failed, stale, permission-denied, and partial-success states. Bulk operations need a preview, bounded batch size, and an outcome report.

## Evidence and acceptance

Identify staff count, shifts, device types, daily order volume, refund authority, and escalation cover. Ask operators to walk through an unpaid order, a paid-but-unallocated order, a failed shipment, and a damaged return.

Acceptance requires demonstrated role restrictions, a traceable refund approval, stock adjustment reasons, no silent overwrite during conflicting edits, and an operator completing the fulfillment journey without spreadsheet-only steps.
