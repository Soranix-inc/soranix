import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { OTLPTraceExporter } from '@opentelemetry/exporter-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

import { systemLogger } from '@packages/logging';

import { getTracingConfig } from './config.js';

let sdk: NodeSDK | null = null;

export function initializeTracing(): void {
  const config = getTracingConfig();

  if (!config.enabled) {
    systemLogger.info('Tracing disabled, skipping initialization');
    return;
  }

  try {
    // Create exporters
    const exporters = [];

    if (config.jaegerEndpoint) {
      exporters.push(
        new JaegerExporter({
          endpoint: config.jaegerEndpoint,
        })
      );
    }

    if (config.otlpEndpoint) {
      exporters.push(
        new OTLPTraceExporter({
          url: config.otlpEndpoint,
        })
      );
    }

    if (exporters.length === 0) {
      systemLogger.warn('No tracing exporters configured');
      return;
    }

    // Create resource
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: config.serviceVersion,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: config.environment,
    });

    // Initialize SDK
    sdk = new NodeSDK({
      resource,
      traceExporter: exporters[0], // Use first exporter as primary
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable some instrumentations that might be noisy
          '@opentelemetry/instrumentation-fs': {
            enabled: false,
          },
          '@opentelemetry/instrumentation-dns': {
            enabled: false,
          },
        }),
      ],
    });

    // Start the SDK
    sdk.start();

    systemLogger.info('Tracing initialized successfully', {
      serviceName: config.serviceName,
      serviceVersion: config.serviceVersion,
      environment: config.environment,
      exporters: exporters.length,
    });
  } catch (error) {
    systemLogger.error('Failed to initialize tracing', {
      error: error.message,
      stack: error.stack,
    });
  }
}

export function shutdownTracing(): Promise<void> {
  if (sdk) {
    return sdk.shutdown();
  }
  return Promise.resolve();
}



