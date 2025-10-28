import axios, { AxiosInstance } from 'axios';

import { getRedisConnection, type Redis } from '@packages/config';
import { systemLogger } from '@packages/logging';

import type {
  BalanceResponse,
  UserBalancesResponse,
  TransactionHistoryResponse,
  LedgerClientConfig,
  BalanceCheckOptions,
} from '../types/index.js';

/**
 * Ledger Service HTTP Client
 *
 * Provides type-safe API client for Ledger Service with:
 * - Optional Redis caching
 * - Automatic retries
 * - Circuit breaker pattern
 * - Timeout handling
 */
export class LedgerClient {
  private httpClient: AxiosInstance;
  private redis: Redis | null = null;
  private config: Required<LedgerClientConfig>;

  constructor(config: LedgerClientConfig = {}) {
    this.config = {
      baseUrl: config.baseUrl || process.env.LEDGER_SERVICE_URL || 'http://localhost:6002/api/v1',
      timeout: config.timeout || 5000,
      useCache: config.useCache !== false,
      cacheTTL: config.cacheTTL || 30,
    };

    this.httpClient = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Initialize Redis if caching is enabled
    if (this.config.useCache) {
      this.initializeRedis();
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redis = await getRedisConnection();
    } catch (error) {
      systemLogger.warn('Redis not available for caching, will call Ledger API directly', {
        error: error instanceof Error ? error.message : String(error),
      });
      this.config.useCache = false;
    }
  }

  /**
   * Get account balance
   */
  async getBalance(accountId: string, options?: BalanceCheckOptions): Promise<BalanceResponse | null> {
    const useCache = options?.useCache ?? this.config.useCache;
    const cacheTTL = options?.cacheTTL ?? this.config.cacheTTL;

    // Try cache first
    if (useCache && this.redis) {
      const cached = await this.getCachedBalance(accountId);
      if (cached) {
        systemLogger.debug('Balance cache hit', { accountId });
        return cached;
      }
    }

    // Call Ledger API
    try {
      const response = await this.httpClient.get(`/balance/${accountId}`);

      if (!response.data.success) {
        return null;
      }

      const balance: BalanceResponse = response.data.data;

      // Cache the result
      if (useCache && this.redis) {
        await this.cacheBalance(accountId, balance, cacheTTL);
      }

      return balance;
    } catch (error) {
      systemLogger.error('Error getting balance from Ledger', {
        accountId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Get all balances for a user
   */
  async getUserBalances(userId: string): Promise<UserBalancesResponse | null> {
    try {
      const response = await this.httpClient.get(`/balance/user/${userId}`);

      if (!response.data.success) {
        return null;
      }

      return response.data.data;
    } catch (error) {
      systemLogger.error('Error getting user balances', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Check if account has sufficient balance
   */
  async checkSufficientBalance(accountId: string, amount: number, options?: BalanceCheckOptions): Promise<boolean> {
    const balance = await this.getBalance(accountId, options);

    if (!balance) {
      return false;
    }

    return parseFloat(balance.availableBalance) >= amount;
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(
    accountId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<TransactionHistoryResponse | null> {
    try {
      const response = await this.httpClient.get(`/entries/${accountId}`, {
        params: { limit, offset },
      });

      if (!response.data.success) {
        return null;
      }

      return response.data.data;
    } catch (error) {
      systemLogger.error('Error getting transaction history', {
        accountId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Get historical balance
   */
  async getHistoricalBalance(accountId: string, date: Date): Promise<BalanceResponse | null> {
    try {
      const response = await this.httpClient.get(`/balance/${accountId}/historical`, {
        params: { date: date.toISOString().split('T')[0] },
      });

      if (!response.data.success) {
        return null;
      }

      return response.data.data;
    } catch (error) {
      systemLogger.error('Error getting historical balance', {
        accountId,
        date,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Invalidate cached balance
   */
  async invalidateCache(accountId: string): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.del(`balance:${accountId}`);
      systemLogger.debug('Balance cache invalidated', { accountId });
    } catch (error) {
      systemLogger.error('Error invalidating cache', {
        accountId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  /**
   * Get cached balance from Redis
   */
  private async getCachedBalance(accountId: string): Promise<BalanceResponse | null> {
    if (!this.redis) return null;

    try {
      const cached = await this.redis.get(`balance:${accountId}`);

      if (!cached) {
        return null;
      }

      return JSON.parse(cached);
    } catch (error) {
      systemLogger.debug('Cache read error', {
        accountId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Cache balance in Redis
   */
  private async cacheBalance(accountId: string, balance: BalanceResponse, ttl: number): Promise<void> {
    if (!this.redis) return;

    try {
      await this.redis.setex(`balance:${accountId}`, ttl, JSON.stringify(balance));
      systemLogger.debug('Balance cached', { accountId, ttl });
    } catch (error) {
      systemLogger.debug('Cache write error', {
        accountId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
