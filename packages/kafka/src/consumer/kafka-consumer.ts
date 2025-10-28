import { Kafka, Consumer } from 'kafkajs';

import { systemLogger } from '@packages/logging';

import { KafkaConsumerConfig, MessageHandler, RunConfig, TopicPartition } from '../types/kafka-types.js';

export class KafkaConsumer {
  private kafka: Kafka;
  private consumer: Consumer;
  private isConnected = false;
  private handlers = new Map<string, MessageHandler>();

  constructor(config: KafkaConsumerConfig) {
    const brokers = config.brokers || [process.env.KAFKA_BROKERS || 'localhost:9092'];

    this.kafka = new Kafka({
      clientId: config.clientId,
      brokers,
      retry: config.retry || {
        initialRetryTime: 100,
        retries: 8,
      },
    });

    this.consumer = this.kafka.consumer({
      groupId: config.groupId,

      // Session & heartbeat
      sessionTimeout: config.sessionTimeout || 30000,
      rebalanceTimeout: config.rebalanceTimeout || 60000,
      heartbeatInterval: config.heartbeatInterval || 3000,

      // Metadata & topics
      metadataMaxAge: config.metadataMaxAge || 300000,
      allowAutoTopicCreation: config.allowAutoTopicCreation ?? true,

      // Fetching
      maxBytesPerPartition: config.maxBytesPerPartition || 1048576, // 1MB
      minBytes: config.minBytes || 1,
      maxBytes: config.maxBytes || 10485760, // 10MB
      maxWaitTimeInMs: config.maxWaitTimeInMs || 5000,

      // Advanced
      readUncommitted: config.readUncommitted || false,
      maxInFlightRequests: config.maxInFlightRequests ?? undefined,
      rackId: config.rackId ?? undefined,

      // Retry
      retry: config.retry || {
        initialRetryTime: 100,
        retries: 5,
      },
    });
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.consumer.connect();
      this.isConnected = true;
      systemLogger.info('Kafka consumer connected');
    } catch (error) {
      systemLogger.error('Failed to connect Kafka consumer', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.consumer.disconnect();
      this.isConnected = false;
      systemLogger.info('Kafka consumer disconnected');
    } catch (error) {
      systemLogger.error('Failed to disconnect Kafka consumer', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Subscribe to topics (supports string arrays and regex)
   */
  async subscribe(topics: string[] | RegExp[], fromBeginning = false): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      // KafkaJS expects { topics: string[] | RegExp[], fromBeginning?: boolean }
      await this.consumer.subscribe({
        topics: topics as any, // KafkaJS accepts both string[] and RegExp[]
        fromBeginning,
      });

      systemLogger.info('Subscribed to Kafka topics', {
        topics: topics.map((t) => (t instanceof RegExp ? t.source : t)),
        fromBeginning,
      });
    } catch (error) {
      systemLogger.error('Failed to subscribe to Kafka topics', {
        topics,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Start consuming messages with full KafkaJS run options
   */
  async run(config?: RunConfig): Promise<void> {
    try {
      await this.consumer.run({
        partitionsConsumedConcurrently: config?.partitionsConsumedConcurrently || 1,
        autoCommit: config?.autoCommit ?? true,
        autoCommitInterval: config?.autoCommitInterval ?? undefined,
        autoCommitThreshold: config?.autoCommitThreshold ?? undefined,
        eachBatchAutoResolve: config?.eachBatchAutoResolve ?? true,

        // Use either eachMessage or eachBatch (KafkaJS native types)
        eachMessage: config?.eachMessage as any,
        eachBatch: config?.eachBatch as any,
      });

      systemLogger.info('Kafka consumer started', {
        partitionsConsumedConcurrently: config?.partitionsConsumedConcurrently || 1,
        autoCommit: config?.autoCommit ?? true,
      });
    } catch (error) {
      systemLogger.error('Kafka consumer error', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Seek to specific offset (for replay)
   */
  async seekToOffset(topic: string, partition: number, offset: string): Promise<void> {
    try {
      await this.consumer.seek({
        topic,
        partition,
        offset,
      });

      systemLogger.info('Seeked to offset', { topic, partition, offset });
    } catch (error) {
      systemLogger.error('Failed to seek to offset', {
        topic,
        partition,
        offset,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Seek to beginning (read all history)
   */
  async seekToBeginning(topic: string): Promise<void> {
    try {
      // Get topic partitions
      const admin = this.kafka.admin();
      await admin.connect();

      const metadata = await admin.fetchTopicMetadata({ topics: [topic] });
      const topicMetadata = metadata.topics.find((t) => t.name === topic);

      if (topicMetadata) {
        for (const partition of topicMetadata.partitions) {
          await this.consumer.seek({
            topic,
            partition: partition.partitionId,
            offset: '0',
          });
        }
      }

      await admin.disconnect();

      systemLogger.info('Seeked to beginning', { topic });
    } catch (error) {
      systemLogger.error('Failed to seek to beginning', {
        topic,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Pause consumption for specific topics/partitions
   * Supports both topic-level and partition-level pausing
   */
  pause(topicPartitions: TopicPartition[]): void {
    try {
      this.consumer.pause(topicPartitions);
      systemLogger.info('Consumer paused', { topicPartitions });
    } catch (error) {
      systemLogger.error('Failed to pause consumer', {
        topicPartitions,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Resume consumption for specific topics/partitions
   */
  resume(topicPartitions: TopicPartition[]): void {
    try {
      this.consumer.resume(topicPartitions);
      systemLogger.info('Consumer resumed', { topicPartitions });
    } catch (error) {
      systemLogger.error('Failed to resume consumer', {
        topicPartitions,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get list of paused topic-partitions
   */
  paused(): TopicPartition[] {
    return this.consumer.paused();
  }

  /**
   * Manually commit offsets
   * Ignores all autoCommit settings - lowest level commit
   */
  async commitOffsets(
    offsets: Array<{
      topic: string;
      partition: number;
      offset: string;
    }>
  ): Promise<void> {
    try {
      await this.consumer.commitOffsets(offsets);
      systemLogger.info('Offsets committed manually', {
        count: offsets.length,
      });
    } catch (error) {
      systemLogger.error('Failed to commit offsets', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Describe consumer group
   * Returns metadata for the configured consumer group
   */
  async describeGroup(): Promise<{
    groupId: string;
    members: Array<{
      clientHost: string;
      clientId: string;
      memberAssignment: Buffer;
      memberId: string;
      memberMetadata: Buffer;
    }>;
    protocol: string;
    protocolType: string;
    state: string;
  }> {
    try {
      const groupDescription = await this.consumer.describeGroup();
      systemLogger.info('Consumer group described', {
        groupId: groupDescription.groupId,
        state: groupDescription.state,
        members: groupDescription.members.length,
      });
      return groupDescription;
    } catch (error) {
      systemLogger.error('Failed to describe consumer group', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if consumer is connected
   */
  isConsumerConnected(): boolean {
    return this.isConnected;
  }
}
