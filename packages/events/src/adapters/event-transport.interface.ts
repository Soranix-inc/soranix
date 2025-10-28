import { BaseEvent } from '../types/base-event.js';

/**
 * Event Handler Type
 * Processes incoming events from transport layer
 */
export type EventHandler = (event: BaseEvent, data: any) => Promise<void>;

/**
 * Abstract Event Transport Interface
 * Provides abstraction layer between business logic and infrastructure (Kafka/RabbitMQ)
 *
 * This ensures services don't need to know about specific message broker implementations
 */
export interface EventTransport {
  /**
   * Initialize the transport (connect to broker)
   */
  initialize(): Promise<void>;

  /**
   * Publish a single event
   * @param event - The event to publish
   */
  publish(event: BaseEvent): Promise<void>;

  /**
   * Publish multiple events in a batch
   * @param events - Array of events to publish
   */
  publishBatch(events: BaseEvent[]): Promise<void>;

  /**
   * Subscribe to event types and provide handler
   * @param eventTypes - Array of event type strings to subscribe to
   * @param handler - Callback function to process events
   */
  subscribe(eventTypes: string[], handler: EventHandler): Promise<void>;

  /**
   * Disconnect from transport
   */
  disconnect(): Promise<void>;

  /**
   * Check if transport is available and healthy
   */
  isHealthy(): Promise<boolean>;
}
