import type { TransactionContext } from '@luic/platform';
export interface VariantObservation { id: string; title: string; sku: string; maxQuantity: number; unitPriceMinor: string | null; eligible: boolean }
export interface CatalogObservationPort { observe(tx: TransactionContext, variants: string[]): Promise<Map<string, VariantObservation>> }
