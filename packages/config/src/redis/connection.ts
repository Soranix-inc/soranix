import Redis, { RedisOptions } from 'ioredis';

import { systemLogger } from '@packages/logging';

/**
 * Redis Connection Configuration
 *
 * Provides a singleton Redis connection that can be reused across services.
 * Configuration is loaded from environment variables.
 */

export interface RedisConfig {
  host: string;
  port: number;
  password?: string;
  db?: number;
  keyPrefix?: string;
  maxRetriesPerRequest?: number;
  enableReadyCheck?: boolean;
  enableOfflineQueue?: boolean;
  connectTimeout?: number;
  retryStrategy?: (times: number) => number | void;
}

class RedisConnection {
  private static instance: Redis | null = null;
  private static isConnecting = false;

  /**
   * Get Redis connection (singleton)
   */
  static async getConnection(config?: Partial<RedisConfig>): Promise<Redis> {
    if (RedisConnection.instance && RedisConnection.instance.status === 'ready') {
      return RedisConnection.instance;
    }

    if (RedisConnection.isConnecting) {
      // Wait for connection to be established
      await new Promise((resolve) => setTimeout(resolve, 100));
      return RedisConnection.getConnection(config);
    }

    RedisConnection.isConnecting = true;

    try {
      const redisConfig = RedisConnection.buildConfig(config);
      RedisConnection.instance = new Redis(redisConfig);

      // Event handlers
      RedisConnection.instance.on('connect', () => {
        systemLogger.info('Redis connection established');
      });

      RedisConnection.instance.on('ready', () => {
        systemLogger.info('Redis ready to accept commands');
      });

      RedisConnection.instance.on('error', (error) => {
        systemLogger.error('Redis connection error', {
          error: error.message,
        });
      });

      RedisConnection.instance.on('close', () => {
        systemLogger.warn('Redis connection closed');
      });

      RedisConnection.instance.on('reconnecting', (delay: number) => {
        systemLogger.info('Redis reconnecting', { delay });
      });

      // Wait for connection to be ready
      await RedisConnection.instance.ping();

      RedisConnection.isConnecting = false;
      return RedisConnection.instance;
    } catch (error) {
      RedisConnection.isConnecting = false;
      systemLogger.error('Failed to connect to Redis', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Build Redis configuration from environment variables
   */
  private static buildConfig(overrides?: Partial<RedisConfig>): RedisOptions {
    const defaultConfig: RedisConfig = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      keyPrefix: process.env.REDIS_KEY_PREFIX,
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      enableOfflineQueue: true,
      connectTimeout: 10000,
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    };

    return { ...defaultConfig, ...overrides };
  }

  /**
   * Close Redis connection
   */
  static async closeConnection(): Promise<void> {
    if (RedisConnection.instance) {
      await RedisConnection.instance.quit();
      RedisConnection.instance = null;
      systemLogger.info('Redis connection closed');
    }
  }

  /**
   * Get connection status
   */
  static getStatus(): string {
    return RedisConnection.instance?.status || 'disconnected';
  }
}

/**
 * Helper function to get Redis connection
 */
export async function getRedisConnection(config?: Partial<RedisConfig>): Promise<Redis> {
  return RedisConnection.getConnection(config);
}

/**
 * Helper function to close Redis connection
 */
export async function closeRedisConnection(): Promise<void> {
  return RedisConnection.closeConnection();
}

/**
 * Helper function to check Redis status
 */
export function getRedisStatus(): string {
  return RedisConnection.getStatus();
}

export { Redis };

