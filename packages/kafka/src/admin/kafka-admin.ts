import { Kafka, Admin, ITopicConfig } from 'kafkajs';

import { systemLogger } from '@packages/logging';

import { TOPIC_CONFIGS, getAllTopicNames } from '../topics/topic-definitions.js';

export class KafkaAdmin {
  private kafka: Kafka;
  private admin: Admin;
  private isConnected = false;

  constructor(brokers?: string[]) {
    const kafkaBrokers = brokers || [process.env.KAFKA_BROKERS || 'localhost:9092'];

    this.kafka = new Kafka({
      clientId: 'soranix-admin',
      brokers: kafkaBrokers,
    });

    this.admin = this.kafka.admin();
  }

  async connect(): Promise<void> {
    if (this.isConnected) return;

    try {
      await this.admin.connect();
      this.isConnected = true;
      systemLogger.info('Kafka admin connected');
    } catch (error) {
      systemLogger.error('Failed to connect Kafka admin', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.isConnected) return;

    try {
      await this.admin.disconnect();
      this.isConnected = false;
      systemLogger.info('Kafka admin disconnected');
    } catch (error) {
      systemLogger.error('Failed to disconnect Kafka admin', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Create all predefined topics
   */
  async createAllTopics(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const topics: ITopicConfig[] = Object.values(TOPIC_CONFIGS).map((config) => ({
        topic: config.name,
        numPartitions: config.numPartitions,
        replicationFactor: config.replicationFactor,
        configEntries: [
          { name: 'retention.ms', value: config.retentionMs.toString() },
          {
            name: 'retention.bytes',
            value: config.retentionBytes.toString(),
          },
          { name: 'cleanup.policy', value: config.cleanupPolicy },
          { name: 'compression.type', value: config.compressionType },
          {
            name: 'min.insync.replicas',
            value: config.minInSyncReplicas.toString(),
          },
        ],
      }));

      const created = await this.admin.createTopics({
        topics,
        waitForLeaders: true,
        timeout: 30000,
      });

      if (created) {
        systemLogger.info('All Kafka topics created', {
          count: topics.length,
          topics: topics.map((t) => t.topic),
        });
      } else {
        systemLogger.info('Topics already exist or creation skipped');
      }
    } catch (error) {
      systemLogger.error('Failed to create Kafka topics', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Create a single topic
   */
  async createTopic(topicName: string): Promise<boolean> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const config = TOPIC_CONFIGS[topicName];
      if (!config) {
        throw new Error(`Topic configuration not found: ${topicName}`);
      }

      const created = await this.admin.createTopics({
        topics: [
          {
            topic: config.name,
            numPartitions: config.numPartitions,
            replicationFactor: config.replicationFactor,
            configEntries: [
              { name: 'retention.ms', value: config.retentionMs.toString() },
              {
                name: 'retention.bytes',
                value: config.retentionBytes.toString(),
              },
              { name: 'cleanup.policy', value: config.cleanupPolicy },
              { name: 'compression.type', value: config.compressionType },
              {
                name: 'min.insync.replicas',
                value: config.minInSyncReplicas.toString(),
              },
            ],
          },
        ],
        waitForLeaders: true,
      });

      systemLogger.info('Kafka topic created', { topic: topicName });
      return created;
    } catch (error) {
      systemLogger.error('Failed to create Kafka topic', {
        topic: topicName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * List all topics
   */
  async listTopics(): Promise<string[]> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const topics = await this.admin.listTopics();
      systemLogger.info('Listed Kafka topics', { count: topics.length });
      return topics;
    } catch (error) {
      systemLogger.error('Failed to list Kafka topics', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete a topic
   */
  async deleteTopic(topic: string): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.admin.deleteTopics({
        topics: [topic],
        timeout: 30000,
      });

      systemLogger.info('Kafka topic deleted', { topic });
    } catch (error) {
      systemLogger.error('Failed to delete Kafka topic', {
        topic,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete all topics (use with caution!)
   */
  async deleteAllTopics(): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const topicNames = getAllTopicNames();
      await this.admin.deleteTopics({
        topics: topicNames,
        timeout: 30000,
      });

      systemLogger.warn('All Kafka topics deleted', {
        count: topicNames.length,
      });
    } catch (error) {
      systemLogger.error('Failed to delete all Kafka topics', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Get topic metadata
   */
  async getTopicMetadata(topics: string[]): Promise<any> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const metadata = await this.admin.fetchTopicMetadata({ topics });
      return metadata;
    } catch (error) {
      systemLogger.error('Failed to fetch topic metadata', {
        topics,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Check if a topic exists
   */
  async topicExists(topic: string): Promise<boolean> {
    try {
      const topics = await this.listTopics();
      return topics.includes(topic);
    } catch (error) {
      systemLogger.error('Failed to check topic existence', {
        topic,
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }

  /**
   * Create partitions for existing topic
   */
  async createPartitions(config: {
    topicPartitions: Array<{
      topic: string;
      count: number;
      assignments?: number[][];
    }>;
    validateOnly?: boolean;
    timeout?: number;
  }): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.admin.createPartitions({
        validateOnly: config.validateOnly ?? false,
        timeout: config.timeout || 5000,
        topicPartitions: config.topicPartitions,
      });

      systemLogger.info('Partitions created', {
        topics: config.topicPartitions.map((tp) => tp.topic),
      });
    } catch (error) {
      systemLogger.error('Failed to create partitions', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Fetch topic offsets (most recent offset for a topic)
   */
  async fetchTopicOffsets(topic: string): Promise<
    Array<{
      partition: number;
      offset: string;
      high: string;
      low: string;
    }>
  > {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const offsets = await this.admin.fetchTopicOffsets(topic);
      systemLogger.info('Fetched topic offsets', {
        topic,
        partitions: offsets.length,
      });
      return offsets;
    } catch (error) {
      systemLogger.error('Failed to fetch topic offsets', {
        topic,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Fetch topic offsets by timestamp
   * Returns earliest offset where message timestamp >= given timestamp
   */
  async fetchTopicOffsetsByTimestamp(
    topic: string,
    timestamp: number
  ): Promise<
    Array<{
      partition: number;
      offset: string;
    }>
  > {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const offsets = await this.admin.fetchTopicOffsetsByTimestamp(topic, timestamp);
      systemLogger.info('Fetched topic offsets by timestamp', {
        topic,
        timestamp,
        partitions: offsets.length,
      });
      return offsets;
    } catch (error) {
      systemLogger.error('Failed to fetch topic offsets by timestamp', {
        topic,
        timestamp,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Fetch consumer group offsets
   */
  async fetchOffsets(config: { groupId: string; topics?: string[]; resolveOffsets?: boolean }): Promise<
    Array<{
      topic: string;
      partitions: Array<{
        partition: number;
        offset: string;
      }>;
    }>
  > {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const offsets = await this.admin.fetchOffsets({
        groupId: config.groupId,
        topics: config.topics,
        resolveOffsets: config.resolveOffsets,
      });

      systemLogger.info('Fetched consumer group offsets', {
        groupId: config.groupId,
        topics: config.topics?.length || 'all',
      });

      return offsets;
    } catch (error) {
      systemLogger.error('Failed to fetch consumer group offsets', {
        groupId: config.groupId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Reset consumer group offsets to earliest or latest
   */
  async resetOffsets(config: { groupId: string; topic: string; earliest?: boolean }): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.admin.resetOffsets({
        groupId: config.groupId,
        topic: config.topic,
        earliest: config.earliest ?? false,
      });

      systemLogger.info('Consumer group offsets reset', {
        groupId: config.groupId,
        topic: config.topic,
        to: config.earliest ? 'earliest' : 'latest',
      });
    } catch (error) {
      systemLogger.error('Failed to reset consumer group offsets', {
        groupId: config.groupId,
        topic: config.topic,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Set consumer group offsets to specific values
   */
  async setOffsets(config: {
    groupId: string;
    topic: string;
    partitions: Array<{
      partition: number;
      offset: string;
    }>;
  }): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.admin.setOffsets({
        groupId: config.groupId,
        topic: config.topic,
        partitions: config.partitions,
      });

      systemLogger.info('Consumer group offsets set', {
        groupId: config.groupId,
        topic: config.topic,
        partitions: config.partitions.length,
      });
    } catch (error) {
      systemLogger.error('Failed to set consumer group offsets', {
        groupId: config.groupId,
        topic: config.topic,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Describe cluster
   */
  async describeCluster(): Promise<{
    brokers: Array<{
      nodeId: number;
      host: string;
      port: number;
    }>;
    controller: number | null;
    clusterId: string;
  }> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const cluster = await this.admin.describeCluster();
      systemLogger.info('Cluster described', {
        brokers: cluster.brokers.length,
        controller: cluster.controller,
      });
      return cluster;
    } catch (error) {
      systemLogger.error('Failed to describe cluster', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * List consumer groups
   */
  async listGroups(): Promise<{
    groups: Array<{
      groupId: string;
      protocolType: string;
    }>;
  }> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const groups = await this.admin.listGroups();
      systemLogger.info('Listed consumer groups', {
        count: groups.groups.length,
      });
      return groups;
    } catch (error) {
      systemLogger.error('Failed to list consumer groups', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Describe consumer groups
   */
  async describeGroups(groupIds: string[]): Promise<{
    groups: Array<{
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
    }>;
  }> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const groups = await this.admin.describeGroups(groupIds);
      systemLogger.info('Consumer groups described', {
        count: groupIds.length,
      });
      return groups;
    } catch (error) {
      systemLogger.error('Failed to describe consumer groups', {
        groupIds,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete consumer groups
   * NOTE: Groups must have no connected consumers
   */
  async deleteGroups(groupIds: string[]): Promise<
    Array<{
      groupId: string;
      errorCode?: number;
    }>
  > {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const result = await this.admin.deleteGroups(groupIds);
      systemLogger.info('Consumer groups deleted', { count: groupIds.length });
      return result;
    } catch (error) {
      systemLogger.error('Failed to delete consumer groups', {
        groupIds,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Delete topic records up to a given offset
   * NOTE: Always deletes from earliest offset, not arbitrary range
   */
  async deleteTopicRecords(config: {
    topic: string;
    partitions: Array<{
      partition: number;
      offset: string; // Use '-1' to delete all records
    }>;
  }): Promise<void> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      await this.admin.deleteTopicRecords({
        topic: config.topic,
        partitions: config.partitions,
      });

      systemLogger.info('Topic records deleted', {
        topic: config.topic,
        partitions: config.partitions.length,
      });
    } catch (error) {
      systemLogger.error('Failed to delete topic records', {
        topic: config.topic,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Describe topic configs
   */
  async describeConfigs(config: {
    resources: Array<{
      type: number; // ConfigResourceTypes.TOPIC, BROKER, etc.
      name: string;
      configNames?: string[];
    }>;
    includeSynonyms?: boolean;
  }): Promise<any> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const configs = await this.admin.describeConfigs({
        includeSynonyms: config.includeSynonyms ?? false,
        resources: config.resources,
      });

      systemLogger.info('Configs described', {
        resources: config.resources.length,
      });
      return configs;
    } catch (error) {
      systemLogger.error('Failed to describe configs', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Alter topic configs
   */
  async alterConfigs(config: {
    resources: Array<{
      type: number; // ConfigResourceTypes.TOPIC, BROKER, etc.
      name: string;
      configEntries: Array<{
        name: string;
        value: string;
      }>;
    }>;
    validateOnly?: boolean;
  }): Promise<any> {
    try {
      if (!this.isConnected) {
        await this.connect();
      }

      const result = await this.admin.alterConfigs({
        validateOnly: config.validateOnly ?? false,
        resources: config.resources,
      });

      systemLogger.info('Configs altered', {
        resources: config.resources.length,
      });
      return result;
    } catch (error) {
      systemLogger.error('Failed to alter configs', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
}
