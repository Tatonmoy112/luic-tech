type Schema = Record<string, unknown>;
const id = { type: 'string', format: 'uuid' }, decimal = { type: 'string', pattern: '^[1-9][0-9]{0,18}$' };
const money = { type: 'string', pattern: '^[0-9]+$' }, quantity = { type: 'integer', minimum: 1, maximum: 20 };
const obj = (properties: Record<string, Schema>, required = Object.keys(properties)): Schema => ({ type: 'object', additionalProperties: false, properties, ...(required.length ? { required } : {}) });
const nullable = (s: Schema): Schema => ({ ...s, nullable: true });
const ref = (name: string): Schema => ({ $ref: '#/components/schemas/' + name });
const schemas: Record<string, Schema> = {
  Empty: obj({}),
  Adjustment: obj({ positionId: id, deltaSellable: { type: 'integer', minimum: -1000, maximum: 1000, not: { enum: [0] } }, operationKey: id,
    reasonCode: { type: 'string', maxLength: 64, pattern: '^[a-z][a-z0-9_]*$' }, reasonNote: { type: 'string', minLength: 1, maxLength: 200 } }, ['positionId', 'deltaSellable', 'operationKey', 'reasonCode']),
  AddItem: obj({ cartId: id, variantId: id, quantity }), ChangeItem: obj({ cartId: id, quantity }), CartId: obj({ cartId: id }),
  Merge: obj({ sourceCartId: id, targetCartId: id, sourceVersion: decimal }),
  Position: obj({ id, variantId: id, stockLocationId: id, sellableOnHand: money, reservedQuantity: money, available: money, version: decimal }),
  Movement: obj({ id, stockPositionId: id, movementType: { type: 'string', enum: ['opening', 'adjustment'] }, deltaSellable: { type: 'integer' }, deltaReserved: { type: 'integer', enum: [0] },
    sellableAfter: money, reservedAfter: money, positionVersion: decimal, operationKey: id, reasonCode: { type: 'string' }, occurredAt: { type: 'string', format: 'date-time' } }),
  Item: obj({ id, variantId: id, quantity, title: nullable({ type: 'string' }), observedUnitPriceMinor: nullable(money), currentUnitPriceMinor: nullable(money),
    indicativeAvailability: { type: 'string', enum: ['unknown', 'in_stock', 'out_of_stock'] }, warnings: { type: 'array', items: { type: 'string', enum: ['UNAVAILABLE', 'PRICE_CHANGED', 'QUANTITY_LIMIT_CHANGED', 'OUT_OF_STOCK'] } } }),
  Problem: obj({ type: { type: 'string' }, title: { type: 'string' }, status: { type: 'integer' }, code: { type: 'string' }, detail: { type: 'string' }, instance: { type: 'string' }, correlationId: id }),
};
const cartFields = { id, version: decimal, state: { type: 'string', enum: ['active'] }, currency: { type: 'string', enum: ['BDT'] }, expiresAt: { type: 'string', format: 'date-time' },
  items: { type: 'array', maxItems: 50, items: ref('Item') }, merchandiseEstimateMinor: nullable(money) };
schemas.Cart = obj(cartFields);
schemas.GuestCreated = obj({ ...cartFields, guestToken: { type: 'string', pattern: '^[A-Za-z0-9_-]{43}$', description: 'One-time raw secret. Never log or persist.' } });
schemas.MergeResult = obj({ ...cartFields, sourceCartId: id, sourceVersion: decimal, adjustments: { type: 'array', maxItems: 50, items: obj({ variantId: id, requestedQuantity: { type: 'integer' }, acceptedQuantity: quantity, reason: { type: 'string', enum: ['QUANTITY_LIMIT'] } }) } });
schemas.AdjustmentResult = obj({ ...(schemas.Position!.properties as Record<string, Schema>), movementId: id });
for (const [name, item] of [['Positions', 'Position'], ['Movements', 'Movement']]) schemas[name!] = obj({ items: { type: 'array', maxItems: 100, items: ref(item!) }, nextCursor: nullable({ type: 'string', maxLength: 512 }) });
const paths: Record<string, Record<string, unknown>> = {};
function route(path: string, method: string, operationId: string, response: string, body?: string, auth = 'owner', mutate = false, status = 200): void {
  const parameters: Schema[] = [...path.matchAll(/\{([^}]+)\}/g)].map(m => ({ name: m[1], in: 'path', required: true, schema: id }));
  if (mutate) parameters.push({ name: 'If-Match', in: 'header', required: true, schema: { type: 'string', pattern: '^"[1-9][0-9]{0,18}"$' } }, { name: 'Idempotency-Key', in: 'header', required: true, schema: id });
  if (response === 'Positions' || response === 'Movements') parameters.push({ name: 'limit', in: 'query', schema: { type: 'integer', minimum: 1, maximum: 100, default: 20 } }, { name: 'cursor', in: 'query', schema: { type: 'string', maxLength: 512 } });
  if (response === 'Positions') parameters.push({ name: 'variantId', in: 'query', schema: id });
  const responses: Record<string, unknown> = { [status]: { description: 'Success; exact decimal strings, no-store.', headers: { ETag: { schema: { type: 'string' } }, 'Idempotency-Replayed': { schema: { type: 'string', enum: ['true'] } } }, content: { 'application/json': { schema: ref(response) } } } };
  for (const code of [400, 401, 403, 404, 409, 412, 413, 422, 428, 503]) responses[code] = { description: 'Safe denial/conflict; 503 includes unknown COMMIT (exact retry required).', content: { 'application/problem+json': { schema: ref('Problem') } } };
  const security = auth === 'none' ? [] : auth === 'staff' ? [{ StaffBearer: [] }] : auth === 'customer' ? [{ CustomerBearer: [] }] : auth === 'merge' ? [{ CustomerBearer: [], GuestCapability: [] }] : [{ CustomerBearer: [] }, { GuestCapability: [] }];
  (paths[path] ??= {})[method] = { operationId, security, parameters, responses, ...(body ? { requestBody: { required: true, content: { 'application/json': { schema: ref(body) } } } } : {}),
    ...(auth === 'staff' ? { 'x-permission': mutate ? 'inventory.adjust' : 'inventory.read' } : {}) };
}
route('/staff/inventory/positions', 'get', 'listStockPositions', 'Positions', undefined, 'staff');
route('/staff/inventory/positions/{id}', 'get', 'getStockPosition', 'Position', undefined, 'staff');
route('/staff/inventory/positions/{id}/movements', 'get', 'listStockMovements', 'Movements', undefined, 'staff');
route('/staff/inventory/adjustments', 'post', 'adjustStock', 'AdjustmentResult', 'Adjustment', 'staff', true, 201);
route('/guest/carts', 'post', 'createGuestCart', 'GuestCreated', 'Empty', 'none', false, 201);
route('/customer/cart', 'post', 'getOrCreateCart', 'Cart', 'Empty', 'customer');
route('/customer/cart', 'get', 'getOwnedCart', 'Cart');
route('/customer/cart/items', 'post', 'addCartItem', 'Cart', 'AddItem', 'owner', true);
route('/customer/cart/items/{variantId}', 'patch', 'changeCartItem', 'Cart', 'ChangeItem', 'owner', true);
route('/customer/cart/items/{variantId}', 'delete', 'removeCartItem', 'Cart', 'CartId', 'owner', true);
route('/customer/cart/items', 'delete', 'clearCart', 'Cart', 'CartId', 'owner', true);
route('/customer/cart/merge', 'post', 'mergeGuestCart', 'MergeResult', 'Merge', 'merge', true);
export const stockCartOpenApi = { openapi: '3.0.3', info: { title: 'Local stock and cart', version: '1.0.0' }, servers: [{ url: '/api/v1' }], paths,
  components: { securitySchemes: { StaffBearer: { type: 'http', scheme: 'bearer' }, CustomerBearer: { type: 'http', scheme: 'bearer' }, GuestCapability: { type: 'apiKey', in: 'header', name: 'X-Guest-Cart-Token' } }, schemas } };
