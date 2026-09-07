import { DynamicModule, Module } from '@nestjs/common';
import type { RuntimeConfig } from './configuration';
import { Database } from './database';
import { Telemetry, LogSink } from './telemetry';
import { WorkTracker } from './work';

export class Foundation {
  readonly telemetry: Telemetry;
  readonly database: Database;
  readonly work: WorkTracker;
  stopping = false;
  constructor(config: RuntimeConfig, sink?: LogSink) {
    this.telemetry = new Telemetry(config, sink);
    this.database = new Database(config, this.telemetry);
    this.work = new WorkTracker(this.telemetry);
  }
  onModuleDestroy(): void { this.stopping = true; this.work.stop(); this.database.stop(); }
  async onApplicationShutdown(): Promise<void> {
    await this.work.drain();
    await this.database.close();
    await this.telemetry.close();
  }
}
@Module({})
export class FoundationModule {
  static register(foundation: Foundation): DynamicModule {
    return { module: FoundationModule, providers: [{ provide: Foundation, useValue: foundation }], exports: [Foundation] };
  }
}
