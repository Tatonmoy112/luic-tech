# Phase 6: Reporting requirements

**Owner:** Product manager with finance and operations. **Goal:** Consistent operational decisions from explicitly defined numbers.

## Proposed reporting dictionary

All monetary values are BDT under D01. Store timestamps in UTC; display and group business days in Asia/Dhaka. Document whether each report groups by order date, payment verification date, delivery date, refund date, or settlement date.

| Report or metric | Definition | Authoritative source | Owner and cadence |
| --- | --- | --- | --- |
| Confirmed orders | Distinct orders that reached confirmed state in the period; show subsequent cancellations separately | Order state history | Operations, daily |
| Gross merchandise value | Sum of item quantity multiplied by original unit selling price for confirmed orders, before discounts; excludes delivery and tax | Immutable order lines | Product, daily/monthly |
| Net merchandise sales | Confirmed merchandise value less item discounts and completed merchandise refunds; display refund-period adjustments separately | Order lines + refund allocation | Finance, daily/monthly |
| Collected payments | Sum of validated successful payment attempts; duplicate notifications do not add value | Payment ledger | Finance, daily |
| Net collections | Collected payments less completed payment refunds in the selected event period | Payment/refund ledger | Finance, daily |
| Gateway settlement | Matched settlement receipts, with fees, adjustments, and unsettled balances shown separately | Gateway reports + finance import | Finance, daily |
| Available stock | On-hand sellable quantity less active reservations; damaged/quarantined stock excluded | Inventory ledger and reservations | Operations, near real time |
| Low stock | Available quantity below approved per-SKU threshold | Inventory + threshold settings | Operations, daily |
| Fulfillment lead time | Elapsed time from order confirmation to courier handoff; report median and p95 | Order/shipment history | Operations, weekly |
| Payment success rate | Successful distinct payment attempts divided by eligible initiated attempts; pending, failed, cancelled shown separately | Payment attempts | Product + finance, weekly |
| Top products | Rank by net units and net merchandise value, with return adjustments visible | Order lines + returns | Product, weekly |
| Customer report | Order frequency and value by pseudonymous customer reference; guests separate unless safely linked | Customers + orders | Product, monthly |

These are proposed management reporting definitions, not statutory accounting or tax policy. Finance approves recognition and invoice rules separately in D07.

## Report behavior

Filter by date, state, SKU/category, payment method where available, and fulfillment status. Exports must preserve filters, currency, timezone, generation timestamp, freshness, and report definition version. Restrict access and large exports; prevent spreadsheet formula injection in user-supplied text fields.

Launch reports use PostgreSQL-derived views/read models. OpenSearch and browser analytics are not finance sources. Heavy exports run asynchronously with expiring authorized download links.

Proposed freshness: order-action views within 60 seconds and routine aggregates within 15 minutes. Show the last successful refresh and incomplete reconciliation count. These are targets pending load verification.

## Reconciliation example

For a paid order with BDT 2,000 merchandise, BDT 100 discount, BDT 80 delivery, and zero tax solely for illustration: payable is BDT 1,980. A completed BDT 500 merchandise refund leaves net merchandise sales of BDT 1,400 and net collections of BDT 1,480. Settlement can differ further because of gateway fees or timing; zero illustrative tax is not a proposed tax rate.

## Acceptance and decisions

Finance must reconcile a sample covering unpaid, successful, duplicate-notification, cancelled, partial-refund, and unsettled cases. Totals must drill down to source records with no double counting. Confirm reporting users, export formats, retention, fiscal calendar, and approved definitions before signing scope.
