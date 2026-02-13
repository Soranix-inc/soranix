import { systemLogger } from '@packages/logging';

import { BaseEvent } from '../types/base-event.js';
import type { AllDomainEvents } from '../registry/index.js';
import type {
  TransportAdapter,
  TransportConfig,
  EventSubscriberOptions,
  ResolvedEventConfig,
} from '../transports/types.js';
import { getAllTransportConfigs } from '../registry/index.js';
import { ConfigResolver } from '../transports/config-resolver.js';
import { RabbitMQAdapter } from '../adapters/rabbitmq/rabbitmq-adapter.js';
import type { EventHandler } from '../adapters/event-transport.interface.js';

/**
 * EventSubscriber - High-level subscriber that handles transport initialization
 *
 * Services specify which transports to use and which events to subscribe to.
 * All infrastructure setup is handled internally.
 */
export class EventSubscriber {
  private serviceName: string;
  private adapters: TransportAdapter[];
  private config: TransportConfig | undefined;
  private subscribes: string[] | undefined;
  private initialized = false;
  private resolvedConfigs: Map<string, ResolvedEventConfig> = new Map();

  // Adapter instances
  private rabbitmqAdapter: RabbitMQAdapter | null = null;
  private handlers = new Map<string, EventHandler>();

  constructor(serviceName: string, options: EventSubscriberOptions) {
    this.serviceName = serviceName;
    this.adapters = Array.isArray(options.adapters) ? options.adapters : [options.adapters];
    this.config = options.config;
    this.subscribes = options.subscribes;
  }

  /**
   * Initialize subscriber with selected adapters
   * Sets up all infrastructure (queues, topics, bindings, etc.)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      systemLogger.info('EventSubscriber already initialized', { service: this.serviceName });
      return;
    }

    try {
      systemLogger.info('Initializing EventSubscriber...', {
        service: this.serviceName,
        adapters: this.adapters,
        subscribes: this.subscribes,
      });

      // 1. Load event registry transport configs
      const registryConfigs = getAllTransportConfigs();

      // 2. Filter to only subscribed events if specified
      const filteredConfigs = this.subscribes
        ? Object.fromEntries(
            this.subscribes.map((eventType) => [eventType, registryConfigs[eventType]]).filter(([, config]) => config)
          )
        : registryConfigs;

      // 3. Resolve configurations (merge registry defaults + service overrides)
      const configResolver = new ConfigResolver();
      this.resolvedConfigs = configResolver.resolve(filteredConfigs, this.config, this.serviceName);

      // 4. Initialize selected adapters
      for (const adapter of this.adapters) {
        await this.initializeAdapter(adapter);
      }

      this.initialized = true;
      systemLogger.info('EventSubscriber initialized successfully', {
        service: this.serviceName,
        adapters: this.adapters,
      });
    } catch (error) {
      systemLogger.error('Failed to initialize EventSubscriber', {
        service: this.serviceName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Initialize a specific adapter
   */
  private async initializeAdapter(adapter: TransportAdapter): Promise<void> {
    switch (adapter) {
      case 'rabbitmq':
        this.rabbitmqAdapter = new RabbitMQAdapter(this.serviceName);
        await this.rabbitmqAdapter.setup(this.resolvedConfigs);
        break;

      default:
        throw new Error(`Unknown adapter: ${adapter}`);
    }
  }

  /**
   * Subscribe to event types with handler
   * Type-safe subscription with automatic queue/topic setup
   */
  async subscribe<T extends AllDomainEvents = AllDomainEvents>(
    eventTypes: string[],
    handler: (event: T, data: T['data']) => Promise<void>
  ): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Store handlers
    for (const eventType of eventTypes) {
      this.handlers.set(eventType, handler as EventHandler);
    }

    // Subscribe via adapters
    const promises: Promise<void>[] = [];

    if (this.rabbitmqAdapter) {
      await this.rabbitmqAdapter.subscribe(eventTypes, handler as EventHandler);
    }
  }

  /**
   * Get RabbitMQ-specific subscriber
   */
  getRabbitMQSubscriber(): RabbitMQSubscriber | null {
    return this.rabbitmqAdapter ? new RabbitMQSubscriber(this.rabbitmqAdapter) : null;
  }

  /**
   * Disconnect from all transports
   */
  async disconnect(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.rabbitmqAdapter) {
      promises.push(this.rabbitmqAdapter.disconnect());
    }

    await Promise.all(promises);
    this.initialized = false;
    systemLogger.info('EventSubscriber disconnected', { service: this.serviceName });
  }

  /**
   * Check health of all transports
   */
  async isHealthy(): Promise<Record<TransportAdapter, boolean>> {
    const health: Record<string, boolean> = {};

    if (this.rabbitmqAdapter) {
      health.rabbitmq = await this.rabbitmqAdapter.isHealthy();
    }

    return health as Record<TransportAdapter, boolean>;
  }
}

/**
 * RabbitMQ-specific subscriber wrapper
 */
export class RabbitMQSubscriber {
  constructor(private adapter: RabbitMQAdapter) {}

  async subscribe<T extends AllDomainEvents = AllDomainEvents>(
    eventTypes: string[],
    handler: (event: T, data: T['data']) => Promise<void>
  ): Promise<void> {
    return this.adapter.subscribe(eventTypes, handler as EventHandler);
  }
}
