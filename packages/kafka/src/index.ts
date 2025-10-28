/**
 * @packages/kafka - Apache Kafka integration for Soranix Platform
 * Provides event streaming capabilities with KRaft mode (no Zookeeper)
 */

// Producer
export { KafkaProducer } from './producer/kafka-producer.js';

// Consumer
export { KafkaConsumer } from './consumer/kafka-consumer.js';

// Admin
export { KafkaAdmin } from './admin/kafka-admin.js';

// Topics
export {
  KAFKA_TOPICS,
  TOPIC_CONFIGS,
  getTopicConfig,
  getAllTopicNames,
  type KafkaTopic,
} from './topics/topic-definitions.js';

// Types
export type {
  KafkaEvent,
  KafkaMessage,
  KafkaProducerConfig,
  KafkaConsumerConfig,
  MessageHandler,
  TopicConfig,
  SendOptions,
  TopicMessages,
  RunConfig,
  EachMessagePayload,
  EachBatchPayload,
  Offsets,
  OffsetsByTopicPartition,
  TopicPartition,
  TransactionOffsets,
} from './types/kafka-types.js';
