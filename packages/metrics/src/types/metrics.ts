// Metric types for Prometheus
export interface MetricLabels {
  [key: string]: string | number;
}

export interface CounterMetric {
  name: string;
  help: string;
  labels?: MetricLabels;
  value?: number;
}

export interface GaugeMetric {
  name: string;
  help: string;
  labels?: MetricLabels;
  value?: number;
}

export interface HistogramMetric {
  name: string;
  help: string;
  labels?: MetricLabels;
  value?: number;
  buckets?: number[];
}

export interface SummaryMetric {
  name: string;
  help: string;
  labels?: MetricLabels;
  value?: number;
  percentiles?: number[];
}

// System metrics
export interface SystemMetrics {
  // HTTP metrics
  http_requests_total: CounterMetric;
  http_request_duration_seconds: HistogramMetric;
  http_request_size_bytes: HistogramMetric;
  http_response_size_bytes: HistogramMetric;

  // Database metrics
  database_connections_active: GaugeMetric;
  database_connections_idle: GaugeMetric;
  database_queries_total: CounterMetric;
  database_query_duration_seconds: HistogramMetric;

  // Memory metrics
  memory_usage_bytes: GaugeMetric;
  memory_heap_used_bytes: GaugeMetric;
  memory_heap_total_bytes: GaugeMetric;

  // CPU metrics
  cpu_usage_percent: GaugeMetric;
  process_cpu_seconds_total: CounterMetric;

  // Event metrics
  events_published_total: CounterMetric;
  events_consumed_total: CounterMetric;
  events_failed_total: CounterMetric;

  // Business metrics
  users_registered_total: CounterMetric;
  payments_completed_total: CounterMetric;
  payments_failed_total: CounterMetric;
  transfers_completed_total: CounterMetric;
  bills_paid_total: CounterMetric;
}

// Metric collection interface
export interface MetricCollector {
  collect(): Promise<SystemMetrics>;
}

// Prometheus configuration
export interface PrometheusConfig {
  enabled: boolean;
  port: number;
  path: string;
  collectDefaultMetrics: boolean;
  defaultMetricsInterval: number;
  prefix?: string;
  labels?: Record<string, string>;
}

