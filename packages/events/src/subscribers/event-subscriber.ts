import { systemLogger } from '@packages/logging';

import { EventHandler as TransportEventHandler } from '../adapters/event-transport.interface.js';
import { KafkaAdapter, type KafkaAdapterConfig } from '../adapters/kafka-adapter.js';
import { RabbitMQAdapter } from '../adapters/rabbitmq-adapter.js';
import { EventRouter } from '../routing/event-router.js';
import { BaseEvent } from '../types/base-event.js';

export type EventHandler<T = any> = (event: BaseEvent, data: T) => Promise<void>;

/**
 * Configuration options for EventSubscriber
 */
export interface EventSubscriberConfig {
  kafka?: KafkaAdapterConfig;
  // Can add RabbitMQ config in future if needed
}

/**
 * High-level event subscriber with automatic routing
 * Business logic ONLY interacts with this class!
 *
 * Features:
 * - Automatic routing to Kafka or RabbitMQ based on event type
 * - Separation of concerns (business logic doesn't know about infrastructure)
 * - Unified subscription interface
 * - Configurable per service
 */
export class EventSubscriber {
  private kafkaAdapter: KafkaAdapter;
  private rabbitmqAdapter: RabbitMQAdapter;
  private serviceName: string;
  private initialized = false;
  private handlers = new Map<string, EventHandler>();

  constructor(serviceName: string, config?: EventSubscriberConfig) {
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
      systemLogger.info('EventSubscriber initialized', { service: this.serviceName });
    } catch (error) {
      systemLogger.error('Failed to initialize EventSubscriber', {
        service: this.serviceName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Subscribe to event types
   * Automatically routes to correct transport based on event type
   */
  async subscribe(eventTypes: string[], handler: EventHandler): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Store handler
    eventTypes.forEach((eventType) => {
      this.handlers.set(eventType, handler);
    });

    // Group event types by transport
    const kafkaEventTypes = eventTypes.filter((et) => EventRouter.shouldUseKafka(et));
    const rabbitmqEventTypes = eventTypes.filter((et) => EventRouter.shouldUseRabbitMQ(et));

    // Create transport handler wrapper
    const transportHandler: TransportEventHandler = async (event: BaseEvent, data: any) => {
      const eventHandler = this.handlers.get(event.eventType);
      if (eventHandler) {
        await eventHandler(event, data);
      }
    };

    try {
      // Subscribe to Kafka events
      if (kafkaEventTypes.length > 0) {
        await this.kafkaAdapter.subscribe(kafkaEventTypes, transportHandler);
      }

      // Subscribe to RabbitMQ events
      if (rabbitmqEventTypes.length > 0) {
        await this.rabbitmqAdapter.subscribe(rabbitmqEventTypes, transportHandler);
      }

      systemLogger.info('Subscribed to events', {
        service: this.serviceName,
        total: eventTypes.length,
        kafka: kafkaEventTypes.length,
        rabbitmq: rabbitmqEventTypes.length,
        eventTypes,
      });
    } catch (error) {
      systemLogger.error('Failed to subscribe to events', {
        eventTypes,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Unsubscribe from event type
   */
  async unsubscribe(eventType: string): Promise<void> {
    const handler = this.handlers.get(eventType);
    if (handler) {
      this.handlers.delete(eventType);
      systemLogger.info('Unsubscribed from event', { eventType, service: this.serviceName });
    }
  }

  /**
   * Disconnect from all transports
   */
  async disconnect(): Promise<void> {
    await Promise.all([this.kafkaAdapter.disconnect(), this.rabbitmqAdapter.disconnect()]);
    this.initialized = false;
    systemLogger.info('EventSubscriber disconnected', { service: this.serviceName });
  }

  /**
   * Check health of transports
   */
  async isHealthy(): Promise<{ kafka: boolean; rabbitmq: boolean }> {
    const [kafka, rabbitmq] = await Promise.all([this.kafkaAdapter.isHealthy(), this.rabbitmqAdapter.isHealthy()]);

    return { kafka, rabbitmq };
  }
}
