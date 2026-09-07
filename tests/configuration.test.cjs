const { readConfiguration, ConfigurationError } = require('../packages/platform/dist');
const { environment } = require('./helpers.cjs');

const required = ['SERVICE_NAME', 'RUNTIME_ROLE', 'APP_ENV', 'NODE_ENV', 'RELEASE_ID',
  'DATA_MODE', 'COMMERCE_PROFILE', 'PROFILE_REVISION', 'IDENTITY_MODE', 'PAYMENT_MODE', 'DB_PORT', 'DB_PASSWORD'];
describe.each(['api', 'worker'])('%s configuration', role => {
  test('accepts explicit synthetic local and test composition', () => {
    for (const overrides of [{}, { APP_ENV: 'local', NODE_ENV: 'development' }]) {
      const config = readConfiguration(environment(role, overrides), role);
      expect(config.role).toBe(role);
      expect(Object.isFrozen(config)).toBe(true);
    }
  });
  test.each(required)('rejects missing required %s', key => {
    const env = environment(role);
    delete env[key];
    expect(() => readConfiguration(env, role)).toThrow(ConfigurationError);
    try { readConfiguration(env, role); } catch (error) { expect(error.keys).toContain(key); }
  });
  test.each(['shared-development', 'staging', 'production', 'recovery', '', 'LOCAL'])(
    'rejects environment %s even with synthetic modes', APP_ENV => {
      expect(() => readConfiguration(environment(role, { APP_ENV }), role)).toThrow(ConfigurationError);
    });
  test.each([
    { NODE_ENV: 'production' }, { DATA_MODE: 'real' }, { RUNTIME_ROLE: 'dispatcher' },
    { RUNTIME_ROLE: role === 'api' ? 'worker' : 'api' },
    { IDENTITY_MODE: 'auth0' }, { PAYMENT_MODE: 'sslcommerz' },
    { PAYMENT_MODE: 'cod' }, { PROFILE_REVISION: '2' }, { COMMERCE_PROFILE: 'TEMPLATE-DIGITAL' },
    { COMMERCE_PROFILE: 'TEMPLATE-MARKETPLACE' }, { RELEASE_ID: '\nunsafe' },
    { RELEASE_ID: 'x'.repeat(65) }, { SERVICE_NAME: 'other-service' },
  ])('rejects incompatible or unsupported selection %#', override => {
    expect(() => readConfiguration(environment(role, override), role)).toThrow(ConfigurationError);
  });
});
test.each(['', '-1', '65536', '1.5', '3e3', ' 3000', '3000 ', 'NaN', '01', '0x80'])(
  'API rejects invalid port %s', API_PORT => {
    expect(() => readConfiguration(environment('api', { API_PORT }), 'api')).toThrow(ConfigurationError);
  });
test('API port is required, loopback is fixed, and boundary ports are valid', () => {
  const env = environment('api');
  delete env.API_PORT;
  expect(() => readConfiguration(env, 'api')).toThrow(ConfigurationError);
  for (const API_PORT of ['0', '1', '65535']) {
    const config = readConfiguration(environment('api', { API_PORT, API_HOST: '0.0.0.0' }), 'api');
    expect(config.host).toBe('127.0.0.1');
    expect(config.port).toBe(Number(API_PORT));
  }
});
test('worker neither requires nor consumes API listener settings', () => {
  const config = readConfiguration(environment('worker', { API_PORT: 'invalid' }), 'worker');
  expect(config).not.toHaveProperty('port');
  expect(config).not.toHaveProperty('host');
});
