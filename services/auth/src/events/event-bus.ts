import { EventPublisher, registerEventConfigs, AUTH_EVENT_CONFIG } from '@packages/events';
import { systemLogger } from '@packages/logging';

import { AuthEventPublisher } from './publishers/auth-event-publisher';

export class EventBus {
  private static instance: EventBus;
  private eventPublisher: EventPublisher | null = null;
  private authEventPublisher: AuthEventPublisher | null = null;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      systemLogger.info('Event bus already initialized');
      return;
    }

    try {
      systemLogger.info('Initializing event bus...');

      registerEventConfigs(AUTH_EVENT_CONFIG);

      // Initialize event publisher with RabbitMQ adapter
      // All infrastructure setup (exchanges, queues, bindings) is handled by EventPublisher
      this.eventPublisher = new EventPublisher('auth-service', {
        adapters: 'rabbitmq',
      });
      await this.eventPublisher.initialize();

      // Initialize auth event publisher
      this.authEventPublisher = new AuthEventPublisher(this.eventPublisher);

      this.isInitialized = true;

      systemLogger.info('Event bus initialized successfully');
    } catch (error) {
      systemLogger.error('Failed to initialize event bus', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  getAuthEventPublisher(): AuthEventPublisher {
    if (!this.authEventPublisher) {
      throw new Error('Event bus not initialized. Call initialize() first.');
    }
    return this.authEventPublisher;
  }

  getEventPublisher(): EventPublisher {
    if (!this.eventPublisher) {
      throw new Error('Event bus not initialized. Call initialize() first.');
    }
    return this.eventPublisher;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export const eventBus = EventBus.getInstance();
