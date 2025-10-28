import {
  KafkaProducer,
  KafkaConsumer,
  KAFKA_TOPICS,
  type SendOptions,
  type RunConfig,
  type KafkaEvent,
  type TopicMessages,
  type KafkaProducerConfig,
  type KafkaConsumerConfig,
} from '@packages/kafka';
import { systemLogger } from '@packages/logging';

import { BaseEvent } from '../types/base-event.js';

import { EventTransport, EventHandler } from './event-transport.interface.js';

/**
 * Configuration options for Kafka adapter
 */
export interface KafkaAdapterConfig {
  // Producer configuration
  producer?: {
    idempotent?: boolean; // Default: true (prevent duplicates)
    maxInFlightRequests?: number; // Default: 5 (balance order/throughput)
    transactional?: boolean; // Default: false (enable transactions)
    compressionType?: 'gzip' | 'snappy' | 'lz4' | 'zstd'; // Default: 'snappy'
    allowAutoTopicCreation?: boolean; // Default: false
    retry?: {
      retries?: number;
      initialRetryTime?: number;
    };
  };

  // Consumer configuration
  consumer?: {
    fromBeginning?: boolean; // Default: false (start from latest)
    sessionTimeout?: number; // Default: 30000 (30s)
    rebalanceTimeout?: number; // Default: 60000 (60s)
    heartbeatInterval?: number; // Default: 3000 (3s)
    maxBytesPerPartition?: number; // Default: 1048576 (1MB)
    minBytes?: number; // Default: 1
    maxBytes?: number; // Default: 10485760 (10MB)
    maxWaitTimeInMs?: number; // Default: 5000 (5s)
    rackId?: string; // Default: undefined (no follower fetching)
    readUncommitted?: boolean; // Default: false
    retry?: {
      retries?: number;
      initialRetryTime?: number;
    };
  };

  // Run configuration (how consumer runs)
  run?: {
    partitionsConsumedConcurrently?: number; // Default: 1
    autoCommit?: boolean; // Default: true
    autoCommitInterval?: number; // Default: 5000
    autoCommitThreshold?: number; // Default: 100
    eachBatchAutoResolve?: boolean; // Default: true
  };

  // Send options (per-message config)
  send?: {
    acks?: -1 | 0 | 1; // Default: -1 (all replicas for financial events)
    timeout?: number; // Default: 30000 (30s)
    compression?: 'gzip' | 'snappy' | 'lz4' | 'zstd' | 'none'; // Default: 'snappy'
  };
}

/**
 * Kafka adapter - hides Kafka implementation details from business logic
 * Maps business events to Kafka topics with full type safety
 *
 * Features:
 * - Type-safe publish/subscribe
 * - Automatic topic routing
 * - Configurable per service
 * - Sensible defaults for financial events
 * - Full customization support
 */
export class KafkaAdapter implements EventTransport {
  private producer: KafkaProducer;
  private consumer: KafkaConsumer | null = null;
  private serviceName: string;
  private config: KafkaAdapterConfig;

  constructor(serviceName: string, config?: KafkaAdapterConfig) {
    this.serviceName = serviceName;
    this.config = config || {};

    // Producer configuration with defaults
    const producerConfig: KafkaProducerConfig = {
      clientId: `${serviceName}-producer`,
      idempotent: this.config.producer?.idempotent ?? true, // Default: true
      maxInFlightRequests: this.config.producer?.maxInFlightRequests ?? 5, // Default: 5
      transactional: this.config.producer?.transactional ?? false, // Default: false
      compressionType: this.config.producer?.compressionType ?? 'snappy', // Default: snappy
      allowAutoTopicCreation: this.config.producer?.allowAutoTopicCreation ?? false, // Default: false
      retry: this.config.producer?.retry ?? {
        retries: 8,
        initialRetryTime: 100,
      },
    };

    this.producer = new KafkaProducer(producerConfig);
  }

  async initialize(): Promise<void> {
    await this.producer.connect();
    systemLogger.info('Kafka adapter initialized', { service: this.serviceName });
  }

  async publish(event: BaseEvent): Promise<void> {
    try {
      const topic = this.getTopicForEvent(event.eventType);

      // Create properly typed Kafka event
      const kafkaEvent: KafkaEvent = {
        key: event.aggregateId, // Partition by aggregate (userId, accountId, etc.)
        value: event,
        headers: {
          eventType: event.eventType,
          eventId: event.eventId,
          timestamp: event.timestamp.toISOString(),
          correlationId: event.correlationId || '',
          version: event.version.toString(),
        },
      };

      // Send options (use configured values or defaults)
      const sendOptions: SendOptions = {
        acks: this.config.send?.acks ?? -1, // Default: -1 (all replicas)
        timeout: this.config.send?.timeout ?? 30000, // Default: 30s
        compression: this.config.send?.compression ?? 'snappy', // Default: snappy
      };

      await this.producer.publish(topic, kafkaEvent, sendOptions);

      systemLogger.debug('Event published via Kafka adapter', {
        eventType: event.eventType,
        eventId: event.eventId,
        topic,
        acks: sendOptions.acks,
      });
    } catch (error) {
      systemLogger.error('Failed to publish event via Kafka', {
        eventType: event.eventType,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async publishBatch(events: BaseEvent[]): Promise<void> {
    try {
      // Group events by topic
      const eventsByTopic = new Map<string, BaseEvent[]>();

      for (const event of events) {
        const topic = this.getTopicForEvent(event.eventType);
        if (!eventsByTopic.has(topic)) {
          eventsByTopic.set(topic, []);
        }
        eventsByTopic.get(topic)!.push(event);
      }

      // Convert to TopicMessages array (type-safe)
      const topicMessages: TopicMessages[] = Array.from(eventsByTopic.entries()).map(([topic, topicEvents]) => ({
        topic,
        messages: topicEvents.map((event) => ({
          key: event.aggregateId,
          value: event,
          headers: {
            eventType: event.eventType,
            eventId: event.eventId,
            timestamp: event.timestamp.toISOString(),
            correlationId: event.correlationId || '',
            version: event.version.toString(),
          },
        })),
      }));

      // Send options (use configured values or defaults)
      const sendOptions: SendOptions = {
        acks: this.config.send?.acks ?? -1, // Default: -1
        timeout: this.config.send?.timeout ?? 30000, // Default: 30s
        compression: this.config.send?.compression ?? 'snappy', // Default: snappy
      };

      // Use sendBatch for multi-topic publishing (more efficient)
      await this.producer.sendBatch(topicMessages, sendOptions);

      systemLogger.info('Batch published via Kafka adapter', {
        count: events.length,
        topics: Array.from(eventsByTopic.keys()),
        compression: sendOptions.compression,
      });
    } catch (error) {
      systemLogger.error('Failed to publish batch via Kafka', {
        count: events.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async subscribe(eventTypes: string[], handler: EventHandler): Promise<void> {
    try {
      if (!this.consumer) {
        // Consumer configuration with defaults
        const consumerConfig: KafkaConsumerConfig = {
          clientId: `${this.serviceName}-consumer`,
          groupId: `${this.serviceName}-group`,
          fromBeginning: this.config.consumer?.fromBeginning ?? false, // Default: false (latest)

          // Session & heartbeat (use config or defaults)
          sessionTimeout: this.config.consumer?.sessionTimeout ?? 30000, // Default: 30s
          rebalanceTimeout: this.config.consumer?.rebalanceTimeout ?? 60000, // Default: 60s
          heartbeatInterval: this.config.consumer?.heartbeatInterval ?? 3000, // Default: 3s

          // Fetching configuration
          maxBytesPerPartition: this.config.consumer?.maxBytesPerPartition ?? 1048576, // Default: 1MB
          minBytes: this.config.consumer?.minBytes ?? 1,
          maxBytes: this.config.consumer?.maxBytes ?? 10485760, // Default: 10MB
          maxWaitTimeInMs: this.config.consumer?.maxWaitTimeInMs ?? 5000, // Default: 5s

          // Advanced options
          rackId: this.config.consumer?.rackId, // Default: undefined (no follower fetching)
          readUncommitted: this.config.consumer?.readUncommitted ?? false, // Default: false

          // Retry configuration
          retry: this.config.consumer?.retry ?? {
            retries: 5,
            initialRetryTime: 100,
          },
        };

        this.consumer = new KafkaConsumer(consumerConfig);
        await this.consumer.connect();
      }

      // Map event types to topics
      const topics = [...new Set(eventTypes.map((et) => this.getTopicForEvent(et)))];

      // Subscribe to topics (use configured fromBeginning)
      const fromBeginning = this.config.consumer?.fromBeginning ?? false;
      await this.consumer.subscribe(topics, fromBeginning);

      // Run configuration (use config or defaults)
      const runConfig: RunConfig = {
        partitionsConsumedConcurrently: this.config.run?.partitionsConsumedConcurrently ?? 1, // Default: 1
        autoCommit: this.config.run?.autoCommit ?? true, // Default: true
        autoCommitInterval: this.config.run?.autoCommitInterval ?? 5000, // Default: 5s
        autoCommitThreshold: this.config.run?.autoCommitThreshold ?? 100, // Default: 100
        eachBatchAutoResolve: this.config.run?.eachBatchAutoResolve ?? true, // Default: true

        eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
          try {
            // Parse message value
            const value = JSON.parse(message.value?.toString() || '{}');
            const event = value as BaseEvent;

            // Call handler
            await handler(event, event.data);

            // Send heartbeat for long-running handlers
            await heartbeat();

            systemLogger.debug('Kafka message processed', {
              topic,
              partition,
              offset: message.offset,
              eventType: event.eventType,
            });
          } catch (error) {
            systemLogger.error('Failed to process Kafka message', {
              topic,
              partition,
              offset: message.offset,
              error: error instanceof Error ? error.message : String(error),
            });
            throw error;
          }
        },
      };

      // Run consumer with type-safe config
      await this.consumer.run(runConfig);

      systemLogger.info('Subscribed via Kafka adapter', {
        service: this.serviceName,
        eventTypes,
        topics,
        fromBeginning,
        partitionsConsumedConcurrently: runConfig.partitionsConsumedConcurrently,
        autoCommitInterval: runConfig.autoCommitInterval,
        autoCommitThreshold: runConfig.autoCommitThreshold,
      });
    } catch (error) {
      systemLogger.error('Failed to subscribe via Kafka adapter', {
        eventTypes,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.producer.disconnect();
      if (this.consumer) {
        await this.consumer.disconnect();
      }
      systemLogger.info('Kafka adapter disconnected', { service: this.serviceName });
    } catch (error) {
      systemLogger.error('Failed to disconnect Kafka adapter', {
        service: this.serviceName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const producerHealthy = this.producer.isProducerConnected();
      const consumerHealthy = this.consumer?.isConsumerConnected() ?? true; // True if no consumer

      return producerHealthy && consumerHealthy;
    } catch (error) {
      systemLogger.warn('Kafka adapter health check failed', {
        service: this.serviceName,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Route event type to Kafka topic
   * This mapping ensures events go to the correct Kafka topic
   */
  private getTopicForEvent(eventType: string): string {
    // Financial events (7-year retention)
    if (eventType.startsWith('payment.')) return KAFKA_TOPICS.PAYMENTS;
    if (eventType.startsWith('transfer.')) return KAFKA_TOPICS.TRANSFERS;
    if (eventType.startsWith('deposit.')) return KAFKA_TOPICS.DEPOSITS;
    if (eventType.startsWith('withdrawal.')) return KAFKA_TOPICS.WITHDRAWALS;
    if (eventType.startsWith('bill.')) return KAFKA_TOPICS.BILLS;
    if (eventType.startsWith('exchange.')) return KAFKA_TOPICS.EXCHANGE;
    if (eventType.startsWith('ledger.')) return KAFKA_TOPICS.LEDGER_ENTRIES;
    if (eventType.startsWith('balance.')) return KAFKA_TOPICS.BALANCE_UPDATES;

    // Audit & compliance
    if (eventType.startsWith('audit.')) return KAFKA_TOPICS.AUDIT_TRAIL;
    if (eventType.startsWith('compliance.')) return KAFKA_TOPICS.COMPLIANCE_EVENTS;

    // Default to general financial transactions
    return KAFKA_TOPICS.FINANCIAL_TRANSACTIONS;
  }
}
