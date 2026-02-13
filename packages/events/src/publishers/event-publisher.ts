import { systemLogger } from '@packages/logging';

import { BaseEvent } from '../types/base-event.js';
import type { AllDomainEvents } from '../registry/index.js';
import type {
  TransportAdapter,
  TransportConfig,
  EventPublisherOptions,
  ResolvedEventConfig,
} from '../transports/types.js';
import { getAllTransportConfigs } from '../registry/index.js';
import { ConfigResolver } from '../transports/config-resolver.js';
import { RabbitMQAdapter } from '../adapters/rabbitmq/rabbitmq-adapter.js';

/**
 * EventPublisher - High-level publisher that handles transport initialization
 *
 * Services specify which transports to use and optional overrides.
 * All infrastructure setup is handled internally.
 */
export class EventPublisher {
  private serviceName: string;
  private adapters: TransportAdapter[];
  private config: TransportConfig | undefined;
  private initialized = false;
  private resolvedConfigs: Map<string, ResolvedEventConfig> = new Map();

  // Adapter instances
  private rabbitmqAdapter: RabbitMQAdapter | null = null;

  constructor(serviceName: string, options: EventPublisherOptions) {
    this.serviceName = serviceName;
    this.adapters = Array.isArray(options.adapters) ? options.adapters : [options.adapters];
    this.config = options.config;
  }

  /**
   * Initialize publisher with selected adapters
   * Sets up all infrastructure (exchanges, queues, topics, etc.)
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      systemLogger.info('EventPublisher already initialized', { service: this.serviceName });
      return;
    }

    try {
      systemLogger.info('Initializing EventPublisher...', {
        service: this.serviceName,
        adapters: this.adapters,
      });

      // 1. Load event registry transport configs
      const registryConfigs = getAllTransportConfigs();

      // 2. Resolve configurations (merge registry defaults + service overrides)
      const configResolver = new ConfigResolver();
      this.resolvedConfigs = configResolver.resolve(registryConfigs, this.config, this.serviceName);

      // 3. Initialize selected adapters
      for (const adapter of this.adapters) {
        await this.initializeAdapter(adapter);
      }

      this.initialized = true;
      systemLogger.info('EventPublisher initialized successfully', {
        service: this.serviceName,
        adapters: this.adapters,
      });
    } catch (error) {
      systemLogger.error('Failed to initialize EventPublisher', {
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
   * Publish event to all configured adapters
   */
  async publish<T extends AllDomainEvents = AllDomainEvents>(event: T): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const promises: Promise<void>[] = [];

    if (this.rabbitmqAdapter) {
      await this.rabbitmqAdapter.publish(event);
    }
  }

  /**
   * Publish batch of events to all configured adapters
   */
  async publishBatch<T extends AllDomainEvents = AllDomainEvents>(events: T[]): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }

    const promises: Promise<void>[] = [];

    if (this.rabbitmqAdapter) {
      await this.rabbitmqAdapter.publishBatch(events);
    }
  }

  /**
   * Get RabbitMQ-specific publisher (for use cases where you want separate control)
   */
  getRabbitMQPublisher(): RabbitMQPublisher | null {
    return this.rabbitmqAdapter ? new RabbitMQPublisher(this.rabbitmqAdapter) : null;
  }

  /**
   * Disconnect from all transports
   */
  async disconnect(): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.rabbitmqAdapter) {
      await this.rabbitmqAdapter.disconnect();
    }
    this.initialized = false;
    systemLogger.info('EventPublisher disconnected', { service: this.serviceName });
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
 * RabbitMQ-specific publisher wrapper
 * Allows publishing only to RabbitMQ when using multiple adapters
 */
export class RabbitMQPublisher {
  constructor(private adapter: RabbitMQAdapter) {}

  async publish<T extends AllDomainEvents = AllDomainEvents>(event: T): Promise<void> {
    return this.adapter.publish(event);
  }

  async publishBatch<T extends AllDomainEvents = AllDomainEvents>(events: T[]): Promise<void> {
    return this.adapter.publishBatch(events);
  }
}
