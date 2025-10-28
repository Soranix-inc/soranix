# 🚀 Kafka Consumer Improvements

Based on the **official KafkaJS documentation**, we've significantly improved our Kafka consumer implementation.

---

## ✅ What Was Improved

### **1. Comprehensive Consumer Configuration** ⚙️

**Before:**

```typescript
const consumer = new KafkaConsumer({
  clientId: 'my-service',
  groupId: 'my-group',
  fromBeginning: false,
});
```

**After:**

```typescript
const consumer = new KafkaConsumer({
  clientId: 'my-service',
  groupId: 'my-group',
  fromBeginning: false,

  // ✅ Session & heartbeat
  sessionTimeout: 30000, // Timeout to detect failures
  rebalanceTimeout: 60000, // Max time for rejoin
  heartbeatInterval: 3000, // Heartbeat frequency

  // ✅ Metadata & topics
  metadataMaxAge: 300000, // 5 minutes
  allowAutoTopicCreation: true,

  // ✅ Fetching
  maxBytesPerPartition: 1048576, // 1MB
  minBytes: 1,
  maxBytes: 10485760, // 10MB
  maxWaitTimeInMs: 5000,

  // ✅ Advanced
  readUncommitted: false, // Read uncommitted transactions
  maxInFlightRequests: null, // No limit
  rackId: 'us-east-1a', // ✅ NEW: Follower fetching!

  // ✅ Retry
  retry: {
    retries: 5,
    initialRetryTime: 100,
  },
});
```

---

### **2. Regex Topic Subscription** 🎯

**Before:**

```typescript
// Only string arrays
await consumer.subscribe(['topic-A', 'topic-B'], false);
```

**After:**

```typescript
// ✅ String arrays
await consumer.subscribe(['topic-A', 'topic-B'], false);

// ✅ NEW: Regex patterns!
await consumer.subscribe([/topic-(eu|us)-.*/i], false);
```

**Use case:** Subscribe to all topics matching a pattern (e.g., all regional topics).

---

### **3. Full `consumer.run()` Support** 🏃

**Before:**

```typescript
// Limited options
await consumer.run();
```

**After:**

```typescript
await consumer.run({
  // ✅ Partition-aware concurrency
  partitionsConsumedConcurrently: 3, // Process 3 partitions concurrently

  // ✅ Auto commit options
  autoCommit: true,
  autoCommitInterval: 5000, // Commit every 5 seconds
  autoCommitThreshold: 100, // Or every 100 messages

  // ✅ eachMessage handler
  eachMessage: async ({ topic, partition, message, heartbeat, pause }) => {
    console.log('Message:', message.value.toString());
    await heartbeat(); // Send heartbeat
    // pause() returns resume function
  },
});
```

---

### **4. `eachBatch` Support (Advanced)** 📦

**NEW:** For advanced use cases requiring batch processing:

```typescript
await consumer.run({
  eachBatchAutoResolve: true, // Auto-resolve batch

  eachBatch: async ({
    batch,
    resolveOffset,
    heartbeat,
    commitOffsetsIfNecessary,
    uncommittedOffsets,
    isRunning,
    isStale,
    pause,
  }) => {
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

**Benefits:**

- ✅ Access to `highWatermark` for lag calculation
- ✅ Control over offset resolution
- ✅ Can stop mid-batch on shutdown (`isRunning()`)
- ✅ Detect stale batches (`isStale()`)

---

### **5. Partition-Aware Concurrency** ⚡

**NEW:** Process multiple partitions concurrently:

```typescript
await consumer.run({
  partitionsConsumedConcurrently: 3, // Default: 1

  eachMessage: async ({ topic, partition, message }) => {
    // This will be called up to 3 times concurrently
    // Messages in same partition still processed in order!
    await processMessage(message);
  },
});
```

**Benefits:**

- ✅ Higher throughput for I/O-bound workloads
- ✅ Messages in same partition remain ordered
- ✅ Better resource utilization

**Guideline:** Set to number of partitions consumed or number of CPU cores.

---

### **6. Auto Commit Options** 🔄

**Before:**

```typescript
// No control over auto commit
```

**After:**

```typescript
await consumer.run({
  // Commit after 5 seconds
  autoCommitInterval: 5000,

  // OR commit after 100 messages
  autoCommitThreshold: 100,

  // OR both (whichever comes first)
  autoCommitInterval: 5000,
  autoCommitThreshold: 100,

  eachMessage: async ({ topic, message }) => {
    // Offsets auto-committed based on above settings
  },
});
```

**Benefits:**

- ✅ Faster recovery from failures
- ✅ Balance between performance and safety

---

### **7. Manual Commit Support** 🎛️

**NEW:** Full control over offset commits:

```typescript
await consumer.run({
  autoCommit: false, // Disable auto commit

  eachMessage: async ({ topic, partition, message }) => {
    // Process message
    await saveToDatabase(message);
  },
});

// Manually commit specific offsets
await consumer.commitOffsets([
  { topic: 'topic-A', partition: 0, offset: '100' },
  { topic: 'topic-A', partition: 1, offset: '250' },
  { topic: 'topic-B', partition: 0, offset: '50' },
]);
```

**Use case:** Atomic commits with external storage (e.g., SQL database).

---

### **8. Enhanced Pause/Resume** ⏸️

**Before:**

```typescript
// Topic-level only
await consumer.pause(['topic-A']);
await consumer.resume(['topic-A']);
```

**After:**

```typescript
// ✅ Topic-level
consumer.pause([{ topic: 'topic-A' }]);

// ✅ NEW: Partition-level!
consumer.pause([
  { topic: 'topic-A', partitions: [0, 1] }, // Pause specific partitions
  { topic: 'topic-B' }, // Pause entire topic
]);

// Resume
consumer.resume([{ topic: 'topic-A', partitions: [0, 1] }]);

// ✅ Get paused topics/partitions
const paused = consumer.paused();
console.log(paused); // [{ topic: 'topic-A', partitions: [0, 1] }]
```

**Use case:** Handle backpressure per partition.

---

### **9. Describe Consumer Group** 📊

**NEW:** Get consumer group metadata:

```typescript
const groupInfo = await consumer.describeGroup();

console.log(groupInfo);
// {
//   errorCode: 0,
//   groupId: 'my-group',
//   members: [
//     {
//       clientHost: '/172.19.0.1',
//       clientId: 'my-service',
//       memberId: 'my-service-abc-123',
//       memberAssignment: Buffer,
//       memberMetadata: Buffer,
//     }
//   ],
//   protocol: 'RoundRobinAssigner',
//   protocolType: 'consumer',
//   state: 'Stable',
// }
```

**Use case:** Monitoring, debugging, rebalancing detection.

---

### **10. Follower Fetching (rackId)** 🌍

**NEW:** Reduce cross-region/AZ costs:

```typescript
const consumer = new KafkaConsumer({
  groupId: 'my-group',
  rackId: 'us-east-1a', // ✅ Fetch from same rack when possible
});
```

**Benefits:**

- ✅ Reduced data transfer costs (across regions/AZs)
- ✅ Better performance (lower latency)
- ✅ Flexible "rack" definition (regions, AZs, data centers)

---

## 📊 Complete Comparison Table

| Feature                            | Before | After | Benefit                           |
| ---------------------------------- | ------ | ----- | --------------------------------- |
| **sessionTimeout**                 | ✅     | ✅    | Detect failures                   |
| **rebalanceTimeout**               | ❌     | ✅    | Control rebalance time            |
| **heartbeatInterval**              | ✅     | ✅    | Heartbeat frequency               |
| **metadataMaxAge**                 | ❌     | ✅    | Metadata refresh control          |
| **allowAutoTopicCreation**         | ❌     | ✅    | Explicit topic creation           |
| **maxBytesPerPartition**           | ❌     | ✅    | Control fetch size                |
| **minBytes/maxBytes**              | ❌     | ✅    | Fetch size control                |
| **maxWaitTimeInMs**                | ✅     | ✅    | Fetch wait time                   |
| **readUncommitted**                | ❌     | ✅    | Read uncommitted transactions     |
| **maxInFlightRequests**            | ❌     | ✅    | Control concurrent requests       |
| **rackId (follower fetching)**     | ❌     | ✅    | Reduce cross-region costs         |
| **Regex topic subscription**       | ❌     | ✅    | Pattern-based subscription        |
| **partitionsConsumedConcurrently** | ❌     | ✅    | Concurrent partition processing   |
| **autoCommitInterval**             | ❌     | ✅    | Time-based auto commit            |
| **autoCommitThreshold**            | ❌     | ✅    | Message-count-based auto commit   |
| **autoCommit disable**             | ❌     | ✅    | Manual commit control             |
| **eachMessage**                    | ⚠️     | ✅    | Full eachMessage support          |
| **eachBatch**                      | ❌     | ✅    | Batch processing support          |
| **eachBatchAutoResolve**           | ❌     | ✅    | Auto-resolve batch offsets        |
| **commitOffsets**                  | ❌     | ✅    | Manual offset commits             |
| **describeGroup**                  | ❌     | ✅    | Consumer group metadata           |
| **Partition-level pause/resume**   | ❌     | ✅    | Fine-grained backpressure control |
| **paused()**                       | ❌     | ✅    | Get paused topics/partitions      |

---

## 🎯 Real-World Use Cases

### **1. Partition-Aware Concurrency**

```typescript
await consumer.run({
  partitionsConsumedConcurrently: 3,

  eachMessage: async ({ topic, partition, message, pause }) => {
    try {
      await sendToExternalAPI(message);
    } catch (e) {
      if (e instanceof RateLimitError) {
        // Pause only this partition
        const resume = pause();
        setTimeout(resume, e.retryAfter * 1000);
      }
      throw e;
    }
  },
});
```

### **2. Batch Processing with Manual Control**

```typescript
await consumer.run({
  eachBatchAutoResolve: false, // Manual control

  eachBatch: async ({ batch, resolveOffset, heartbeat, isRunning, isStale }) => {
    for (const message of batch.messages) {
      // Check if shutting down
      if (!isRunning() || isStale()) break;

      // Process message
      await processMessage(message);

      // Mark as processed
      resolveOffset(message.offset);

      // Heartbeat every message
      await heartbeat();
    }
    // Offsets committed only for resolved messages
  },
});
```

### **3. Exactly-Once with External Storage**

```typescript
await consumer.run({
  autoCommit: false, // Disable auto commit

  eachMessage: async ({ topic, partition, message }) => {
    // Store message + offset atomically in SQL
    await db.transaction(async (tx) => {
      await tx.insert({ data: message.value, offset: message.offset });
      // Offset stored with data - atomic!
    });
  },
});

// On restart, seek to stored offset
const lastOffset = await db.query('SELECT offset FROM processed_messages ORDER BY offset DESC LIMIT 1');
consumer.seek({ topic: 'my-topic', partition: 0, offset: lastOffset });
```

### **4. Auto Commit with Interval + Threshold**

```typescript
await consumer.run({
  autoCommitInterval: 5000, // Commit every 5 seconds
  autoCommitThreshold: 100, // OR every 100 messages (whichever first)

  eachMessage: async ({ topic, message }) => {
    await processMessage(message);
    // Offsets auto-committed when either condition met
  },
});
```

### **5. Follower Fetching (Cost Optimization)**

```typescript
// Consumers in us-east-1a
const consumerEast = new KafkaConsumer({
  groupId: 'my-group',
  rackId: 'us-east-1a', // Fetch from same AZ
});

// Consumers in eu-west-1b
const consumerEU = new KafkaConsumer({
  groupId: 'my-group',
  rackId: 'eu-west-1b', // Fetch from same AZ
});

// Result: Reduced cross-AZ data transfer costs!
```

---

## 🚀 Migration Guide

### **Existing Code (Still Works!)**

```typescript
// Old API still supported
const consumer = new KafkaConsumer({
  clientId: 'my-service',
  groupId: 'my-group',
});

await consumer.connect();
await consumer.subscribe(['my-topic'], false);
await consumer.run({
  eachMessage: async ({ topic, message }) => {
    console.log(message.value.toString());
  },
});
```

### **Taking Advantage of New Features**

```typescript
// Enhanced configuration
const consumer = new KafkaConsumer({
  clientId: 'my-service',
  groupId: 'my-group',
  rackId: 'us-east-1a', // ✅ NEW: Follower fetching
  maxBytesPerPartition: 2097152, // ✅ 2MB (increased from 1MB)
});

await consumer.connect();

// ✅ NEW: Regex subscription
await consumer.subscribe([/topic-(prod|staging)-.*/i], false);

await consumer.run({
  partitionsConsumedConcurrently: 3, // ✅ NEW: Concurrency
  autoCommitInterval: 5000, // ✅ NEW: Auto commit options
  autoCommitThreshold: 100,

  eachMessage: async ({ topic, message, heartbeat, pause }) => {
    await processMessage(message);
    await heartbeat(); // ✅ Manual heartbeat
  },
});
```

---

## ✅ Summary

**Improvements Made:**

1. ✅ **Complete configuration options** - All KafkaJS consumer options
2. ✅ **Regex topic subscription** - Pattern-based subscriptions
3. ✅ **Partition-aware concurrency** - Process multiple partitions concurrently
4. ✅ **Auto commit options** - Interval + threshold-based commits
5. ✅ **eachBatch support** - Advanced batch processing
6. ✅ **Manual commits** - `commitOffsets()` for full control
7. ✅ **Partition-level pause/resume** - Fine-grained backpressure
8. ✅ **describeGroup()** - Consumer group metadata
9. ✅ **Follower fetching** - `rackId` for cost optimization
10. ✅ **Full type safety** - Comprehensive TypeScript types

**What Stays the Same:**

- ✅ **Backward compatible** - No breaking changes
- ✅ **Simple API** - Easy to use
- ✅ **Same reliability** - Battle-tested KafkaJS

**Based on:**

- 📚 Official KafkaJS consumer documentation
- 🏆 Best practices from Apache Kafka
- 💼 Real-world production patterns

---

**All improvements follow the official KafkaJS documentation!** 🎉
