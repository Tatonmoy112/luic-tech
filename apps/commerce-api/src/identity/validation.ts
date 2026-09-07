import { DatabaseFailure } from '@luic/platform';
export function fail(code: ConstructorParameters<typeof DatabaseFailure>[0]): never { throw new DatabaseFailure(code); }
export function object(value: unknown, fields: readonly string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return fail('BAD_REQUEST');
  const row = value as Record<string, unknown>;
  if (Object.keys(row).some(key => !fields.includes(key))) return fail('BAD_REQUEST');
  return row;
}
export function string(value: unknown, max: number, pattern?: RegExp): string {
  if (typeof value !== 'string' || !value.trim() || value.length > max || /[\u0000-\u001f\u007f]/.test(value) ||
    (pattern && !pattern.test(value))) return fail('BAD_REQUEST');
  return value;
}
export function uuid(value: unknown): string { return string(value, 36, /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i); }
export function version(value: unknown): string {
  if (value === undefined) return fail('PRECONDITION_REQUIRED');
  const v = string(value, 21, /^"[1-9][0-9]{0,18}"$/).slice(1, -1);
  if (BigInt(v) > 9223372036854775807n) return fail('BAD_REQUEST');
  return v;
}
export const addressColumns: Readonly<Record<string, string>> = Object.freeze({ label: 'label', recipientName: 'recipient_name',
  phoneE164: 'phone_e164', line1: 'line_1', line2: 'line_2', area: 'area', city: 'city', postalCode: 'postal_code',
  countryCode: 'country_code', isDefaultShipping: 'is_default_shipping', isDefaultBilling: 'is_default_billing' });
export function addressInput(value: unknown, create: boolean): Record<string, unknown> {
  const row = object(value, Object.keys(addressColumns));
  if (!Object.keys(row).length) return fail('BAD_REQUEST');
  const required = ['recipientName', 'phoneE164', 'line1', 'city', 'countryCode'];
  if (create && required.some(key => row[key] === undefined)) return fail('BAD_REQUEST');
  for (const [key, val] of Object.entries(row)) {
    if (key.startsWith('isDefault')) { if (typeof val !== 'boolean') return fail('BAD_REQUEST'); }
    else if (val === null && !required.includes(key)) continue;
    else if (key === 'countryCode') { if (val !== 'BD') return fail('BAD_REQUEST'); }
    else string(val, key === 'label' ? 50 : key === 'postalCode' ? 20 : key.startsWith('line') ? 200 : key === 'phoneE164' ? 16 : 100,
      key === 'phoneE164' ? /^\+[1-9][0-9]{7,14}$/ : undefined);
  }
  return row;
}
