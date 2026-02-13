/**
 * Configuration Resolver
 * Merges registry defaults with service-specific overrides
 */


import type {
  EventTransportConfig,
  TransportConfig,
  ResolvedEventConfig,
  ResolvedRabbitMQConfig,
  RabbitMQEventConfig,
} from './types.js';
import { RABBITMQ_QUEUE_TEMPLATES } from './templates.js';

export class ConfigResolver {
  resolve(
    registryConfigs: Record<string, EventTransportConfig>,
    serviceConfig: TransportConfig | undefined,
    serviceName: string
  ): Map<string, ResolvedEventConfig> {
    const resolved = new Map<string, ResolvedEventConfig>();

    for (const [eventType, registryConfig] of Object.entries(registryConfigs)) {
      const resolvedConfig: ResolvedEventConfig = {
        eventType,
      };

      // Resolve RabbitMQ config if present
      if (registryConfig.rabbitmq) {
        const serviceOverride = serviceConfig?.rabbitmq?.events?.[eventType];
        const resolvedRabbitMQ = this.resolveRabbitMQConfig(
          registryConfig.rabbitmq,
          serviceOverride,
          serviceConfig,
          serviceName,
          eventType
        );
        resolvedConfig.rabbitmq = resolvedRabbitMQ;
      }

      resolved.set(eventType, resolvedConfig);
    }

    return resolved;
  }

  private resolveRabbitMQConfig(
    registryConfig: RabbitMQEventConfig,
    serviceOverride: Partial<RabbitMQEventConfig> | undefined,
    serviceConfig: TransportConfig | undefined,
    serviceName: string,
    eventType: string
  ): ResolvedRabbitMQConfig {
    // Merge registry + service override
    const merged: RabbitMQEventConfig = {
      exchange: serviceOverride?.exchange || registryConfig.exchange,
      routingKey: serviceOverride?.routingKey || registryConfig.routingKey,
      queue: {
        ...registryConfig.queue,
        ...serviceOverride?.queue,
      },
    };

    // Resolve queue configuration
    const queueTemplate = merged.queue?.template || 'default';
    const template = RABBITMQ_QUEUE_TEMPLATES[queueTemplate] || RABBITMQ_QUEUE_TEMPLATES.default;

    // Generate queue name
    const queueNameStrategy = serviceConfig?.rabbitmq?.global?.queueNamingStrategy || 'event-type';
    
    let queueName: string;
    if (merged.queue?.name) {
      queueName = merged.queue.name;
    } else if (queueNameStrategy === 'service-prefixed') {
      const prefix = serviceConfig?.rabbitmq?.global?.queueNamePrefix || serviceName;
      queueName = `${prefix}.${eventType.replace(/\./g, '_')}`;
    } else {
      queueName = eventType.replace(/\./g, '_');
    }

    // Merge template with queue-specific overrides
    const queueArgs = {
      ...template.arguments,
      ...merged.queue?.arguments,
    };

    return {
      exchange: merged.exchange,
      routingKey: merged.routingKey,
      queue: {
        name: queueName,
        durable: merged.queue?.durable ?? template.durable ?? true,
        exclusive: merged.queue?.exclusive ?? template.exclusive ?? false,
        autoDelete: merged.queue?.autoDelete ?? template.autoDelete ?? false,
        arguments: queueArgs,
      },
    };
  }
}

