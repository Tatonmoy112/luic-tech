import type { INestApplicationContext } from '@nestjs/common';
import { ConfigurationError, RuntimeConfig } from './configuration';

// Deliberately bounded messages: never serialize exceptions, env or config values.
export function reportStartupFailure(error: unknown): void {
  const event = error instanceof ConfigurationError
    ? { event: 'configuration_rejected', keys: error.keys }
    : { event: 'startup_failed' };
  process.stderr.write(JSON.stringify(event) + '\n');
  process.exitCode = 1;
}

export function runLifecycle(app: INestApplicationContext, config: RuntimeConfig, port?: number): void {
  // A standalone Nest context has no socket/queue to keep its process alive yet.
  const keepAlive = config.role === 'worker' ? setInterval(() => {}, 60_000) : undefined;
  let stopping = false;
  const stop = (): void => {
    if (stopping) return;
    stopping = true;
    const deadline = setTimeout(() => {
      process.stderr.write('{"event":"shutdown_failed"}\n');
      process.exit(1);
    }, 5_000);
    void app.close().then(() => {
      process.stdout.write(JSON.stringify({ event: 'stopped', role: config.role }) + '\n');
    }, () => {
      process.stderr.write('{"event":"shutdown_failed"}\n');
      process.exitCode = 1;
    }).finally(() => {
      clearTimeout(deadline);
      if (keepAlive) clearInterval(keepAlive);
      process.off('SIGINT', stop);
      process.off('SIGTERM', stop);
    });
  };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  process.stdout.write(JSON.stringify({
    event: 'started', role: config.role, configVersion: config.version,
    ...(config.role === 'api' ? { host: config.host, port } : {}),
  }) + '\n');
}
