/**
 * Kafka Event Types for Soranix Platform
 */

export interface KafkaEvent {
  key: string; // For partitioning (userId, accountId, etc.)
  value: any; // Event payload
  headers?: Record<string, string>;
  partition?: number;
  timestamp?: string;
}

export interface SendOptions {
  acks?: -1 | 0 | 1; // -1 = all replicas, 0 = no ack, 1 = leader only
  timeout?: number; // Time to await response in ms
  compression?: 'gzip' | 'snappy' | 'lz4' | 'zstd' | 'none';
}

export interface TopicMessages {
  topic: string;
  messages: KafkaEvent[];
}

export interface KafkaMessage {
  topic: string;
  partition: number;
  key: string | null;
  value: any;
  headers: Record<string, string>;
  timestamp: string;
  offset: string;
}

export interface KafkaProducerConfig {
  clientId: string;
  brokers?: string[];
  compressionType?: 'gzip' | 'snappy' | 'lz4' | 'zstd';
  idempotent?: boolean;
  transactional?: boolean;
  allowAutoTopicCreation?: boolean;
  transactionTimeout?: number;
  maxInFlightRequests?: number;
  metadataMaxAge?: number;
  retry?: {
    maxRetryTime?: number;
    initialRetryTime?: number;
    factor?: number;
    multiplier?: number;
    retries?: number;
  };
}

export interface KafkaConsumerConfig {
  clientId: string;
  groupId: string;
  brokers?: string[];
  fromBeginning?: boolean; // Read from offset 0 (all history)

  // Session & heartbeat
  sessionTimeout?: number; // Timeout to detect failures (default: 30000ms)
  rebalanceTimeout?: number; // Max time coordinator waits for rejoin (default: 60000ms)
  heartbeatInterval?: number; // Expected time between heartbeats (default: 3000ms)

  // Metadata & topics
  metadataMaxAge?: number; // Force metadata refresh period (default: 300000ms)
  allowAutoTopicCreation?: boolean; // Allow topic creation (default: true)

  // Fetching
  maxBytesPerPartition?: number; // Max data per partition (default: 1048576 - 1MB)
  minBytes?: number; // Min data for fetch request (default: 1)
  maxBytes?: number; // Max bytes in response (default: 10485760 - 10MB)
  maxWaitTimeInMs?: number; // Max time to wait for data (default: 5000ms)

  // Advanced
  readUncommitted?: boolean; // Read uncommitted transactional messages (default: false)
  maxInFlightRequests?: number; // Max concurrent requests (default: null - no limit)
  rackId?: string; // Enable follower fetching from same rack (default: null)

  // Retry
  retry?: {
    maxRetryTime?: number;
    initialRetryTime?: number;
    factor?: number;
    multiplier?: number;
    retries?: number;
  };
}

export interface RunConfig {
  // Concurrency
  partitionsConsumedConcurrently?: number; // Process N partitions concurrently (default: 1)

  // Auto commit
  autoCommit?: boolean; // Enable auto commit (default: true)
  autoCommitInterval?: number; // Commit after N ms (default: null)
  autoCommitThreshold?: number; // Commit after N messages (default: null)

  // Message handler
  eachMessage?: (payload: EachMessagePayload) => Promise<void>;

  // Batch handler
  eachBatch?: (payload: EachBatchPayload) => Promise<void>;
  eachBatchAutoResolve?: boolean; // Auto-resolve batch processing (default: true)
}

export interface EachMessagePayload {
  topic: string;
  partition: number;
  message: {
    key: Buffer | null;
    value: Buffer | null;
    timestamp: string;
    size: number;
    attributes: number;
    offset: string;
    headers?: Record<string, Buffer>;
  };
  heartbeat: () => Promise<void>;
  pause: () => () => void; // Returns resume function
}

export interface EachBatchPayload {
  batch: {
    topic: string;
    partition: number;
    highWatermark: string;
    messages: Array<{
      key: Buffer | null;
      value: Buffer | null;
      timestamp: string;
      size: number;
      attributes: number;
      offset: string;
      headers?: Record<string, Buffer>;
    }>;
  };
  resolveOffset: (offset: string) => void;
  heartbeat: () => Promise<void>;
  commitOffsetsIfNecessary: (offsets?: Offsets) => Promise<void>;
  uncommittedOffsets: () => OffsetsByTopicPartition;
  isRunning: () => boolean;
  isStale: () => boolean;
  pause: () => () => void;
}

export interface Offsets {
  topics: Array<{
    topic: string;
    partitions: Array<{
      partition: number;
      offset: string;
    }>;
  }>;
}

export interface OffsetsByTopicPartition {
  topics: Array<{
    topic: string;
    partitions: Array<{
      partition: number;
      offset: string;
    }>;
  }>;
}

export interface TopicPartition {
  topic: string;
  partitions?: number[];
}

export interface TransactionOffsets {
  consumerGroupId: string;
  topics: Array<{
    topic: string;
    partitions: Array<{
      partition: number;
      offset: string;
    }>;
  }>;
}

export type MessageHandler = (payload: KafkaMessage) => Promise<void>;

export interface TopicConfig {
  name: string;
  numPartitions: number;
  replicationFactor: number;
  retentionMs: number; // How long to keep messages
  retentionBytes: number; // Max size per partition
  cleanupPolicy: 'delete' | 'compact';
  compressionType: 'snappy' | 'gzip' | 'lz4' | 'zstd';
  minInSyncReplicas: number;
}
