import { EventPublisher, initializeEventConfigs } from '@packages/events';
import { systemLogger } from '@packages/logging';
import { getRabbitMQConnection } from '@packages/rabbitmq';
import { ExchangeManager, QueueManager } from '@packages/rabbitmq';

import { UserEventPublisher } from './publishers/user-event-publisher';

export class EventBus {
  private static instance: EventBus;
  private eventPublisher: EventPublisher | null = null;
  private userEventPublisher: UserEventPublisher | null = null;
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

      // Initialize event configurations
      initializeEventConfigs();

      // Get RabbitMQ connection
      const rabbitMQ = getRabbitMQConnection();
      await rabbitMQ.connect();

      const channel = rabbitMQ.getChannel();

      // Setup exchanges
      const exchangeManager = new ExchangeManager(channel);
      await exchangeManager.setupExchanges();

      // Setup queues
      const queueManager = new QueueManager(channel);
      await queueManager.setupQueues();

      // Setup queue bindings
      await queueManager.setupQueueBindings();

      // Initialize event publisher
      this.eventPublisher = new EventPublisher('auth-service');
      await this.eventPublisher.initialize();

      // Initialize user event publisher
      this.userEventPublisher = new UserEventPublisher(this.eventPublisher);

      this.isInitialized = true;

      systemLogger.info('Event bus initialized successfully');
    } catch (error) {
      systemLogger.error('Failed to initialize event bus', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  getUserEventPublisher(): UserEventPublisher {
    if (!this.userEventPublisher) {
      throw new Error('Event bus not initialized. Call initialize() first.');
    }
    return this.userEventPublisher;
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

// Export singleton instance
export const eventBus = EventBus.getInstance();
