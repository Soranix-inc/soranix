import { EventSubscriber, EventPublisher, initializeEventConfigs } from '@packages/events';
import { systemLogger } from '@packages/logging';
import { getRabbitMQConnection } from '@packages/rabbitmq';
import { ExchangeManager, QueueManager } from '@packages/rabbitmq';

import CoreServices from '../services/core/core.services.js';

import { BillEventSubscriber } from './subscribers/bill-event-subscriber.js';
import { PaymentEventSubscriber } from './subscribers/payment-event-subscriber.js';
import { TransferEventSubscriber } from './subscribers/transfer-event-subscriber.js';

export class EventBus {
  private static instance: EventBus;
  private eventSubscriber: EventSubscriber | null = null;
  private eventPublisher: EventPublisher | null = null;
  private coreServices: CoreServices | null = null;
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

      // Initialize event subscriber and publisher
      this.eventSubscriber = new EventSubscriber(channel);
      this.eventPublisher = new EventPublisher(channel);

      // Initialize core ledger service
      this.coreServices = new CoreServices();

      // Initialize and subscribe to financial events
      const paymentSubscriber = new PaymentEventSubscriber(this.eventSubscriber, this.coreServices);
      await paymentSubscriber.subscribeToPaymentEvents();

      const billSubscriber = new BillEventSubscriber(this.eventSubscriber, this.coreServices);
      await billSubscriber.subscribeToBillEvents();

      const transferSubscriber = new TransferEventSubscriber(this.eventSubscriber, this.coreServices);
      await transferSubscriber.subscribeToTransferEvents();

      this.isInitialized = true;

      systemLogger.info('Event bus initialized successfully');
    } catch (error) {
      systemLogger.error('Failed to initialize event bus', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  getCoreServices(): CoreServices {
    if (!this.coreServices) {
      throw new Error('Event bus not initialized. Call initialize() first.');
    }
    return this.coreServices;
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
