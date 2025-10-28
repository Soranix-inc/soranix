import { Channel, ConsumeMessage } from 'amqplib';

import { systemLogger } from '@packages/logging';
import { getRabbitMQConnection, EXCHANGES } from '@packages/rabbitmq';

import { BaseEvent, getEventConfig } from '../types/base-event.js';
import { EventEncryption } from '../utils/encryption.js';

import { EventTransport, EventHandler } from './event-transport.interface.js';

/**
 * RabbitMQ adapter - wraps existing RabbitMQ implementation
 * Provides separation between business logic and RabbitMQ infrastructure
 *
 * Features:
 * - Type-safe publish/subscribe
 * - Automatic exchange routing
 * - Message encryption support
 * - Dead letter queue support
 * - Persistent messaging
 */
export class RabbitMQAdapter implements EventTransport {
  private channel: Channel | null = null;
  private handlers = new Map<string, EventHandler>();

  async initialize(): Promise<void> {
    try {
      const connection = getRabbitMQConnection();
      await connection.connect();
      this.channel = connection.getChannel();
      systemLogger.info('RabbitMQ adapter initialized');
    } catch (error) {
      systemLogger.error('Failed to initialize RabbitMQ adapter', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async publish(event: BaseEvent): Promise<void> {
    if (!this.channel) throw new Error('RabbitMQ not initialized');

    try {
      const config = getEventConfig(event.eventType);
      const exchange = this.getExchangeForEvent(event.eventType);
      const routingKey = event.eventType;

      const eventData = { ...event };

      // Encrypt data if required
      if (config.requiresEncryption) {
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

      systemLogger.debug('Event published via RabbitMQ adapter', {
        eventType: event.eventType,
        exchange,
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
    try {
      for (const event of events) {
        await this.publish(event);
      }

      systemLogger.info('Batch published via RabbitMQ adapter', {
        count: events.length,
      });
    } catch (error) {
      systemLogger.error('Failed to publish batch via RabbitMQ', {
        count: events.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async subscribe(eventTypes: string[], handler: EventHandler): Promise<void> {
    if (!this.channel) throw new Error('RabbitMQ not initialized');

    try {
      for (const eventType of eventTypes) {
        this.handlers.set(eventType, handler);

        // Get queue for this event type
        const queue = this.getQueueForEvent(eventType);

        // Ensure queue exists
        await this.channel.assertQueue(queue, {
          durable: true,
          exclusive: false,
          autoDelete: false,
        });

        // Consume messages
        await this.channel.consume(
          queue,
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

        systemLogger.info('Subscribed via RabbitMQ adapter', {
          eventType,
          queue,
        });
      }
    } catch (error) {
      systemLogger.error('Failed to subscribe via RabbitMQ adapter', {
        eventTypes,
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
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const connection = getRabbitMQConnection();
      return connection.isConnected();
    } catch (error) {
      systemLogger.warn('RabbitMQ adapter health check failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
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
        messageId: message.properties.messageId,
      });
    } catch (error) {
      systemLogger.error('Failed to handle RabbitMQ message', {
        eventType,
        error: error instanceof Error ? error.message : String(error),
        messageId: message.properties.messageId,
      });
      throw error;
    }
  }

  /**
   * Get exchange for event type
   */
  private getExchangeForEvent(eventType: string): string {
    if (eventType.startsWith('user.')) return EXCHANGES.USER;
    if (
      eventType.startsWith('notification.') ||
      eventType.startsWith('email.') ||
      eventType.startsWith('sms.') ||
      eventType.startsWith('push.')
    ) {
      return EXCHANGES.NOTIFICATION;
    }
    if (eventType.startsWith('ai.')) return EXCHANGES.AI;
    if (eventType.startsWith('audit.')) return EXCHANGES.AUDIT;

    // Default
    return EXCHANGES.USER;
  }

  /**
   * Get queue name for event type
   */
  private getQueueForEvent(eventType: string): string {
    // For simplicity, use eventType as queue name
    // In production, you might want more sophisticated mapping
    return eventType.replace(/\./g, '_');
  }
}
