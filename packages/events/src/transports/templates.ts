/**
 * Transport Templates
 * Reusable configuration templates for queues and topics
 */

import type { RabbitMQQueueConfig } from './types.js';
import { EXCHANGES } from './constants.js';

export const RABBITMQ_QUEUE_TEMPLATES: Record<string, Omit<RabbitMQQueueConfig, 'name' | 'template'>> = {
  default: {
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
    },
  },
  
  critical: {
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 300000, // 5 minutes
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
      'x-max-retries': 3,
      'x-retry-delay': 1000,
    },
  },
  
  audit: {
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 2592000000, // 30 days
    },
  },
} as const;





