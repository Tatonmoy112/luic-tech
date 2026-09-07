const { randomUUID, randomBytes } = require('node:crypto');
const { once } = require('node:events');
const net = require('node:net');
const { Module, Controller, Get } = require('@nestjs/common');
const { NestFactory } = require('@nestjs/core');
const { startApi } = require('../apps/commerce-api/dist/application');
const { Foundation, configureHttp, readConfiguration, requestContext } = require('../packages/platform/dist');
const { environment } = require('./helpers.cjs');
let api, base;
const events = [];
beforeAll(async () => { api = await startApi(environment(), event => events.push(event)); base = 'http://127.0.0.1:' + api.port; });
afterAll(async () => { await api.app.close(); });
test('minimal liveness/readiness, generated and supplied correlation, no caching', async () => {
  for (const path of ['/health/live', '/health/ready']) {
    const correlation = randomUUID();
    const response = await fetch(base + path, { headers: { 'x-correlation-id': correlation } });
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-correlation-id')).toBe(correlation);
    expect(response.headers.get('traceparent')).toMatch(/^00-[0-9a-f]{32}-[0-9a-f]{16}-01$/);
    expect(Object.keys(await response.json())).toEqual(['status']);
  }
});
test.each([
  ['bad correlation', { headers: { 'x-correlation-id': 'unsafe' } }, 400],
  ['oversized correlation', { headers: { 'x-correlation-id': 'x'.repeat(200) } }, 400],
  ['zero trace', { headers: { traceparent: '00-' + '0'.repeat(32) + '-' + '1'.repeat(16) + '-01' } }, 400],
  ['malformed JSON', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{"token":' }, 400],
  ['scalar JSON', { method: 'POST', headers: { 'content-type': 'application/json' }, body: '42' }, 400],
  ['unsupported body', { method: 'POST', headers: { 'content-type': 'text/plain' }, body: 'private' }, 400],
  ['compressed body', { method: 'POST', headers: { 'content-type': 'application/json', 'content-encoding': 'gzip' }, body: '{}' }, 400],
  ['oversized body', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ value: 'x'.repeat(256 * 1024) }) }, 413],
])('%s returns safe problem details', async (_name, options, status) => {
  const response = await fetch(base + '/private-path?secret=hidden', options);
  expect(response.status).toBe(status);
  expect(response.headers.get('content-type')).toContain('application/problem+json');
  const body = await response.json();
  expect(body).toMatchObject({ status, instance: '/unmatched', correlationId: response.headers.get('x-correlation-id') });
  expect(JSON.stringify(body)).not.toMatch(/private-path|hidden|token|stack|SQL/);
});
test('bounded URL and unmatched routes never reflect path, query, authorization, cookies or body into logs', async () => {
  const canary = randomBytes(24).toString('hex');
  const response = await fetch(base + '/' + canary + '?token=' + canary, { method: 'POST',
    headers: { authorization: 'Bearer ' + canary, cookie: 'session=' + canary, 'content-type': 'application/json' },
    body: JSON.stringify({ email: canary, password: canary }) });
  expect(response.status).toBe(404);
  expect(await response.text()).not.toContain(canary);
  const long = await fetch(base + '/' + 'x'.repeat(2048));
  expect(long.status).toBe(400); await long.text();
  expect(JSON.stringify(events)).not.toContain(canary);
});
test('DB outage fails readiness within deadline while liveness stays healthy', async () => {
  const blackhole = net.createServer(socket => socket.destroy());
  blackhole.listen(0, '127.0.0.1'); await once(blackhole, 'listening');
  const offline = await startApi(environment('api', { DB_PORT: String(blackhole.address().port) }), () => {});
  try {
    const origin = 'http://127.0.0.1:' + offline.port;
    const before = performance.now();
    const ready = await fetch(origin + '/health/ready');
    expect(ready.status).toBe(503); expect((await ready.json()).code).toBe('UNAVAILABLE');
    expect(performance.now() - before).toBeLessThan(2000);
    const live = await fetch(origin + '/health/live');
    expect(live.status).toBe(200); await live.text();
  } finally { await offline.app.close(); await new Promise(resolve => blackhole.close(resolve)); }
});
test('concurrent requests isolate context and correlate one HTTP span with one DB span; internal errors are captured locally', async () => {
  const records = [];
  const canary = randomBytes(32).toString('hex');
  const foundation = new Foundation(readConfiguration(environment(), 'api'), event => records.push(event));
  class Probe {
    async query() {
      await foundation.database.transaction(tx => tx.query('SELECT pg_sleep(0.01)'));
      return { correlationId: requestContext.getStore().correlationId };
    }
    failure() { throw new Error(canary); }
  }
  Controller('probe')(Probe);
  Get('query')(Probe.prototype, 'query', Object.getOwnPropertyDescriptor(Probe.prototype, 'query'));
  Get('failure')(Probe.prototype, 'failure', Object.getOwnPropertyDescriptor(Probe.prototype, 'failure'));
  class TestModule {}
  Module({ controllers: [Probe] })(TestModule);
  const app = await NestFactory.create(TestModule, { logger: false, abortOnError: false, bodyParser: false });
  configureHttp(app, foundation.telemetry, () => foundation.stopping);
  await app.listen(0, '127.0.0.1');
  try {
    const origin = 'http://127.0.0.1:' + app.getHttpServer().address().port;
    const correlations = Array.from({ length: 8 }, randomUUID);
    await Promise.all(correlations.map(async id => {
      const response = await fetch(origin + '/probe/query', { headers: { 'x-correlation-id': id } });
      expect((await response.json()).correlationId).toBe(id);
      const completed = records.find(e => e.event === 'http_completed' && e.correlationId === id);
      const tx = records.find(e => e.event === 'db_transaction' && e.correlationId === id);
      expect(tx.traceId).toBe(completed.traceId);
      const spans = records.filter(e => e.event === 'span' && e.traceId === tx.traceId);
      expect(spans).toHaveLength(2);
      expect(spans.find(s => s.name === 'db.transaction').parentSpanId).toBe(completed.spanId);
    }));
    const failure = await fetch(origin + '/probe/failure');
    expect(failure.status).toBe(500);
    expect(await failure.text()).not.toContain(canary);
    await foundation.telemetry.errors.flush(1000);
    expect(records.some(e => e.event === 'error_report')).toBe(true);
    expect(JSON.stringify(records)).not.toContain(canary);
    foundation.onModuleDestroy();
    const stopping = await fetch(origin + '/probe/query');
    expect(stopping.status).toBe(503); await stopping.text();
  } finally { await app.close(); await foundation.onApplicationShutdown(); }
});
test('valid inbound traceparent continues a trace without consuming baggage', async () => {
  const traceId = randomBytes(16).toString('hex');
  const response = await fetch(base + '/health/live', { headers: {
    traceparent: '00-' + traceId + '-1234567890abcdef-01', baggage: 'private=do-not-copy' } });
  expect(response.headers.get('traceparent').split('-')[1]).toBe(traceId);
  await response.text();
  expect(JSON.stringify(events)).not.toContain('do-not-copy');
});
