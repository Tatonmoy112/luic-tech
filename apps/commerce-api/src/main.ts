import { readConfiguration } from '@luic/platform/configuration';
import { reportStartupFailure, runLifecycle } from '@luic/platform/lifecycle';

async function main(): Promise<void> {
  readConfiguration(process.env, 'api');
  const { startApi } = await import('./application');
  const { app, config, port } = await startApi(process.env);
  runLifecycle(app, config, port);
}
void main().catch(reportStartupFailure);
