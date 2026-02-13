/**
 * Central Event Registry
 *
 * This file aggregates all domain events from all services.
 * When event types change, all consuming services will be aware through TypeScript.
 *
 * To add events from a new service:
 * 1. Create a new file in this directory (e.g., payment-events.ts)
 * 2. Import and export the events here
 * 3. Add them to the AllDomainEvents union type
 */

import type { EventTransportConfig } from '../transports/types.js';

// Auth Service Events
export * from './auth-events.js';
import type { RegisterUserEvent, EmailVerificationRequestedEvent } from './auth-events.js';
import { AUTH_EVENT_TRANSPORT_CONFIGS } from './auth-events.js';

// Payment Service Events
// export * from './payment-events.js';
// import type { PaymentProcessedEvent } from './payment-events.js';
// import { PAYMENT_EVENT_TRANSPORT_CONFIGS } from './payment-events.js';

// Ledger Service Events
// export * from './ledger-events.js';
// import type { LedgerEntryCreatedEvent } from './ledger-events.js';
// import { LEDGER_EVENT_TRANSPORT_CONFIGS } from './ledger-events.js';

// Union type of all domain events
// Add new event types to this union as services are added
export type AllDomainEvents = RegisterUserEvent | EmailVerificationRequestedEvent;
// | PaymentProcessedEvent
// | LedgerEntryCreatedEvent
// | ... (add more as needed)

/**
 * Helper type to extract all available event type strings
 * Useful for type-safe event type constants or validation
 */
export type AllEventTypes = AllDomainEvents['eventType'];

/**
 * Helper type to get the data type for a specific event type
 */
export type EventDataForType<T extends AllEventTypes> = Extract<AllDomainEvents, { eventType: T }>['data'];

/**
 * Get all transport configurations from the registry
 * Used by EventPublisher/EventSubscriber to set up infrastructure
 */
export function getAllTransportConfigs(): Record<string, EventTransportConfig> {
  return {
    ...AUTH_EVENT_TRANSPORT_CONFIGS,
    // ...PAYMENT_EVENT_TRANSPORT_CONFIGS,
    // ...LEDGER_EVENT_TRANSPORT_CONFIGS,
  } as Record<string, EventTransportConfig>;
}

