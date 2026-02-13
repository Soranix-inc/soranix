/**
 * Transport Configuration Types
 * Type-safe configuration for event transport adapters
 */

export type TransportAdapter = 'rabbitmq';

export type QueueTemplate = 'default' | 'critical' | 'audit';

export type ExchangeName =
  | 'soranix.auth'
  | 'soranix.users'
  | 'soranix.ledger'
  | 'soranix.payments'
  | 'soranix.banking'
  | 'soranix.portfolio'
  | 'soranix.bills-payment'
  | 'soranix.transfers'
  | 'soranix.flows'
  | 'soranix.money-management'
  | 'soranix.notification'
  | 'soranix.billing'
  | 'soranix.ai'
  | 'soranix.audit'
  | 'soranix.dlx';

/**
 * RabbitMQ Queue Configuration
 */
export interface RabbitMQQueueConfig {
  name?: string;
  template?: QueueTemplate;
  durable?: boolean;
  exclusive?: boolean;
  autoDelete?: boolean;
  arguments?: {
    'x-message-ttl'?: number;
    'x-dead-letter-exchange'?: string;
    'x-dead-letter-routing-key'?: string;
    'x-max-retries'?: number;
    'x-retry-delay'?: number;
    'x-max-priority'?: number;
    [key: string]: any;
  };
}

/**
 * RabbitMQ Exchange Configuration
 */
export interface RabbitMQExchangeConfig {
  name: ExchangeName;
  type?: 'topic' | 'direct' | 'fanout';
  durable?: boolean;
  arguments?: Record<string, any>;
}

/**
 * RabbitMQ Event Configuration (from registry)
 */
export interface RabbitMQEventConfig {
  exchange: ExchangeName;
  routingKey: string;
  queue?: RabbitMQQueueConfig;
}

/**
 * Transport Configuration per Event (from registry)
 */
export interface EventTransportConfig {
  rabbitmq?: RabbitMQEventConfig;
}

/**
 * Service-level RabbitMQ Configuration (overrides)
 */
export interface RabbitMQServiceConfig {
  events?: Record<string, Partial<RabbitMQEventConfig>>;
  global?: {
    queueNamingStrategy?: 'event-type' | 'service-prefixed';
    queueNamePrefix?: string;
  };
}

/**
 * Combined Service Transport Configuration
 */
export interface TransportConfig {
  rabbitmq?: RabbitMQServiceConfig;
}

/**
 * EventPublisher Options
 */
export interface EventPublisherOptions {
  adapters: TransportAdapter | TransportAdapter[];
  config?: TransportConfig;
}

/**
 * EventSubscriber Options
 */
export interface EventSubscriberOptions {
  adapters: TransportAdapter | TransportAdapter[];
  config?: TransportConfig;
  subscribes?: string[];
}

/**
 * Resolved Event Configuration (after merging registry + service configs)
 */
export interface ResolvedEventConfig {
  eventType: string;
  rabbitmq?: ResolvedRabbitMQConfig;
}

export interface ResolvedRabbitMQConfig {
  exchange: ExchangeName;
  routingKey: string;
  queue: {
    name: string;
    durable: boolean;
    exclusive: boolean;
    autoDelete: boolean;
    arguments: Record<string, any>;
  };
}
