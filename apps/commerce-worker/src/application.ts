import 'reflect-metadata';
import { INestApplicationContext, Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigurationModule, Environment, RuntimeConfig, readConfiguration, Foundation, FoundationModule } from '@luic/platform';

export async function startWorker(env: Environment): Promise<{
  app: INestApplicationContext;
  config: RuntimeConfig;
}> {
  const config = readConfiguration(env, 'worker');
  const foundation = new Foundation(config);
  @Module({ imports: [ConfigurationModule.register(config), FoundationModule.register(foundation)] })
  class WorkerModule {}
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger: false, abortOnError: false,
  });
  return { app, config };
}
