const { startWorker } = require('../../apps/commerce-worker/dist/application');
const { Foundation, runLifecycle, reportStartupFailure } = require('../../packages/platform/dist');
(async () => {
  const { app, config } = await startWorker(process.env);
  const foundation = app.get(Foundation);
  const job = foundation.work.run(signal => new Promise(resolve => {
    if (process.env.B002_NONCOOPERATIVE !== '1') signal.addEventListener('abort', resolve, { once: true });
  }), async () => { process.stdout.write('UNEXPECTED_ACK\n'); });
  void job.catch(() => {});
  runLifecycle(app, config);
})().catch(reportStartupFailure);
