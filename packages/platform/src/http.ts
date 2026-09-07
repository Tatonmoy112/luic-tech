import { randomUUID } from 'node:crypto';
import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import express, { ErrorRequestHandler, Request, Response } from 'express';
import { SpanStatusCode } from '@opentelemetry/api';
import { DatabaseFailure } from './database';
import { requestContext, SafeCode, SafeRoute, Telemetry } from './telemetry';

const statusCode: Record<number, SafeCode> = { 400: 'BAD_REQUEST', 404: 'NOT_FOUND',
  409: 'CONFLICT', 413: 'PAYLOAD_TOO_LARGE', 415: 'BAD_REQUEST', 503: 'UNAVAILABLE' };
const titles: Record<SafeCode, string> = { OK: 'OK', BAD_REQUEST: 'Invalid request', NOT_FOUND: 'Not found',
  PAYLOAD_TOO_LARGE: 'Request too large', UNAVAILABLE: 'Service unavailable', CONFLICT: 'Conflict',
  INTERNAL_ERROR: 'Internal error', DB_BUSY: 'Database busy', COMMIT_UNKNOWN: 'Outcome unknown',
  ROLLED_BACK: 'Operation rolled back', DRAINING: 'Service stopping' };
function routeOf(req: Request): SafeRoute {
  const path = req.path;
  return path === '/health/live' || path === '/health/ready' ? path : 'unmatched';
}
export function problem(req: Request, res: Response, status: number, code: SafeCode): void {
  if (res.headersSent) return;
  res.status(status).type('application/problem+json').json({ type: 'about:blank', title: titles[code],
    status, code, detail: titles[code], instance: routeOf(req) === 'unmatched' ? '/unmatched' : req.path,
    correlationId: requestContext.getStore()?.correlationId ?? randomUUID() });
}
@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
  constructor(private readonly telemetry: Telemetry) {}
  catch(error: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    let status = error instanceof HttpException ? error.getStatus() : 500;
    let code = statusCode[status] ?? 'INTERNAL_ERROR';
    if (error instanceof DatabaseFailure) {
      status = error.code === 'CONFLICT' ? 409 : 503; code = error.code;
    }
    if (status >= 500 && code === 'INTERNAL_ERROR') this.telemetry.captureInternal();
    problem(http.getRequest(), http.getResponse(), status, code);
  }
}
export function configureHttp(app: INestApplication, telemetry: Telemetry, draining: () => boolean): void {
  app.use((req: Request, res: Response, next: () => void) => {
    const correlation = req.headers['x-correlation-id'];
    const parentHeader = req.headers.traceparent;
    const validCorrelation = correlation === undefined ||
      (typeof correlation === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(correlation));
    const parentMatch = typeof parentHeader === 'string'
      ? /^00-([0-9a-f]{32})-([0-9a-f]{16})-(0[01])$/.exec(parentHeader) : null;
    const validParent = parentHeader === undefined || !!(parentMatch &&
      parentMatch[1] !== '0'.repeat(32) && parentMatch[2] !== '0'.repeat(16));
    const span = telemetry.start('http.request', validParent && parentMatch ? {
      traceId: parentMatch[1]!, spanId: parentMatch[2]!, traceFlags: Number.parseInt(parentMatch[3]!, 16),
    } : undefined);
    const ctx = { correlationId: validCorrelation && correlation ? correlation as string : randomUUID(), span };
    requestContext.run(ctx, () => {
      const began = performance.now();
      res.setHeader('x-correlation-id', ctx.correlationId);
      const sc = span.spanContext();
      res.setHeader('traceparent', '00-' + sc.traceId + '-' + sc.spanId + '-01');
      res.setHeader('cache-control', 'no-store');
      res.setHeader('x-content-type-options', 'nosniff');
      let finished = false;
      const end = (): void => {
        if (finished) return; finished = true;
        requestContext.run(ctx, () => {
          const status = res.writableFinished ? res.statusCode : 503;
          span.setAttribute('http.route', routeOf(req));
          span.setAttribute('http.response.status_code', status);
          span.setStatus({ code: status >= 500 ? SpanStatusCode.ERROR : SpanStatusCode.OK });
          telemetry.emit('http_completed', status >= 400 ? statusCode[status] ?? 'INTERNAL_ERROR' : 'OK',
            routeOf(req), performance.now() - began);
          span.end();
        });
      };
      res.once('finish', end); res.once('close', end);
      if (!validCorrelation || !validParent || req.originalUrl.length > 2048 ||
        Buffer.byteLength(JSON.stringify(req.headers)) > 16384) { problem(req, res, 400, 'BAD_REQUEST'); return; }
      if (draining()) { problem(req, res, 503, 'DRAINING'); return; }
      const hasBody = !!req.headers['transfer-encoding'] || Number(req.headers['content-length'] ?? 0) > 0;
      if (hasBody && (!req.is('application/json') || req.headers['content-encoding'])) {
        problem(req, res, 400, 'BAD_REQUEST'); return;
      }
      next();
    });
  });
  app.use(express.json({ limit: '256kb', strict: true, inflate: false }));
  const parsingErrors: ErrorRequestHandler = (error: { type?: string }, req, res, _next) => {
    problem(req, res, error?.type === 'entity.too.large' ? 413 : 400,
      error?.type === 'entity.too.large' ? 'PAYLOAD_TOO_LARGE' : 'BAD_REQUEST');
  };
  app.use(parsingErrors);
  app.useGlobalFilters(new SafeExceptionFilter(telemetry));
  const server = app.getHttpServer();
  server.requestTimeout = 5000;
  server.headersTimeout = 5000;
  server.keepAliveTimeout = 1000;
}
