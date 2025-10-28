import { Kafka, Producer, ProducerRecord, RecordMetadata, CompressionTypes, Partitioners } from 'kafkajs';

import { systemLogger } from '@packages/logging';

import { KafkaProducerConfig, KafkaEvent, SendOptions, TopicMessages } from '../types/kafka-types.js';

export class KafkaProducer {
  private kafka: Kafka;
  private producer: Producer;
  private isConnected = false;

  constructor(config: KafkaProducerConfig) {
    const brokers = config.brokers || [process.env.KAFKA_BROKERS || 'localhost:9092'];

    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers,
      retry: config.retry || {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.producer = this.kafka.producer({
      // Use DefaultPartitioner for compatibility with Java clients (co-partitioning)
      createPartitioner: Partitioners.DefaultPartitioner,
      allowAutoTopicCreation: config.allowAutoTopicCreation ?? false, // Topics must be created explicitly by default
      transactionTimeout: config.transactionTimeout || 60000, // 60 seconds
      idempotent: config.idempotent ?? true, // Prevent duplicates
      transactionalId: config.transactional ? config.clientId : undefined,
      maxInFlightRequests: config.maxInFlightRequests || null, // No limit by default
      retry: config.retry || {
        initialRetryTime: 100,
        retries: 8,
      },
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.producer.connect();
      this.isConnected = true;
      systemLogger.info('Kafka producer connected');
    } catch (error) {
      systemLogger.error('Failed to connect Kafka producer', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.producer.disconnect();
      this.isConnected = false;
      systemLogger.info('Kafka producer disconnected');
    } catch (error) {
      systemLogger.error('Failed to disconnect Kafka producer', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Publish a single event to Kafka
   */
  async publish(topic: string, event: KafkaEvent, options?: SendOptions): Promise<RecordMetadata[]> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const record: ProducerRecord = {
        topic,
        messages: [
          {
            key: event.key,
            value: JSON.stringify(event.value),
            headers: {
              timestamp: new Date().toISOString(),
              eventType: event.value.eventType || 'unknown',
              ...event.headers,
            },
            partition: event.partition,
            timestamp: event.timestamp,
          },
        ],
        acks: options?.acks ?? -1, // Default: all replicas must acknowledge
        timeout: options?.timeout ?? 30000, // Default: 30 seconds
        compression: options?.compression ? this.getCompressionType(options.compression) : undefined,
      };

      const result = await this.producer.send(record);

      systemLogger.info('Event published to Kafka', {
        topic,
        key: event.key,
        partition: result[0].partition,
        offset: result[0].offset,
        acks: options?.acks ?? -1,
      });

      return result;
    } catch (error) {
      systemLogger.error('Failed to publish event to Kafka', {
        topic,
        key: event.key,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Helper to convert compression string to CompressionTypes enum
   */
  private getCompressionType(compression: string): CompressionTypes | undefined {
    switch (compression) {
      case 'gzip':
        return CompressionTypes.GZIP;
      case 'snappy':
        return CompressionTypes.Snappy;
      case 'lz4':
        return CompressionTypes.LZ4;
      case 'zstd':
        return CompressionTypes.ZSTD;
      case 'none':
        return CompressionTypes.None;
      default:
        return undefined;
    }
  }

  /**
   * Publish multiple events to a single topic
   */
  async publishBatch(topic: string, events: KafkaEvent[], options?: SendOptions): Promise<RecordMetadata[]> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const record: ProducerRecord = {
        topic,
        messages: events.map((event) => ({
          key: event.key,
          value: JSON.stringify(event.value),
          headers: {
            timestamp: new Date().toISOString(),
            eventType: event.value.eventType || 'unknown',
            ...event.headers,
          },
          partition: event.partition,
          timestamp: event.timestamp,
        })),
        acks: options?.acks ?? -1,
        timeout: options?.timeout ?? 30000,
        compression: options?.compression ? this.getCompressionType(options.compression) : undefined,
      };

      const result = await this.producer.send(record);

      systemLogger.info('Batch published to Kafka', {
        topic,
        count: events.length,
        partitions: result.map((r) => r.partition),
      });

      return result;
    } catch (error) {
      systemLogger.error('Failed to publish batch to Kafka', {
        topic,
        count: events.length,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Publish to multiple topics at once (as per KafkaJS sendBatch)
   * Useful for migrating between topics or publishing related events
   */
  async sendBatch(topicMessages: TopicMessages[], options?: SendOptions): Promise<RecordMetadata[]> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const batch = topicMessages.map((tm) => ({
        topic: tm.topic,
        messages: tm.messages.map((event) => ({
          key: event.key,
          value: JSON.stringify(event.value),
          headers: {
            timestamp: new Date().toISOString(),
            eventType: event.value.eventType || 'unknown',
            ...event.headers,
          },
          partition: event.partition,
          timestamp: event.timestamp,
        })),
      }));

      const result = await this.producer.sendBatch({
        topicMessages: batch,
        acks: options?.acks ?? -1,
        timeout: options?.timeout ?? 30000,
        compression: options?.compression ? this.getCompressionType(options.compression) : undefined,
      });

      systemLogger.info('Multi-topic batch published to Kafka', {
        topics: topicMessages.map((tm) => tm.topic),
        totalMessages: topicMessages.reduce((sum, tm) => sum + tm.messages.length, 0),
      });

      return result;
    } catch (error) {
      systemLogger.error('Failed to publish multi-topic batch to Kafka', {
        topics: topicMessages.map((tm) => tm.topic),
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Start a new transaction
   * Returns a transaction object with send(), sendBatch(), sendOffsets(), commit(), abort()
   *
   * Requirements for EoS (Exactly-Once Semantics):
   * - Producer must have transactionalId set
   * - maxInFlightRequests: 1
   * - idempotent: true
   * - acks: -1 (all replicas)
   */
  async transaction() {
    const kafkaTransaction = await this.producer.transaction();

    return {
      /**
       * Send messages within transaction
       */
      send: async (topic: string, event: KafkaEvent, options?: SendOptions) => {
        await kafkaTransaction.send({
          topic,
          messages: [
            {
              key: event.key,
              value: JSON.stringify(event.value),
              headers: {
                timestamp: new Date().toISOString(),
                eventType: event.value.eventType || 'unknown',
                ...event.headers,
              },
              partition: event.partition,
              timestamp: event.timestamp,
            },
          ],
          acks: options?.acks ?? -1,
          timeout: options?.timeout ?? 30000,
          compression: options?.compression ? this.getCompressionType(options.compression) : undefined,
        });

        systemLogger.debug('Message sent in transaction', {
          topic,
          key: event.key,
        });
      },

      /**
       * Send batch to single topic within transaction
       */
      sendBatch: async (topic: string, events: KafkaEvent[], options?: SendOptions) => {
        await kafkaTransaction.send({
          topic,
          messages: events.map((event) => ({
            key: event.key,
            value: JSON.stringify(event.value),
            headers: {
              timestamp: new Date().toISOString(),
              eventType: event.value.eventType || 'unknown',
              ...event.headers,
            },
            partition: event.partition,
            timestamp: event.timestamp,
          })),
          acks: options?.acks ?? -1,
          timeout: options?.timeout ?? 30000,
          compression: options?.compression ? this.getCompressionType(options.compression) : undefined,
        });

        systemLogger.debug('Batch sent in transaction', {
          topic,
          count: events.length,
        });
      },

      /**
       * Send to multiple topics within transaction
       */
      sendToMultipleTopics: async (topicMessages: TopicMessages[], options?: SendOptions) => {
        for (const { topic, messages } of topicMessages) {
          await kafkaTransaction.send({
            topic,
            messages: messages.map((event) => ({
              key: event.key,
              value: JSON.stringify(event.value),
              headers: {
                timestamp: new Date().toISOString(),
                eventType: event.value.eventType || 'unknown',
                ...event.headers,
              },
            })),
            acks: options?.acks ?? -1,
            timeout: options?.timeout ?? 30000,
            compression: options?.compression ? this.getCompressionType(options.compression) : undefined,
          });
        }

        systemLogger.debug('Multi-topic sent in transaction', {
          topics: topicMessages.map((tm) => tm.topic),
        });
      },

      /**
       * Send consumer offsets within transaction (for consume-transform-produce)
       * This ensures exactly-once processing by committing consumer offsets atomically
       */
      sendOffsets: async (offsets: {
        consumerGroupId: string;
        topics: Array<{
          topic: string;
          partitions: Array<{ partition: number; offset: string }>;
        }>;
      }) => {
        await kafkaTransaction.sendOffsets(offsets);

        systemLogger.debug('Offsets sent in transaction', {
          consumerGroupId: offsets.consumerGroupId,
          topics: offsets.topics.map((t) => t.topic),
        });
      },

      /**
       * Commit the transaction
       */
      commit: async () => {
        await kafkaTransaction.commit();
        systemLogger.info('Transaction committed');
      },

      /**
       * Abort the transaction (rollback)
       */
      abort: async () => {
        await kafkaTransaction.abort();
        systemLogger.warn('Transaction aborted');
      },
    };
  }

  /**
   * Check if producer is connected
   */
  isProducerConnected(): boolean {
    return this.isConnected;
  }
}
