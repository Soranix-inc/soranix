import { systemLogger } from '@packages/logging';

import { KafkaAdapter, type KafkaAdapterConfig } from '../adapters/kafka-adapter.js';
import { RabbitMQAdapter } from '../adapters/rabbitmq-adapter.js';
import { EventRouter } from '../routing/event-router.js';
import { BaseEvent } from '../types/base-event.js';

/**
 * Configuration options for EventPublisher
 */
export interface EventPublisherConfig {
  kafka?: KafkaAdapterConfig;
  // Can add RabbitMQ config in future if needed
}

/**
 * High-level event publisher with automatic routing
 * Business logic ONLY interacts with this class!
 *
 * Features:
 * - Automatic routing to Kafka or RabbitMQ based on event type
 * - Separation of concerns (business logic doesn't know about infrastructure)
 * - Support for batch publishing
 * - Configurable per service
 */
export class EventPublisher {
  private kafkaAdapter: KafkaAdapter;
  private rabbitmqAdapter: RabbitMQAdapter;
  private serviceName: string;
  private initialized = false;

  constructor(serviceName: string, config?: EventPublisherConfig) {
    this.serviceName = serviceName;
    this.kafkaAdapter = new KafkaAdapter(serviceName, config?.kafka);
    this.rabbitmqAdapter = new RabbitMQAdapter();
  }

  /**
   * Initialize both adapters
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await Promise.all([this.kafkaAdapter.initialize(), this.rabbitmqAdapter.initialize()]);
      this.initialized = true;
      systemLogger.info('EventPublisher initialized', { service: this.serviceName });
    } catch (error) {
      systemLogger.error('Failed to initialize EventPublisher', {
        service: this.serviceName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Publish event - automatically routes to correct transport
   */
  async publish(event: BaseEvent): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const transportType = EventRouter.getTransportType(event);

    try {
      switch (transportType) {
        case 'kafka':
          await this.kafkaAdapter.publish(event);
          break;

        case 'rabbitmq':
          await this.rabbitmqAdapter.publish(event);
          break;

        case 'both':
          // Publish to both transports for redundancy
          await Promise.all([this.kafkaAdapter.publish(event), this.rabbitmqAdapter.publish(event)]);
          break;
      }

      systemLogger.info('Event published', {
        eventType: event.eventType,
        eventId: event.eventId,
        transport: transportType,
        service: this.serviceName,
      });
    } catch (error) {
      systemLogger.error('Failed to publish event', {
        eventType: event.eventType,
        transport: transportType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Publish multiple events in a batch
   */
  async publishBatch(events: BaseEvent[]): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Group events by transport
    const kafkaEvents = events.filter(
      (e) => EventRouter.getTransportType(e) === 'kafka' || EventRouter.getTransportType(e) === 'both'
    );

    const rabbitmqEvents = events.filter(
      (e) => EventRouter.getTransportType(e) === 'rabbitmq' || EventRouter.getTransportType(e) === 'both'
    );

    try {
      await Promise.all([
        kafkaEvents.length > 0 ? this.kafkaAdapter.publishBatch(kafkaEvents) : Promise.resolve(),
        rabbitmqEvents.length > 0 ? this.rabbitmqAdapter.publishBatch(rabbitmqEvents) : Promise.resolve(),
      ]);

      systemLogger.info('Batch published', {
        total: events.length,
        kafka: kafkaEvents.length,
        rabbitmq: rabbitmqEvents.length,
        service: this.serviceName,
      });
    } catch (error) {
      systemLogger.error('Failed to publish batch', {
        count: events.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Disconnect from all transports
   */
  async disconnect(): Promise<void> {
    await Promise.all([this.kafkaAdapter.disconnect(), this.rabbitmqAdapter.disconnect()]);
    this.initialized = false;
    systemLogger.info('EventPublisher disconnected', { service: this.serviceName });
  }

  /**
   * Check health of transports
   */
  async isHealthy(): Promise<{ kafka: boolean; rabbitmq: boolean }> {
    const [kafka, rabbitmq] = await Promise.all([this.kafkaAdapter.isHealthy(), this.rabbitmqAdapter.isHealthy()]);

    return { kafka, rabbitmq };
  }
}
