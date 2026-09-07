import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { ROOT_CONTEXT, Span, SpanStatusCode, trace } from '@opentelemetry/api';
import { BasicTracerProvider, SimpleSpanProcessor, SpanExporter, ReadableSpan } from '@opentelemetry/sdk-trace-base';
import { NodeClient, Scope } from '@sentry/node';
import type { RuntimeConfig } from './configuration';

export interface RequestContext { readonly correlationId: string; readonly span: Span }
export const requestContext = new AsyncLocalStorage<RequestContext>();
export type SafeEvent = 'http_completed' | 'db_transaction' | 'db_unavailable' | 'worker_completed' | 'worker_abandoned' | 'error_captured';
export type SafeCode = 'OK' | 'BAD_REQUEST' | 'NOT_FOUND' | 'PAYLOAD_TOO_LARGE' | 'UNAVAILABLE' | 'CONFLICT' | 'INTERNAL_ERROR' | 'DB_BUSY' | 'COMMIT_UNKNOWN' | 'ROLLED_BACK' | 'DRAINING';
export type SafeRoute = '/health/live' | '/health/ready' | 'unmatched' | 'worker';
export type LogSink = (record: Readonly<Record<string, unknown>>) => void;

// Manual OTel spans have one owner. No automatic HTTP/DB/Sentry instrumentation,
// baggage, raw request fields, exception stacks or network exporters are enabled.
export class Telemetry {
  readonly provider: BasicTracerProvider;
  readonly errors: NodeClient;
  private readonly scope = new Scope();
  private readonly counts = new Map<SafeEvent, number>();
  constructor(private readonly config: RuntimeConfig, private readonly sink: LogSink = record => {
    process.stdout.write(JSON.stringify(record) + '\n');
  }, exporter?: SpanExporter) {
    const localExporter: SpanExporter = {
      export: (spans: ReadableSpan[], done) => {
        for (const span of spans) this.write({ event: 'span', name: span.name,
          traceId: span.spanContext().traceId, spanId: span.spanContext().spanId,
          parentSpanId: span.parentSpanContext?.spanId, status: span.status.code });
        done({ code: 0 });
      }, shutdown: async () => {},
    };
    this.provider = new BasicTracerProvider({ spanProcessors: [new SimpleSpanProcessor(exporter ?? localExporter)] });
    this.errors = new NodeClient({ dsn: 'http://local@localhost/1', integrations: [],
      transport: () => ({ send: async () => {
        this.write({ event: 'error_report', code: 'INTERNAL_ERROR' });
        return { statusCode: 200 };
      }, flush: async () => true }),
      stackParser: () => [], sendDefaultPii: false, enabled: true,
      beforeSend: event => ({ type: undefined, event_id: event.event_id!, message: 'INTERNAL_ERROR', level: 'error' }),
    });
    this.scope.setClient(this.errors);
  }
  private write(record: Record<string, unknown>): void {
    try { this.sink({ timestamp: new Date().toISOString(), service: this.config.service,
      role: this.config.role, environment: this.config.environment, release: this.config.release, ...record }); }
    catch { /* Telemetry loss cannot change a business outcome. */ }
  }
  emit(event: SafeEvent, code: SafeCode, route: SafeRoute = 'unmatched', durationMs?: number): void {
    const ctx = requestContext.getStore();
    this.counts.set(event, (this.counts.get(event) ?? 0) + 1);
    this.write({ event, code, route, ...(durationMs === undefined ? {} : { durationMs }),
      ...(ctx ? { correlationId: ctx.correlationId, traceId: ctx.span.spanContext().traceId,
        spanId: ctx.span.spanContext().spanId } : {}) });
  }
  metrics(): Readonly<Record<string, number>> { return Object.freeze(Object.fromEntries(this.counts)); }
  captureInternal(): void {
    this.errors.captureMessage('INTERNAL_ERROR', 'error', undefined, this.scope);
    this.emit('error_captured', 'INTERNAL_ERROR');
  }
  start(name: 'http.request' | 'db.transaction' | 'worker.work', parent?: { traceId: string; spanId: string; traceFlags: number }): Span {
    const current = requestContext.getStore();
    const context = parent ? trace.setSpanContext(ROOT_CONTEXT, { ...parent, isRemote: true })
      : current ? trace.setSpan(ROOT_CONTEXT, current.span) : ROOT_CONTEXT;
    return this.provider.getTracer('commerce-foundation', '2').startSpan(name, {}, context);
  }
  async work<T>(operation: (signal: AbortSignal) => Promise<T>, signal: AbortSignal): Promise<T> {
    const span = this.start('worker.work');
    return requestContext.run({ correlationId: randomUUID(), span }, async () => {
      try { const result = await operation(signal); span.setStatus({ code: SpanStatusCode.OK }); return result; }
      catch (error) { span.setStatus({ code: SpanStatusCode.ERROR }); throw error; }
      finally { span.end(); }
    });
  }
  async close(): Promise<void> { await this.errors.close(1000); await this.provider.shutdown(); }
}
