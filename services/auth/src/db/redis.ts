import { createClient } from 'redis';

import { systemLogger } from '@packages/logging';

export type RedisClient = ReturnType<typeof createClient>;

let redisClient: RedisClient | null = null;

export async function initializeRedis(): Promise<RedisClient> {
  if (redisClient) {
    return redisClient;
  }

  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => {
        if (retries > 10) {
          systemLogger.error('Redis reconnection failed after 10 attempts');
          return new Error('Redis reconnection limit exceeded');
        }
        return Math.min(retries * 50, 1000);
      },
    },
  });

  client.on('error', (err) => {
    systemLogger.error('Redis client error', { error: err.message });
  });

  client.on('connect', () => {
    systemLogger.info('Redis client connected');
  });

  client.on('reconnecting', () => {
    systemLogger.warn('Redis client reconnecting');
  });

  await client.connect();

  redisClient = client;
  systemLogger.info('Redis initialized successfully');

  return client;
}

export function getRedisClient(): RedisClient {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    systemLogger.info('Redis connection closed');
  }
}

// Session helpers
export const REDIS_KEYS = {
  session: (sessionId: string) => `session:${sessionId}`,
  userSessions: (userId: string) => `user:${userId}:sessions`,
  rateLimitLogin: (email: string) => `rate:login:${email}`,
  rateLimitPasswordReset: (email: string) => `rate:password-reset:${email}`,
} as const;
