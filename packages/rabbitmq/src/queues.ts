import { Channel } from 'amqplib';

import { systemLogger } from '@packages/logging';

import { EXCHANGES } from './exchanges.js';

export const QUEUES = {
  // Financial queues
  PAYMENTS_PROCESSING: 'payments.processing',
  PAYMENTS_COMPLETED: 'payments.completed',
  TRANSFERS_PROCESSING: 'transfers.processing',
  TRANSFERS_COMPLETED: 'transfers.completed',
  BILLS_PROCESSING: 'bills.processing',
  BILLS_COMPLETED: 'bills.completed',

  // User queues
  USER_REGISTRATION: 'user.registration',
  USER_AUTHENTICATION: 'user.authentication',
  USER_PROFILE_UPDATES: 'user.profile.updates',

  // AI queues
  AI_ANALYSIS: 'ai.analysis',
  AI_RECOMMENDATIONS: 'ai.recommendations',
  AI_INSIGHTS: 'ai.insights',

  // Notification queues
  NOTIFICATIONS_EMAIL: 'notifications.email',
  NOTIFICATIONS_SMS: 'notifications.sms',
  NOTIFICATIONS_PUSH: 'notifications.push',

  // Audit queues
  AUDIT_EVENTS: 'audit.events',

  // Dead letter queues
  DEAD_LETTER_FINANCIAL: 'dlx.financial',
  DEAD_LETTER_USER: 'dlx.user',
  DEAD_LETTER_AI: 'dlx.ai',
  DEAD_LETTER_NOTIFICATION: 'dlx.notification',
} as const;

export interface QueueConfig {
  name: string;
  durable: boolean;
  exclusive: boolean;
  autoDelete: boolean;
  arguments?: Record<string, any>;
}

export const QUEUE_CONFIGS: Record<string, QueueConfig> = {
  // Financial queues - Critical events with high reliability
  [QUEUES.PAYMENTS_PROCESSING]: {
    name: QUEUES.PAYMENTS_PROCESSING,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 300000, // 5 minutes
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
      'x-dead-letter-routing-key': 'dlx.financial',
      'x-max-retries': 3,
    },
  },
  [QUEUES.PAYMENTS_COMPLETED]: {
    name: QUEUES.PAYMENTS_COMPLETED,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
    },
  },
  [QUEUES.TRANSFERS_PROCESSING]: {
    name: QUEUES.TRANSFERS_PROCESSING,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 300000, // 5 minutes
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
      'x-dead-letter-routing-key': 'dlx.financial',
      'x-max-retries': 3,
    },
  },
  [QUEUES.TRANSFERS_COMPLETED]: {
    name: QUEUES.TRANSFERS_COMPLETED,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
    },
  },
  [QUEUES.BILLS_PROCESSING]: {
    name: QUEUES.BILLS_PROCESSING,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 300000, // 5 minutes
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
      'x-dead-letter-routing-key': 'dlx.financial',
      'x-max-retries': 3,
    },
  },
  [QUEUES.BILLS_COMPLETED]: {
    name: QUEUES.BILLS_COMPLETED,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
    },
  },

  // User queues
  [QUEUES.USER_REGISTRATION]: {
    name: QUEUES.USER_REGISTRATION,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
      'x-dead-letter-routing-key': 'dlx.user',
    },
  },
  [QUEUES.USER_AUTHENTICATION]: {
    name: QUEUES.USER_AUTHENTICATION,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
      'x-dead-letter-routing-key': 'dlx.user',
    },
  },
  [QUEUES.USER_PROFILE_UPDATES]: {
    name: QUEUES.USER_PROFILE_UPDATES,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
      'x-dead-letter-routing-key': 'dlx.user',
    },
  },

  // AI queues
  [QUEUES.AI_ANALYSIS]: {
    name: QUEUES.AI_ANALYSIS,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
      'x-dead-letter-routing-key': 'dlx.ai',
    },
  },
  [QUEUES.AI_RECOMMENDATIONS]: {
    name: QUEUES.AI_RECOMMENDATIONS,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
      'x-dead-letter-routing-key': 'dlx.ai',
    },
  },
  [QUEUES.AI_INSIGHTS]: {
    name: QUEUES.AI_INSIGHTS,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
      'x-dead-letter-routing-key': 'dlx.ai',
    },
  },

  // Notification queues
  [QUEUES.NOTIFICATIONS_EMAIL]: {
    name: QUEUES.NOTIFICATIONS_EMAIL,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
      'x-dead-letter-routing-key': 'dlx.notification',
    },
  },
  [QUEUES.NOTIFICATIONS_SMS]: {
    name: QUEUES.NOTIFICATIONS_SMS,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
      'x-dead-letter-routing-key': 'dlx.notification',
    },
  },
  [QUEUES.NOTIFICATIONS_PUSH]: {
    name: QUEUES.NOTIFICATIONS_PUSH,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
      'x-dead-letter-routing-key': 'dlx.notification',
    },
  },

  // Audit queue
  [QUEUES.AUDIT_EVENTS]: {
    name: QUEUES.AUDIT_EVENTS,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 2592000000, // 30 days
    },
  },

  // Dead letter queues
  [QUEUES.DEAD_LETTER_FINANCIAL]: {
    name: QUEUES.DEAD_LETTER_FINANCIAL,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 86400000, // 24 hours
    },
  },
  [QUEUES.DEAD_LETTER_USER]: {
    name: QUEUES.DEAD_LETTER_USER,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 86400000, // 24 hours
    },
  },
  [QUEUES.DEAD_LETTER_AI]: {
    name: QUEUES.DEAD_LETTER_AI,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 86400000, // 24 hours
    },
  },
  [QUEUES.DEAD_LETTER_NOTIFICATION]: {
    name: QUEUES.DEAD_LETTER_NOTIFICATION,
    durable: true,
    exclusive: false,
    autoDelete: false,
    arguments: {
      'x-message-ttl': 86400000, // 24 hours
    },
  },
};

export class QueueManager {
  constructor(private channel: Channel) {}

  async setupQueues(): Promise<void> {
    systemLogger.info('Setting up RabbitMQ queues...');

    for (const [queueName, config] of Object.entries(QUEUE_CONFIGS)) {
      try {
        await this.channel.assertQueue(config.name, {
          durable: config.durable,
          exclusive: config.exclusive,
          autoDelete: config.autoDelete,
          arguments: config.arguments,
        });
        systemLogger.info(`Queue created/verified: ${queueName}`);
      } catch (error) {
        systemLogger.error(`Failed to create queue: ${queueName}`, { error: error.message });
        throw error;
      }
    }

    systemLogger.info('All queues setup completed');
  }

  async setupQueueBindings(): Promise<void> {
    systemLogger.info('Setting up queue bindings...');

    const bindings = [
      // Financial bindings
      { queue: QUEUES.PAYMENTS_PROCESSING, exchange: EXCHANGES.FINANCIAL, routingKey: 'payment.*' },
      { queue: QUEUES.PAYMENTS_COMPLETED, exchange: EXCHANGES.FINANCIAL, routingKey: 'payment.completed' },
      { queue: QUEUES.TRANSFERS_PROCESSING, exchange: EXCHANGES.FINANCIAL, routingKey: 'transfer.*' },
      { queue: QUEUES.TRANSFERS_COMPLETED, exchange: EXCHANGES.FINANCIAL, routingKey: 'transfer.completed' },
      { queue: QUEUES.BILLS_PROCESSING, exchange: EXCHANGES.FINANCIAL, routingKey: 'bill.*' },
      { queue: QUEUES.BILLS_COMPLETED, exchange: EXCHANGES.FINANCIAL, routingKey: 'bill.completed' },

      // User bindings
      { queue: QUEUES.USER_REGISTRATION, exchange: EXCHANGES.USER, routingKey: 'user.registered' },
      { queue: QUEUES.USER_AUTHENTICATION, exchange: EXCHANGES.USER, routingKey: 'user.login' },
      { queue: QUEUES.USER_PROFILE_UPDATES, exchange: EXCHANGES.USER, routingKey: 'user.profile.*' },

      // AI bindings
      { queue: QUEUES.AI_ANALYSIS, exchange: EXCHANGES.AI, routingKey: 'ai.analysis.*' },
      { queue: QUEUES.AI_RECOMMENDATIONS, exchange: EXCHANGES.AI, routingKey: 'ai.recommendation.*' },
      { queue: QUEUES.AI_INSIGHTS, exchange: EXCHANGES.AI, routingKey: 'ai.insight.*' },

      // Notification bindings
      { queue: QUEUES.NOTIFICATIONS_EMAIL, exchange: EXCHANGES.NOTIFICATION, routingKey: 'notification.email' },
      { queue: QUEUES.NOTIFICATIONS_SMS, exchange: EXCHANGES.NOTIFICATION, routingKey: 'notification.sms' },
      { queue: QUEUES.NOTIFICATIONS_PUSH, exchange: EXCHANGES.NOTIFICATION, routingKey: 'notification.push' },

      // Audit bindings
      { queue: QUEUES.AUDIT_EVENTS, exchange: EXCHANGES.AUDIT, routingKey: 'audit.*' },

      // Dead letter bindings
      { queue: QUEUES.DEAD_LETTER_FINANCIAL, exchange: EXCHANGES.DEAD_LETTER, routingKey: 'dlx.financial' },
      { queue: QUEUES.DEAD_LETTER_USER, exchange: EXCHANGES.DEAD_LETTER, routingKey: 'dlx.user' },
      { queue: QUEUES.DEAD_LETTER_AI, exchange: EXCHANGES.DEAD_LETTER, routingKey: 'dlx.ai' },
      { queue: QUEUES.DEAD_LETTER_NOTIFICATION, exchange: EXCHANGES.DEAD_LETTER, routingKey: 'dlx.notification' },
    ];

    for (const binding of bindings) {
      try {
        await this.channel.bindQueue(binding.queue, binding.exchange, binding.routingKey);
        systemLogger.info(`Binding created: ${binding.queue} -> ${binding.exchange} (${binding.routingKey})`);
      } catch (error) {
        systemLogger.error(`Failed to create binding: ${binding.queue} -> ${binding.exchange}`, {
          error: error.message,
        });
        throw error;
      }
    }

    systemLogger.info('All queue bindings setup completed');
  }

  async deleteQueue(queueName: string): Promise<void> {
    try {
      await this.channel.deleteQueue(queueName);
      systemLogger.info(`Queue deleted: ${queueName}`);
    } catch (error) {
      systemLogger.error(`Failed to delete queue: ${queueName}`, { error: error.message });
      throw error;
    }
  }
}

