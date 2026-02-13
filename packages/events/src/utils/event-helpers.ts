import { BaseEvent, EventMetadata } from '../types/base-event.js';
import type { AllDomainEvents } from '../registry/index.js';

export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Represents an event without system-generated fields.
 * These fields are automatically added by createEventInstance.
 */
export type EventWithoutSystemFields<T extends BaseEvent> = Omit<
  T,
  'eventId' | 'aggregateId' | 'timestamp' | 'version' | 'correlationId' | 'causationId' | 'metadata'
>;

/**
 * Semantic alias for EventWithoutSystemFields.
 * Represents the payload/input required to create an event.
 */
export type EventPayload<T extends BaseEvent> = EventWithoutSystemFields<T> & {
  eventType: T['eventType'];
  data: T['data'];
};

/**
 * Creates a fully-formed event instance with system-generated fields.
 *
 * @param event - Event payload (without system fields)
 * @param aggregateId - The aggregate/entity ID this event relates to
 * @param options - Optional correlation ID, causation ID, and metadata
 * @returns Complete event instance with all fields populated
 *
 * @example
 * const event = createEventInstance({
 *   eventType: 'auth.user.registered',
 *   data: { userId: '123', email: 'user@example.com' }
 * }, userId, { metadata: {...} });
 */
export function createEventInstance<T extends AllDomainEvents>(
  event: EventPayload<T>,
  aggregateId: string,
  options: { correlationId?: string; causationId?: string; metadata?: EventMetadata } = {}
): T {
  return {
    ...event,
    eventId: generateEventId(),
    aggregateId,
    timestamp: new Date(),
    version: 1,
    correlationId: options.correlationId || generateCorrelationId(),
    causationId: options.causationId,
    metadata: options.metadata,
  } as T;
}
