import crypto from 'crypto';

import { getRedisConnection, type Redis } from '@packages/config';
import { systemLogger } from '@packages/logging';

import type { IdempotencyConfig, RequestFingerprint, IdempotencyResult, IdempotencyData } from './idempotency-types.js';

/**
 * Idempotency Service
 *
 * Prevents duplicate operations using Redis for fast, distributed idempotency checking.
 *
 * Features:
 * - Server-generated idempotency keys
 * - Request fingerprint for rapid duplicate detection
 * - Configurable TTL (default 24 hours)
 * - Cached results for duplicate requests
 * - Distributed across multiple service instances
 *
 * Usage:
 * ```typescript
 * const idempotency = new IdempotencyService({ ttl: 86400, keyPrefix: 'payment' });
 *
 * // Generate key
 * const key = idempotency.generateKey(fingerprint);
 *
 * // Check for duplicates
 * const result = await idempotency.check(key);
 * if (result.isDuplicate) {
 *   return result.cachedResult;
 * }
 *
 * // Process operation...
 * const operationResult = await processPayment();
 *
 * // Store result
 * await idempotency.store(key, fingerprint, operationResult);
 * ```
 */
export class IdempotencyService {
  private redis: Redis | null = null;
  private config: Required<IdempotencyConfig>;

  constructor(config: IdempotencyConfig = {}) {
    this.config = {
      ttl: config.ttl || 86400, // 24 hours
      keyPrefix: config.keyPrefix || 'idem',
      useFingerprintCheck: config.useFingerprintCheck !== false,
      fingerprintWindowSeconds: config.fingerprintWindowSeconds || 300, // 5 minutes
    };
  }

  /**
   * Initialize Redis connection
   */
  private async getRedis(): Promise<Redis> {
    if (!this.redis) {
      this.redis = await getRedisConnection();
    }
    return this.redis;
  }

  /**
   * Generate idempotency key from request fingerprint
   */
  generateKey(fingerprint: RequestFingerprint): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const data = `${fingerprint.resourceId}:${fingerprint.operation}:${fingerprint.amount}:${JSON.stringify(fingerprint.context || {})}:${timestamp}`;
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    return `${this.config.keyPrefix}_${hash.substring(0, 32)}_${timestamp}`;
  }

  /**
   * Generate fingerprint hash for duplicate detection
   */
  private generateFingerprintHash(fingerprint: RequestFingerprint): string {
    const data = `${fingerprint.resourceId}:${fingerprint.operation}:${fingerprint.amount}:${JSON.stringify(fingerprint.context || {})}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Check if idempotency key exists
   */
  async check(idempotencyKey: string): Promise<IdempotencyResult> {
    try {
      const redis = await this.getRedis();
      const key = `${this.config.keyPrefix}:key:${idempotencyKey}`;

      const data = await redis.get(key);

      if (!data) {
        return { isDuplicate: false };
      }

      const stored: IdempotencyData = JSON.parse(data);

      systemLogger.info('Duplicate idempotency key detected', {
        key: idempotencyKey,
        originalTimestamp: stored.createdAt,
      });

      return {
        isDuplicate: true,
        cachedResult: stored.result,
        metadata: {
          originalTimestamp: new Date(stored.createdAt),
          expiresAt: new Date(stored.expiresAt),
        },
      };
    } catch (error) {
      systemLogger.error('Error checking idempotency', {
        key: idempotencyKey,
        error: error instanceof Error ? error.message : String(error),
      });
      // On error, don't block the request
      return { isDuplicate: false };
    }
  }

  /**
   * Check for duplicate by request fingerprint
   * Catches rapid duplicates even with different idempotency keys
   */
  async checkFingerprint(fingerprint: RequestFingerprint): Promise<IdempotencyResult> {
    if (!this.config.useFingerprintCheck) {
      return { isDuplicate: false };
    }

    try {
      const redis = await this.getRedis();
      const fingerprintHash = this.generateFingerprintHash(fingerprint);
      const key = `${this.config.keyPrefix}:fingerprint:${fingerprintHash}`;

      const data = await redis.get(key);

      if (!data) {
        return { isDuplicate: false };
      }

      const stored: IdempotencyData = JSON.parse(data);

      systemLogger.warn('Duplicate fingerprint detected', {
        fingerprintHash,
        resourceId: fingerprint.resourceId,
        operation: fingerprint.operation,
        originalTimestamp: stored.createdAt,
      });

      return {
        isDuplicate: true,
        cachedResult: stored.result,
        metadata: {
          originalTimestamp: new Date(stored.createdAt),
        },
      };
    } catch (error) {
      systemLogger.error('Error checking fingerprint', {
        error: error instanceof Error ? error.message : String(error),
      });
      return { isDuplicate: false };
    }
  }

  /**
   * Store idempotency key with result
   */
  async store(idempotencyKey: string, result: any, metadata?: Record<string, any>): Promise<void> {
    try {
      const redis = await this.getRedis();
      const key = `${this.config.keyPrefix}:key:${idempotencyKey}`;

      const data: IdempotencyData = {
        key: idempotencyKey,
        result,
        metadata,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.config.ttl * 1000),
      };

      await redis.setex(key, this.config.ttl, JSON.stringify(data));

      systemLogger.debug('Idempotency key stored', {
        key: idempotencyKey,
        ttl: this.config.ttl,
      });
    } catch (error) {
      systemLogger.error('Error storing idempotency key', {
        key: idempotencyKey,
        error: error instanceof Error ? error.message : String(error),
      });
      // Don't throw - idempotency storage failure shouldn't break the operation
    }
  }

  /**
   * Store fingerprint for rapid duplicate detection
   */
  async storeFingerprint(fingerprint: RequestFingerprint, result: any): Promise<void> {
    if (!this.config.useFingerprintCheck) {
      return;
    }

    try {
      const redis = await this.getRedis();
      const fingerprintHash = this.generateFingerprintHash(fingerprint);
      const key = `${this.config.keyPrefix}:fingerprint:${fingerprintHash}`;

      const data: IdempotencyData = {
        key: fingerprintHash,
        result,
        fingerprint: JSON.stringify(fingerprint),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + this.config.fingerprintWindowSeconds * 1000),
      };

      await redis.setex(key, this.config.fingerprintWindowSeconds, JSON.stringify(data));

      systemLogger.debug('Fingerprint stored', {
        fingerprintHash,
        ttl: this.config.fingerprintWindowSeconds,
      });
    } catch (error) {
      systemLogger.error('Error storing fingerprint', {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Combined check and store operation (atomic)
   * Use this for most operations
   */
  async checkAndStore(
    idempotencyKey: string,
    fingerprint: RequestFingerprint,
    result: any,
    metadata?: Record<string, any>
  ): Promise<IdempotencyResult> {
    // Check idempotency key
    const keyCheck = await this.check(idempotencyKey);
    if (keyCheck.isDuplicate) {
      return keyCheck;
    }

    // Check fingerprint
    const fingerprintCheck = await this.checkFingerprint(fingerprint);
    if (fingerprintCheck.isDuplicate) {
      return fingerprintCheck;
    }

    // Store both
    await this.store(idempotencyKey, result, metadata);
    await this.storeFingerprint(fingerprint, result);

    return { isDuplicate: false };
  }

  /**
   * Delete idempotency key (use with caution!)
   */
  async delete(idempotencyKey: string): Promise<void> {
    try {
      const redis = await this.getRedis();
      const key = `${this.config.keyPrefix}:key:${idempotencyKey}`;
      await redis.del(key);

      systemLogger.info('Idempotency key deleted', { key: idempotencyKey });
    } catch (error) {
      systemLogger.error('Error deleting idempotency key', {
        key: idempotencyKey,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get stored idempotency data
   */
  async get(idempotencyKey: string): Promise<IdempotencyData | null> {
    try {
      const redis = await this.getRedis();
      const key = `${this.config.keyPrefix}:key:${idempotencyKey}`;

      const data = await redis.get(key);
      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      systemLogger.error('Error getting idempotency data', {
        key: idempotencyKey,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}

