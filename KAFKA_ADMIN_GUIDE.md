# 🔧 Kafka Admin Client - Complete Guide

Comprehensive guide for Kafka cluster administration operations in Soranix.

---

## 📋 Overview

The **KafkaAdmin** client provides all cluster operations including:

✅ Topic management (create, delete, list)  
✅ Partition management (create, list)  
✅ Consumer group management (list, describe, delete, reset offsets)  
✅ Cluster information (describe cluster)  
✅ Topic offsets (fetch by time, reset)  
✅ Configuration management (describe, alter)  
✅ Record deletion (GDPR compliance)

---

## 🚀 **Quick Start**

```typescript
import { KafkaAdmin } from '@packages/kafka';

const admin = new KafkaAdmin();
await admin.connect();

// Do admin operations...

await admin.disconnect();
```

---

## 📦 **Topic Management**

### **1. Create All Predefined Topics**

```typescript
await admin.createAllTopics();
// Creates all 12 Soranix topics with 7-year retention
```

### **2. Create Single Topic**

```typescript
await admin.createTopic('financial.payments');
// Creates from TOPIC_CONFIGS
```

### **3. List Topics**

```typescript
const topics = await admin.listTopics();
console.log(topics);
// ['financial.payments', 'financial.transfers', ...]
```

### **4. Check if Topic Exists**

```typescript
const exists = await admin.topicExists('financial.payments');
console.log(exists); // true or false
```

### **5. Delete Topic**

```typescript
await admin.deleteTopic('old-topic');
```

### **6. Fetch Topic Metadata**

```typescript
const metadata = await admin.getTopicMetadata(['financial.payments']);
console.log(metadata);
// {
//   topics: [{
//     name: 'financial.payments',
//     partitions: [
//       { partitionId: 0, leader: 1, replicas: [1], isr: [1] },
//       { partitionId: 1, leader: 2, replicas: [2], isr: [2] },
//       ...
//     ]
//   }]
// }

// Or fetch all topics
const allMetadata = await admin.getTopicMetadata([]);
```

---

## 📊 **Partition Management**

### **1. Create Partitions (Scale Up)**

```typescript
// Add more partitions to existing topic
await admin.createPartitions({
  topicPartitions: [
    {
      topic: 'financial.payments',
      count: 12, // Increase from 6 to 12 partitions
    },
  ],
  timeout: 5000,
});
```

**Use case:** Scale up high-throughput topics

⚠️ **Note:** Cannot reduce partition count (only increase)

---

## 📈 **Topic Offsets**

### **1. Fetch Topic Offsets (Current State)**

```typescript
const offsets = await admin.fetchTopicOffsets('financial.payments');
console.log(offsets);
// [
//   { partition: 0, offset: '31004', high: '31004', low: '421' },
//   { partition: 1, offset: '54312', high: '54312', low: '3102' },
//   { partition: 2, offset: '32103', high: '32103', low: '518' },
// ]
```

**Use case:** Check topic size, calculate lag

### **2. Fetch Offsets by Timestamp (Time Travel)**

```typescript
const timestamp = Date.now() - 24 * 60 * 60 * 1000; // 24 hours ago

const offsets = await admin.fetchTopicOffsetsByTimestamp('financial.payments', timestamp);
console.log(offsets);
// [
//   { partition: 0, offset: '3244' },
//   { partition: 1, offset: '3113' },
// ]
```

**Use case:** Find offsets for specific time period

---

## 👥 **Consumer Group Management**

### **1. List All Consumer Groups**

```typescript
const groups = await admin.listGroups();
console.log(groups);
// {
//   groups: [
//     { groupId: 'ledger-service-group', protocolType: 'consumer' },
//     { groupId: 'analytics-service-group', protocolType: 'consumer' },
//   ]
// }
```

### **2. Describe Consumer Groups**

```typescript
const groupInfo = await admin.describeGroups(['ledger-service-group', 'analytics-service-group']);

console.log(groupInfo);
// {
//   groups: [{
//     groupId: 'ledger-service-group',
//     state: 'Stable', // Stable, Rebalancing, Dead
//     members: [
//       {
//         clientId: 'ledger-service',
//         clientHost: '/172.19.0.1',
//         memberId: 'ledger-service-abc-123',
//         memberAssignment: Buffer,
//         memberMetadata: Buffer,
//       }
//     ],
//     protocol: 'RoundRobinAssigner',
//     protocolType: 'consumer',
//   }]
// }
```

**Use case:** Monitor group health, detect rebalancing

### **3. Fetch Consumer Group Offsets**

```typescript
// Get offsets for specific topics
const offsets = await admin.fetchOffsets({
  groupId: 'ledger-service-group',
  topics: ['financial.payments', 'financial.transfers'],
});

console.log(offsets);
// [
//   {
//     topic: 'financial.payments',
//     partitions: [
//       { partition: 0, offset: '31004' },
//       { partition: 1, offset: '54312' },
//     ],
//   },
//   {
//     topic: 'financial.transfers',
//     partitions: [
//       { partition: 0, offset: '1234' },
//     ],
//   },
// ]

// Or get for ALL topics
const allOffsets = await admin.fetchOffsets({
  groupId: 'ledger-service-group',
  // topics omitted = all topics
});
```

**Use case:** Monitor consumer lag, debugging

### **4. Reset Consumer Group Offsets**

```typescript
// Reset to latest (default)
await admin.resetOffsets({
  groupId: 'analytics-service-group',
  topic: 'financial.payments',
});

// Reset to earliest (replay all history)
await admin.resetOffsets({
  groupId: 'analytics-service-group',
  topic: 'financial.payments',
  earliest: true,
});
```

**⚠️ NOTE:** Consumer group must have **no running instances**!

**Use case:** Reprocess events, fix consumer lag

### **5. Set Consumer Group Offsets (Manual)**

```typescript
await admin.setOffsets({
  groupId: 'my-group',
  topic: 'financial.payments',
  partitions: [
    { partition: 0, offset: '35' },
    { partition: 1, offset: '102' },
    { partition: 2, offset: '567' },
  ],
});
```

**Use case:** Skip to specific offset, fix corrupted data

### **6. Reset Offsets by Timestamp (Time-Based Replay)**

```typescript
// Replay from 24 hours ago
const timestamp = Date.now() - 24 * 60 * 60 * 1000;

const offsets = await admin.fetchTopicOffsetsByTimestamp('financial.payments', timestamp);

await admin.setOffsets({
  groupId: 'my-group',
  topic: 'financial.payments',
  partitions: offsets,
});
```

**Use case:** Replay events from specific time

### **7. Delete Consumer Groups**

```typescript
await admin.deleteGroups(['old-group', 'test-group']);
// [
//   { groupId: 'old-group', errorCode: 0 },
//   { groupId: 'test-group', errorCode: 0 },
// ]
```

**⚠️ NOTE:** Groups must have no connected consumers!

---

## 🌍 **Cluster Management**

### **1. Describe Cluster**

```typescript
const cluster = await admin.describeCluster();
console.log(cluster);
// {
//   brokers: [
//     { nodeId: 0, host: 'localhost', port: 9092 },
//     { nodeId: 1, host: 'kafka-1', port: 9092 },
//     { nodeId: 2, host: 'kafka-2', port: 9092 },
//   ],
//   controller: 0,
//   clusterId: 'soranix-kafka-kraft-cluster-001'
// }
```

**Use case:** Monitoring, health checks, debugging

---

## ⚙️ **Configuration Management**

### **1. Describe Topic Configs**

```typescript
// Get all configs for a topic
const { ConfigResourceTypes } = await import('kafkajs');

const configs = await admin.describeConfigs({
  resources: [
    {
      type: ConfigResourceTypes.TOPIC,
      name: 'financial.payments',
    },
  ],
  includeSynonyms: false,
});

console.log(configs);
// {
//   resources: [{
//     resourceName: 'financial.payments',
//     resourceType: 2,
//     configEntries: [
//       {
//         configName: 'cleanup.policy',
//         configValue: 'delete',
//         isDefault: true,
//         isSensitive: false,
//         readOnly: false,
//       },
//       {
//         configName: 'retention.ms',
//         configValue: '220752000000', // 7 years
//         isDefault: false,
//       },
//       ...
//     ],
//   }]
// }
```

### **2. Describe Specific Configs**

```typescript
// Get only specific config keys
const configs = await admin.describeConfigs({
  resources: [
    {
      type: ConfigResourceTypes.TOPIC,
      name: 'financial.payments',
      configNames: ['cleanup.policy', 'retention.ms'],
    },
  ],
});
```

### **3. Alter Topic Configs**

```typescript
const { ConfigResourceTypes } = await import('kafkajs');

await admin.alterConfigs({
  resources: [
    {
      type: ConfigResourceTypes.TOPIC,
      name: 'financial.payments',
      configEntries: [
        { name: 'cleanup.policy', value: 'compact' },
        { name: 'retention.ms', value: '315360000000' }, // 10 years
      ],
    },
  ],
  validateOnly: false,
});
```

**Use case:** Adjust retention, change cleanup policy, tune performance

---

## 🗑️ **Record Deletion (GDPR Compliance)**

### **Delete Topic Records**

```typescript
// Delete records up to (but not including) offset 30 on partition 0
await admin.deleteTopicRecords({
  topic: 'financial.payments',
  partitions: [
    { partition: 0, offset: '30' }, // Deletes offsets 0-29
    { partition: 3, offset: '-1' }, // Delete ALL records on partition 3
  ],
});
```

**⚠️ Important:**

- Always deletes from **earliest** offset (cannot delete arbitrary range)
- Offset is **exclusive** (deletes up to but not including)
- Use `-1` to delete all records

**Use case:** GDPR right-to-be-forgotten, clean up old data

---

## 🎯 **Real-World Use Cases**

### **1. Consumer Group Lag Monitoring**

```typescript
// Get consumer group lag
const groupOffsets = await admin.fetchOffsets({
  groupId: 'analytics-service-group',
  topics: ['financial.payments'],
});

const topicOffsets = await admin.fetchTopicOffsets('financial.payments');

// Calculate lag
for (const topic of groupOffsets) {
  for (const partition of topic.partitions) {
    const topicOffset = topicOffsets.find((t) => t.partition === partition.partition);
    const lag = parseInt(topicOffset!.offset) - parseInt(partition.offset);
    console.log(`Partition ${partition.partition}: Lag = ${lag} messages`);
  }
}
```

### **2. Reprocess Events from 24 Hours Ago**

```typescript
const timestamp = Date.now() - 24 * 60 * 60 * 1000;

// 1. Get offsets for timestamp
const offsets = await admin.fetchTopicOffsetsByTimestamp('financial.payments', timestamp);

// 2. Set consumer group to those offsets
await admin.setOffsets({
  groupId: 'analytics-service-group',
  topic: 'financial.payments',
  partitions: offsets,
});

// 3. Restart consumer → will reprocess from 24h ago
```

### **3. Scale Up High-Traffic Topic**

```typescript
// Current: 6 partitions
// Need: 12 partitions (double throughput)

await admin.createPartitions({
  topicPartitions: [
    {
      topic: 'financial.payments',
      count: 12, // New partition count
    },
  ],
});
```

### **4. Clean Up Old Test Groups**

```typescript
// List all groups
const allGroups = await admin.listGroups();

// Find test groups
const testGroups = allGroups.groups.filter((g) => g.groupId.includes('test')).map((g) => g.groupId);

// Delete (must have no consumers!)
await admin.deleteGroups(testGroups);
```

### **5. GDPR Right-to-be-Forgotten**

```typescript
// User requests data deletion
const userId = 'user_123';

// Find all messages for this user and delete
const topic = 'financial.payments';
const offsets = await admin.fetchTopicOffsets(topic);

// Delete up to current offset on all partitions
await admin.deleteTopicRecords({
  topic,
  partitions: offsets.map((o) => ({
    partition: o.partition,
    offset: o.offset, // Delete everything up to now
  })),
});
```

### **6. Monitor Cluster Health**

```typescript
const cluster = await admin.describeCluster();

console.log('Brokers:', cluster.brokers.length);
console.log('Controller:', cluster.controller);
console.log('Cluster ID:', cluster.clusterId);

// Check broker health
for (const broker of cluster.brokers) {
  console.log(`Broker ${broker.nodeId}: ${broker.host}:${broker.port}`);
}
```

### **7. Change Topic Retention**

```typescript
const { ConfigResourceTypes } = await import('kafkajs');

// Increase retention to 10 years
await admin.alterConfigs({
  resources: [
    {
      type: ConfigResourceTypes.TOPIC,
      name: 'financial.payments',
      configEntries: [
        { name: 'retention.ms', value: '315360000000' }, // 10 years
      ],
    },
  ],
});
```

---

## 📊 **Monitoring & Debugging**

### **Consumer Lag Dashboard**

```typescript
async function getConsumerLag(groupId: string, topic: string) {
  // 1. Get consumer group offsets
  const groupOffsets = await admin.fetchOffsets({
    groupId,
    topics: [topic],
  });

  // 2. Get topic offsets
  const topicOffsets = await admin.fetchTopicOffsets(topic);

  // 3. Calculate lag
  const lagByPartition = [];

  for (const topicData of groupOffsets) {
    for (const partition of topicData.partitions) {
      const topicPartition = topicOffsets.find((t) => t.partition === partition.partition);

      if (topicPartition) {
        const lag = parseInt(topicPartition.offset) - parseInt(partition.offset);
        lagByPartition.push({
          partition: partition.partition,
          consumerOffset: partition.offset,
          topicOffset: topicPartition.offset,
          lag,
        });
      }
    }
  }

  return lagByPartition;
}

// Usage
const lag = await getConsumerLag('analytics-service-group', 'financial.payments');
console.log(lag);
// [
//   { partition: 0, consumerOffset: '1000', topicOffset: '1500', lag: 500 },
//   { partition: 1, consumerOffset: '2000', topicOffset: '2100', lag: 100 },
// ]
```

### **Consumer Group Health Check**

```typescript
const groups = await admin.describeGroups(['ledger-service-group']);

for (const group of groups.groups) {
  console.log(`Group: ${group.groupId}`);
  console.log(`State: ${group.state}`); // Stable, Rebalancing, Dead
  console.log(`Members: ${group.members.length}`);

  if (group.state !== 'Stable') {
    console.warn(`⚠️ Group ${group.groupId} is ${group.state}!`);
  }
}
```

---

## 🔄 **Operations Recipes**

### **Recipe 1: Complete Consumer Reset**

```typescript
async function resetConsumerCompletely(groupId: string, topic: string) {
  // 1. Stop all consumers first!

  // 2. Reset to earliest
  await admin.resetOffsets({
    groupId,
    topic,
    earliest: true,
  });

  // 3. Restart consumers → will reprocess all history
  console.log(`✅ ${groupId} reset to beginning of ${topic}`);
}
```

### **Recipe 2: Skip Bad Messages**

```typescript
async function skipBadMessages(groupId: string, topic: string, partition: number, skipCount: number) {
  // 1. Get current offset
  const offsets = await admin.fetchOffsets({
    groupId,
    topics: [topic],
  });

  const currentOffset = offsets[0].partitions.find((p) => p.partition === partition);

  if (currentOffset) {
    const newOffset = (parseInt(currentOffset.offset) + skipCount).toString();

    // 2. Set to new offset (skip messages)
    await admin.setOffsets({
      groupId,
      topic,
      partitions: [{ partition, offset: newOffset }],
    });

    console.log(`✅ Skipped ${skipCount} messages on partition ${partition}`);
  }
}

// Usage: Skip 100 corrupted messages
await skipBadMessages('my-group', 'financial.payments', 0, 100);
```

### **Recipe 3: Replay Last 7 Days**

```typescript
async function replayLastNDays(groupId: string, topic: string, days: number) {
  const timestamp = Date.now() - days * 24 * 60 * 60 * 1000;

  // 1. Get offsets for timestamp
  const offsets = await admin.fetchTopicOffsetsByTimestamp(topic, timestamp);

  // 2. Set consumer group to those offsets
  await admin.setOffsets({
    groupId,
    topic,
    partitions: offsets,
  });

  console.log(`✅ ${groupId} will replay last ${days} days of ${topic}`);
}

// Replay last 7 days
await replayLastNDays('analytics-service-group', 'financial.payments', 7);
```

### **Recipe 4: Clean Up Old Consumer Groups**

```typescript
async function cleanupOldGroups() {
  // 1. List all groups
  const allGroups = await admin.listGroups();

  // 2. Describe to check state
  const groupIds = allGroups.groups.map((g) => g.groupId);
  const groupDetails = await admin.describeGroups(groupIds);

  // 3. Find dead groups
  const deadGroups = groupDetails.groups
    .filter((g) => g.state === 'Dead' || g.members.length === 0)
    .map((g) => g.groupId);

  // 4. Delete
  if (deadGroups.length > 0) {
    await admin.deleteGroups(deadGroups);
    console.log(`✅ Deleted ${deadGroups.length} dead groups`);
  }
}
```

---

## ⚠️ **Important Notes**

### **Consumer Group Operations**

All consumer group operations (`resetOffsets`, `setOffsets`, `deleteGroups`) require:

❌ **No running consumers** in the group!

**Workflow:**

1. Stop all consumers
2. Perform admin operation
3. Restart consumers

### **Partition Count**

- ✅ Can **increase** partitions
- ❌ Cannot **decrease** partitions
- Reason: Message ordering and partition assignment

### **Topic Deletion**

Kafka must have `delete.topic.enable=true` (enabled by default in modern versions)

### **Record Deletion**

- Deletes from earliest offset, not arbitrary range
- Offset is **exclusive** (deletes up to but not including)

---

## 🔍 **Diagnostic Commands**

### **Check Topic Size**

```typescript
const offsets = await admin.fetchTopicOffsets('financial.payments');

let totalMessages = 0;
for (const partition of offsets) {
  const messages = parseInt(partition.offset) - parseInt(partition.low);
  totalMessages += messages;
  console.log(`Partition ${partition.partition}: ${messages} messages`);
}

console.log(`Total: ${totalMessages} messages in topic`);
```

### **Find Lagging Consumers**

```typescript
const groups = await admin.listGroups();

for (const group of groups.groups) {
  const offsets = await admin.fetchOffsets({
    groupId: group.groupId,
  });

  // Check lag for each topic
  for (const topic of offsets) {
    const topicOffsets = await admin.fetchTopicOffsets(topic.topic);

    let totalLag = 0;
    for (const partition of topic.partitions) {
      const topicPartition = topicOffsets.find((t) => t.partition === partition.partition);
      if (topicPartition) {
        const lag = parseInt(topicPartition.offset) - parseInt(partition.offset);
        totalLag += lag;
      }
    }

    if (totalLag > 10000) {
      console.warn(`⚠️ Group ${group.groupId} lagging on ${topic.topic}: ${totalLag} messages`);
    }
  }
}
```

---

## 📚 **Complete API Reference**

| Method                                    | Purpose                      | Use Case              |
| ----------------------------------------- | ---------------------------- | --------------------- |
| `createAllTopics()`                       | Create all predefined topics | Initial setup         |
| `createTopic(name)`                       | Create single topic          | Ad-hoc topic creation |
| `createPartitions(config)`                | Add partitions to topic      | Scale up              |
| `listTopics()`                            | List all topics              | Monitoring            |
| `deleteTopic(name)`                       | Delete topic                 | Cleanup               |
| `deleteAllTopics()`                       | Delete all topics            | Reset cluster         |
| `getTopicMetadata(topics)`                | Get topic metadata           | Debugging             |
| `topicExists(name)`                       | Check topic existence        | Validation            |
| `fetchTopicOffsets(topic)`                | Get current offsets          | Check size, lag       |
| `fetchTopicOffsetsByTimestamp(topic, ts)` | Get offsets by time          | Time-based replay     |
| `fetchOffsets(config)`                    | Get consumer group offsets   | Monitor lag           |
| `resetOffsets(config)`                    | Reset to earliest/latest     | Reprocess             |
| `setOffsets(config)`                      | Set to specific offsets      | Skip, replay          |
| `describeCluster()`                       | Get cluster info             | Health check          |
| `listGroups()`                            | List consumer groups         | Monitoring            |
| `describeGroups(ids)`                     | Describe consumer groups     | Debugging             |
| `deleteGroups(ids)`                       | Delete consumer groups       | Cleanup               |
| `deleteTopicRecords(config)`              | Delete records               | GDPR                  |
| `describeConfigs(config)`                 | Get topic configs            | Inspection            |
| `alterConfigs(config)`                    | Change topic configs         | Tuning                |

---

## ✅ **Summary**

**What You Can Do:**

✅ **Topic Management** - Create, delete, list, scale  
✅ **Partition Management** - Create, list  
✅ **Consumer Group Management** - List, describe, delete, reset  
✅ **Offset Management** - Fetch, reset, set by time/offset  
✅ **Cluster Monitoring** - Describe cluster, brokers  
✅ **Configuration** - Describe, alter topic configs  
✅ **Record Deletion** - GDPR compliance  
✅ **Lag Monitoring** - Calculate consumer lag  
✅ **Time-Based Replay** - Replay from specific time

**Perfect for:**

- 📊 Monitoring dashboards
- 🔧 Operations & maintenance
- 🐛 Debugging consumer issues
- ⏮️ Reprocessing events
- 📏 Compliance (GDPR)
- 📈 Performance tuning

**Based on official KafkaJS admin documentation!** 🎉
