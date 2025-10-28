import { register, collectDefaultMetrics, Counter, Gauge, Histogram, Summary } from 'prom-client';

import { systemLogger } from '@packages/logging';
import { getTraceId, getSpanId } from '@packages/tracing';

import { MetricLabels } from '../types/metrics.js';

import { PrometheusConfig, getPrometheusConfig } from './config.js';

export class SoranixMetrics {
  private config: PrometheusConfig;
  private metrics: Map<string, Counter | Gauge | Histogram | Summary> = new Map();

  constructor(config?: Partial<PrometheusConfig>) {
    this.config = { ...getPrometheusConfig(), ...config };

    if (!this.config.enabled) {
      systemLogger.info('Prometheus metrics disabled');
      return;
    }

    this.initializeMetrics();

    if (this.config.collectDefaultMetrics) {
      collectDefaultMetrics({
        prefix: this.config.prefix,
        labels: this.config.labels,
        gcDurationBuckets: [0.001, 0.01, 0.1, 1, 2, 5],
        eventLoopMonitoringPrecision: 10,
      });
    }

    systemLogger.info('SoranixMetrics initialized', {
      enabled: this.config.enabled,
      port: this.config.port,
      path: this.config.path,
    });
  }

  /**
   * Initialize custom metrics
   */
  private initializeMetrics(): void {
    // HTTP metrics
    this.createCounter('http_requests_total', 'Total number of HTTP requests', ['method', 'route', 'status_code']);
    this.createHistogram('http_request_duration_seconds', 'HTTP request duration in seconds', [
      'method',
      'route',
      'status_code',
    ]);
    this.createHistogram('http_request_size_bytes', 'HTTP request size in bytes', ['method', 'route']);
    this.createHistogram('http_response_size_bytes', 'HTTP response size in bytes', ['method', 'route', 'status_code']);

    // Database metrics
    this.createGauge('database_connections_active', 'Number of active database connections');
    this.createGauge('database_connections_idle', 'Number of idle database connections');
    this.createCounter('database_queries_total', 'Total number of database queries', ['operation', 'table', 'status']);
    this.createHistogram('database_query_duration_seconds', 'Database query duration in seconds', [
      'operation',
      'table',
    ]);

    // Event metrics
    this.createCounter('events_published_total', 'Total number of events published', ['event_type', 'status']);
    this.createCounter('events_consumed_total', 'Total number of events consumed', ['event_type', 'status']);
    this.createCounter('events_failed_total', 'Total number of failed events', ['event_type', 'error_type']);

    // Business metrics
    this.createCounter('users_registered_total', 'Total number of users registered', ['method', 'source']);
    this.createCounter('payments_completed_total', 'Total number of payments completed', [
      'method',
      'provider',
      'currency',
    ]);
    this.createCounter('payments_failed_total', 'Total number of failed payments', [
      'method',
      'provider',
      'error_type',
    ]);
    this.createCounter('transfers_completed_total', 'Total number of transfers completed', ['type', 'currency']);
    this.createCounter('bills_paid_total', 'Total number of bills paid', ['biller', 'category', 'provider']);

    // Memory metrics
    this.createGauge('memory_usage_bytes', 'Memory usage in bytes');
    this.createGauge('memory_heap_used_bytes', 'Heap memory used in bytes');
    this.createGauge('memory_heap_total_bytes', 'Total heap memory in bytes');

    // CPU metrics
    this.createGauge('cpu_usage_percent', 'CPU usage percentage');
    this.createCounter('process_cpu_seconds_total', 'Total CPU time used by the process');
  }

  /**
   * Create a counter metric
   */
  private createCounter(name: string, help: string, labelNames: string[] = []): Counter {
    const counter = new Counter({
      name: `${this.config.prefix}${name}`,
      help,
      labelNames: [...labelNames, 'trace_id', 'span_id'],
      registers: [register],
    });

    this.metrics.set(name, counter);
    return counter;
  }

  /**
   * Create a gauge metric
   */
  private createGauge(name: string, help: string, labelNames: string[] = []): Gauge {
    const gauge = new Gauge({
      name: `${this.config.prefix}${name}`,
      help,
      labelNames: [...labelNames, 'trace_id', 'span_id'],
      registers: [register],
    });

    this.metrics.set(name, gauge);
    return gauge;
  }

  /**
   * Create a histogram metric
   */
  private createHistogram(name: string, help: string, labelNames: string[] = []): Histogram {
    const histogram = new Histogram({
      name: `${this.config.prefix}${name}`,
      help,
      labelNames: [...labelNames, 'trace_id', 'span_id'],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [register],
    });

    this.metrics.set(name, histogram);
    return histogram;
  }

  /**
   * Create a summary metric
   */
  private createSummary(name: string, help: string, labelNames: string[] = []): Summary {
    const summary = new Summary({
      name: `${this.config.prefix}${name}`,
      help,
      labelNames: [...labelNames, 'trace_id', 'span_id'],
      percentiles: [0.5, 0.9, 0.95, 0.99],
      registers: [register],
    });

    this.metrics.set(name, summary);
    return summary;
  }

  /**
   * Increment a counter
   */
  incrementCounter(name: string, labels: MetricLabels = {}, value: number = 1): void {
    if (!this.config.enabled) return;

    const metric = this.metrics.get(name) as Counter;
    if (!metric) {
      systemLogger.warn(`Counter metric '${name}' not found`);
      return;
    }

    const enrichedLabels = this.enrichLabelsWithTrace(labels);
    metric.inc(enrichedLabels, value);
  }

  /**
   * Set a gauge value
   */
  setGauge(name: string, value: number, labels: MetricLabels = {}): void {
    if (!this.config.enabled) return;

    const metric = this.metrics.get(name) as Gauge;
    if (!metric) {
      systemLogger.warn(`Gauge metric '${name}' not found`);
      return;
    }

    const enrichedLabels = this.enrichLabelsWithTrace(labels);
    metric.set(enrichedLabels, value);
  }

  /**
   * Observe a histogram value
   */
  observeHistogram(name: string, value: number, labels: MetricLabels = {}): void {
    if (!this.config.enabled) return;

    const metric = this.metrics.get(name) as Histogram;
    if (!metric) {
      systemLogger.warn(`Histogram metric '${name}' not found`);
      return;
    }

    const enrichedLabels = this.enrichLabelsWithTrace(labels);
    metric.observe(enrichedLabels, value);
  }

  /**
   * Observe a summary value
   */
  observeSummary(name: string, value: number, labels: MetricLabels = {}): void {
    if (!this.config.enabled) return;

    const metric = this.metrics.get(name) as Summary;
    if (!metric) {
      systemLogger.warn(`Summary metric '${name}' not found`);
      return;
    }

    const enrichedLabels = this.enrichLabelsWithTrace(labels);
    metric.observe(enrichedLabels, value);
  }

  /**
   * Get all metrics as Prometheus format
   */
  async getMetrics(): Promise<string> {
    if (!this.config.enabled) {
      return '# Prometheus metrics disabled\n';
    }

    return register.metrics();
  }

  /**
   * Get metrics in JSON format
   */
  async getMetricsAsJSON(): Promise<any> {
    if (!this.config.enabled) {
      return {};
    }

    return register.getMetricsAsJSON();
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    if (!this.config.enabled) return;

    register.clear();
    systemLogger.info('All metrics cleared');
  }

  /**
   * Enrich labels with trace correlation data
   */
  private enrichLabelsWithTrace(labels: MetricLabels): MetricLabels {
    const traceId = getTraceId();
    const spanId = getSpanId();

    return {
      ...labels,
      ...(traceId && { trace_id: traceId }),
      ...(spanId && { span_id: spanId }),
    };
  }

  /**
   * Get the Prometheus register
   */
  getRegister() {
    return register;
  }
}
