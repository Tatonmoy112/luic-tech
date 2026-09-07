import 'reflect-metadata';
import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { ConfigurationModule, Environment, RuntimeConfig, readConfiguration, Foundation, FoundationModule, configureHttp, LogSink } from '@luic/platform';
import { LocalIdentityVerifier } from './identity/authentication';
import { IdentityService } from './identity/service';
import { IdentityController, IDENTITY_VERIFIER } from './identity/controller';

@Controller('health')
class HealthController {
  constructor(private readonly foundation: Foundation) {}
  @Get('live') live(): { status: string } { return { status: 'ok' }; }
  @Get('ready') async ready(): Promise<{ status: string }> {
    if (this.foundation.stopping || !await this.foundation.database.ready()) throw new ServiceUnavailableException();
    return { status: 'ready' };
  }
}

export async function startApi(env: Environment, sink?: LogSink): Promise<{
  app: NestExpressApplication;
  config: Extract<RuntimeConfig, { role: 'api' }>;
  port: number;
}> {
  const config = readConfiguration(env, 'api');
  if (config.role !== 'api') throw new Error('Unexpected runtime role');
  const verifier = new LocalIdentityVerifier(config, env.IDENTITY_PUBLIC_KEY);
  const foundation = new Foundation(config, sink);
  @Module({ imports: [ConfigurationModule.register(config), FoundationModule.register(foundation)],
    providers: [{ provide: IDENTITY_VERIFIER, useValue: verifier }, { provide: IdentityService, useValue: new IdentityService(foundation.database) }],
    controllers: [HealthController, IdentityController] })
  class ApiModule {}
  const adapter = new ExpressAdapter();
  adapter.getInstance().disable('x-powered-by');
  const app = await NestFactory.create<NestExpressApplication>(ApiModule, adapter, {
    logger: false, abortOnError: false, bodyParser: false,
  });
  configureHttp(app, foundation.telemetry, () => foundation.stopping);
  try {
    await app.listen(config.port, config.host);
    const address = app.getHttpServer().address();
    if (!address || typeof address === 'string') throw new Error('Expected TCP listener');
    return { app, config, port: address.port };
  } catch (error) {
    await app.close();
    throw error;
  }
}
