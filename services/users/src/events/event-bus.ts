import { EventSubscriber, initializeEventConfigs } from '@packages/events';
import { systemLogger } from '@packages/logging';
import { getRabbitMQConnection } from '@packages/rabbitmq';
import { ExchangeManager, QueueManager } from '@packages/rabbitmq';

import { UserEventSubscriber } from './subscribers/user-event-subscriber';

export class EventBus {
  private static instance: EventBus;
  private eventSubscriber: EventSubscriber | null = null;
  private userEventSubscriber: UserEventSubscriber | null = null;
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

      // Initialize event subscriber
      this.eventSubscriber = new EventSubscriber('users-service');
      await this.eventSubscriber.initialize();

      // Initialize user event subscriber
      this.userEventSubscriber = new UserEventSubscriber(this.eventSubscriber);

      // Subscribe to events
      await this.userEventSubscriber.subscribeToUserEvents();

      this.isInitialized = true;

      systemLogger.info('Event bus initialized successfully');
    } catch (error) {
      systemLogger.error('Failed to initialize event bus', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  getUserEventSubscriber(): UserEventSubscriber {
    if (!this.userEventSubscriber) {
      throw new Error('Event bus not initialized. Call initialize() first.');
    }
    return this.userEventSubscriber;
  }

  getEventSubscriber(): EventSubscriber {
    if (!this.eventSubscriber) {
      throw new Error('Event bus not initialized. Call initialize() first.');
    }
    return this.eventSubscriber;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
export const eventBus = EventBus.getInstance();
