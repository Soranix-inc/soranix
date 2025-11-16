import { TopicConfig } from '../types/kafka-types.js';

/**
 * Kafka Topics for Soranix Platform
 * Financial events require 7-year retention for regulatory compliance
 */

export const KAFKA_TOPICS = {
  // Financial Domain - Long retention (7 years)
  FINANCIAL_TRANSACTIONS: 'financial.transactions',
  LEDGER_ENTRIES: 'financial.ledger.entries',
  BALANCE_UPDATES: 'financial.balance.updates',

  // Payment events
  PAYMENTS: 'financial.payments',
  TRANSFERS: 'financial.transfers',
  WITHDRAWALS: 'financial.withdrawals',
  DEPOSITS: 'financial.deposits',

  // Bills & Exchange
  BILLS: 'financial.bills',
  EXCHANGE: 'financial.exchange',

  // Audit Trail - Very long retention
  AUDIT_TRAIL: 'audit.trail',
  COMPLIANCE_EVENTS: 'compliance.events',

  // Dead Letter Topic (for failed messages)
  DEAD_LETTER: 'dead.letter.queue',
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

/**
 * Topic configurations with retention and replication settings
 */
export const TOPIC_CONFIGS: Record<string, TopicConfig> = {
  // Financial transactions - CRITICAL
  [KAFKA_TOPICS.FINANCIAL_TRANSACTIONS]: {
    name: KAFKA_TOPICS.FINANCIAL_TRANSACTIONS,
    numPartitions: 6, // High throughput
    replicationFactor: 1, // Dev: 1, Prod: 3
    retentionMs: 220752000000, // 7 years (7 * 365 * 24 * 60 * 60 * 1000)
    retentionBytes: -1, // Unlimited
    cleanupPolicy: 'delete',
    compressionType: 'snappy', // Fast compression
    minInSyncReplicas: 1, // Dev: 1, Prod: 2
  },

  // Ledger entries - CRITICAL
  [KAFKA_TOPICS.LEDGER_ENTRIES]: {
    name: KAFKA_TOPICS.LEDGER_ENTRIES,
    numPartitions: 6,
    replicationFactor: 1,
    retentionMs: 220752000000, // 7 years
    retentionBytes: -1, // Unlimited
    cleanupPolicy: 'delete',
    compressionType: 'snappy',
    minInSyncReplicas: 1,
  },

  // Balance updates - Use compaction (only keep latest balance)
  [KAFKA_TOPICS.BALANCE_UPDATES]: {
    name: KAFKA_TOPICS.BALANCE_UPDATES,
    numPartitions: 3,
    replicationFactor: 1,
    retentionMs: 220752000000, // 7 years
    retentionBytes: -1,
    cleanupPolicy: 'compact', // Keep only latest per key
    compressionType: 'snappy',
    minInSyncReplicas: 1,
  },

  // Payments
  [KAFKA_TOPICS.PAYMENTS]: {
    name: KAFKA_TOPICS.PAYMENTS,
    numPartitions: 6,
    replicationFactor: 1,
    retentionMs: 220752000000, // 7 years
    retentionBytes: -1,
    cleanupPolicy: 'delete',
    compressionType: 'snappy',
    minInSyncReplicas: 1,
  },

  // Transfers
  [KAFKA_TOPICS.TRANSFERS]: {
    name: KAFKA_TOPICS.TRANSFERS,
    numPartitions: 6,
    replicationFactor: 1,
    retentionMs: 220752000000, // 7 years
    retentionBytes: -1,
    cleanupPolicy: 'delete',
    compressionType: 'snappy',
    minInSyncReplicas: 1,
  },

  // Withdrawals
  [KAFKA_TOPICS.WITHDRAWALS]: {
    name: KAFKA_TOPICS.WITHDRAWALS,
    numPartitions: 6,
    replicationFactor: 1,
    retentionMs: 220752000000, // 7 years
    retentionBytes: -1,
    cleanupPolicy: 'delete',
    compressionType: 'snappy',
    minInSyncReplicas: 1,
  },

  // Deposits
  [KAFKA_TOPICS.DEPOSITS]: {
    name: KAFKA_TOPICS.DEPOSITS,
    numPartitions: 6,
    replicationFactor: 1,
    retentionMs: 220752000000, // 7 years
    retentionBytes: -1,
    cleanupPolicy: 'delete',
    compressionType: 'snappy',
    minInSyncReplicas: 1,
  },

  // Bills
  [KAFKA_TOPICS.BILLS]: {
    name: KAFKA_TOPICS.BILLS,
    numPartitions: 6,
    replicationFactor: 1,
    retentionMs: 220752000000, // 7 years
    retentionBytes: -1,
    cleanupPolicy: 'delete',
    compressionType: 'snappy',
    minInSyncReplicas: 1,
  },

  // Exchange
  [KAFKA_TOPICS.EXCHANGE]: {
    name: KAFKA_TOPICS.EXCHANGE,
    numPartitions: 6,
    replicationFactor: 1,
    retentionMs: 220752000000, // 7 years
    retentionBytes: -1,
    cleanupPolicy: 'delete',
    compressionType: 'snappy',
    minInSyncReplicas: 1,
  },

  // Audit trail - VERY CRITICAL
  [KAFKA_TOPICS.AUDIT_TRAIL]: {
    name: KAFKA_TOPICS.AUDIT_TRAIL,
    numPartitions: 3,
    replicationFactor: 1,
    retentionMs: 220752000000, // 7 years
    retentionBytes: -1,
    cleanupPolicy: 'delete',
    compressionType: 'gzip', // Better compression for logs
    minInSyncReplicas: 1,
  },

  // Compliance events
  [KAFKA_TOPICS.COMPLIANCE_EVENTS]: {
    name: KAFKA_TOPICS.COMPLIANCE_EVENTS,
    numPartitions: 3,
    replicationFactor: 1,
    retentionMs: 220752000000, // 7 years
    retentionBytes: -1,
    cleanupPolicy: 'delete',
    compressionType: 'gzip',
    minInSyncReplicas: 1,
  },

  // Dead letter queue
  [KAFKA_TOPICS.DEAD_LETTER]: {
    name: KAFKA_TOPICS.DEAD_LETTER,
    numPartitions: 1,
    replicationFactor: 1,
    retentionMs: 604800000, // 7 days
    retentionBytes: -1,
    cleanupPolicy: 'delete',
    compressionType: 'snappy',
    minInSyncReplicas: 1,
  },
};

/**
 * Get topic config by topic name
 */
export function getTopicConfig(topic: string): TopicConfig | undefined {
  return TOPIC_CONFIGS[topic];
}

/**
 * Get all topic names
 */
export function getAllTopicNames(): string[] {
  return Object.values(KAFKA_TOPICS);
}

