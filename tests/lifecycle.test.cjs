const net = require('node:net');
const { randomBytes } = require('node:crypto');
const { once } = require('node:events');
const { startApi } = require('../apps/commerce-api/dist/application');
const { startWorker } = require('../apps/commerce-worker/dist/application');
const { CONFIG } = require('../packages/platform/dist');
const { environment, launch } = require('./helpers.cjs');

test('API and standalone worker coexist and close independently', async () => {
  const api = await startApi(environment('api'));
  let worker;
  try {
    worker = await startWorker(environment('worker'));
    expect(api.app.get(CONFIG)).toEqual(api.config);
    expect(worker.app.get(CONFIG)).toEqual(worker.config);
    expect(worker.app).not.toHaveProperty('getHttpServer');
    const response = await fetch('http://127.0.0.1:' + api.port + '/');
    expect(response.status).toBe(404); // no business or health route in B001
    expect(response.headers.get('x-powered-by')).toBeNull();
    await response.text();
    await worker.app.close();
    worker = undefined;
    const stillAlive = await fetch('http://127.0.0.1:' + api.port + '/');
    expect(stillAlive.status).toBe(404);
    await stillAlive.text();
  } finally {
    if (worker) await worker.app.close();
    await api.app.close();
  }
  await expect(fetch('http://127.0.0.1:' + api.port + '/')).rejects.toThrow();
});

describe.each(['api', 'worker'])('%s entrypoint', role => {
  test.each([
    ['missing release', { RELEASE_ID: undefined }, 'RELEASE_ID'],
    ['staging synthetic', { APP_ENV: 'staging' }, 'APP_ENV'],
    ['production synthetic', { APP_ENV: 'production', NODE_ENV: 'production' }, 'APP_ENV'],
    ['conflicting production runtime', { NODE_ENV: 'production' }, 'NODE_ENV'],
    ['real identity', { IDENTITY_MODE: 'auth0' }, 'IDENTITY_MODE'],
    ['real payment', { PAYMENT_MODE: 'sslcommerz' }, 'PAYMENT_MODE'],
    ['unsupported profile', { COMMERCE_PROFILE: 'TEMPLATE-MARKETPLACE' }, 'COMMERCE_PROFILE'],
    ['wrong entrypoint role', { RUNTIME_ROLE: role === 'api' ? 'worker' : 'api' }, 'RUNTIME_ROLE'],
  ])('fails before startup: %s', async (_label, overrides, key) => {
    const result = await launch(role, environment(role, overrides)).exit;
    expect(result.code).toBe(1);
    expect(result.output).not.toContain('"event":"started"');
    expect(JSON.parse(result.output)).toEqual({ event: 'configuration_rejected', keys: expect.arrayContaining([key]) });
  });
  test('invalid configuration and unused secret values never appear in output', async () => {
    const canary = randomBytes(32).toString('hex');
    const result = await launch(role, environment(role, {
      RELEASE_ID: 'invalid/' + canary, PAYMENT_MODE: canary, TEST_SECRET: canary,
    })).exit;
    expect(result.code).toBe(1);
    expect(result.output.includes(canary)).toBe(false);
    expect(JSON.parse(result.output)).toEqual({
      event: 'configuration_rejected', keys: ['PAYMENT_MODE', 'RELEASE_ID'],
    });
  });
  // Windows child.kill forcibly terminates processes; actual graceful OS signal
  // semantics are proved by the same suite in the pinned Linux runtime.
  const signalTest = process.platform === 'win32' ? test.skip : test;
  signalTest.each(['SIGINT', 'SIGTERM'])('starts and gracefully stops on %s', async signal => {
    const canary = randomBytes(32).toString('hex');
    const running = launch(role, environment(role, { TEST_SECRET: canary }));
    try {
      const event = await running.started();
      expect(event.role).toBe(role);
      if (role === 'api') {
        expect(event.host).toBe('127.0.0.1');
        const response = await fetch('http://127.0.0.1:' + event.port + '/');
        expect(response.status).toBe(404);
        await response.text();
      } else expect(event).not.toHaveProperty('port');
      running.child.kill(signal);
      const result = await running.exit;
      expect(result.code).toBe(0);
      expect(result.output).toContain('"event":"stopped"');
      expect(result.output.includes(canary)).toBe(false);
    } finally {
      if (running.child.exitCode === null) running.child.kill('SIGKILL');
    }
  });
});
test('occupied API port fails safely without leaking environment or OS exception', async () => {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const canary = randomBytes(32).toString('hex');
  try {
    const result = await launch('api', environment('api', {
      API_PORT: String(server.address().port), TEST_SECRET: canary,
    })).exit;
    expect(result.code).toBe(1);
    expect(result.output).toBe('{"event":"startup_failed"}\n');
    expect(result.output.includes(canary)).toBe(false);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
