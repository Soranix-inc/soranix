export interface PrometheusConfig {
  enabled: boolean;
  port: number;
  path: string;
  collectDefaultMetrics: boolean;
  defaultMetricsInterval: number;
  prefix?: string;
  labels?: Record<string, string>;
}

export const getPrometheusConfig = (): PrometheusConfig => {
  return {
    enabled: process.env.PROMETHEUS_ENABLED !== 'false',
    port: parseInt(process.env.PROMETHEUS_PORT || '9090'),
    path: process.env.PROMETHEUS_PATH || '/metrics',
    collectDefaultMetrics: process.env.PROMETHEUS_COLLECT_DEFAULT !== 'false',
    defaultMetricsInterval: parseInt(process.env.PROMETHEUS_DEFAULT_INTERVAL || '10000'),
    prefix: process.env.PROMETHEUS_PREFIX || 'soranix_',
    labels: {
      service: process.env.SERVICE_NAME || 'unknown',
      version: process.env.SERVICE_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
    },
  };
};

