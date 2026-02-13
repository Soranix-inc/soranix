// Main exports
export { initializeTracing, shutdownTracing } from './tracer.js';
export { createSpan, runWithSpan, addSpanAttributes, addSpanEvent, getTraceId, getSpanId } from './span-utils.js';
export { getTracingConfig, type TracingConfig } from './config.js';



