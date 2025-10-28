# @packages/kafka

Apache Kafka integration for Soranix Platform using **KRaft mode** (no Zookeeper dependency).

## 🚀 Features

- ✅ **KRaft Mode** - No Zookeeper required
- ✅ **Idempotent Producer** - Exactly-once semantics
- ✅ **7-Year Retention** - Financial compliance (configurable)
- ✅ **Multiple Compression** - GZIP, Snappy, LZ4, ZSTD
- ✅ **Event Replay** - Time-travel capabilities
- ✅ **Transactions** - Atomic multi-topic writes
- ✅ **Batch Publishing** - High throughput
- ✅ **DefaultPartitioner** - Compatible with Java clients (co-partitioning)

---

## 📦 Installation

```bash
npm install @packages/kafka
```

---

## 🎯 Basic Usage

### **Producer**

```typescript
import { KafkaProducer, KAFKA_TOPICS } from '@packages/kafka';

const producer = new KafkaProducer({
  clientId: 'my-service',
  idempotent: true, // Exactly-once semantics
});

await producer.connect();

// Publish single event
await producer.publish(KAFKA_TOPICS.PAYMENTS, {
  key: 'user_123', // For partitioning
  value: {
    eventType: 'payment.completed',
    amount: 100.0,
    currency: 'USD',
  },
  headers: {
    'correlation-id': 'abc-123',
  },
});

await producer.disconnect();
```

### **Consumer**

```typescript
import { KafkaConsumer, KAFKA_TOPICS } from '@packages/kafka';

const consumer = new KafkaConsumer({
  clientId: 'my-service',
  groupId: 'my-group',
  fromBeginning: false, // Or true to replay all history

  // Optional: Advanced configuration
  rackId: 'us-east-1a', // Follower fetching (cost optimization)
  sessionTimeout: 30000,
  heartbeatInterval: 3000,
});

await consumer.connect();

// Subscribe to topics
await consumer.subscribe([KAFKA_TOPICS.PAYMENTS], false);

// Run consumer with eachMessage
await consumer.run({
  partitionsConsumedConcurrently: 3, // Process 3 partitions concurrently
  autoCommitInterval: 5000, // Auto commit every 5 seconds
  autoCommitThreshold: 100, // Or every 100 messages

  eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
    const value = JSON.parse(message.value.toString());
    console.log('Received:', value);

    // Send heartbeat for long-running tasks
    await heartbeat();
  },
});
```

---

## 🔥 Advanced Consumer Features

### **1. Regex Topic Subscription**

```typescript
// Subscribe to all topics matching a pattern
await consumer.subscribe([/topic-(prod|staging)-.*/i], false);

// Or subscribe to all regional topics
await consumer.subscribe([/payments-(us|eu|asia)-.*/i], true);
```

### **2. Batch Processing (eachBatch)**

```typescript
await consumer.run({
  eachBatchAutoResolve: false, // Manual offset resolution

  eachBatch: async ({ batch, resolveOffset, heartbeat, commitOffsetsIfNecessary, isRunning, isStale }) => {
    console.log('Batch:', batch.topic, 'Lag:', batch.highWatermark);

    for (const message of batch.messages) {
      // Check if shutting down
      if (!isRunning() || isStale()) break;

      // Process message
      await processMessage(message);

      // Mark as processed
      resolveOffset(message.offset);

      // Send heartbeat
      await heartbeat();
    }
  },
});
```

### **3. Manual Commit (Exactly-Once with DB)**

```typescript
await consumer.run({
  autoCommit: false, // Disable auto commit

  eachMessage: async ({ topic, partition, message }) => {
    // Atomic write to database + offset
    await db.transaction(async (tx) => {
      await tx.insert({ data: message.value });
      await tx.insert({ offset: message.offset, partition, topic });
    });
  },
});

// Later: manually commit offsets
await consumer.commitOffsets([{ topic: 'my-topic', partition: 0, offset: '12345' }]);
```

### **4. Partition-Level Backpressure**

```typescript
await consumer.run({
  partitionsConsumedConcurrently: 3,

  eachMessage: async ({ topic, partition, message, pause }) => {
    try {
      await sendToExternalAPI(message);
    } catch (e) {
      if (e instanceof TooManyRequestsError) {
        // Pause only this partition
        const resume = pause();

        // Other partitions keep processing!
        setTimeout(resume, e.retryAfter * 1000);
      }
      throw e;
    }
  },
});
```

### **5. Monitoring Consumer Group**

```typescript
// Get consumer group metadata
const groupInfo = await consumer.describeGroup();

console.log('Group:', groupInfo.groupId);
console.log('State:', groupInfo.state); // Stable, Rebalancing, etc.
console.log('Members:', groupInfo.members.length);
console.log('Protocol:', groupInfo.protocol); // RoundRobinAssigner

// Get paused partitions
const paused = consumer.paused();
console.log('Paused:', paused);
// [{ topic: 'payments', partitions: [0, 1] }]
```

### **Admin (Topic Management)**

```typescript
import { KafkaAdmin } from '@packages/kafka';

const admin = new KafkaAdmin();
await admin.connect();

// Create all predefined topics
await admin.createAllTopics();

// List topics
const topics = await admin.listTopics();

// Check if topic exists
const exists = await admin.topicExists('financial.payments');

await admin.disconnect();
```

---

## 🔧 Advanced Configuration

### **Consumer Options**

```typescript
const consumer = new KafkaConsumer({
  clientId: 'my-service',
  groupId: 'my-group',
  brokers: ['kafka:9093'], // Optional
  fromBeginning: false,

  // Session & heartbeat (failure detection)
  sessionTimeout: 30000, // 30s - time before consumer is considered dead
  rebalanceTimeout: 60000, // 60s - max time for rebalance
  heartbeatInterval: 3000, // 3s - heartbeat frequency

  // Metadata
  metadataMaxAge: 300000, // 5 min - force metadata refresh
  allowAutoTopicCreation: true, // Allow topic creation

  // Fetching (performance tuning)
  maxBytesPerPartition: 1048576, // 1MB per partition
  minBytes: 1, // Min bytes before returning
  maxBytes: 10485760, // 10MB max response size
  maxWaitTimeInMs: 5000, // Max wait for data

  // Advanced
  readUncommitted: false, // Read uncommitted transactions
  maxInFlightRequests: null, // No limit (or set to control ordering)
  rackId: 'us-east-1a', // ✅ Follower fetching (cost optimization!)

  // Retry
  retry: {
    retries: 5,
    initialRetryTime: 100,
  },
});
```

### **Run Options**

```typescript
await consumer.run({
  // Concurrency
  partitionsConsumedConcurrently: 3, // Process N partitions concurrently

  // Auto commit
  autoCommit: true, // Enable auto commit
  autoCommitInterval: 5000, // Commit every 5 seconds
  autoCommitThreshold: 100, // OR every 100 messages (whichever first)

  // Message handler
  eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
    // Process message
    await heartbeat(); // Send heartbeat for long tasks
  },

  // OR batch handler
  eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
    // Process batch
  },
  eachBatchAutoResolve: true, // Auto-resolve batch offsets
});
```

### **Producer Options**

```typescript
const producer = new KafkaProducer({
  clientId: 'my-service',
  brokers: ['kafka:9093'], // Optional, defaults to env.KAFKA_BROKERS
  idempotent: true, // Prevent duplicates
  transactional: false, // Enable transactions
  allowAutoTopicCreation: false, // Topics must be created explicitly
  transactionTimeout: 60000, // 60 seconds
  maxInFlightRequests: null, // No limit (or set to 5 for ordering)
  compressionType: 'snappy', // Default compression
  retry: {
    initialRetryTime: 100,
    retries: 8,
  },
});
```

### **Send Options (Per-Message Control)**

```typescript
// Control ACKs, timeout, and compression per send
await producer.publish(
  KAFKA_TOPICS.PAYMENTS,
  {
    key: 'user_123',
    value: { amount: 100 },
  },
  {
    acks: -1, // -1 = all replicas, 0 = no ack, 1 = leader only
    timeout: 30000, // 30 seconds
    compression: 'gzip', // Override default compression
  }
);
```

**ACKs Options:**

- `-1` (default): All in-sync replicas must acknowledge (most reliable)
- `0`: No acknowledgment (fire-and-forget, fastest)
- `1`: Only leader acknowledgment (balanced)

---

## 📊 Compression

### **Built-in: GZIP**

GZIP is included by default:

```typescript
await producer.publish(KAFKA_TOPICS.PAYMENTS, { key: 'user_123', value: data }, { compression: 'gzip' });
```

### **Snappy** (Recommended for Performance)

Install:

```bash
npm install kafkajs-snappy
```

Setup:

```typescript
// In your service startup (e.g., app.ts)
import { CompressionTypes, CompressionCodecs } from 'kafkajs';
import SnappyCodec from 'kafkajs-snappy';

CompressionCodecs[CompressionTypes.Snappy] = SnappyCodec;
```

Use:

```typescript
await producer.publish(KAFKA_TOPICS.PAYMENTS, { key: 'user_123', value: data }, { compression: 'snappy' });
```

### **LZ4** (High Compression Ratio)

Install:

```bash
npm install kafkajs-lz4
```

Setup:

```typescript
import { CompressionTypes, CompressionCodecs } from 'kafkajs';
import LZ4 from 'kafkajs-lz4';

CompressionCodecs[CompressionTypes.LZ4] = new LZ4().codec;
```

### **ZSTD** (Best Compression)

Install:

```bash
npm install @kafkajs/zstd
```

Setup:

```typescript
import { CompressionTypes, CompressionCodecs } from 'kafkajs';
import ZstdCodec from '@kafkajs/zstd';

CompressionCodecs[CompressionTypes.ZSTD] = ZstdCodec();
```

---

## 🔄 Batch Publishing

### **Single Topic Batch**

```typescript
const events = [
  { key: 'user_1', value: { amount: 100 } },
  { key: 'user_2', value: { amount: 200 } },
  { key: 'user_3', value: { amount: 300 } },
];

await producer.publishBatch(KAFKA_TOPICS.PAYMENTS, events);
```

### **Multiple Topics Batch** (New!)

Publish to multiple topics in a single operation:

```typescript
const topicMessages = [
  {
    topic: KAFKA_TOPICS.PAYMENTS,
    messages: [{ key: 'user_1', value: { amount: 100 } }],
  },
  {
    topic: KAFKA_TOPICS.TRANSFERS,
    messages: [{ key: 'user_2', value: { amount: 50 } }],
  },
  {
    topic: KAFKA_TOPICS.AUDIT_TRAIL,
    messages: [{ key: 'audit_1', value: { action: 'payment.completed' } }],
  },
];

await producer.sendBatch(topicMessages);
```

Useful for:

- Migrating between topics
- Publishing related events to different topics
- Atomic writes to multiple topics (if using transactions)

---

## 🔐 Transactions (Exactly-Once Semantics)

### **Enable Transactional Producer**

```typescript
const producer = new KafkaProducer({
  clientId: 'ledger-service',
  transactional: true, // ✅ Enable transactions

  // These are set automatically when transactional: true:
  idempotent: true, // Prevent duplicates
  maxInFlightRequests: 1, // Required for EoS
  // acks: -1 // All replicas (automatic)
});

await producer.connect();
```

### **Basic Transaction**

```typescript
const transaction = await producer.transaction();

try {
  // Send multiple messages atomically
  await transaction.send(KAFKA_TOPICS.PAYMENTS, {
    key: 'user_123',
    value: { amount: 100 },
  });

  await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, {
    key: 'user_123',
    value: { debit: 100 },
  });

  // ✅ Commit: Both published atomically
  await transaction.commit();
} catch (error) {
  // ❌ Abort: Neither published
  await transaction.abort();
  throw error;
}
```

### **Consume-Transform-Produce (Exactly-Once Pipeline)**

```typescript
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const transaction = await producer.transaction();

    try {
      // 1. Transform data
      const transformedData = transform(message.value);

      // 2. Produce transformed message
      await transaction.send(KAFKA_TOPICS.OUTPUT, {
        key: transformedData.userId,
        value: transformedData,
      });

      // 3. ✅ Commit offset atomically with produced message
      await transaction.sendOffsets({
        consumerGroupId: 'my-group',
        topics: [
          {
            topic,
            partitions: [
              {
                partition,
                offset: (parseInt(message.offset) + 1).toString(),
              },
            ],
          },
        ],
      });

      // Commit transaction
      await transaction.commit();
    } catch (error) {
      await transaction.abort();
      throw error;
    }
  },
});
```

**Benefits:**

- ✅ All messages published or none (atomic)
- ✅ Exactly-once delivery (no duplicates)
- ✅ Perfect for financial operations
- ✅ Consume-transform-produce pipelines
- ✅ Atomic offset commits with `sendOffsets()`

---

## 🕰️ Event Replay

### **Read from Beginning**

```typescript
const consumer = new KafkaConsumer({
  clientId: 'replay-service',
  groupId: 'replay-group',
  fromBeginning: true, // ✅ Read from offset 0
});

await consumer.connect();
await consumer.subscribe([KAFKA_TOPICS.LEDGER_ENTRIES], async (message) => {
  // Rebuild ledger from all events
  await rebuildLedger(message.value);
});
await consumer.run();
```

### **Seek to Specific Offset**

```typescript
// Replay from specific point
await consumer.seekToOffset(KAFKA_TOPICS.PAYMENTS, 0, '12345');
```

### **Seek to Beginning Programmatically**

```typescript
await consumer.seekToBeginning(KAFKA_TOPICS.PAYMENTS);
```

---

## 📈 Partitioning

### **DefaultPartitioner**

Our producer uses the **DefaultPartitioner** by default for compatibility with Java clients:

```typescript
// Automatic partitioning based on key
await producer.publish(KAFKA_TOPICS.PAYMENTS, {
  key: 'user_123', // Hash-based partition selection
  value: data,
});
```

**Partition Logic:**

1. If `partition` is specified → use it
2. If `key` is specified → hash (murmur2) of key
3. If no key or partition → round-robin

**Why DefaultPartitioner?**

- ✅ Co-partitioning with Java clients
- ✅ Consistent hashing
- ✅ Ordered processing per key

---

## 📋 Predefined Topics

| Topic                       | Retention | Partitions | Use Case                  |
| --------------------------- | --------- | ---------- | ------------------------- |
| `financial.transactions`    | 7 years   | 6          | All financial events      |
| `financial.ledger.entries`  | 7 years   | 6          | Ledger entries            |
| `financial.balance.updates` | 7 years   | 3          | Balance updates (compact) |
| `financial.payments`        | 7 years   | 6          | Payment events            |
| `financial.transfers`       | 7 years   | 6          | Transfer events           |
| `financial.deposits`        | 7 years   | 6          | Deposit events            |
| `financial.withdrawals`     | 7 years   | 6          | Withdrawal events         |
| `financial.bills`           | 7 years   | 6          | Bill payments             |
| `financial.exchange`        | 7 years   | 6          | Crypto/fiat exchange      |
| `audit.trail`               | 7 years   | 3          | Audit trail               |
| `compliance.events`         | 7 years   | 3          | Compliance events         |
| `dead.letter.queue`         | 7 days    | 1          | Failed messages           |

---

## 🎯 Best Practices

### **Producer Best Practices**

#### **1. Use Idempotent Producer**

```typescript
const producer = new KafkaProducer({
  clientId: 'my-service',
  idempotent: true, // ✅ Prevents duplicates
});
```

### **2. Partition by Aggregate ID**

```typescript
// Good: All events for user_123 go to same partition (ordered)
await producer.publish(KAFKA_TOPICS.PAYMENTS, {
  key: 'user_123', // ✅ Consistent partitioning
  value: event,
});

// Bad: Random partitioning (unordered)
await producer.publish(KAFKA_TOPICS.PAYMENTS, {
  key: Math.random().toString(), // ❌ Don't do this
  value: event,
});
```

### **3. Use Appropriate ACKs**

```typescript
// Financial operations: Wait for all replicas
await producer.publish(topic, event, { acks: -1 }); // ✅

// Operational events: Leader only (faster)
await producer.publish(topic, event, { acks: 1 });

// Metrics/logs: No ack (fastest)
await producer.publish(topic, event, { acks: 0 });
```

### **4. Enable Compression**

```typescript
// For high-throughput topics
await producer.publish(topic, event, { compression: 'snappy' }); // ✅ Fast

// For audit/logs (better ratio)
await producer.publish(topic, event, { compression: 'gzip' }); // ✅ Small
```

#### **5. Batch When Possible**

```typescript
// Good: Batch multiple events
await producer.publishBatch(topic, events); // ✅

// Bad: Individual sends in loop
for (const event of events) {
  await producer.publish(topic, event); // ❌ Slower
}
```

---

### **Consumer Best Practices**

#### **1. Use Partition Concurrency for I/O-Bound Work**

```typescript
// ✅ Good for I/O-bound (network requests, DB queries)
await consumer.run({
  partitionsConsumedConcurrently: 3, // Process 3 partitions at once
  eachMessage: async ({ message }) => {
    await fetch('https://api.example.com', { data: message }); // I/O
  },
});

// ❌ Don't use for CPU-bound work
await consumer.run({
  partitionsConsumedConcurrently: 10, // Too high!
  eachMessage: async ({ message }) => {
    heavyComputation(message); // CPU-bound
  },
});
```

**Guideline:** Set to number of partitions or CPU cores, whichever is lower.

#### **2. Use Auto Commit for Reliability**

```typescript
// ✅ Good: Balance between performance and safety
await consumer.run({
  autoCommitInterval: 5000, // Commit every 5s
  autoCommitThreshold: 100, // Or every 100 messages

  eachMessage: async ({ message }) => {
    await processMessage(message);
  },
});

// ❌ Bad: No auto commit (manual commit required!)
await consumer.run({
  autoCommit: false, // Need manual commits!
  eachMessage: async ({ message }) => {
    await processMessage(message);
    // Forgot to commit offsets! Will reprocess on restart
  },
});
```

#### **3. Send Heartbeats for Long-Running Tasks**

```typescript
await consumer.run({
  eachMessage: async ({ message, heartbeat }) => {
    // Long-running task
    for (let i = 0; i < 10; i++) {
      await processChunk(message, i);
      await heartbeat(); // ✅ Prevent session timeout
    }
  },
});
```

**Without heartbeat:** Consumer may be removed from group during processing!

#### **4. Use Pause for Backpressure**

```typescript
await consumer.run({
  eachMessage: async ({ topic, partition, message, pause }) => {
    try {
      await sendToExternalAPI(message);
    } catch (e) {
      if (e instanceof TooManyRequestsError) {
        // Pause this partition
        const resume = pause();
        setTimeout(resume, e.retryAfter * 1000);
      }
      throw e;
    }
  },
});
```

#### **5. Use eachBatch for Performance**

```typescript
// ✅ Good: Batch processing (better performance)
await consumer.run({
  eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
    // Batch insert to DB
    const messages = batch.messages.map((m) => JSON.parse(m.value.toString()));
    await db.batchInsert(messages);

    // Resolve all at once
    batch.messages.forEach((m) => resolveOffset(m.offset));
    await heartbeat();
  },
});

// ❌ Bad: Individual processing in eachMessage
await consumer.run({
  eachMessage: async ({ message }) => {
    await db.insert(message); // Individual inserts (slow!)
  },
});
```

#### **6. Check isRunning() and isStale() in eachBatch**

```typescript
await consumer.run({
  eachBatchAutoResolve: false,

  eachBatch: async ({ batch, resolveOffset, isRunning, isStale }) => {
    for (const message of batch.messages) {
      // ✅ Check before processing
      if (!isRunning() || isStale()) break;

      await processMessage(message);
      resolveOffset(message.offset);
    }
  },
});
```

**Without checks:** May process stale messages during shutdown/seek!

#### **7. Use fromBeginning for Replay**

```typescript
// ✅ Rebuild state from all events
await consumer.subscribe([KAFKA_TOPICS.LEDGER_ENTRIES], true); // fromBeginning: true
```

#### **8. Use Manual Commits for Exactly-Once with DB**

```typescript
await consumer.run({
  autoCommit: false,

  eachMessage: async ({ topic, partition, message }) => {
    // ✅ Atomic: Store data + offset together
    await db.transaction(async (tx) => {
      await tx.insert({ data: message.value });
      await tx.insert({
        topic,
        partition,
        offset: (parseInt(message.offset) + 1).toString(), // +1 to avoid reprocessing
      });
    });
  },
});

// On restart: seek to stored offset
const lastOffset = await db.getLastOffset(topic, partition);
consumer.seek({ topic, partition, offset: lastOffset });
```

---

## 🔍 Monitoring

### **Check Producer Health**

```typescript
const isConnected = producer.isProducerConnected();
console.log('Producer connected:', isConnected);
```

### **Check Consumer Health**

```typescript
const isConnected = consumer.isConsumerConnected();
console.log('Consumer connected:', isConnected);
```

### **Describe Consumer Group**

```typescript
const groupInfo = await consumer.describeGroup();

console.log('Group ID:', groupInfo.groupId);
console.log('State:', groupInfo.state); // Stable, Rebalancing, Dead, etc.
console.log('Members:', groupInfo.members.length);
console.log('Protocol:', groupInfo.protocol); // RoundRobinAssigner
console.log('Members:', groupInfo.members);
```

**Use case:** Detect rebalancing, monitor group health, debugging.

### **Pause/Resume Consumer**

```typescript
// Pause entire topic
consumer.pause([{ topic: KAFKA_TOPICS.PAYMENTS }]);

// Pause specific partitions
consumer.pause([
  { topic: KAFKA_TOPICS.PAYMENTS, partitions: [0, 1, 2] },
  { topic: KAFKA_TOPICS.TRANSFERS }, // Entire topic
]);

// Resume
consumer.resume([{ topic: KAFKA_TOPICS.PAYMENTS, partitions: [0, 1, 2] }]);

// Check paused partitions
const paused = consumer.paused();
console.log('Paused:', paused);
// [{ topic: 'financial.payments', partitions: [0, 1, 2] }]
```

---

## 🌍 Environment Variables

```bash
# Kafka brokers (comma-separated)
KAFKA_BROKERS=kafka:9093

# Or multiple brokers
KAFKA_BROKERS=kafka1:9093,kafka2:9093,kafka3:9093
```

---

## 📚 Related Documentation

- **KAFKA_INTEGRATION.md** - Full Kafka setup guide
- **KafkaJS Documentation** - https://kafka.js.org/
- **Apache Kafka** - https://kafka.apache.org/

---

## ✅ Summary

### **Producer Features:**

✅ **Exactly-Once Semantics** - Transactional producer with EoS  
✅ **Transactions** - Atomic multi-topic writes with commit/abort  
✅ **sendOffsets()** - Atomic offset commits (consume-transform-produce)  
✅ **Idempotent Producer** - Prevent duplicates  
✅ **Event Sourcing** - Replay from any offset  
✅ **7-Year Retention** - Compliance-ready  
✅ **Multiple Compression** - GZIP, Snappy, LZ4, ZSTD  
✅ **Batch Publishing** - High throughput  
✅ **DefaultPartitioner** - Java client compatibility  
✅ **Per-Message Control** - ACKs, timeout, compression  
✅ **Multi-Topic Batch** - sendBatch to multiple topics

### **Consumer Features:**

✅ **Regex Subscriptions** - Pattern-based topic matching  
✅ **Partition Concurrency** - Process N partitions concurrently  
✅ **Auto Commit Options** - Interval + threshold-based  
✅ **Manual Commits** - Full offset control  
✅ **eachMessage** - Simple message-by-message processing  
✅ **eachBatch** - Advanced batch processing  
✅ **Partition-Level Pause** - Fine-grained backpressure  
✅ **Follower Fetching** - Cost optimization (rackId)  
✅ **describeGroup** - Consumer group monitoring  
✅ **Session & Heartbeat Control** - Failure detection tuning

**Simple Producer API:**

```typescript
import { KafkaProducer, KAFKA_TOPICS } from '@packages/kafka';

const producer = new KafkaProducer({ clientId: 'my-service' });
await producer.connect();
await producer.publish(KAFKA_TOPICS.PAYMENTS, {
  key: 'user_123',
  value: { amount: 100 },
});
```

**Simple Consumer API:**

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
    console.log(JSON.parse(message.value.toString()));
  },
});
```

That's it! 🎉
