# ⚡ Kafka Quick Reference - Cheat Sheet

Quick reference for common Kafka operations in Soranix.

---

## 🚀 **Quick Start**

### **Publishing Events (Simple)**

```typescript
import { EventPublisher } from '@packages/events';

// ✅ Works with sensible defaults
const publisher = new EventPublisher('my-service');
await publisher.initialize();

// Auto-routes to Kafka or RabbitMQ
await publisher.publish({
  eventId: generateId(),
  eventType: 'payment.completed', // Routes to Kafka
  aggregateId: 'user_123',
  version: 1,
  timestamp: new Date(),
  data: { amount: 100 },
});
```

### **Publishing with Custom Config**

```typescript
import { EventPublisher, type EventPublisherConfig } from '@packages/events';

// ✅ Customize per service
const config: EventPublisherConfig = {
  kafka: {
    producer: {
      transactional: true, // Enable transactions
      idempotent: true,
    },
    send: {
      acks: -1, // All replicas
      timeout: 60000, // 60s
    },
  },
};

const publisher = new EventPublisher('ledger-service', config);
await publisher.initialize();
await publisher.publish(event); // Same API!
```

---

## 🔐 **Transactions (Exactly-Once)**

### **Basic Transaction**

```typescript
import { KafkaProducer, KAFKA_TOPICS } from '@packages/kafka';

const producer = new KafkaProducer({
  clientId: 'my-service',
  transactional: true, // ✅ Enable transactions
});
await producer.connect();

const transaction = await producer.transaction();
try {
  await transaction.send(KAFKA_TOPICS.PAYMENTS, event1);
  await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, event2);
  await transaction.commit(); // ✅ Both or neither
} catch (error) {
  await transaction.abort(); // ❌ Rollback
  throw error;
}
```

### **Consume-Transform-Produce**

```typescript
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const transaction = await producer.transaction();
    try {
      await transaction.send(KAFKA_TOPICS.OUTPUT, transformed);
      await transaction.sendOffsets({
        consumerGroupId: 'my-group',
        topics: [{ topic, partitions: [{ partition, offset: nextOffset }] }],
      });
      await transaction.commit();
    } catch (e) {
      await transaction.abort();
    }
  },
});
```

---

## 📥 **Consuming Events**

### **Simple Consumer**

```typescript
import { KafkaConsumer, KAFKA_TOPICS } from '@packages/kafka';

const consumer = new KafkaConsumer({
  clientId: 'my-service',
  groupId: 'my-group',
});
await consumer.connect();

await consumer.subscribe([KAFKA_TOPICS.PAYMENTS], false);

await consumer.run({
  eachMessage: async ({ message }) => {
    const data = JSON.parse(message.value.toString());
    await processMessage(data);
  },
});
```

### **High-Performance Consumer**

```typescript
await consumer.run({
  partitionsConsumedConcurrently: 5, // 5x throughput
  autoCommitInterval: 5000,
  autoCommitThreshold: 100,

  eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
    const messages = batch.messages.map((m) => JSON.parse(m.value.toString()));
    await db.batchInsert(messages); // Batch processing
    batch.messages.forEach((m) => resolveOffset(m.offset));
    await heartbeat();
  },
});
```

### **Cost-Optimized Consumer**

```typescript
const consumer = new KafkaConsumer({
  groupId: 'my-group',
  rackId: 'us-east-1a', // ✅ Follower fetching (90% cost savings)
});
```

---

## 📊 **Common Patterns**

### **Pattern 1: Payment Processing (Atomic)**

```typescript
const transaction = await producer.transaction();
try {
  await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, debit);
  await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, credit);
  await transaction.send(KAFKA_TOPICS.PAYMENTS, payment);
  await transaction.commit();
} catch (e) {
  await transaction.abort();
}
```

### **Pattern 2: Event Replay (Rebuild State)**

```typescript
const consumer = new KafkaConsumer({
  groupId: 'replay-group',
  fromBeginning: true, // ✅ From offset 0
});

await consumer.subscribe([KAFKA_TOPICS.LEDGER_ENTRIES], true);
await consumer.run({
  eachMessage: async ({ message }) => {
    await rebuildLedger(message);
  },
});
```

### **Pattern 3: Backpressure Handling**

```typescript
await consumer.run({
  eachMessage: async ({ pause }) => {
    try {
      await externalAPI.send(message);
    } catch (e) {
      if (e instanceof RateLimitError) {
        const resume = pause();
        setTimeout(resume, e.retryAfter * 1000);
      }
    }
  },
});
```

---

## 🎯 **Event Routing**

### **Kafka** (7-year retention)

```
payment.*
transfer.*
deposit.*
withdrawal.*
bill.*
ledger.*
balance.*
audit.*
```

### **RabbitMQ** (fire-and-forget)

```
user.*
email.*
notification.*
ai.*
```

---

## 🔧 **Configuration Cheat Sheet**

### **Producer (Transactions)**

```typescript
{
  clientId: "service-name",
  transactional: true,
  idempotent: true,
  maxInFlightRequests: 1,
}
```

### **Producer (High-Throughput)**

```typescript
{
  clientId: "service-name",
  idempotent: true,
  compressionType: "snappy",
}
```

### **Consumer (High-Performance)**

```typescript
{
  clientId: "service-name",
  groupId: "service-group",
  rackId: "us-east-1a",
  maxBytesPerPartition: 2097152, // 2MB
}
```

### **Consumer Run (Concurrent)**

```typescript
{
  partitionsConsumedConcurrently: 5,
  autoCommitInterval: 5000,
  autoCommitThreshold: 100,
  eachBatch: handler,
}
```

---

## 📝 **Common Commands**

### **Check Kafka Health**

```bash
docker exec -it soranix-kafka kafka-broker-api-versions --bootstrap-server localhost:9093
```

### **List Topics**

```bash
docker exec -it soranix-kafka kafka-topics --bootstrap-server localhost:9093 --list
```

### **Describe Topic**

```bash
docker exec -it soranix-kafka kafka-topics --bootstrap-server localhost:9093 --describe --topic financial.payments
```

### **Create Topics Programmatically**

```typescript
import { KafkaAdmin } from '@packages/kafka';

const admin = new KafkaAdmin();
await admin.connect();
await admin.createAllTopics();
await admin.disconnect();
```

---

## 🔍 **Monitoring**

### **Consumer Group Info**

```typescript
const groupInfo = await consumer.describeGroup();
console.log('State:', groupInfo.state); // Stable, Rebalancing
console.log('Members:', groupInfo.members.length);
```

### **Paused Partitions**

```typescript
const paused = consumer.paused();
console.log(paused); // [{ topic: 'payments', partitions: [0, 1] }]
```

### **Health Checks**

```typescript
const health = await eventPublisher.isHealthy();
console.log('Kafka:', health.kafka);
console.log('RabbitMQ:', health.rabbitmq);
```

---

## 🌍 **Environment Variables**

```bash
# Kafka brokers
KAFKA_BROKERS=kafka:9093

# Or multiple brokers
KAFKA_BROKERS=kafka1:9093,kafka2:9093,kafka3:9093

# Client ID
KAFKA_CLIENT_ID=my-service
```

---

## 🔧 **Admin Operations**

### **Consumer Group Management**

```typescript
import { KafkaAdmin } from '@packages/kafka';

const admin = new KafkaAdmin();
await admin.connect();

// List all consumer groups
const groups = await admin.listGroups();

// Describe consumer groups
const groupInfo = await admin.describeGroups(['my-group']);

// Get consumer group offsets
const offsets = await admin.fetchOffsets({
  groupId: 'my-group',
  topics: ['financial.payments'],
});

// Reset to earliest
await admin.resetOffsets({
  groupId: 'my-group',
  topic: 'financial.payments',
  earliest: true,
});

// Set specific offsets
await admin.setOffsets({
  groupId: 'my-group',
  topic: 'financial.payments',
  partitions: [{ partition: 0, offset: '100' }],
});

// Delete consumer group (no running consumers!)
await admin.deleteGroups(['old-group']);

await admin.disconnect();
```

### **Topic Management**

```typescript
// Create all topics
await admin.createAllTopics();

// List topics
const topics = await admin.listTopics();

// Check if exists
const exists = await admin.topicExists('financial.payments');

// Fetch topic offsets
const offsets = await admin.fetchTopicOffsets('financial.payments');

// Fetch offsets by timestamp
const timestamp = Date.now() - 24 * 60 * 60 * 1000;
const timeOffsets = await admin.fetchTopicOffsetsByTimestamp('financial.payments', timestamp);

// Scale up (add partitions)
await admin.createPartitions({
  topicPartitions: [{ topic: 'financial.payments', count: 12 }],
});

// Delete records (GDPR)
await admin.deleteTopicRecords({
  topic: 'user-data',
  partitions: [{ partition: 0, offset: '-1' }], // Delete all
});
```

### **Cluster Monitoring**

```typescript
// Describe cluster
const cluster = await admin.describeCluster();
console.log('Brokers:', cluster.brokers.length);
console.log('Controller:', cluster.controller);
```

---

## 📚 **Kafka Topics**

| Topic                       | Retention | Use Case        |
| --------------------------- | --------- | --------------- |
| `financial.payments`        | 7 years   | Payment events  |
| `financial.transfers`       | 7 years   | Transfer events |
| `financial.ledger.entries`  | 7 years   | Ledger entries  |
| `financial.balance.updates` | 7 years   | Balance updates |
| `audit.trail`               | 7 years   | Audit trail     |

**See `KAFKA_INTEGRATION.md` for all 12 topics**

---

## ⚡ **Performance Tips**

✅ Use `partitionsConsumedConcurrently` for I/O-bound work  
✅ Use `eachBatch` for batch DB operations  
✅ Use `rackId` to reduce cross-AZ costs  
✅ Use `autoCommitInterval` + `autoCommitThreshold` for fast recovery  
✅ Use transactions for financial operations  
✅ Batch publish when possible  
✅ Use `compression: "snappy"` for high-throughput

---

## 📖 **Full Documentation**

- **packages/kafka/README.md** - Complete API reference
- **KAFKA_TRANSACTIONS.md** - Transaction guide (exactly-once)
- **KAFKA_ADMIN_GUIDE.md** - **NEW!** Admin operations & monitoring
- **KAFKA_INTEGRATION.md** - Setup & architecture
- **KAFKA_COMPLETE_IMPROVEMENTS.md** - All 51 features
- **KAFKA_FINAL_SUMMARY.md** - Executive summary

---

**Quick reference for Kafka in Soranix!** ⚡

**51 Features | 5,600+ Lines of Docs | Production-Ready** 🚀
