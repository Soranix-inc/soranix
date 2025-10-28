import Mixpanel from 'mixpanel';

import { systemLogger } from '@packages/logging';
import { getTraceId, getSpanId } from '@packages/tracing';

import { SoranixEvent, UserProperties } from '../types/index.js';

import { MixpanelConfig, getMixpanelConfig } from './config.js';

export class SoranixAnalytics {
  private client: Mixpanel.Mixpanel;
  private config: MixpanelConfig;
  private eventQueue: SoranixEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  constructor(config?: Partial<MixpanelConfig>) {
    this.config = { ...getMixpanelConfig(), ...config };

    if (!this.config.enabled) {
      systemLogger.info('Mixpanel analytics disabled');
      return;
    }

    if (!this.config.token) {
      throw new Error('Mixpanel token is required');
    }

    this.client = Mixpanel.init(this.config.token, {
      debug: this.config.debug,
      ip: this.config.ip,
      agent: this.config.agent,
    });

    this.setupBatchFlushing();
    systemLogger.info('SoranixAnalytics initialized', {
      environment: this.config.environment,
      batchSize: this.config.batchSize,
    });
  }

  /**
   * Track a single event
   */
  async track<T extends SoranixEvent>(event: T): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Add trace correlation if available
      const enrichedEvent = this.enrichEventWithTrace(event);

      // Add to queue for batch processing
      this.eventQueue.push(enrichedEvent);

      // Flush if queue is full
      if (this.eventQueue.length >= this.config.batchSize!) {
        await this.flush();
      }
    } catch (error) {
      systemLogger.error('Failed to track event', {
        event: event.event,
        error: error.message,
      });
    }
  }

  /**
   * Track multiple events in batch
   */
  async trackBatch(events: SoranixEvent[]): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      const enrichedEvents = events.map((event) => this.enrichEventWithTrace(event));
      this.eventQueue.push(...enrichedEvents);

      if (this.eventQueue.length >= this.config.batchSize!) {
        await this.flush();
      }
    } catch (error) {
      systemLogger.error('Failed to track batch events', {
        eventCount: events.length,
        error: error.message,
      });
    }
  }

  /**
   * Identify a user and set their properties
   */
  async identify(userId: string, properties: UserProperties): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      // Set user properties
      this.client.people.set(userId, properties);

      // Set user alias if needed
      this.client.alias(userId, userId);

      systemLogger.debug('User identified', { userId, propertiesCount: Object.keys(properties).length });
    } catch (error) {
      systemLogger.error('Failed to identify user', {
        userId,
        error: error.message,
      });
    }
  }

  /**
   * Set user properties without tracking an event
   */
  async setUserProperties(userId: string, properties: UserProperties): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      this.client.people.set(userId, properties);
      systemLogger.debug('User properties set', { userId, propertiesCount: Object.keys(properties).length });
    } catch (error) {
      systemLogger.error('Failed to set user properties', {
        userId,
        error: error.message,
      });
    }
  }

  /**
   * Increment a user property
   */
  async incrementUserProperty(userId: string, property: string, value: number = 1): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    try {
      this.client.people.increment(userId, property, value);
      systemLogger.debug('User property incremented', { userId, property, value });
    } catch (error) {
      systemLogger.error('Failed to increment user property', {
        userId,
        property,
        value,
        error: error.message,
      });
    }
  }

  /**
   * Flush queued events to Mixpanel
   */
  async flush(): Promise<void> {
    if (!this.config.enabled || this.eventQueue.length === 0) {
      return;
    }

    try {
      const eventsToFlush = [...this.eventQueue];
      this.eventQueue = [];

      // Send events to Mixpanel
      for (const event of eventsToFlush) {
        this.client.track(event.distinct_id, event.event, event.properties, event.timestamp);
      }

      systemLogger.debug('Events flushed to Mixpanel', { eventCount: eventsToFlush.length });
    } catch (error) {
      systemLogger.error('Failed to flush events to Mixpanel', {
        eventCount: this.eventQueue.length,
        error: error.message,
      });
    }
  }

  /**
   * Enrich event with trace correlation data
   */
  private enrichEventWithTrace<T extends SoranixEvent>(event: T): T {
    const traceId = getTraceId();
    const spanId = getSpanId();

    if (traceId || spanId) {
      return {
        ...event,
        properties: {
          ...event.properties,
          ...(traceId && { trace_id: traceId }),
          ...(spanId && { span_id: spanId }),
        },
      };
    }

    return event;
  }

  /**
   * Setup automatic batch flushing
   */
  private setupBatchFlushing(): void {
    if (this.config.flushInterval && this.config.flushInterval > 0) {
      this.flushTimer = setInterval(() => {
        this.flush().catch((error) => {
          systemLogger.error('Failed to flush events in timer', { error: error.message });
        });
      }, this.config.flushInterval);
    }
  }

  /**
   * Shutdown the analytics client
   */
  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Flush remaining events
    await this.flush();

    systemLogger.info('SoranixAnalytics shutdown complete');
  }
}
