import { DynamicModule, Module } from '@nestjs/common';

export const CONFIG = Symbol('B001_RUNTIME_CONFIG');
export type RuntimeRole = 'api' | 'worker';
export type Environment = Readonly<Record<string, string | undefined>>;

interface BaseConfig {
  readonly version: 2;
  readonly database: Readonly<{ host: '127.0.0.1'; port: number; name: 'commerce_local' | 'commerce_test'; user: 'commerce_api' | 'commerce_worker'; password: string; max: number }>;
  readonly service: 'commerce';
  readonly environment: 'local' | 'test';
  readonly release: string;
  readonly dataMode: 'synthetic';
  readonly profile: 'DEV-PHYSICAL-BD';
  readonly profileRevision: 1;
  readonly identityMode: 'synthetic';
  readonly paymentMode: 'simulated';
}
export type RuntimeConfig = Readonly<BaseConfig & (
  { role: 'api'; host: '127.0.0.1'; port: number } | { role: 'worker' }
)>;

export class ConfigurationError extends Error {
  constructor(readonly keys: readonly string[]) {
    super('Invalid runtime configuration');
    this.name = 'ConfigurationError';
  }
}

// This Bolt supports only isolated local/test composition. Mode labels do not
// instantiate an identity issuer, payment simulator, or any external client.
export function readConfiguration(env: Environment, role: RuntimeRole): RuntimeConfig {
  const invalid = new Set<string>();
  const requireValue = (key: string, allowed: readonly string[]): void => {
    if (!allowed.includes(env[key] ?? '')) invalid.add(key);
  };
  requireValue('SERVICE_NAME', ['commerce']);
  requireValue('RUNTIME_ROLE', [role]);
  requireValue('APP_ENV', ['local', 'test']);
  requireValue('NODE_ENV', [env.APP_ENV === 'test' ? 'test' : 'development']);
  requireValue('DATA_MODE', ['synthetic']);
  requireValue('COMMERCE_PROFILE', ['DEV-PHYSICAL-BD']);
  requireValue('PROFILE_REVISION', ['1']);
  requireValue('IDENTITY_MODE', ['synthetic']);
  requireValue('PAYMENT_MODE', ['simulated']);
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,63}$/.test(env.RELEASE_ID ?? '')) {
    invalid.add('RELEASE_ID');
  }
  let port = 0;
  if (role === 'api') {
    const value = env.API_PORT ?? '';
    if (!/^(0|[1-9][0-9]{0,4})$/.test(value) || Number(value) > 65535) {
      invalid.add('API_PORT');
    } else port = Number(value);
  }
  if (invalid.size) throw new ConfigurationError(Object.freeze([...invalid].sort()));
  if (!/^[1-9][0-9]{0,4}$/.test(env.DB_PORT ?? '') || Number(env.DB_PORT) > 65535) invalid.add('DB_PORT');
  if (!env.DB_PASSWORD || env.DB_PASSWORD.length > 256) invalid.add('DB_PASSWORD');
  if (invalid.size) throw new ConfigurationError(Object.freeze([...invalid].sort()));
  const base: BaseConfig = {
    version: 2, service: 'commerce', environment: env.APP_ENV as 'local' | 'test',
    database: Object.freeze({ host: '127.0.0.1', port: Number(env.DB_PORT),
      name: env.APP_ENV === 'test' ? 'commerce_test' : 'commerce_local',
      user: role === 'api' ? 'commerce_api' : 'commerce_worker', password: env.DB_PASSWORD!, max: role === 'api' ? 5 : 3 }),
    release: env.RELEASE_ID!, dataMode: 'synthetic', profile: 'DEV-PHYSICAL-BD',
    profileRevision: 1, identityMode: 'synthetic', paymentMode: 'simulated',
  };
  return Object.freeze(role === 'api'
    ? { ...base, role, host: '127.0.0.1', port }
    : { ...base, role });
}

@Module({})
export class ConfigurationModule {
  static register(config: RuntimeConfig): DynamicModule {
    return {
      module: ConfigurationModule,
      providers: [{ provide: CONFIG, useValue: config }],
      exports: [CONFIG],
    };
  }
}
