import 'reflect-metadata';
import { Controller, Get, Module, ServiceUnavailableException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { ConfigurationModule, Environment, RuntimeConfig, readConfiguration, Foundation, FoundationModule, configureHttp, LogSink } from '@luic/platform';
import { LocalIdentityVerifier } from './identity/authentication';
import { IdentityService } from './identity/service';
import { IdentityController, IDENTITY_VERIFIER } from './identity/controller';
import { CatalogService } from './catalog/service';
import { CatalogController } from './catalog/controller';
import { InventoryObservation, InventoryService } from './inventory/service';
import { InventoryController } from './inventory/controller';
import { CartService } from './cart/service';
import { CartController } from './cart/controller';

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
  const catalog = new CatalogService(foundation.database);
  @Module({ imports: [ConfigurationModule.register(config), FoundationModule.register(foundation)],
    providers: [{ provide: IDENTITY_VERIFIER, useValue: verifier }, { provide: IdentityService, useValue: new IdentityService(foundation.database) },
      {provide:CatalogService,useValue:catalog},
      {provide:InventoryService,useValue:new InventoryService(foundation.database)},
      {provide:CartService,useValue:new CartService(foundation.database,catalog,new InventoryObservation())}],
    controllers: [HealthController, IdentityController, CatalogController, InventoryController, CartController] })
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
