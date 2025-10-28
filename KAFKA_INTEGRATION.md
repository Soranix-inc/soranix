# 🚀 Kafka Integration for Soranix Platform

## 📋 Overview

Soranix now uses **Apache Kafka in KRaft mode** (no Zookeeper!) for event streaming alongside RabbitMQ. This hybrid architecture provides:

- **Kafka**: Financial events with 7-year retention for audit trail and compliance
- **RabbitMQ**: Operational events (notifications, background jobs) that are fire-and-forget

### **Why Kafka + RabbitMQ?**

| Feature               | Kafka                      | RabbitMQ             |
| --------------------- | -------------------------- | -------------------- |
| **Message Retention** | 7+ years (configurable)    | 7-30 days max        |
| **Replay Messages**   | ✅ Yes                     | ❌ No                |
| **Event Sourcing**    | ✅ Perfect                 | ❌ Not designed for  |
| **Audit Trail**       | ✅ Yes (immutable)         | ❌ No                |
| **Late Joiners**      | ✅ Can read from beginning | ❌ Miss old messages |
| **Use Case**          | Financial transactions     | Notifications, tasks |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Business Logic Layer                       │
│                   (@packages/events)                         │
│  EventPublisher / EventSubscriber (service-facing API)      │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   │ Automatic routing
                   │
┌──────────────────▼──────────────────────────────────────────┐
│              Event Router (EventRouter)                      │
│  - Financial events → Kafka                                  │
│  - Operational events → RabbitMQ                             │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
┌───────▼────────┐   ┌────────▼────────┐
│  KafkaAdapter  │   │ RabbitMQAdapter │
│  (Kafka impl)  │   │ (RabbitMQ impl) │
└────────────────┘   └─────────────────┘
        │                     │
┌───────▼────────┐   ┌────────▼────────┐
│     Kafka      │   │    RabbitMQ     │
│  (KRaft mode)  │   │                 │
└────────────────┘   └─────────────────┘
```

---

## 📦 Kafka Setup (KRaft Mode)

### **1. Docker Compose Configuration**

Kafka is configured in KRaft mode (no Zookeeper dependency):

```yaml
kafka:
  image: confluentinc/cp-kafka:7.5.0
  container_name: soranix-kafka
  ports:
    - '9092:9092' # External access
    - '9093:9093' # Internal Docker network
    - '9094:9094' # Controller port
  environment:
    # KRaft mode (no Zookeeper!)
    KAFKA_NODE_ID: 1
    KAFKA_PROCESS_ROLES: 'broker,controller'
    KAFKA_CONTROLLER_QUORUM_VOTERS: '1@kafka:9094'

    # Listeners
    KAFKA_LISTENERS: 'PLAINTEXT://kafka:9093,PLAINTEXT_HOST://0.0.0.0:9092,CONTROLLER://kafka:9094'
    KAFKA_ADVERTISED_LISTENERS: 'PLAINTEXT://kafka:9093,PLAINTEXT_HOST://localhost:9092'

    # 7-year retention for financial compliance
    KAFKA_LOG_RETENTION_HOURS: 61320 # 7 years
    KAFKA_LOG_RETENTION_BYTES: -1 # Unlimited
```

**Benefits of KRaft Mode:**

- ✅ No Zookeeper dependency (simpler setup)
- ✅ Faster startup
- ✅ Better scaling (millions of partitions)
- ✅ Single process to start

### **2. Kafka UI**

Access Kafka UI at: `http://localhost:8090`

Monitor topics, messages, consumer groups, and more!

---

## 🎯 Kafka Topics

### **Financial Topics (7-year retention)**

| Topic                       | Purpose                       | Retention | Partitions |
| --------------------------- | ----------------------------- | --------- | ---------- |
| `financial.transactions`    | All financial transactions    | 7 years   | 6          |
| `financial.ledger.entries`  | Ledger entries (double-entry) | 7 years   | 6          |
| `financial.balance.updates` | Balance updates (compacted)   | 7 years   | 3          |
| `financial.payments`        | Payment events                | 7 years   | 6          |
| `financial.transfers`       | Transfer events               | 7 years   | 6          |
| `financial.deposits`        | Deposit events                | 7 years   | 6          |
| `financial.withdrawals`     | Withdrawal events             | 7 years   | 6          |
| `financial.bills`           | Bill payment events           | 7 years   | 6          |
| `financial.exchange`        | Crypto/fiat exchange          | 7 years   | 6          |
| `audit.trail`               | Audit trail                   | 7 years   | 3          |
| `compliance.events`         | Compliance events             | 7 years   | 3          |

### **Topic Management**

Topics are created automatically on service startup via `KafkaAdmin`:

```typescript
import { KafkaAdmin } from '@packages/kafka';

const admin = new KafkaAdmin();
await admin.connect();
await admin.createAllTopics(); // Creates all predefined topics
await admin.disconnect();
```

---

## 🔌 Usage in Services

### **Publishing Events (Automatic Routing)**

Services don't need to know about Kafka or RabbitMQ!

```typescript
// services/ledger/src/app.ts
import { EventPublisher } from '@packages/events';

const eventPublisher = new EventPublisher('ledger-service');
await eventPublisher.initialize();

// Publish financial event (automatically goes to Kafka)
await eventPublisher.publish({
  eventId: 'evt_123',
  eventType: 'ledger.entry.created', // ✅ Goes to Kafka!
  aggregateId: 'alice_123',
  version: 1,
  timestamp: new Date(),
  data: {
    entryId: 'entry_456',
    accountId: 'alice_123:wallet:checking:usd',
    amount: 100.0,
    balance: 500.0,
  },
});

// Publish operational event (automatically goes to RabbitMQ)
await eventPublisher.publish({
  eventId: 'evt_124',
  eventType: 'email.send', // ✅ Goes to RabbitMQ!
  aggregateId: 'alice_123',
  version: 1,
  timestamp: new Date(),
  data: {
    to: 'alice@example.com',
    template: 'transaction_receipt',
  },
});
```

### **Subscribing to Events**

```typescript
// services/analytics/src/app.ts
import { EventSubscriber } from '@packages/events';

const eventSubscriber = new EventSubscriber('analytics-service');
await eventSubscriber.initialize();

// Subscribe to financial events (automatically subscribes to Kafka)
await eventSubscriber.subscribe(
  ['payment.completed', 'transfer.completed', 'ledger.entry.created'],
  async (event, data) => {
    console.log('Received financial event:', event.eventType);
    // Process event...
  }
);
```

---

## 📊 Event Routing Rules

### **Events → Kafka** (7-year retention, audit trail)

```typescript
// Financial domain
'payment.*';
'transfer.*';
'deposit.*';
'withdrawal.*';
'bill.*';
'exchange.*';
'ledger.*';
'balance.*';

// Compliance
'audit.*';
'compliance.*';
'kyc.verified';
'kyc.rejected';
```

### **Events → RabbitMQ** (fire-and-forget)

```typescript
// User operations
'user.registered';
'user.login';
'user.logout';
'user.profile.*';

// Notifications
'email.*';
'sms.*';
'push.*';
'notification.*';

// Background jobs
'report.*';
'kyc.initiated';

// AI/ML tasks
'ai.*';
```

---

## 🔧 Advanced: Direct Kafka Access

For advanced use cases, you can use `@packages/kafka` directly:

```typescript
import { KafkaProducer, KafkaConsumer, KAFKA_TOPICS } from '@packages/kafka';

// Producer
const producer = new KafkaProducer({
  clientId: 'my-service',
  idempotent: true, // Prevent duplicate messages
});
await producer.connect();

await producer.publish(KAFKA_TOPICS.PAYMENTS, {
  key: 'alice_123', // Partition by user
  value: {
    eventType: 'payment.completed',
    amount: 100.0,
  },
});

// Consumer
const consumer = new KafkaConsumer({
  clientId: 'my-service',
  groupId: 'analytics-group',
  fromBeginning: false, // Or true to replay history
});
await consumer.connect();

await consumer.subscribe([KAFKA_TOPICS.PAYMENTS], async (message) => {
  console.log('Received:', message.value);
});
await consumer.run();
```

---

## 🔄 Event Sourcing & Replay

### **Replay All Events (Time Travel)**

```typescript
import { KafkaConsumer } from '@packages/kafka';

const consumer = new KafkaConsumer({
  clientId: 'ledger-replay',
  groupId: 'ledger-replay-group',
  fromBeginning: true, // ✅ Read from offset 0 (all history)
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
// Replay from specific point in time
await consumer.seekToOffset('financial.payments', 0, '12345');
```

---

## 🏃 Running Kafka

### **Start All Services**

```bash
docker-compose -f docker-compose.local.yaml up
```

### **Check Kafka Health**

```bash
# Check Kafka is running
docker exec -it soranix-kafka kafka-broker-api-versions --bootstrap-server localhost:9093

# List topics
docker exec -it soranix-kafka kafka-topics --bootstrap-server localhost:9093 --list

# View topic details
docker exec -it soranix-kafka kafka-topics --bootstrap-server localhost:9093 --describe --topic financial.payments
```

### **Access Kafka UI**

```
http://localhost:8090
```

---

## 📈 Monitoring & Debugging

### **Check Event Publisher Health**

```typescript
const health = await eventPublisher.isHealthy();
console.log('Kafka:', health.kafka); // true/false
console.log('RabbitMQ:', health.rabbitmq); // true/false
```

### **View Messages in Kafka UI**

1. Open `http://localhost:8090`
2. Navigate to Topics
3. Select topic (e.g., `financial.payments`)
4. View messages, partitions, offsets

---

## ⚠️ Troubleshooting

### **Kafka Not Starting**

```bash
# Check logs
docker logs soranix-kafka

# Common issue: Storage already formatted
# Solution: Delete volumes and restart
docker-compose down -v
docker-compose up
```

### **Services Can't Connect to Kafka**

Check environment variables:

```bash
KAFKA_BROKERS=kafka:9093  # For Docker services
KAFKA_BROKERS=localhost:9092  # For local development
```

### **Topics Not Created**

Create manually:

```typescript
import { KafkaAdmin } from '@packages/kafka';

const admin = new KafkaAdmin();
await admin.connect();
await admin.createAllTopics();
```

---

## 🎯 Best Practices

### **1. Use EventPublisher (Not Direct Kafka)**

✅ **Good:**

```typescript
await eventPublisher.publish(event); // Automatic routing
```

❌ **Bad:**

```typescript
await kafkaProducer.publish(KAFKA_TOPICS.PAYMENTS, event); // Tightly coupled
```

### **2. Partition by Aggregate ID**

```typescript
{
  key: event.aggregateId, // e.g., userId, accountId
  value: event,
}
```

This ensures:

- Messages for same user/account go to same partition
- Ordered processing per user/account

### **3. Use Idempotency Keys**

For financial operations, always use idempotency:

```typescript
import { IdempotencyService } from '@packages/utils/idempotency';

const idempotencyService = new IdempotencyService();
const result = await idempotencyService.check(idempotencyKey);
if (result.isDuplicate) {
  return result.cachedResult; // Return cached result
}
```

---

## 🔐 Transactions (Exactly-Once Semantics)

For financial operations requiring exactly-once processing:

```typescript
const producer = new KafkaProducer({
  clientId: 'ledger-service',
  transactional: true, // ✅ Enable transactions
});

await producer.connect();

const transaction = await producer.transaction();

try {
  // Atomic write: debit + credit
  await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, debitEvent);
  await transaction.send(KAFKA_TOPICS.LEDGER_ENTRIES, creditEvent);

  await transaction.commit(); // ✅ Both or neither
} catch (error) {
  await transaction.abort(); // ❌ Rollback
  throw error;
}
```

**See `KAFKA_TRANSACTIONS.md` for complete transaction guide.**

---

## 📚 Additional Resources

- **KAFKA_TRANSACTIONS.md** - Complete transaction guide (exactly-once)
- **packages/kafka/README.md** - Full API reference
- **Kafka KRaft Documentation**: https://kafka.apache.org/documentation/#kraft
- **KafkaJS Documentation**: https://kafka.js.org/
- **Soranix Event System**: `EVENT_USAGE_EXAMPLES.md`
- **Soranix Ledger**: `LEDGER_SYSTEM.md`

---

## ✅ Summary

**What You Get:**

✅ **Exactly-Once Semantics** - Transactions with commit/abort  
✅ **Event Sourcing** - Rebuild state from events  
✅ **Audit Trail** - 7-year retention for compliance  
✅ **Replay Capability** - Time-travel queries  
✅ **Horizontal Scaling** - Millions of partitions  
✅ **Separation of Concerns** - Business logic doesn't know about infrastructure  
✅ **Automatic Routing** - Events go to correct transport automatically  
✅ **Consume-Transform-Produce** - Exactly-once pipelines with sendOffsets()

**Services Use:**

```typescript
// Simple, clean API
import { EventPublisher } from '@packages/events';

const publisher = new EventPublisher('my-service');
await publisher.initialize();
await publisher.publish(event); // That's it!
```

**No Infrastructure Leaks** ✨
