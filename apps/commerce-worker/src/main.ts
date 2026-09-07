import { readConfiguration } from '@luic/platform/configuration';
import { reportStartupFailure, runLifecycle } from '@luic/platform/lifecycle';

async function main(): Promise<void> {
  readConfiguration(process.env, 'worker');
  const { startWorker } = await import('./application');
  const { app, config } = await startWorker(process.env);
  runLifecycle(app, config);
}
void main().catch(reportStartupFailure);
