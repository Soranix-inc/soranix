import { Channel } from 'amqplib';

import { systemLogger } from '@packages/logging';

export const EXCHANGES = {
  FINANCIAL: 'soranix.financial',
  USER: 'soranix.user',
  AI: 'soranix.ai',
  NOTIFICATION: 'soranix.notification',
  AUDIT: 'soranix.audit',
  DEAD_LETTER: 'soranix.dlx',
} as const;

export const EXCHANGE_TYPES = {
  TOPIC: 'topic',
  DIRECT: 'direct',
  FANOUT: 'fanout',
} as const;

export interface ExchangeConfig {
  name: string;
  type: string;
  durable: boolean;
  arguments?: Record<string, any>;
}

export const EXCHANGE_CONFIGS: Record<string, ExchangeConfig> = {
  [EXCHANGES.FINANCIAL]: {
    name: EXCHANGES.FINANCIAL,
    type: EXCHANGE_TYPES.TOPIC,
    durable: true,
    arguments: {
      'x-message-ttl': 604800000, // 7 days in milliseconds
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
    },
  },
  [EXCHANGES.USER]: {
    name: EXCHANGES.USER,
    type: EXCHANGE_TYPES.TOPIC,
    durable: true,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
    },
  },
  [EXCHANGES.AI]: {
    name: EXCHANGES.AI,
    type: EXCHANGE_TYPES.TOPIC,
    durable: true,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
    },
  },
  [EXCHANGES.NOTIFICATION]: {
    name: EXCHANGES.NOTIFICATION,
    type: EXCHANGE_TYPES.TOPIC,
    durable: true,
    arguments: {
      'x-message-ttl': 604800000, // 7 days
      'x-dead-letter-exchange': EXCHANGES.DEAD_LETTER,
    },
  },
  [EXCHANGES.AUDIT]: {
    name: EXCHANGES.AUDIT,
    type: EXCHANGE_TYPES.TOPIC,
    durable: true,
    arguments: {
      'x-message-ttl': 2592000000, // 30 days for audit events
    },
  },
  [EXCHANGES.DEAD_LETTER]: {
    name: EXCHANGES.DEAD_LETTER,
    type: EXCHANGE_TYPES.TOPIC,
    durable: true,
    arguments: {
      'x-message-ttl': 86400000, // 24 hours for dead letter messages
    },
  },
};

export class ExchangeManager {
  constructor(private channel: Channel) {}

  async setupExchanges(): Promise<void> {
    systemLogger.info('Setting up RabbitMQ exchanges...');

    for (const [exchangeName, config] of Object.entries(EXCHANGE_CONFIGS)) {
      try {
        await this.channel.assertExchange(config.name, config.type, {
          durable: config.durable,
          arguments: config.arguments,
        });
        systemLogger.info(`Exchange created/verified: ${exchangeName}`);
      } catch (error) {
        systemLogger.error(`Failed to create exchange: ${exchangeName}`, { error: error.message });
        throw error;
      }
    }

    systemLogger.info('All exchanges setup completed');
  }

  async deleteExchange(exchangeName: string): Promise<void> {
    try {
      await this.channel.deleteExchange(exchangeName);
      systemLogger.info(`Exchange deleted: ${exchangeName}`);
    } catch (error) {
      systemLogger.error(`Failed to delete exchange: ${exchangeName}`, { error: error.message });
      throw error;
    }
  }
}
