import { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';

import { systemLogger } from '@packages/logging';

const tracer = trace.getTracer('soranix-tracer');

export interface SpanOptions {
  name: string;
  kind?: SpanKind;
  attributes?: Record<string, string | number | boolean>;
}

export function createSpan(options: SpanOptions) {
  return tracer.startSpan(options.name, {
    kind: options.kind || SpanKind.INTERNAL,
    attributes: options.attributes,
  });
}

export function runWithSpan<T>(options: SpanOptions, fn: () => T | Promise<T>): Promise<T> {
  const span = createSpan(options);

  return context.with(trace.setSpan(context.active(), span), async () => {
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: error.message,
      });
      span.recordException(error);
      systemLogger.error('Span execution failed', {
        spanName: options.name,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    } finally {
      span.end();
    }
  });
}

export function addSpanAttributes(attributes: Record<string, string | number | boolean>): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.setAttributes(attributes);
  }
}

export function addSpanEvent(name: string, attributes?: Record<string, string | number | boolean>): void {
  const span = trace.getActiveSpan();
  if (span) {
    span.addEvent(name, attributes);
  }
}

export function getTraceId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().traceId;
}

export function getSpanId(): string | undefined {
  const span = trace.getActiveSpan();
  return span?.spanContext().spanId;
}

