import { Channel, ConsumeMessage } from 'amqplib';

import { systemLogger } from '@packages/logging';

import { BaseEvent, getEventConfig } from '../../types/base-event.js';
import { EventEncryption } from '../../utils/encryption.js';
import type { ResolvedEventConfig, ResolvedRabbitMQConfig } from '../../transports/types.js';
import { getRabbitMQConnection } from './connection.js';
import { EXCHANGES } from '../../transports/constants.js';
import { EventTransport, EventHandler } from '../event-transport.interface.js';

/**
 * RabbitMQ Adapter
 * Handles all RabbitMQ operations using registry-based configurations
 */
export class RabbitMQAdapter implements EventTransport {
  private channel: Channel | null = null;
  private handlers = new Map<string, EventHandler>();
  private serviceName: string;
  private resolvedConfigs: Map<string, ResolvedEventConfig> = new Map();
  private exchangesSetUp = new Set<string>();

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Setup RabbitMQ infrastructure based on resolved configs
   */
  async setup(resolvedConfigs: Map<string, ResolvedEventConfig>): Promise<void> {
    this.resolvedConfigs = resolvedConfigs;

    try {
      const connection = getRabbitMQConnection();
      await connection.connect();
      this.channel = connection.getChannel();

      // Set up exchanges (deduplicated)
      await this.setupExchanges();

      // Set up queues and bindings
      await this.setupQueuesAndBindings();

      systemLogger.info('RabbitMQ adapter setup completed', { service: this.serviceName });
    } catch (error) {
      systemLogger.error('Failed to setup RabbitMQ adapter', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Set up exchanges from resolved configs
   */
  private async setupExchanges(): Promise<void> {
    if (!this.channel) throw new Error('RabbitMQ channel not available');

    const exchangesToCreate = new Set<string>();

    // Collect all unique exchanges from configs
    for (const config of this.resolvedConfigs.values()) {
      if (config.rabbitmq?.exchange) {
        exchangesToCreate.add(config.rabbitmq.exchange);
      }
    }

    // Always include dead letter exchange
    exchangesToCreate.add(EXCHANGES.DEAD_LETTER);

    // Create exchanges
    for (const exchangeName of exchangesToCreate) {
      if (this.exchangesSetUp.has(exchangeName)) continue;

      try {
        await this.channel.assertExchange(exchangeName, 'topic', {
          durable: true,
          arguments:
            exchangeName === EXCHANGES.DEAD_LETTER
              ? { 'x-message-ttl': 86400000 } // 24 hours for DLX
              : {
                  'x-message-ttl': 604800000, // 7 days
                  'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
                },
        });
        this.exchangesSetUp.add(exchangeName);
        systemLogger.debug(`Exchange created: ${exchangeName}`);
      } catch (error) {
        systemLogger.error(`Failed to create exchange: ${exchangeName}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  }

  /**
   * Set up queues and bindings from resolved configs
   */
  private async setupQueuesAndBindings(): Promise<void> {
    if (!this.channel) throw new Error('RabbitMQ channel not available');

    for (const [eventType, config] of this.resolvedConfigs.entries()) {
      if (!config.rabbitmq) continue;

      const { exchange, routingKey, queue } = config.rabbitmq;

      try {
        // Create queue
        await this.channel.assertQueue(queue.name, {
          durable: queue.durable,
          exclusive: queue.exclusive,
          autoDelete: queue.autoDelete,
          arguments: queue.arguments,
        });

        // Bind queue to exchange
        await this.channel.bindQueue(queue.name, exchange, routingKey);

        systemLogger.debug(`Queue created and bound: ${queue.name} -> ${exchange} (${routingKey})`);
      } catch (error) {
        systemLogger.error(`Failed to setup queue/binding for ${eventType}`, {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    }
  }

  async initialize(): Promise<void> {
    // Already handled by setup()
  }

  async publish(event: BaseEvent): Promise<void> {
    if (!this.channel) throw new Error('RabbitMQ not initialized');

    const config = this.resolvedConfigs.get(event.eventType);
    if (!config?.rabbitmq) {
      throw new Error(`No RabbitMQ config found for event type: ${event.eventType}`);
    }

    try {
      const eventConfig = getEventConfig(event.eventType);
      const { exchange, routingKey } = config.rabbitmq;

      const eventData = { ...event };

      // Encrypt data if required
      if (eventConfig.requiresEncryption) {
        eventData.data = EventEncryption.encrypt(JSON.stringify(eventData.data));
        eventData.encrypted = true;
      }

      const message = Buffer.from(JSON.stringify(eventData));

      const published = this.channel.publish(exchange, routingKey, message, {
        persistent: true,
        messageId: event.eventId,
        timestamp: event.timestamp.getTime(),
        correlationId: event.correlationId,
        headers: {
          eventType: event.eventType,
          aggregateId: event.aggregateId,
          version: event.version,
          encrypted: eventData.encrypted,
        },
      });

      if (!published) {
        throw new Error('Failed to publish message - channel buffer full');
      }

      systemLogger.debug('Event published via RabbitMQ', {
        eventType: event.eventType,
        exchange,
        routingKey,
      });
    } catch (error) {
      systemLogger.error('Failed to publish event via RabbitMQ', {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async publishBatch(events: BaseEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event);
    }
  }

  async subscribe(eventTypes: string[], handler: EventHandler): Promise<void> {
    if (!this.channel) throw new Error('RabbitMQ not initialized');

    try {
      for (const eventType of eventTypes) {
        this.handlers.set(eventType, handler);

        const config = this.resolvedConfigs.get(eventType);
        if (!config?.rabbitmq) {
          systemLogger.warn(`No RabbitMQ config found for event type: ${eventType}, skipping subscription`);
          continue;
        }

        const queueName = config.rabbitmq.queue.name;

        // Consume messages
        await this.channel.consume(
          queueName,
          async (message: ConsumeMessage | null) => {
            if (!message) return;

            try {
              await this.handleMessage(message, eventType);

              if (this.channel) {
                this.channel.ack(message);
              }
            } catch (error) {
              systemLogger.error('Error processing RabbitMQ message', {
                eventType,
                error: error instanceof Error ? error.message : String(error),
                messageId: message.properties.messageId,
              });

              // Reject message and requeue for retry
              if (this.channel) {
                this.channel.nack(message, false, true);
              }
            }
          },
          {
            noAck: false,
            exclusive: false,
          }
        );

        systemLogger.info('Subscribed to RabbitMQ event', {
          eventType,
          queue: queueName,
        });
      }
    } catch (error) {
      systemLogger.error('Failed to subscribe via RabbitMQ', {
        eventTypes,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async handleMessage(message: ConsumeMessage, eventType: string): Promise<void> {
    try {
      const messageContent = message.content.toString();
      const event: BaseEvent = JSON.parse(messageContent);

      // Decrypt data if encrypted
      let eventData = event.data;
      if (event.encrypted && EventEncryption.isEncrypted(eventData)) {
        eventData = JSON.parse(EventEncryption.decrypt(eventData));
      }

      const handler = this.handlers.get(eventType);
      if (!handler) {
        systemLogger.warn('No handler found for event type', { eventType });
        return;
      }

      await handler(event, eventData);

      systemLogger.debug('RabbitMQ message processed', {
        eventType,
        eventId: event.eventId,
      });
    } catch (error) {
      systemLogger.error('Failed to handle RabbitMQ message', {
        eventType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      const connection = getRabbitMQConnection();
      await connection.disconnect();
      this.channel = null;
      systemLogger.info('RabbitMQ adapter disconnected');
    } catch (error) {
      systemLogger.error('Failed to disconnect RabbitMQ adapter', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const connection = getRabbitMQConnection();
      return connection.isConnected();
    } catch (error) {
      return false;
    }
  }
}
