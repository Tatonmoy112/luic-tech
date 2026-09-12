import { createHash } from 'node:crypto';
import { fail, object, string, uuid, version } from '../identity/validation';
export { fail, object, string, uuid, version };
export type Input = Record<string, unknown>;
export const slug = (v: unknown): string => string(v, 160, /^[a-z0-9]+(-[a-z0-9]+)*$/);
export function money(v: unknown): string {
  const value = string(v, 19, /^[1-9][0-9]{0,18}$/);
  if (BigInt(value)>9223372036854775807n) return fail('BAD_REQUEST');
  return value;
}
export function instant(v: unknown): string {
  const value = string(v, 24, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  if (!Number.isFinite(Date.parse(value)) || new Date(value).toISOString()!==value) return fail('BAD_REQUEST');
  return value;
}
export function integer(v: unknown, min: number, max: number): number {
  if (typeof v!=='number' || !Number.isInteger(v) || v<min || v>max) return fail('BAD_REQUEST'); return v;
}
export function productInput(body: unknown, create: boolean): Input {
  const input = object(body,['title','slug','shortDescription','description','brandId','categoryIds']);
  if (!Object.keys(input).length) return fail('BAD_REQUEST');
  if (create || input.title!==undefined) string(input.title,200);
  if (create || input.slug!==undefined) slug(input.slug);
  for (const field of ['shortDescription','description']) if (input[field]!==undefined && input[field]!==null) {
    const value=string(input[field],field==='description'?20000:1000);
    // Plain text for the initial catalog; rich content needs the later reviewed sanitizer contract.
    if (/[<>]/.test(value)) return fail('BAD_REQUEST');
  }
  if (input.brandId!==undefined && input.brandId!==null) uuid(input.brandId);
  if (input.categoryIds!==undefined) {
    if (!Array.isArray(input.categoryIds) || input.categoryIds.length>20) return fail('BAD_REQUEST');
    const ids=input.categoryIds.map(uuid);
    if(new Set(ids).size!==ids.length) return fail('BAD_REQUEST');
    input.categoryIds=ids;
  }
  return input;
}
export function variantInput(body: unknown, create: boolean): Input {
  const input=object(body,['sku','title','barcode','maxOrderQuantity','weightGrams','attributeValues']);
  if(!Object.keys(input).length) return fail('BAD_REQUEST');
  if(create || input.sku!==undefined) input.sku=string(input.sku,64,/^[A-Za-z0-9][A-Za-z0-9._-]*$/).toUpperCase();
  if(create || input.title!==undefined) string(input.title,200);
  if(input.barcode!==undefined && input.barcode!==null) string(input.barcode,64);
  if(input.maxOrderQuantity!==undefined && input.maxOrderQuantity!==null) integer(input.maxOrderQuantity,1,20);
  if(input.weightGrams!==undefined && input.weightGrams!==null) integer(input.weightGrams,1,2147483647);
  if(input.attributeValues!==undefined) {
    if(!Array.isArray(input.attributeValues) || input.attributeValues.length>20) return fail('BAD_REQUEST');
    const ids=new Set();
    for(const item of input.attributeValues) {const r=object(item,['attributeId','valueId']);uuid(r.attributeId);uuid(r.valueId);if(ids.has(r.attributeId)) return fail('BAD_REQUEST');ids.add(r.attributeId);}
    input.attributeValues.sort((a,b)=>(a as Input).attributeId!.toString().localeCompare((b as Input).attributeId!.toString()));
  }
  return input;
}
export function priceInput(body: unknown): Input {
  const input=object(body,['unitPriceMinor','compareAtMinor','validFrom','validTo','reason']);
  money(input.unitPriceMinor);string(input.reason,200);instant(input.validFrom);
  if(input.validTo!==undefined && input.validTo!==null) {instant(input.validTo);if(String(input.validTo)<=String(input.validFrom)) return fail('BAD_REQUEST');}
  if(input.compareAtMinor!==undefined && input.compareAtMinor!==null) {money(input.compareAtMinor);if(BigInt(input.compareAtMinor as string)<BigInt(input.unitPriceMinor as string)) return fail('BAD_REQUEST');}
  return input;
}
export function mediaInput(body: unknown): Input {
  const input=object(body,['mediaAssetId','variantId','role','altText','sortOrder','isPrimary']);uuid(input.mediaAssetId);
  if(input.variantId!==undefined && input.variantId!==null) uuid(input.variantId);
  if(input.role!==undefined && !['hero','gallery'].includes(input.role as string)) return fail('BAD_REQUEST');
  if(input.altText!==undefined && input.altText!==null) string(input.altText,200);
  if(input.sortOrder!==undefined) integer(input.sortOrder,0,19);
  if(input.isPrimary!==undefined && typeof input.isPrimary!=='boolean') return fail('BAD_REQUEST');
  return input;
}
export function reasonInput(body: unknown): Input {const input=object(body,['reasonCode','reason']);string(input.reasonCode,64,/^[a-z][a-z0-9_]*$/);if(input.reason!==undefined)string(input.reason,200);return input;}
export function canonical(v: unknown): string {
  if(Array.isArray(v)) return '['+v.map(canonical).join(',')+']';
  if(v!==null && typeof v==='object') return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+canonical((v as Input)[k])).join(',')+'}';
  return JSON.stringify(v);
}
export const hash = (v: unknown): string => createHash('sha256').update(canonical(v)).digest('hex');
export function pageInput(query: unknown): {limit:number;status:string|null;after:string|null} {
  const q=object(query,['limit','status','cursor']);
  const limit=q.limit===undefined?20:Number(string(q.limit,3,/^[1-9][0-9]{0,2}$/)); if(limit>100)return fail('BAD_REQUEST');
  const status=q.status===undefined?null:string(q.status,9,/^(draft|published|archived)$/);
  let after:string|null=null;
  if(q.cursor!==undefined) {
    try {const raw=string(q.cursor,512,/^[A-Za-z0-9_-]+$/);const p=object(JSON.parse(Buffer.from(raw,'base64url').toString()),['v','after','filter']);
      if(p.v!==1 || p.filter!==hash({status,limit}) || Buffer.from(JSON.stringify(p)).toString('base64url')!==raw) return fail('BAD_REQUEST');after=uuid(p.after);
    } catch {return fail('BAD_REQUEST');}
  }
  return {limit,status,after};
}
