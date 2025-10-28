export interface BaseEvent {
  eventId: string;
  eventType: string;
  aggregateId: string;
  timestamp: Date;
  version: number;
  correlationId: string;
  causationId?: string;
  metadata?: Record<string, any>;
  data: any;
  encrypted?: boolean;
}

export interface EventMetadata {
  source: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  environment: string;
  service: string;
  version: string;
}

export enum EventPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum DeliveryGuarantee {
  AT_LEAST_ONCE = 'at-least-once',
  EXACTLY_ONCE = 'exactly-once',
  BEST_EFFORT = 'best-effort',
}

export interface EventConfig {
  priority: EventPriority;
  deliveryGuarantee: DeliveryGuarantee;
  requiresEncryption: boolean;
  ttl?: number; // Time to live in milliseconds
  maxRetries?: number;
}

// Event Configuration Registry
export const EVENT_CONFIG_REGISTRY: Record<string, EventConfig> = {
  // This will be populated by importing event configs from specific event files
};

// Utility function to get event configuration
export function getEventConfig(eventType: string): EventConfig {
  return (
    EVENT_CONFIG_REGISTRY[eventType] || {
      priority: EventPriority.NORMAL,
      deliveryGuarantee: DeliveryGuarantee.AT_LEAST_ONCE,
      requiresEncryption: false,
      ttl: 604800000, // 7 days
      maxRetries: 2,
    }
  );
}

// Utility function to register event configurations
export function registerEventConfigs(configs: Record<string, EventConfig>): void {
  Object.assign(EVENT_CONFIG_REGISTRY, configs);
}

// Generic Event Factory Function
export function createEvent<T extends BaseEvent>(
  eventType: T['eventType'],
  aggregateId: string,
  data: T['data'],
  options: { correlationId?: string; causationId?: string; metadata?: EventMetadata } = {}
): T {
  return {
    eventId: generateEventId(),
    eventType,
    aggregateId,
    timestamp: new Date(),
    version: 1,
    correlationId: options.correlationId || generateCorrelationId(),
    causationId: options.causationId,
    metadata: options.metadata,
    data,
    encrypted: false,
  } as T;
}

// Utility functions
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateCorrelationId(): string {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
