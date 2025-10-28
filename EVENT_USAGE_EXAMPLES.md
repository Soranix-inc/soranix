# 🎯 Event Usage Examples - Before vs After

## ❌ **Before: Verbose Factory Functions**

```typescript
// Had to create individual factory functions for each event
export function createUserRegisteredEvent(
  aggregateId: string,
  data: UserRegisteredData,
  options = {}
): UserRegisteredEvent {
  return {
    eventId: generateEventId(),
    eventType: 'user.registered',
    aggregateId,
    timestamp: new Date(),
    version: 1,
    correlationId: options.correlationId || generateCorrelationId(),
    causationId: options.causationId,
    metadata: options.metadata,
    data,
    encrypted: false,
  };
}

export function createUserLoginEvent(aggregateId: string, data: UserLoginData, options = {}): UserLoginEvent {
  // ... same boilerplate code
}

export function createUserLogoutEvent(aggregateId: string, data: UserLogoutData, options = {}): UserLogoutEvent {
  // ... same boilerplate code
}

// Usage
const event = createUserRegisteredEvent(userId, userData, metadata);
```

## ✅ **After: Single Generic Factory Function**

```typescript
// One generic factory function for all events
export function createEvent<T extends BaseEvent>(
  eventType: T['eventType'],
  aggregateId: string,
  data: T['data'],
  options: {
    correlationId?: string;
    causationId?: string;
    metadata?: EventMetadata;
  } = {}
): T {
  return {
    eventId: generateEventId(),
    eventType,
    aggregateId,
    timestamp: new Date(),
    version: 1,
    correlationId: options.correlationId || generateCorrelationId(),
    causationId: options.causationId,
    metadata: options.metadata,
    data,
    encrypted: false,
  } as T;
}

// Usage - TypeScript infers everything!
const event = createEvent<UserRegisteredEvent>('user.registered', userId, userData, metadata);
```

## 🚀 **Benefits of the New Approach**

### **1. Type Safety with Inference** 🎯

```typescript
// TypeScript knows the exact event type and data structure
const event = createEvent<UserRegisteredEvent>('user.registered', userId, {
  email: 'user@example.com',
  firstName: 'John',
  // TypeScript will autocomplete and validate these fields
});
```

### **2. Minimal Boilerplate** 📝

```typescript
// Before: 6 separate factory functions (120+ lines)
// After: 1 generic function (20 lines)

// Adding new events is now trivial:
const newEvent = createEvent<NewEventType>('new.event.type', aggregateId, data);
```

### **3. Easy to Add New Events** ➕

```typescript
// Just define the interface and use the generic factory
export interface UserDeletedEvent extends BaseEvent {
  eventType: 'user.deleted';
  data: UserDeletedData;
}

// Usage - no new factory function needed!
const event = createEvent<UserDeletedEvent>('user.deleted', userId, {
  deletedAt: new Date(),
  reason: 'account_closed',
});
```

### **4. Consistent API** 🔄

```typescript
// All events use the same pattern
const paymentEvent = createEvent<PaymentCreatedEvent>('payment.created', paymentId, paymentData);
const transferEvent = createEvent<TransferInitiatedEvent>('transfer.initiated', transferId, transferData);
const billEvent = createEvent<BillPaymentEvent>('bill.payment.initiated', billId, billData);
```

### **5. Publisher Integration** 📢

```typescript
// In UserEventPublisher
async publishUserRegistered(userId: string, userData: UserRegisteredData, metadata?: EventMetadata) {
  const event = createEvent<UserRegisteredEvent>('user.registered', userId, userData, {
    metadata: {
      source: 'auth-service',
      service: 'auth',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      ...metadata,
    },
  });

  await this.publisher.publish(event);
}
```

## 🎉 **Real-World Usage Examples**

### **Publishing Events**

```typescript
// User registration
await userPublisher.publishUserRegistered(userId, {
  email: 'john@example.com',
  firstName: 'John',
  lastName: 'Doe',
});

// Payment processing
await paymentPublisher.publishPaymentCreated(paymentId, {
  paymentId,
  userId,
  amount: 100.0,
  currency: 'USD',
  paymentMethod: 'credit_card',
});

// Transfer initiation
await transferPublisher.publishTransferInitiated(transferId, {
  transferId,
  fromUserId: 'user-123',
  toUserId: 'user-456',
  amount: 50.0,
  currency: 'USD',
});
```

### **Subscribing to Events**

```typescript
// Notification service subscribes to user events
await subscriber.subscribe('user.registered', async (event, data) => {
  await sendWelcomeEmail(data.email, data.firstName);
});

// Analytics service subscribes to payment events
await subscriber.subscribe('payment.completed', async (event, data) => {
  await trackPaymentMetrics(data.amount, data.currency);
});
```

## 📊 **Code Reduction Summary**

| Aspect            | Before                      | After          | Reduction     |
| ----------------- | --------------------------- | -------------- | ------------- |
| Factory Functions | 6 per domain                | 1 total        | 83% less code |
| Lines of Code     | ~120 per domain             | ~20 total      | 83% less code |
| New Event Setup   | Create function + interface | Interface only | 50% less work |
| Type Safety       | ✅                          | ✅             | Same          |
| Maintainability   | ❌ Verbose                  | ✅ Clean       | Much better   |

## 🎯 **Key Takeaways**

1. **One generic factory function** handles all event types
2. **TypeScript inference** provides full type safety
3. **Minimal boilerplate** - just define interfaces
4. **Easy to extend** - adding new events is trivial
5. **Consistent API** across all event types
6. **Better developer experience** - less code to write and maintain

This approach scales much better as the number of events grows! 🚀
