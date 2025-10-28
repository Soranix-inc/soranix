export interface TracingConfig {
  serviceName: string;
  serviceVersion: string;
  environment: string;
  jaegerEndpoint?: string;
  otlpEndpoint?: string;
  samplingRatio: number;
  enabled: boolean;
}

export const getTracingConfig = (): TracingConfig => {
  return {
    serviceName: process.env.SERVICE_NAME || 'soranix-service',
    serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    jaegerEndpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    otlpEndpoint: process.env.OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
    samplingRatio: parseFloat(process.env.TRACING_SAMPLING_RATIO || '1.0'),
    enabled: process.env.TRACING_ENABLED !== 'false',
  };
};
