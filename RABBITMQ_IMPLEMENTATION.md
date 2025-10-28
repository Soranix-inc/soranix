# 🐰 RabbitMQ Implementation for Soranix

## Overview

This document outlines the complete RabbitMQ implementation for asynchronous service-to-service communication in the Soranix microservice architecture. The implementation provides:

- **Event-driven architecture** with loose coupling
- **At-least-once delivery guarantees** for critical events
- **Event encryption** for sensitive data
- **Dead letter queues** for failed message handling
- **Comprehensive monitoring** and metrics
- **7-day event retention** with configurable TTL

## 🏗️ Architecture

### Event Flow

```
Service A → Event Publisher → RabbitMQ Exchange → Queue → Event Subscriber → Service B
```

### Exchange Structure

- **soranix.financial** - Payment, transfer, and bill events
- **soranix.user** - User registration, login, profile events
- **soranix.ai** - AI analysis, recommendations, insights
- **soranix.notification** - Email, SMS, push notifications
- **soranix.audit** - Audit trail events
- **soranix.dlx** - Dead letter exchange for failed messages

## 📦 Packages Created

### 1. `@packages/rabbitmq`

**Location**: `packages/rabbitmq/`

**Purpose**: RabbitMQ connection management and infrastructure setup

**Key Components**:

- `RabbitMQConnection` - Connection management with auto-reconnect
- `ExchangeManager` - Exchange creation and configuration
- `QueueManager` - Queue setup and binding management

### 2. `@packages/events`

**Location**: `packages/events/`

**Purpose**: Event definitions, publishing, and subscription infrastructure

**Key Components**:

- Event type definitions (Financial, User, AI, Notification)
- `EventPublisher` - Encrypted event publishing
- `EventSubscriber` - Event consumption with error handling
- `EventEncryption` - AES-256-GCM encryption for sensitive events
- `EventMetricsCollector` - Performance and usage metrics

## 🔧 Configuration

### Environment Variables

```bash
# RabbitMQ Connection
RABBITMQ_HOST=rabbitmq-service
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=soranix
RABBITMQ_PASSWORD=soranix
RABBITMQ_VHOST=/

# Event Encryption
EVENT_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

### Critical Event Configuration

**Financial Events** (Payments, Transfers, Bills):

- Priority: `CRITICAL`
- Delivery: `AT_LEAST_ONCE`
- Encryption: `REQUIRED`
- TTL: `5 minutes` (processing), `7 days` (completed)
- Max Retries: `3`

**User Events**:

- Priority: `HIGH` (registration), `NORMAL` (login/logout)
- Delivery: `AT_LEAST_ONCE`
- Encryption: `REQUIRED` (sensitive data)
- TTL: `7 days`

## 🚀 Getting Started

### Development Setup

1. **Start RabbitMQ with Docker Compose**:

```bash
docker-compose -f docker-compose.local.yaml up rabbitmq
```

2. **Access RabbitMQ Management UI**:

- URL: http://localhost:15672
- Username: `guest`
- Password: `guest`

3. **Start Auth Service**:

```bash
cd services/auth
npm run dev
```

### Testing the Implementation

1. **Register a User** (triggers event):

```bash
curl -X POST http://localhost:5001/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

2. **Check Health Endpoint**:

```bash
curl http://localhost:5001/health
```

3. **Monitor Events in RabbitMQ UI**:
   - Navigate to http://localhost:15672
   - Check queues: `user.registration`, `notifications.email`
   - Monitor message flow and processing

## 📊 Monitoring & Metrics

### Event Metrics

- **Published Events**: Count of events published by type
- **Consumed Events**: Count of events processed successfully
- **Failed Events**: Count of events that failed processing
- **Processing Time**: Average processing time per event type

### Health Checks

- **Service Health**: `/health` endpoint shows event bus status
- **RabbitMQ Health**: Built-in health checks in Kubernetes
- **Queue Monitoring**: Dead letter queue monitoring for failed messages

## 🔒 Security Features

### Event Encryption

- **Algorithm**: AES-256-GCM
- **Key Management**: Environment variable based
- **Selective Encryption**: Only sensitive events are encrypted
- **Key Rotation**: Support for key rotation (manual process)

### Access Control

- **Authentication**: Username/password based
- **Authorization**: Queue-level permissions
- **Network Security**: Kubernetes network policies

## 🏭 Production Deployment

### Kubernetes Configuration

- **RabbitMQ Deployment**: Single node with persistent storage
- **Resource Limits**: 1 CPU, 2GB RAM
- **Storage**: 10GB persistent volume
- **Health Checks**: Liveness and readiness probes

### Scaling Considerations

- **Horizontal Scaling**: Add more service replicas
- **Queue Scaling**: RabbitMQ handles multiple consumers
- **Memory Management**: Configured for 60% memory watermark

## 🔄 Event Types

### Financial Events

```typescript
// Critical events with encryption
PaymentCreatedEvent;
PaymentProcessingEvent;
PaymentCompletedEvent;
PaymentFailedEvent;
TransferInitiatedEvent;
TransferCompletedEvent;
BillPaymentInitiatedEvent;
BillPaymentCompletedEvent;
```

### User Events

```typescript
// User lifecycle events
UserRegisteredEvent;
UserLoginEvent;
UserLogoutEvent;
UserProfileUpdatedEvent;
UserPasswordChangedEvent;
SessionExpiredEvent;
```

### AI Events

```typescript
// AI service events
AIAnalysisRequestedEvent;
AIAnalysisCompletedEvent;
AIRecommendationGeneratedEvent;
AIInsightCreatedEvent;
AIPredictionUpdatedEvent;
```

### Notification Events

```typescript
// Communication events
NotificationSentEvent;
NotificationDeliveredEvent;
NotificationFailedEvent;
EmailSentEvent;
SMSSentEvent;
PushSentEvent;
```

## 🛠️ Development Guidelines

### Adding New Events

1. **Define Event Type**:

```typescript
// packages/events/src/types/your-events.ts
export class YourEvent extends DomainEvent {
  constructor(aggregateId: string, data: YourData, options = {}) {
    super('your.event.type', aggregateId, data, options);
  }

  getConfig(): EventConfig {
    return {
      priority: EventPriority.NORMAL,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      requiresEncryption: false,
      ttl: 604800000, // 7 days
      maxRetries: 2,
    };
  }
}
```

2. **Add to Publisher**:

```typescript
// services/your-service/src/events/publishers/your-publisher.ts
export class YourEventPublisher {
  async publishYourEvent(data: YourData): Promise<void> {
    const event = new YourEvent(data.id, data);
    await this.publisher.publish(event);
  }
}
```

3. **Add to Subscriber**:

```typescript
// services/your-service/src/events/subscribers/your-subscriber.ts
export class YourEventSubscriber {
  async subscribeToYourEvents(): Promise<void> {
    await this.subscriber.subscribe('your.event.type', this.handleYourEvent.bind(this), { queue: 'your.queue' });
  }
}
```

### Error Handling

1. **Dead Letter Queues**: Failed messages automatically go to DLX
2. **Retry Logic**: Configurable retry attempts per event type
3. **Circuit Breaker**: Implement circuit breaker pattern for external services
4. **Monitoring**: Track failed events and processing times

## 📈 Performance Considerations

### Optimization Tips

- **Batch Publishing**: Use `publishBatch()` for multiple events
- **Prefetch Settings**: Configure appropriate prefetch values
- **Connection Pooling**: Reuse connections across service instances
- **Message Compression**: Consider compression for large payloads

### Resource Usage

- **Memory**: ~512MB for RabbitMQ in development
- **CPU**: ~200m CPU for normal operations
- **Storage**: 10GB for production message persistence
- **Network**: Minimal bandwidth for event metadata

## 🚨 Troubleshooting

### Common Issues

1. **Connection Failures**:

   - Check RabbitMQ service status
   - Verify network connectivity
   - Check credentials and permissions

2. **Message Processing Failures**:

   - Check dead letter queues
   - Review error logs
   - Verify event handler implementation

3. **Performance Issues**:
   - Monitor queue depths
   - Check processing times
   - Review resource utilization

### Debug Commands

```bash
# Check RabbitMQ status
kubectl get pods -n soranix | grep rabbitmq

# View RabbitMQ logs
kubectl logs -n soranix deployment/rabbitmq

# Check service health
curl http://localhost:5001/health

# Monitor queue status
# Use RabbitMQ Management UI at http://localhost:15672
```

## 🔮 Future Enhancements

### Planned Features

- **Event Sourcing**: Complete audit trail implementation
- **Saga Pattern**: Distributed transaction management
- **Event Replay**: Message replay capabilities
- **Advanced Monitoring**: Prometheus metrics integration
- **Multi-Region**: Cross-region event replication

### Migration Path

- **Phase 1**: ✅ Auth service integration
- **Phase 2**: Payment and banking services
- **Phase 3**: AI and notification services
- **Phase 4**: Complete event sourcing implementation

---

## 📞 Support

For questions or issues with the RabbitMQ implementation:

1. Check the logs: `kubectl logs -n soranix deployment/auth`
2. Monitor RabbitMQ UI: http://localhost:15672
3. Review this documentation
4. Check service health endpoints

**Happy Eventing! 🎉**
