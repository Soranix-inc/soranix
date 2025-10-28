// Base types
export {
  BaseEvent,
  EventMetadata,
  EventPriority,
  DeliveryGuarantee,
  EventConfig,
  getEventConfig,
  registerEventConfigs,
  createEvent,
} from './types/base-event.js';

// Event types
export * from './types/payment-events.js';
export * from './types/transfer-events.js';
export * from './types/bills-events.js';
export * from './types/user-events.js';
export * from './types/ai-events.js';
export * from './types/notification-events.js';
export * from './types/auth-events.js';

// Publishers and Subscribers
export { EventPublisher, type EventPublisherConfig } from './publishers/event-publisher.js';
export { EventSubscriber, type EventHandler, type EventSubscriberConfig } from './subscribers/event-subscriber.js';

// Adapters (for advanced use cases)
export { EventTransport, EventHandler as TransportEventHandler } from './adapters/event-transport.interface.js';
export { KafkaAdapter, type KafkaAdapterConfig } from './adapters/kafka-adapter.js';
export { RabbitMQAdapter } from './adapters/rabbitmq-adapter.js';

// Routing
export { EventRouter } from './routing/event-router.js';

// Utilities
export { EventEncryption } from './utils/encryption.js';

// Configuration
export { initializeEventConfigs } from './config/event-configs.js';

// Metrics
export { EventMetricsCollector, eventMetrics, type EventMetrics } from './metrics/event-metrics.js';
