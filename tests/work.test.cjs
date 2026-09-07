const { Telemetry, WorkTracker, readConfiguration } = require('../packages/platform/dist');
const { environment } = require('./helpers.cjs');
const { launch } = require('./helpers.cjs');
let telemetry, work, events;
beforeEach(() => { events = []; telemetry = new Telemetry(readConfiguration(environment('worker'), 'worker'), e => events.push(e)); work = new WorkTracker(telemetry); });
afterEach(async () => { await work.drain(); await telemetry.close(); });
test('acknowledges only successfully completed work', async () => {
  const seen = [];
  await work.run(async () => { seen.push('effect'); }, async () => { seen.push('ack'); });
  expect(seen).toEqual(['effect', 'ack']);
  await expect(work.run(async () => { throw new Error('failure'); }, async () => seen.push('bad-ack'))).rejects.toThrow();
  expect(seen).toEqual(['effect', 'ack']);
});
test('shutdown aborts unfinished work, denies admission and never acknowledges abandoned work', async () => {
  let admitted;
  const started = new Promise(resolve => { admitted = resolve; });
  let ack = false;
  const job = work.run(signal => new Promise(resolve => {
    signal.addEventListener('abort', () => resolve(), { once: true }); admitted();
  }), async () => { ack = true; });
  await started;
  await work.drain();
  await job;
  expect(ack).toBe(false);
  expect(events.some(e => e.event === 'worker_abandoned')).toBe(true);
  await expect(work.run(async () => {}, async () => {})).rejects.toThrow('draining');
});
test('a throwing local telemetry sink cannot turn completed work into failure', async () => {
  const failing = new Telemetry(readConfiguration(environment('worker'), 'worker'), () => { throw new Error('sink unavailable'); });
  let ack = false;
  try { await new WorkTracker(failing).run(async () => {}, async () => { ack = true; }); }
  finally { await failing.close(); }
  expect(ack).toBe(true);
});

const posix = process.platform === 'win32' ? test.skip : test;
posix.each([['cooperative', '0', 0], ['noncooperative', '1', 1]])(
  '%s in-flight worker handles SIGTERM within deadline without acknowledgement', async (_name, mode, expectedCode) => {
    const running = launch('worker', environment('worker', { B002_NONCOOPERATIVE: mode }), 'tests/fixtures/drain-worker.cjs');
    try {
      await running.started();
      running.child.kill('SIGTERM');
      const result = await running.exit;
      expect(result.code).toBe(expectedCode);
      expect(result.output).not.toContain('UNEXPECTED_ACK');
      expect(result.output).toContain(mode === '1' ? 'shutdown_failed' : 'stopped');
    } finally { if (running.child.exitCode === null) running.child.kill('SIGKILL'); }
  });
