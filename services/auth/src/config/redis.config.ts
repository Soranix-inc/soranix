import { createClient } from 'redis';

import { systemLogger } from '@packages/logging';

/**
 * Redis Client for Auth Service
 * Used for:
 * - Session storage
 * - Refresh token storage
 * - Rate limiting
 */

export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
});

redisClient.on('error', (err) => {
  systemLogger.error('Redis Client Error', { error: err.message });
});

redisClient.on('connect', () => {
  systemLogger.info('Redis Client Connected');
});

export async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
    systemLogger.info('Redis connection established');
  } catch (error) {
    systemLogger.error('Failed to connect to Redis', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

export async function disconnectRedis(): Promise<void> {
  try {
    await redisClient.quit();
    systemLogger.info('Redis connection closed');
  } catch (error) {
    systemLogger.error('Failed to disconnect from Redis', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
}
