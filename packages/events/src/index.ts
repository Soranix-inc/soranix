export {
  BaseEvent,
  EventMetadata,
  EventPriority,
  DeliveryGuarantee,
  EventConfig,
  getEventConfig,
  registerEventConfigs,
} from './types/base-event.js';

// Central Event Registry - All domain events from all services
export * from './registry/index.js';
export type {
  AllDomainEvents,
  AllEventTypes,
  EventDataForType,
} from './registry/index.js';

export { EventPublisher, RabbitMQPublisher } from './publishers/event-publisher.js';
export { EventSubscriber, RabbitMQSubscriber } from './subscribers/event-subscriber.js';
export type {
  EventPublisherOptions,
  EventSubscriberOptions,
  TransportConfig,
  TransportAdapter,
} from './transports/types.js';

export { EventTransport } from './adapters/event-transport.interface.js';
export type { EventHandler } from './adapters/event-transport.interface.js';

export { EventEncryption } from './utils/encryption.js';
export {
  generateEventId,
  generateCorrelationId,
  createEventInstance,
  type EventWithoutSystemFields,
  type EventPayload,
} from './utils/event-helpers.js';

export { initializeEventConfigs } from './config/event-configs.js';
