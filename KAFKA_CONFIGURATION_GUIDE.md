# ⚙️ Kafka Configuration Guide - Service-Specific Customization

Complete guide to configuring Kafka adapters for different service needs.

---

## 🎯 **Philosophy**

**Sensible defaults for financial events**, but **fully customizable** per service.

Different services have different needs:

- 💰 **Ledger Service**: Maximum reliability (idempotent, all replicas)
- 📊 **Analytics Service**: Maximum throughput (idempotent: false, acks: 0)
- 🔄 **Replay Service**: Read from beginning (fromBeginning: true)
- 🌍 **Multi-Region**: Cost optimization (rackId)

---

## 📦 **Default Configuration**

### **What You Get Out-of-the-Box:**

```typescript
import { EventPublisher } from '@packages/events';

// ✅ Works immediately with sensible defaults
const publisher = new EventPublisher('my-service');
await publisher.initialize();
await publisher.publish(event);
```

**Default Values:**

```typescript
// Producer
idempotent: true; // Prevent duplicates
maxInFlightRequests: 5; // Balance ordering/throughput
transactional: false; // Transactions disabled
compressionType: 'snappy'; // Fast compression
allowAutoTopicCreation: false; // Topics must be created explicitly

// Consumer
fromBeginning: false; // Start from latest
sessionTimeout: 30000; // 30s
heartbeatInterval: 3000; // 3s
maxBytesPerPartition: 1048576; // 1MB
rackId: undefined; // No follower fetching

// Run
partitionsConsumedConcurrently: 1; // Sequential
autoCommit: true; // Auto commit enabled
autoCommitInterval: 5000; // Every 5s
autoCommitThreshold: 100; // Or every 100 messages

// Send
acks: -1; // All replicas (maximum reliability)
timeout: 30000; // 30s
compression: 'snappy'; // Fast compression
```

**Perfect for:** Financial services (payments, ledger, transfers)

---

## 🔧 **Service-Specific Configurations**

### **1. Ledger Service (Maximum Reliability)** 💰

```typescript
import {
  EventPublisher,
  EventSubscriber,
  type EventPublisherConfig,
  type EventSubscriberConfig,
} from '@packages/events';

// Publisher: Maximum reliability
const publisherConfig: EventPublisherConfig = {
  kafka: {
    producer: {
      idempotent: true, // ✅ Prevent duplicates
      transactional: true, // ✅ Enable transactions for atomic writes
      maxInFlightRequests: 1, // ✅ Strict ordering (required for transactions)
    },
    send: {
      acks: -1, // ✅ All replicas must acknowledge
      timeout: 60000, // ✅ 60s (longer for critical operations)
      compression: 'gzip', // ✅ Better compression for archival
    },
  },
};

const publisher = new EventPublisher('ledger-service', publisherConfig);

// Subscriber: Exactly-once processing
const subscriberConfig: EventSubscriberConfig = {
  kafka: {
    consumer: {
      fromBeginning: true, // ✅ Replay all history on first start
      sessionTimeout: 60000, // ✅ 60s (longer for DB-heavy operations)
    },
    run: {
      autoCommit: false, // ✅ Manual commit for exactly-once
      partitionsConsumedConcurrently: 1, // ✅ Sequential (maintain order)
    },
  },
};

const subscriber = new EventSubscriber('ledger-service', subscriberConfig);
```

---

### **2. Analytics Service (Maximum Throughput)** 📊

```typescript
const publisherConfig: EventPublisherConfig = {
  kafka: {
    producer: {
      idempotent: false, // ❌ Don't need (duplicates acceptable for analytics)
      maxInFlightRequests: 10, // ✅ High throughput
      compressionType: 'snappy', // ✅ Fast compression
    },
    send: {
      acks: 0, // ✅ Fire-and-forget (fastest!)
      timeout: 10000, // ✅ 10s (lower timeout)
      compression: 'snappy',
    },
  },
};

const subscriberConfig: EventSubscriberConfig = {
  kafka: {
    consumer: {
      fromBeginning: false, // Latest only
      maxBytesPerPartition: 2097152, // ✅ 2MB (larger for throughput)
      maxWaitTimeInMs: 3000, // ✅ 3s (lower latency)
    },
    run: {
      partitionsConsumedConcurrently: 5, // ✅ 5x throughput!
      autoCommitInterval: 10000, // ✅ 10s (commit less often)
      autoCommitThreshold: 500, // ✅ 500 messages (higher threshold)
    },
  },
};

const publisher = new EventPublisher('analytics-service', publisherConfig);
const subscriber = new EventSubscriber('analytics-service', subscriberConfig);
```

---

### **3. Replay Service (Historical Data)** 🔄

```typescript
const subscriberConfig: EventSubscriberConfig = {
  kafka: {
    consumer: {
      fromBeginning: true, // ✅ Read ALL history from offset 0
      sessionTimeout: 120000, // ✅ 2 minutes (long processing)
      heartbeatInterval: 5000, // ✅ 5s (less frequent heartbeats)
    },
    run: {
      autoCommit: true,
      autoCommitInterval: 30000, // ✅ 30s (commit less often during replay)
      autoCommitThreshold: 1000, // ✅ 1000 messages (higher for replay)
      partitionsConsumedConcurrently: 3, // ✅ Faster replay
    },
  },
};

const subscriber = new EventSubscriber('replay-service', subscriberConfig);
```

---

### **4. Multi-Region Service (Cost Optimization)** 🌍

```typescript
const subscriberConfig: EventSubscriberConfig = {
  kafka: {
    consumer: {
      rackId: process.env.AWS_AVAILABILITY_ZONE, // ✅ e.g., "us-east-1a"
      // Fetch from same AZ (90% cost savings!)
    },
  },
};

const subscriber = new EventSubscriber('regional-service', subscriberConfig);
```

**Savings:** $10,000+/year for high-volume applications!

---

### **5. Fraud Detection (Real-Time)** 🚨

```typescript
const subscriberConfig: EventSubscriberConfig = {
  kafka: {
    consumer: {
      fromBeginning: false, // Latest only (real-time)
      maxWaitTimeInMs: 1000, // ✅ 1s (low latency!)
    },
    run: {
      partitionsConsumedConcurrently: 5, // ✅ High throughput
      autoCommitInterval: 2000, // ✅ 2s (commit frequently for real-time)
    },
  },
};

const subscriber = new EventSubscriber('fraud-detection', subscriberConfig);
```

---

### **6. Metrics/Logs (Fire-and-Forget)** 📝

```typescript
const publisherConfig: EventPublisherConfig = {
  kafka: {
    producer: {
      idempotent: false, // ❌ Don't need (duplicates OK for logs)
      maxInFlightRequests: 20, // ✅ Maximum throughput
    },
    send: {
      acks: 0, // ✅ No acknowledgment (fastest!)
      timeout: 5000, // ✅ 5s (low timeout)
      compression: 'snappy',
    },
  },
};

const publisher = new EventPublisher('metrics-service', publisherConfig);
```

---

## 📊 **Configuration Matrix**

| Service Type        | idempotent | acks | fromBeginning | concurrency | Reason                      |
| ------------------- | ---------- | ---- | ------------- | ----------- | --------------------------- |
| **Ledger**          | ✅ true    | -1   | ✅ true       | 1           | Exactly-once, ordered       |
| **Analytics**       | ❌ false   | 0    | ❌ false      | 5           | Throughput over reliability |
| **Replay**          | ✅ true    | -1   | ✅ true       | 3           | Rebuild state from history  |
| **Fraud Detection** | ✅ true    | -1   | ❌ false      | 5           | Real-time, high throughput  |
| **Metrics/Logs**    | ❌ false   | 0    | ❌ false      | 10          | Fire-and-forget             |
| **Multi-Region**    | ✅ true    | -1   | ❌ false      | 1           | Cost optimization (rackId)  |

---

## 🎯 **Complete Configuration Examples**

### **Example 1: Payment Service**

```typescript
import { EventPublisher, type EventPublisherConfig } from "@packages/events";

const config: EventPublisherConfig = {
  kafka: {
    // Producer settings
    producer: {
      idempotent: true, // Prevent duplicate payments
      transactional: true, // Enable transactions (debit + credit atomic)
      maxInFlightRequests: 1, // Required for transactions
    },

    // Send settings
    send: {
      acks: -1, // All replicas must acknowledge
      timeout: 60000, // 60s for critical operations
      compression: 'gzip', // Better compression for long retention
    },
  },
};

const publisher = new EventPublisher("payment-service", config);
await publisher.initialize();

// Use normally
await publisher.publish({
  eventType: "payment.completed",
  data: { ... },
});
```

---

### **Example 2: Analytics Service**

```typescript
import { EventSubscriber, type EventSubscriberConfig } from '@packages/events';

const config: EventSubscriberConfig = {
  kafka: {
    // Consumer settings
    consumer: {
      fromBeginning: false, // Latest only (real-time analytics)
      maxBytesPerPartition: 2097152, // 2MB (higher throughput)
      maxWaitTimeInMs: 3000, // 3s (lower latency)
      rackId: 'us-east-1a', // Follower fetching (cost savings)
    },

    // Run settings
    run: {
      partitionsConsumedConcurrently: 5, // 5x throughput
      autoCommit: true,
      autoCommitInterval: 10000, // 10s (commit less often)
      autoCommitThreshold: 500, // 500 messages
    },
  },
};

const subscriber = new EventSubscriber('analytics-service', config);
await subscriber.initialize();

await subscriber.subscribe(['payment.completed', 'transfer.completed'], async (event, data) => {
  await analytics.process(data);
});
```

---

### **Example 3: Rebuild Service (Replay All History)**

```typescript
const config: EventSubscriberConfig = {
  kafka: {
    consumer: {
      fromBeginning: true, // ✅ Read from offset 0
      sessionTimeout: 120000, // 2 minutes (long-running tasks)
      heartbeatInterval: 10000, // 10s (less frequent)
    },
    run: {
      partitionsConsumedConcurrently: 3, // Faster replay
      autoCommitInterval: 60000, // 1 minute (commit less often)
      autoCommitThreshold: 5000, // 5000 messages
    },
  },
};

const subscriber = new EventSubscriber('rebuild-ledger-service', config);
await subscriber.initialize();

await subscriber.subscribe(['ledger.entry.created'], async (event, data) => {
  await rebuildLedger(data);
});
```

---

### **Example 4: Multi-Region with Cost Optimization**

```typescript
// AWS deployment with follower fetching
const region = process.env.AWS_REGION; // e.g., "us-east-1"
const az = process.env.AWS_AVAILABILITY_ZONE; // e.g., "us-east-1a"

const config: EventSubscriberConfig = {
  kafka: {
    consumer: {
      rackId: az, // ✅ Fetch from same AZ (90% cost reduction!)
      maxBytesPerPartition: 1048576, // 1MB
    },
  },
};

const subscriber = new EventSubscriber('regional-service', config);
```

**Annual Savings:** $10,000+ for high-volume apps!

---

## 🎨 **Mix and Match**

### **Custom Combination:**

```typescript
const config: EventPublisherConfig = {
  kafka: {
    // Producer: Moderate reliability
    producer: {
      idempotent: true, // Prevent duplicates
      maxInFlightRequests: 5, // Good throughput
      transactional: false, // No transactions needed
    },

    // Send: Leader-only (faster than all replicas)
    send: {
      acks: 1, // Leader only (balanced)
      timeout: 20000, // 20s
      compression: 'snappy',
    },
  },
};
```

---

## 📚 **Configuration Options Reference**

### **Producer Options**

```typescript
producer?: {
  idempotent?: boolean;              // Default: true (prevent duplicates)
  maxInFlightRequests?: number;      // Default: 5 (balance order/throughput)
  transactional?: boolean;           // Default: false (enable transactions)
  compressionType?: 'gzip' | 'snappy' | 'lz4' | 'zstd'; // Default: 'snappy'
  allowAutoTopicCreation?: boolean;  // Default: false
  retry?: {
    retries?: number;                // Default: 8
    initialRetryTime?: number;       // Default: 100
  };
}
```

### **Consumer Options**

```typescript
consumer?: {
  fromBeginning?: boolean;           // Default: false (start from latest)
  sessionTimeout?: number;           // Default: 30000 (30s)
  rebalanceTimeout?: number;         // Default: 60000 (60s)
  heartbeatInterval?: number;        // Default: 3000 (3s)
  maxBytesPerPartition?: number;     // Default: 1048576 (1MB)
  maxBytes?: number;                 // Default: 10485760 (10MB)
  maxWaitTimeInMs?: number;          // Default: 5000 (5s)
  rackId?: string;                   // Default: undefined (no follower fetching)
  readUncommitted?: boolean;         // Default: false
  retry?: {
    retries?: number;                // Default: 5
    initialRetryTime?: number;       // Default: 100
  };
}
```

### **Run Options**

```typescript
run?: {
  partitionsConsumedConcurrently?: number; // Default: 1
  autoCommit?: boolean;                    // Default: true
  autoCommitInterval?: number;             // Default: 5000
  autoCommitThreshold?: number;            // Default: 100
  eachBatchAutoResolve?: boolean;          // Default: true
}
```

### **Send Options**

```typescript
send?: {
  acks?: -1 | 0 | 1;                       // Default: -1 (all replicas)
  timeout?: number;                        // Default: 30000 (30s)
  compression?: 'gzip' | 'snappy' | 'lz4' | 'zstd' | 'none'; // Default: 'snappy'
}
```

---

## 🎯 **When to Override Defaults**

### **Override `idempotent: false`** when:

- ✅ Non-critical events (analytics, metrics, logs)
- ✅ Duplicates are acceptable
- ✅ Need maximum throughput

### **Override `acks: 0`** when:

- ✅ Fire-and-forget events (metrics, logs)
- ✅ Speed > reliability
- ✅ Can tolerate message loss

### **Override `fromBeginning: true`** when:

- ✅ Rebuilding state from scratch
- ✅ New service needs historical data
- ✅ Replay/audit scenarios

### **Override `partitionsConsumedConcurrently`** when:

- ✅ I/O-bound work load (API calls, DB queries)
- ✅ Need higher throughput
- ✅ Messages can be processed out of order (across partitions)

### **Override `rackId`** when:

- ✅ Multi-region/multi-AZ deployment
- ✅ High data volume (cost savings)
- ✅ AWS/GCP/Azure environments

### **Override `transactional: true`** when:

- ✅ Need exactly-once semantics
- ✅ Atomic multi-topic writes
- ✅ Financial operations (payments, transfers)

### **Override `autoCommit: false`** when:

- ✅ Need exactly-once with external storage
- ✅ Atomic commits with database
- ✅ Manual offset control required

---

## ⚠️ **Common Mistakes**

### **❌ Don't Do This:**

```typescript
// Using idempotent: false for financial events
const config: EventPublisherConfig = {
  kafka: {
    producer: {
      idempotent: false, // ❌ BAD for payments!
    },
  },
};

const publisher = new EventPublisher('payment-service', config);
// ❌ Risk of duplicate payments!
```

### **✅ Do This Instead:**

```typescript
// Keep idempotent: true for financial events
const config: EventPublisherConfig = {
  kafka: {
    producer: {
      idempotent: true, // ✅ GOOD!
      transactional: true, // ✅ Even better!
    },
  },
};
```

---

### **❌ Don't Do This:**

```typescript
// Using acks: 0 for ledger entries
const config: EventPublisherConfig = {
  kafka: {
    send: {
      acks: 0, // ❌ BAD! Ledger entries might be lost
    },
  },
};
```

### **✅ Do This Instead:**

```typescript
// Use acks: -1 for critical financial data
const config: EventPublisherConfig = {
  kafka: {
    send: {
      acks: -1, // ✅ All replicas acknowledge
    },
  },
};
```

---

## 🚀 **Migration Guide**

### **Existing Code (Still Works!)**

```typescript
// ✅ No changes needed! Works with defaults
const publisher = new EventPublisher('my-service');
await publisher.initialize();
await publisher.publish(event);
```

### **With Custom Config:**

```typescript
// ✅ Add config when needed
const publisher = new EventPublisher('my-service', {
  kafka: {
    producer: { transactional: true },
    send: { acks: -1 },
  },
});

await publisher.initialize();
await publisher.publish(event); // Same API!
```

---

## 📖 **Environment-Based Configuration**

### **Use Environment Variables:**

```typescript
const publisherConfig: EventPublisherConfig = {
  kafka: {
    consumer: {
      rackId: process.env.KAFKA_RACK_ID, // From environment
      fromBeginning: process.env.KAFKA_FROM_BEGINNING === 'true',
    },
    run: {
      partitionsConsumedConcurrently: parseInt(process.env.KAFKA_PARTITION_CONCURRENCY || '1'),
    },
  },
};

const publisher = new EventPublisher('my-service', publisherConfig);
```

**Environment Variables:**

```bash
KAFKA_RACK_ID=us-east-1a
KAFKA_FROM_BEGINNING=false
KAFKA_PARTITION_CONCURRENCY=5
```

---

## ✅ **Summary**

### **Key Points:**

✅ **Defaults are sensible** - Optimized for financial events  
✅ **Fully customizable** - Override any setting per service  
✅ **Type-safe** - TypeScript catches configuration errors  
✅ **No breaking changes** - Existing code still works  
✅ **Service-specific** - Different services, different configs

### **When to Customize:**

| Setting                          | Override When...                       |
| -------------------------------- | -------------------------------------- |
| `idempotent`                     | Analytics/logs (duplicates OK)         |
| `acks`                           | Fire-and-forget events                 |
| `fromBeginning`                  | Replay/rebuild scenarios               |
| `partitionsConsumedConcurrently` | I/O-bound workloads                    |
| `rackId`                         | Multi-region deployment (cost savings) |
| `transactional`                  | Financial operations (exactly-once)    |
| `autoCommit`                     | Manual commit control needed           |

### **Configuration Levels:**

```
1. Defaults (built into adapter)
   ↓
2. Service-level config (EventPublisher/EventSubscriber constructor)
   ↓
3. Runtime overrides (if needed in future)
```

**Flexible, type-safe, and production-ready!** 🚀
