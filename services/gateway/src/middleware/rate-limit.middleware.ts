import type { Request, Response, NextFunction } from 'express';

import { getRedisConnection, type Redis } from '@packages/config';
import { systemLogger } from '@packages/logging';

import { getRouteConfig, isPublicRoute } from '../config/gateway.config.js';
import type { RateLimitConfig } from '../types/gateway.types.js';

let redisClient: Redis | null = null;

async function getRedis(): Promise<Redis | null> {
  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = await getRedisConnection();
    return redisClient;
  } catch (error) {
    systemLogger.warn('Redis not available for rate limiting, falling back to in-memory', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

async function checkRateLimit(key: string, config: RateLimitConfig): Promise<boolean> {
  const redis = await getRedis();

  if (redis) {
    try {
      const count = await redis.incr(key);

      if (count === 1) {
        await redis.pexpire(key, config.windowMs);
      }

      const ttl = await redis.pttl(key);
      if (ttl === -1) {
        await redis.pexpire(key, config.windowMs);
      }

      return count <= config.max;
    } catch (error) {
      systemLogger.error('Redis rate limit error', {
        error: error instanceof Error ? error.message : String(error),
      });
      return true;
    }
  }

  const memoryStore = (global as any).__rateLimitStore || ((global as any).__rateLimitStore = new Map());
  const record = memoryStore.get(key);

  if (!record) {
    memoryStore.set(key, { count: 1, resetTime: Date.now() + config.windowMs });
    setTimeout(() => memoryStore.delete(key), config.windowMs);
    return true;
  }

  if (Date.now() > record.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: Date.now() + config.windowMs });
    setTimeout(() => memoryStore.delete(key), config.windowMs);
    return true;
  }

  record.count++;
  return record.count <= config.max;
}

function getRateLimitConfig(req: Request): RateLimitConfig | null {
  const routeConfig = getRouteConfig(req.path);
  if (!routeConfig || !routeConfig.rateLimit) {
    return null;
  }

  const isPublic = routeConfig.publicRoutes ? isPublicRoute(req.path, routeConfig) : false;

  if (isPublic && routeConfig.rateLimit.public) {
    return routeConfig.rateLimit.public;
  }

  if (!isPublic && req.user && routeConfig.rateLimit.protected) {
    return routeConfig.rateLimit.protected;
  }

  return routeConfig.rateLimit.default || null;
}

function generateRateLimitKey(req: Request, routeConfig: { service: string }): string {
  const isPublic = routeConfig.publicRoutes ? isPublicRoute(req.path, routeConfig) : false;

  if (isPublic || !req.user) {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return `rate:ip:${routeConfig.service}:${ip}:${req.path}`;
  }

  return `rate:user:${routeConfig.service}:${req.user.userId}:${req.path}`;
}

export async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  if (process.env.RATE_LIMIT_ENABLED === 'false') {
    return next();
  }

  const routeConfig = getRouteConfig(req.path);

  if (!routeConfig) {
    return next();
  }

  const rateLimitConfig = getRateLimitConfig(req);

  if (!rateLimitConfig) {
    return next();
  }

  try {
    const key = generateRateLimitKey(req, routeConfig);
    const allowed = await checkRateLimit(key, rateLimitConfig);

    if (!allowed) {
      systemLogger.warn('Rate limit exceeded', {
        path: req.path,
        userId: req.user?.userId,
        ip: req.ip,
      });

      res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Rate limit exceeded. Maximum ${rateLimitConfig.max} requests per ${rateLimitConfig.windowMs / 1000} seconds.`,
      });
      return;
    }

    res.setHeader('X-RateLimit-Limit', rateLimitConfig.max.toString());
    res.setHeader('X-RateLimit-Window', (rateLimitConfig.windowMs / 1000).toString());

    next();
  } catch (error) {
    systemLogger.error('Rate limiting error', {
      error: error instanceof Error ? error.message : String(error),
      path: req.path,
    });

    next();
  }
}

