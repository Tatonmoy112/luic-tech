import type { Telemetry } from './telemetry';

// Local work lifecycle contract only; queue receipts/leases belong to later Bolts.
export class WorkTracker {
  private stopping = false;
  private readonly controller = new AbortController();
  private readonly pending = new Set<Promise<void>>();
  constructor(private readonly telemetry: Telemetry) {}
  async run(operation: (signal: AbortSignal) => Promise<void>, acknowledge: () => Promise<void>): Promise<void> {
    if (this.stopping) throw new Error('Worker draining');
    const job = this.telemetry.work(async signal => {
      await operation(signal);
      if (signal.aborted) { this.telemetry.emit('worker_abandoned', 'DRAINING', 'worker'); return; }
      await acknowledge();
      this.telemetry.emit('worker_completed', 'OK', 'worker');
    }, this.controller.signal);
    this.pending.add(job);
    try { await job; } finally { this.pending.delete(job); }
  }
  stop(): void { this.stopping = true; this.controller.abort(); }
  async drain(): Promise<void> { this.stop(); await Promise.allSettled([...this.pending]); }
}
