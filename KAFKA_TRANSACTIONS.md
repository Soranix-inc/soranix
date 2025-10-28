# 🔐 Kafka Transactions - Exactly-Once Semantics (EoS)

Comprehensive guide to using **Kafka transactions** in Soranix for exactly-once processing.

---

## 📋 Overview

Kafka transactions enable **exactly-once semantics (EoS)** by ensuring:

- ✅ All messages are published or none (atomicity)
- ✅ Consumer offsets are committed atomically with messages
- ✅ No duplicates even with failures
- ✅ Perfect for financial operations

**Requires:** Kafka >= v0.11

---

## ⚙️ **Producer Configuration for EoS**

To enable transactions, configure the producer with:

```typescript
import { KafkaProducer } from '@packages/kafka';

const producer = new KafkaProducer({
  clientId: 'my-service',

  // ✅ REQUIRED for transactions
  transactional: true, // Enables transactional mode

  // These are automatically set when transactional: true
  // But shown here for clarity:
  idempotent: true, // Prevents duplicates
  maxInFlightRequests: 1, // Required for ordering
  // acks: -1 // All replicas (automatic)
});

await producer.connect();
```

**What happens:**

- ✅ `idempotent: true` - Prevents duplicate messages
- ✅ `maxInFlightRequests: 1` - Ensures strict ordering
- ✅ `acks: -1` - All replicas must acknowledge
- ✅ Producer gets a unique `transactionalId` from `clientId`

---

## 🎯 **Basic Transaction Usage**

### **1. Simple Transaction**

```typescript
const transaction = await producer.transaction();

try {
  // Send multiple messages
  await transaction.send(KAFKA_TOPICS.PAYMENTS, {
    key: 'user_123',
    value: { amount: 100, type: 'payment' },
  });

  await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, {
    key: 'user_123',
    value: { debit: 100, account: 'checking' },
  });

  // ✅ Commit: Both messages published atomically
  await transaction.commit();
} catch (error) {
  // ❌ Abort: Neither message published
  await transaction.abort();
  throw error;
}
```

**Result:**

- ✅ Both messages published or neither
- ✅ No partial state
- ✅ Perfect for financial operations

---

### **2. Batch Transaction**

```typescript
const transaction = await producer.transaction();

try {
  // Send batch to one topic
  await transaction.sendBatch(KAFKA_TOPICS.PAYMENTS, [
    { key: 'user_1', value: { amount: 100 } },
    { key: 'user_2', value: { amount: 200 } },
    { key: 'user_3', value: { amount: 300 } },
  ]);

  // Send to another topic
  await transaction.send(KAFKA_TOPICS.AUDIT_TRAIL, {
    key: 'audit_1',
    value: { action: 'batch_payment', count: 3 },
  });

  // ✅ All 4 messages committed atomically
  await transaction.commit();
} catch (error) {
  await transaction.abort();
  throw error;
}
```

---

### **3. Multi-Topic Transaction**

```typescript
const transaction = await producer.transaction();

try {
  await transaction.sendToMultipleTopics([
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
      messages: [{ key: 'audit_1', value: { action: 'completed' } }],
    },
  ]);

  await transaction.commit();
} catch (error) {
  await transaction.abort();
  throw error;
}
```

---

## 🔄 **Consume-Transform-Produce Pattern**

### **The Problem: Exactly-Once Stream Processing**

```
Traditional approach (at-least-once):

1. Consume message from topic-A
2. Transform data
3. Produce to topic-B
4. Commit offset for topic-A

❌ If crash between step 3 & 4:
   - Message already produced to topic-B
   - Offset NOT committed
   - On restart: Reprocess message
   - Result: DUPLICATE in topic-B
```

### **The Solution: Transaction with sendOffsets()**

```typescript
import { KafkaProducer, KafkaConsumer, KAFKA_TOPICS } from '@packages/kafka';

// Consumer
const consumer = new KafkaConsumer({
  clientId: 'stream-processor',
  groupId: 'stream-processor-group',
});

// Producer (MUST be transactional)
const producer = new KafkaProducer({
  clientId: 'stream-processor',
  transactional: true, // ✅ Enable transactions
  maxInFlightRequests: 1,
  idempotent: true,
});

await consumer.connect();
await producer.connect();

// Subscribe to input topic
await consumer.subscribe([KAFKA_TOPICS.PAYMENTS], false);

await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const transaction = await producer.transaction();

    try {
      // 1. Transform data
      const inputData = JSON.parse(message.value.toString());
      const transformedData = transformPayment(inputData);

      // 2. Produce transformed data
      await transaction.send(KAFKA_TOPICS.PROCESSED_PAYMENTS, {
        key: inputData.userId,
        value: transformedData,
      });

      // 3. ✅ Commit consumer offset ATOMICALLY with produced message
      await transaction.sendOffsets({
        consumerGroupId: 'stream-processor-group',
        topics: [
          {
            topic,
            partitions: [
              {
                partition,
                offset: (parseInt(message.offset) + 1).toString(), // Next offset
              },
            ],
          },
        ],
      });

      // 4. Commit transaction
      await transaction.commit();

      // ✅ EXACTLY-ONCE: Message produced + offset committed ATOMICALLY
    } catch (error) {
      // Rollback everything
      await transaction.abort();
      throw error;
    }
  },
});
```

**Result:**

- ✅ Message produced to topic-B
- ✅ Offset committed for topic-A
- ✅ BOTH happen atomically
- ✅ If crash: BOTH rolled back
- ✅ **Zero duplicates!**

---

## 🎯 **Real-World Use Cases**

### **1. Payment Processing (All-or-Nothing)**

```typescript
const transaction = await producer.transaction();

try {
  // 1. Debit from user account
  await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, {
    key: 'alice_123:wallet:checking:usd',
    value: {
      type: 'debit',
      amount: 100.0,
      description: 'Payment to merchant',
    },
  });

  // 2. Credit to merchant account
  await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, {
    key: 'merchant_456:wallet:checking:usd',
    value: {
      type: 'credit',
      amount: 100.0,
      description: 'Payment from customer',
    },
  });

  // 3. Record payment
  await transaction.send(KAFKA_TOPICS.PAYMENTS, {
    key: 'payment_789',
    value: {
      from: 'alice_123',
      to: 'merchant_456',
      amount: 100.0,
      status: 'completed',
    },
  });

  // ✅ All 3 events or none
  await transaction.commit();
} catch (error) {
  // ❌ Rollback: No partial payments
  await transaction.abort();
  throw error;
}
```

**Benefits:**

- ✅ No partial payments (all-or-nothing)
- ✅ Consistent ledger state
- ✅ No orphaned transactions

---

### **2. Transfer Between Users (Atomic)**

```typescript
const transaction = await producer.transaction();

try {
  // 1. Debit from sender
  await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, {
    key: `${fromUserId}:wallet:checking:usd`,
    value: { type: 'debit', amount: transferAmount },
  });

  // 2. Credit to receiver
  await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, {
    key: `${toUserId}:wallet:checking:usd`,
    value: { type: 'credit', amount: transferAmount },
  });

  // 3. Record transfer
  await transaction.send(KAFKA_TOPICS.TRANSFERS, {
    key: `transfer_${transferId}`,
    value: { from: fromUserId, to: toUserId, amount: transferAmount },
  });

  await transaction.commit();
} catch (error) {
  await transaction.abort();
  throw error;
}
```

---

### **3. Event Enrichment Pipeline (Consume-Transform-Produce)**

```typescript
// Read from raw events, enrich, publish to enriched events
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const transaction = await producer.transaction();

    try {
      // 1. Parse raw event
      const rawEvent = JSON.parse(message.value.toString());

      // 2. Enrich with user data
      const userData = await fetchUserData(rawEvent.userId);
      const enrichedEvent = { ...rawEvent, user: userData };

      // 3. Produce enriched event
      await transaction.send(KAFKA_TOPICS.ENRICHED_EVENTS, {
        key: rawEvent.userId,
        value: enrichedEvent,
      });

      // 4. Commit offset atomically
      await transaction.sendOffsets({
        consumerGroupId: 'enrichment-pipeline',
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

      await transaction.commit();
    } catch (error) {
      await transaction.abort();
      throw error;
    }
  },
});
```

**Result:** Exactly-once enrichment (no duplicates in enriched events)

---

### **4. Multi-Service Event Publishing**

```typescript
// Publish to multiple services atomically
const transaction = await producer.transaction();

try {
  // Analytics
  await transaction.send(KAFKA_TOPICS.ANALYTICS, {
    key: 'metric_123',
    value: { metric: 'payment_count', value: 1 },
  });

  // Fraud Detection
  await transaction.send(KAFKA_TOPICS.FRAUD_DETECTION, {
    key: 'user_123',
    value: { userId: 'user_123', amount: 100, timestamp: Date.now() },
  });

  // Ledger
  await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, {
    key: 'user_123:wallet:checking:usd',
    value: { type: 'debit', amount: 100 },
  });

  await transaction.commit();
} catch (error) {
  // All or none
  await transaction.abort();
}
```

---

## 🔑 **Choosing a TransactionalId**

### **Why TransactionalId Matters**

The `transactionalId` is used to:

- ✅ Fence out zombie producers (only latest producer can write)
- ✅ Enable exactly-once semantics
- ✅ Deduplicate messages across producer restarts

### **Best Practices**

#### **1. For Stream Processing (Consume-Transform-Produce)**

Encode input topic + partition in `transactionalId`:

```typescript
const transactionalId = `stream-processor-${inputTopic}-${partition}`;

const producer = new KafkaProducer({
  clientId: transactionalId, // Use as clientId
  transactional: true,
});
```

**Why:** Ensures same producer instance handles same input partition after restart.

#### **2. For Service-Level Transactions**

Use service name + instance ID:

```typescript
const transactionalId = `ledger-service-${instanceId}`;

const producer = new KafkaProducer({
  clientId: transactionalId,
  transactional: true,
});
```

#### **3. For Kubernetes/Docker**

Use hostname:

```typescript
const transactionalId = `${process.env.SERVICE_NAME}-${process.env.HOSTNAME}`;

const producer = new KafkaProducer({
  clientId: transactionalId,
  transactional: true,
});
```

---

## ⚠️ **Transaction Requirements**

### **Producer Requirements**

```typescript
const producer = new KafkaProducer({
  clientId: 'unique-id', // ✅ Must be unique per producer instance
  transactional: true, // ✅ Enable transactions

  // These are set automatically when transactional: true
  // but shown here for clarity:
  idempotent: true, // ✅ Required
  maxInFlightRequests: 1, // ✅ Required for EoS
  // acks: -1 // ✅ Automatic (all replicas)
});
```

### **Consumer Requirements (for Consume-Transform-Produce)**

```typescript
const consumer = new KafkaConsumer({
  groupId: 'my-group',
  // Default settings work fine!
  // Consumer will only read committed messages by default
});
```

**Transactionally-aware consumers** automatically:

- ✅ Only read committed messages
- ✅ Skip aborted transactions
- ✅ Maintain exactly-once semantics

---

## 🔄 **Transaction API**

### **Methods**

```typescript
const transaction = await producer.transaction();

// Send single message
await transaction.send(topic, event, options);

// Send batch to single topic
await transaction.sendBatch(topic, events, options);

// Send to multiple topics
await transaction.sendToMultipleTopics(topicMessages, options);

// Commit consumer offsets (for consume-transform-produce)
await transaction.sendOffsets({ consumerGroupId, topics });

// Commit transaction
await transaction.commit();

// Abort transaction (rollback)
await transaction.abort();
```

---

## 📊 **Error Handling**

### **Always Use Try-Catch**

```typescript
const transaction = await producer.transaction();

try {
  await transaction.send(KAFKA_TOPICS.PAYMENTS, event);
  await transaction.commit();
} catch (error) {
  // ✅ ALWAYS abort on error
  await transaction.abort();
  throw error;
}
```

### **Automatic Rollback on Abort**

```typescript
const transaction = await producer.transaction();

try {
  // Message 1
  await transaction.send(KAFKA_TOPICS.PAYMENTS, event1);

  // Message 2 (fails!)
  await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, event2);
  // Throws error!

  await transaction.commit(); // Never reached
} catch (error) {
  await transaction.abort(); // ✅ Rollback both messages
  // Message 1 is NOT published
  // Message 2 is NOT published
}
```

---

## 🎯 **Advanced Patterns**

### **1. Idempotent Transactions (Double Safety)**

Combine transactions with idempotency keys:

```typescript
import { IdempotencyService } from '@packages/utils/idempotency';

const idempotencyService = new IdempotencyService();

async function processPayment(paymentId: string, data: any) {
  // 1. Check idempotency
  const idemKey = `payment:${paymentId}`;
  const result = await idempotencyService.check(idemKey);

  if (result.isDuplicate) {
    return result.cachedResult; // Already processed
  }

  // 2. Start transaction
  const transaction = await producer.transaction();

  try {
    // 3. Publish payment events
    await transaction.send(KAFKA_TOPICS.PAYMENTS, {
      key: data.userId,
      value: { paymentId, ...data },
    });

    await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, {
      key: `${data.userId}:wallet:checking:usd`,
      value: { type: 'debit', amount: data.amount },
    });

    // 4. Commit transaction
    await transaction.commit();

    // 5. Store idempotency result
    await idempotencyService.store(idemKey, {}, { paymentId, status: 'completed' });

    return { paymentId, status: 'completed' };
  } catch (error) {
    await transaction.abort();
    throw error;
  }
}
```

**Result:**

- ✅ Idempotency (application-level deduplication)
- ✅ Transactions (infrastructure-level atomicity)
- ✅ **Double safety!**

---

### **2. Ledger Double-Entry with Transactions**

```typescript
async function recordTransfer(from: string, to: string, amount: number) {
  const transaction = await producer.transaction();

  try {
    // Debit entry
    await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, {
      key: `${from}:wallet:checking:usd`,
      value: {
        entryId: generateId(),
        accountId: `${from}:wallet:checking:usd`,
        type: 'debit',
        amount,
        transactionType: 'transfer',
        metadata: { to, transferId: generateId() },
      },
    });

    // Credit entry (double-entry bookkeeping)
    await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, {
      key: `${to}:wallet:checking:usd`,
      value: {
        entryId: generateId(),
        accountId: `${to}:wallet:checking:usd`,
        type: 'credit',
        amount,
        transactionType: 'transfer',
        metadata: { from, transferId: generateId() },
      },
    });

    // Both entries committed atomically
    await transaction.commit();
  } catch (error) {
    // Neither entry published
    await transaction.abort();
    throw error;
  }
}
```

**Result:** Perfect double-entry ledger (both entries or neither)

---

### **3. Saga Pattern with Compensation**

```typescript
async function processSaga(orderId: string) {
  const transaction = await producer.transaction();
  const compensationEvents = [];

  try {
    // Step 1: Reserve inventory
    await transaction.send(KAFKA_TOPICS.INVENTORY, {
      key: orderId,
      value: { action: "reserve", orderId, items: [...] },
    });
    compensationEvents.push({ topic: KAFKA_TOPICS.INVENTORY, action: "unreserve" });

    // Step 2: Charge payment
    await transaction.send(KAFKA_TOPICS.PAYMENTS, {
      key: orderId,
      value: { action: "charge", orderId, amount: 100 },
    });
    compensationEvents.push({ topic: KAFKA_TOPICS.PAYMENTS, action: "refund" });

    // Step 3: Ship order
    await transaction.send(KAFKA_TOPICS.SHIPPING, {
      key: orderId,
      value: { action: "ship", orderId },
    });

    // All steps succeed
    await transaction.commit();
  } catch (error) {
    // Abort transaction
    await transaction.abort();

    // Publish compensation events (outside transaction)
    for (const compensation of compensationEvents) {
      await producer.publish(compensation.topic, {
        key: orderId,
        value: { action: compensation.action, orderId },
      });
    }

    throw error;
  }
}
```

---

## 📈 **Performance Considerations**

### **Transaction Overhead**

```
Non-transactional send:
- Latency: ~5ms
- Throughput: 10,000 msg/sec

Transactional send:
- Latency: ~10ms (2x slower)
- Throughput: 5,000 msg/sec (50% lower)
```

**When to use transactions:**

- ✅ Financial operations (payments, transfers, ledger)
- ✅ Consume-transform-produce pipelines
- ✅ Multi-topic atomic writes
- ✅ When exactly-once is critical

**When NOT to use transactions:**

- ❌ High-throughput analytics (at-least-once is fine)
- ❌ Metrics/logs (duplicates acceptable)
- ❌ Non-critical events

---

### **Batch Transactions for Performance**

```typescript
// ✅ Good: Batch multiple events in one transaction
const transaction = await producer.transaction();

try {
  await transaction.sendBatch(KAFKA_TOPICS.PAYMENTS, [
    { key: 'user_1', value: payment1 },
    { key: 'user_2', value: payment2 },
    { key: 'user_3', value: payment3 },
  ]);

  await transaction.commit();
} catch (error) {
  await transaction.abort();
}

// ❌ Bad: Individual transactions (much slower)
for (const payment of payments) {
  const transaction = await producer.transaction();
  try {
    await transaction.send(KAFKA_TOPICS.PAYMENTS, payment);
    await transaction.commit();
  } catch (error) {
    await transaction.abort();
  }
}
```

**Result:** 10-50x better performance with batch transactions!

---

## ⚠️ **Common Pitfalls**

### **1. Forgetting to Abort on Error**

❌ **Bad:**

```typescript
const transaction = await producer.transaction();

try {
  await transaction.send(topic, event);
  await transaction.commit();
} catch (error) {
  // ❌ Forgot to abort!
  throw error;
}
```

✅ **Good:**

```typescript
const transaction = await producer.transaction();

try {
  await transaction.send(topic, event);
  await transaction.commit();
} catch (error) {
  await transaction.abort(); // ✅ Always abort
  throw error;
}
```

---

### **2. Wrong Offset in sendOffsets()**

❌ **Bad:**

```typescript
await transaction.sendOffsets({
  consumerGroupId: 'my-group',
  topics: [
    {
      topic: 'input-topic',
      partitions: [{ partition: 0, offset: message.offset }], // ❌ Current offset
    },
  ],
});
```

✅ **Good:**

```typescript
await transaction.sendOffsets({
  consumerGroupId: 'my-group',
  topics: [
    {
      topic: 'input-topic',
      partitions: [
        {
          partition: 0,
          offset: (parseInt(message.offset) + 1).toString(), // ✅ Next offset (+1)
        },
      ],
    },
  ],
});
```

**Why:** Offset is the **next** message to consume, not the current one!

---

### **3. Missing transactionalId**

❌ **Bad:**

```typescript
const producer = new KafkaProducer({
  clientId: 'my-service',
  transactional: true, // Enabled
  // ❌ Missing transactionalId (uses clientId by default, but should be explicit)
});
```

✅ **Good:**

```typescript
const producer = new KafkaProducer({
  clientId: 'my-service-producer-instance-1',
  transactional: true,
  // ✅ clientId is used as transactionalId (unique per instance)
});
```

---

## 📚 **Full Example: Ledger Service**

```typescript
// services/ledger/src/services/core/core.services.ts

import { EventPublisher } from '@packages/events';
import { KafkaProducer, KAFKA_TOPICS } from '@packages/kafka';

class LedgerCoreService {
  private kafkaProducer: KafkaProducer;

  constructor() {
    this.kafkaProducer = new KafkaProducer({
      clientId: `ledger-service-${process.env.HOSTNAME}`,
      transactional: true, // ✅ Enable transactions
      idempotent: true,
      maxInFlightRequests: 1,
    });
  }

  async initialize() {
    await this.kafkaProducer.connect();
  }

  async recordTransfer(from: string, to: string, amount: number) {
    const transaction = await this.kafkaProducer.transaction();

    try {
      // 1. Debit entry
      await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, {
        key: `${from}:wallet:checking:usd`,
        value: {
          type: 'debit',
          amount,
          accountId: `${from}:wallet:checking:usd`,
          transactionType: 'transfer',
        },
      });

      // 2. Credit entry
      await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, {
        key: `${to}:wallet:checking:usd`,
        value: {
          type: 'credit',
          amount,
          accountId: `${to}:wallet:checking:usd`,
          transactionType: 'transfer',
        },
      });

      // 3. Transfer event
      await transaction.send(KAFKA_TOPICS.TRANSFERS, {
        key: `transfer_${generateId()}`,
        value: {
          from,
          to,
          amount,
          status: 'completed',
        },
      });

      // Commit all 3 events atomically
      await transaction.commit();

      systemLogger.info('Transfer recorded atomically', { from, to, amount });
    } catch (error) {
      await transaction.abort();
      systemLogger.error('Transfer transaction failed', {
        from,
        to,
        amount,
        error: error.message,
      });
      throw error;
    }
  }
}
```

---

## ✅ **Benefits Summary**

### **With Transactions:**

✅ **Exactly-Once Semantics** - No duplicates, ever  
✅ **Atomic Writes** - All messages or none  
✅ **Consume-Transform-Produce** - Exactly-once pipelines  
✅ **Zombie Fencing** - Only latest producer can write  
✅ **Double-Entry Ledger** - Perfect for financial systems

### **Without Transactions (At-Least-Once):**

⚠️ **Possible duplicates** on retry  
⚠️ **Partial writes** on failure  
⚠️ **Duplicate processing** in pipelines  
⚠️ **Inconsistent state** across topics

---

## 📊 **When to Use Transactions**

| Use Case                      | Use Transactions? | Reason                   |
| ----------------------------- | ----------------- | ------------------------ |
| **Payments**                  | ✅ YES            | Must be exactly-once     |
| **Transfers**                 | ✅ YES            | Atomic debit + credit    |
| **Ledger Entries**            | ✅ YES            | Double-entry bookkeeping |
| **Consume-Transform-Produce** | ✅ YES            | Exactly-once pipelines   |
| **Analytics Events**          | ❌ NO             | At-least-once is fine    |
| **Metrics/Logs**              | ❌ NO             | Duplicates acceptable    |
| **Notifications**             | ❌ NO             | Fire-and-forget          |

---

## 🚀 **Quick Start**

### **1. Enable Transactional Producer**

```typescript
import { KafkaProducer } from '@packages/kafka';

const producer = new KafkaProducer({
  clientId: 'my-service',
  transactional: true, // ✅ That's it!
});

await producer.connect();
```

### **2. Use Transactions**

```typescript
const transaction = await producer.transaction();

try {
  await transaction.send(KAFKA_TOPICS.PAYMENTS, event);
  await transaction.commit();
} catch (error) {
  await transaction.abort();
  throw error;
}
```

### **3. Consume-Transform-Produce**

```typescript
await consumer.run({
  eachMessage: async ({ topic, partition, message }) => {
    const transaction = await producer.transaction();

    try {
      // Transform & produce
      await transaction.send(KAFKA_TOPICS.OUTPUT, transformedEvent);

      // Commit offset atomically
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

      await transaction.commit();
    } catch (error) {
      await transaction.abort();
      throw error;
    }
  },
});
```

---

## ✅ **Summary**

**What You Get:**

✅ **Exactly-Once Semantics** - No duplicates  
✅ **Atomic Writes** - All-or-nothing  
✅ **Consume-Transform-Produce** - Exactly-once pipelines  
✅ **sendOffsets()** - Atomic offset commits  
✅ **Zombie Fencing** - Only latest producer writes  
✅ **Double-Entry Ledger** - Perfect for finance  
✅ **Error Handling** - Automatic rollback

**Perfect for:**

- 💰 Payment processing
- 💸 Money transfers
- 📒 Ledger systems
- 🔄 Stream processing
- 📊 Event enrichment pipelines

**Based on official KafkaJS transaction documentation!** 🎉
