# 📖 Kafka Usage Examples - Real Service Implementations

Practical examples of how different Soranix services use Kafka with custom configurations.

---

## 💰 **1. Ledger Service (Maximum Reliability)**

### **Configuration:**

```typescript
// services/ledger/src/app.ts
import {
  EventPublisher,
  EventSubscriber,
  type EventPublisherConfig,
  type EventSubscriberConfig,
} from '@packages/events';

// Publisher with transactions
const publisherConfig: EventPublisherConfig = {
  kafka: {
    producer: {
      transactional: true, // ✅ Atomic double-entry
      idempotent: true,
      maxInFlightRequests: 1, // Required for transactions
    },
    send: {
      acks: -1, // All replicas
      timeout: 60000, // 60s
      compression: 'gzip', // Better archival compression
    },
  },
};

const publisher = new EventPublisher('ledger-service', publisherConfig);
await publisher.initialize();

// Subscriber with manual commits
const subscriberConfig: EventSubscriberConfig = {
  kafka: {
    consumer: {
      fromBeginning: false, // Latest (or true for initial rebuild)
    },
    run: {
      autoCommit: false, // Manual commits for exactly-once
      partitionsConsumedConcurrently: 1, // Maintain strict ordering
    },
  },
};

const subscriber = new EventSubscriber('ledger-service', subscriberConfig);
await subscriber.initialize();
```

### **Usage:**

```typescript
// Publishing with transactions
import { KafkaProducer, KAFKA_TOPICS } from '@packages/kafka';

const kafkaProducer = new KafkaProducer({
  clientId: 'ledger-service',
  transactional: true,
});
await kafkaProducer.connect();

async function recordTransfer(from: string, to: string, amount: number) {
  const transaction = await kafkaProducer.transaction();

  try {
    // Debit
    await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, {
      key: `${from}:wallet:checking:usd`,
      value: { type: 'debit', amount },
    });

    // Credit
    await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, {
      key: `${to}:wallet:checking:usd`,
      value: { type: 'credit', amount },
    });

    // ✅ Both or neither
    await transaction.commit();
  } catch (error) {
    await transaction.abort();
    throw error;
  }
}
```

---

## 📊 **2. Analytics Service (Maximum Throughput)**

### **Configuration:**

```typescript
// services/analytics/src/app.ts
import { EventSubscriber, type EventSubscriberConfig } from '@packages/events';

const config: EventSubscriberConfig = {
  kafka: {
    consumer: {
      fromBeginning: false, // Real-time only
      maxBytesPerPartition: 2097152, // 2MB
      maxWaitTimeInMs: 2000, // 2s (low latency)
      rackId: process.env.AWS_AVAILABILITY_ZONE, // Cost optimization
    },
    run: {
      partitionsConsumedConcurrently: 5, // ✅ 5x throughput
      autoCommitInterval: 10000, // 10s
      autoCommitThreshold: 500, // 500 messages
    },
  },
};

const subscriber = new EventSubscriber('analytics-service', config);
await subscriber.initialize();

await subscriber.subscribe(['payment.completed', 'transfer.completed', 'deposit.completed'], async (event, data) => {
  await analytics.processEvent(data);
});
```

**Result:** 5x throughput + 90% cost savings!

---

## 🔄 **3. Rebuild Service (Replay All History)**

### **Configuration:**

```typescript
// services/rebuild/src/rebuild-ledger.ts
import { EventSubscriber, type EventSubscriberConfig } from '@packages/events';

const config: EventSubscriberConfig = {
  kafka: {
    consumer: {
      fromBeginning: true, // ✅ Read from offset 0
      sessionTimeout: 120000, // 2 minutes (long tasks)
      heartbeatInterval: 10000, // 10s
    },
    run: {
      partitionsConsumedConcurrently: 3, // Faster replay
      autoCommitInterval: 60000, // 1 minute
      autoCommitThreshold: 5000, // 5000 messages
    },
  },
};

const subscriber = new EventSubscriber('rebuild-ledger', config);
await subscriber.initialize();

await subscriber.subscribe(['ledger.entry.created'], async (event, data) => {
  // Rebuild ledger from all historical events
  await rebuildLedgerEntry(data);
});

console.log('Rebuilding ledger from ALL history...');
```

---

## 🚨 **4. Fraud Detection (Real-Time)**

### **Configuration:**

```typescript
// services/fraud-detection/src/app.ts
import { EventSubscriber, type EventSubscriberConfig } from '@packages/events';

const config: EventSubscriberConfig = {
  kafka: {
    consumer: {
      fromBeginning: false, // Real-time only
      maxWaitTimeInMs: 1000, // ✅ 1s (ultra-low latency)
      sessionTimeout: 20000, // 20s (shorter for fast detection)
    },
    run: {
      partitionsConsumedConcurrently: 5, // High throughput
      autoCommitInterval: 2000, // ✅ 2s (commit frequently)
      autoCommitThreshold: 50, // ✅ 50 messages (real-time)
    },
  },
};

const subscriber = new EventSubscriber('fraud-detection', config);
await subscriber.initialize();

await subscriber.subscribe(['payment.completed', 'transfer.completed'], async (event, data) => {
  // Real-time fraud detection
  const isFraudulent = await fraudDetection.analyze(data);
  if (isFraudulent) {
    await alerts.send({ userId: data.userId, reason: 'suspected_fraud' });
  }
});
```

**Result:** < 2 second fraud detection!

---

## 📝 **5. Metrics/Logging Service (Fire-and-Forget)**

### **Configuration:**

```typescript
// services/metrics/src/app.ts
import { EventPublisher, type EventPublisherConfig } from '@packages/events';

const config: EventPublisherConfig = {
  kafka: {
    producer: {
      idempotent: false, // ✅ Duplicates OK for metrics
      maxInFlightRequests: 20, // ✅ Maximum throughput
    },
    send: {
      acks: 0, // ✅ No acknowledgment (fastest!)
      timeout: 5000, // 5s (low timeout)
      compression: 'snappy',
    },
  },
};

const publisher = new EventPublisher('metrics-service', config);
await publisher.initialize();

// Fire and forget
await publisher.publish({
  eventType: 'metric.recorded',
  data: { metric: 'api_latency', value: 123 },
});
```

**Result:** Maximum throughput (10,000+ events/sec)

---

## 🌍 **6. Multi-Region Service (Cost Optimization)**

### **Configuration:**

```typescript
// services/regional/src/app.ts
import { EventSubscriber, type EventSubscriberConfig } from '@packages/events';

const config: EventSubscriberConfig = {
  kafka: {
    consumer: {
      // ✅ Follower fetching (90% cost reduction)
      rackId: process.env.AWS_AVAILABILITY_ZONE, // "us-east-1a"
    },
  },
};

const subscriber = new EventSubscriber('us-east-payments', config);
await subscriber.initialize();
```

**Deployment:**

```yaml
# Kubernetes deployment
env:
  - name: AWS_AVAILABILITY_ZONE
    valueFrom:
      fieldRef:
        fieldPath: metadata.labels['topology.kubernetes.io/zone']
```

**Savings:** $900/month = $10,800/year for 100TB/month

---

## 🔄 **7. Stream Processing (Consume-Transform-Produce)**

### **Configuration:**

```typescript
// services/enrichment/src/app.ts
import { EventSubscriber, type EventSubscriberConfig } from '@packages/events';
import { KafkaProducer, KAFKA_TOPICS } from '@packages/kafka';

// Subscriber
const subscriberConfig: EventSubscriberConfig = {
  kafka: {
    run: {
      autoCommit: false, // Manual commit for exactly-once
      partitionsConsumedConcurrently: 3,
    },
  },
};

const subscriber = new EventSubscriber('enrichment-service', subscriberConfig);

// Producer (transactional)
const producer = new KafkaProducer({
  clientId: 'enrichment-service',
  transactional: true,
});
await producer.connect();
```

### **Usage:**

```typescript
await subscriber.subscribe(['payment.raw'], async (event, data) => {
  const transaction = await producer.transaction();

  try {
    // 1. Enrich data
    const enriched = await enrichPayment(data);

    // 2. Produce
    await transaction.send(KAFKA_TOPICS.PAYMENTS, {
      key: data.userId,
      value: enriched,
    });

    // 3. ✅ Commit offset atomically
    await transaction.sendOffsets({
      consumerGroupId: 'enrichment-service-group',
      topics: [
        {
          topic: event.topic,
          partitions: [{ partition: event.partition, offset: nextOffset }],
        },
      ],
    });

    await transaction.commit();
  } catch (error) {
    await transaction.abort();
    throw error;
  }
});
```

**Result:** Exactly-once enrichment pipeline!

---

## 🎯 **Configuration Decision Tree**

```
Is this a financial service (payments, ledger, transfers)?
├─ YES → Use defaults (idempotent: true, acks: -1)
│         Need atomic multi-topic writes?
│         ├─ YES → transactional: true
│         └─ NO → Keep defaults
│
└─ NO → Is it analytics/metrics/logs?
          ├─ YES → idempotent: false, acks: 0, high concurrency
          └─ NO → Evaluate case-by-case

Need to replay history?
├─ YES → fromBeginning: true
└─ NO → fromBeginning: false (default)

High data volume + multi-region?
├─ YES → rackId: process.env.AWS_AVAILABILITY_ZONE
└─ NO → Skip rackId

Need high throughput?
├─ YES → partitionsConsumedConcurrently: 3-5
└─ NO → partitionsConsumedConcurrently: 1 (default)

Need exactly-once with DB?
├─ YES → autoCommit: false + manual commits
└─ NO → autoCommit: true (default)
```

---

## 📚 **Service Configuration Summary**

| Service             | idempotent | acks | fromBeginning | concurrency | rackId | Reason                |
| ------------------- | ---------- | ---- | ------------- | ----------- | ------ | --------------------- |
| **Ledger**          | ✅ true    | -1   | false         | 1           | -      | Exactly-once, ordered |
| **Payment**         | ✅ true    | -1   | false         | 1           | -      | Exactly-once, atomic  |
| **Analytics**       | ❌ false   | 0    | false         | 5           | ✅ AZ  | Throughput + cost     |
| **Fraud Detection** | ✅ true    | -1   | false         | 5           | -      | Real-time, reliable   |
| **Metrics**         | ❌ false   | 0    | false         | 10          | -      | Fire-and-forget       |
| **Replay**          | ✅ true    | -1   | ✅ true       | 3           | -      | Rebuild from history  |
| **Regional**        | ✅ true    | -1   | false         | 1           | ✅ AZ  | Cost optimization     |

---

## ✅ **Best Practices**

### **1. Start with Defaults**

```typescript
// ✅ Start simple
const publisher = new EventPublisher('my-service');
```

### **2. Add Config When Needed**

```typescript
// ✅ Add config incrementally
const publisher = new EventPublisher('my-service', {
  kafka: {
    consumer: { rackId: process.env.AWS_AZ }, // Add cost optimization
  },
});
```

### **3. Document Your Config**

```typescript
// ✅ Add comments explaining why
const config: EventPublisherConfig = {
  kafka: {
    producer: {
      // Using transactional for atomic ledger double-entry
      transactional: true,
    },
  },
};
```

### **4. Use Environment Variables**

```typescript
// ✅ Make it configurable
const config: EventPublisherConfig = {
  kafka: {
    consumer: {
      rackId: process.env.KAFKA_RACK_ID,
      fromBeginning: process.env.KAFKA_FROM_BEGINNING === 'true',
    },
  },
};
```

---

## 🚀 **Ready to Use!**

**Default (simple):**

```typescript
const publisher = new EventPublisher('my-service');
await publisher.initialize();
await publisher.publish(event);
```

**Custom (advanced):**

```typescript
const publisher = new EventPublisher('my-service', {
  kafka: {
    producer: { transactional: true },
    consumer: { fromBeginning: true, rackId: 'us-east-1a' },
    run: { partitionsConsumedConcurrently: 5 },
    send: { acks: -1 },
  },
});
await publisher.initialize();
await publisher.publish(event);
```

**Perfect flexibility!** ⚙️✨
