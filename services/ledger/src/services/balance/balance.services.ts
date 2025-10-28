import { eq, and, like, sql, desc } from 'drizzle-orm';

import { systemLogger } from '@packages/logging';

import { getDatabase } from '../../db/connection.js';
import { ledgerEntries, accountBalances } from '../../db/schema/index.js';
import { Currency } from '../../types/account-types.js';
import type { BalanceResult, ReconciliationResult } from '../../types/ledger-types.js';

class BalanceServices {
  private db = getDatabase();

  async getBalance(accountId: string): Promise<BalanceResult | null> {
    try {
      const cached = await this.db.query.accountBalances.findFirst({
        where: eq(accountBalances.accountId, accountId),
      });

      if (!cached) {
        const computed = await this.computeBalance(accountId);
        return computed;
      }

      return {
        accountId: cached.accountId,
        balance: cached.balance,
        availableBalance: cached.availableBalance,
        currency: cached.currency as Currency,
        asOf: cached.updatedAt,
      };
    } catch (error) {
      systemLogger.error('Error getting balance', {
        accountId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  async getUserBalances(userId: string): Promise<BalanceResult[]> {
    try {
      const balances = await this.db.query.accountBalances.findMany({
        where: eq(accountBalances.userId, userId),
      });

      return balances.map((b) => ({
        accountId: b.accountId,
        balance: b.balance,
        availableBalance: b.availableBalance,
        currency: b.currency as Currency,
        asOf: b.updatedAt,
      }));
    } catch (error) {
      systemLogger.error('Error getting user balances', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
      return [];
    }
  }

  async computeBalance(accountId: string): Promise<BalanceResult | null> {
    try {
      const latestEntry = await this.db.query.ledgerEntries.findFirst({
        where: eq(ledgerEntries.accountId, accountId),
        orderBy: [desc(ledgerEntries.sequenceNumber)],
      });

      if (!latestEntry) {
        return null;
      }

      return {
        accountId,
        balance: latestEntry.balance,
        availableBalance: latestEntry.balance,
        currency: latestEntry.currency as Currency,
        asOf: latestEntry.createdAt,
      };
    } catch (error) {
      systemLogger.error('Error computing balance', {
        accountId,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  async getHistoricalBalance(accountId: string, asOf: Date): Promise<BalanceResult | null> {
    try {
      const entry = await this.db.query.ledgerEntries.findFirst({
        where: and(eq(ledgerEntries.accountId, accountId), sql`${ledgerEntries.createdAt} <= ${asOf}`),
        orderBy: [desc(ledgerEntries.createdAt)],
      });

      if (!entry) {
        return {
          accountId,
          balance: '0',
          availableBalance: '0',
          currency: 'usd' as Currency,
          asOf,
        };
      }

      return {
        accountId,
        balance: entry.balance,
        availableBalance: entry.balance,
        currency: entry.currency as Currency,
        asOf: entry.createdAt,
      };
    } catch (error) {
      systemLogger.error('Error getting historical balance', {
        accountId,
        asOf,
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  async getSystemTotalBalance(currency: Currency): Promise<string> {
    try {
      const result = await this.db
        .select({
          total: sql<string>`SUM(${accountBalances.balance})`,
        })
        .from(accountBalances)
        .where(and(eq(accountBalances.currency, currency), like(accountBalances.accountId, '%:wallet:%')));

      return result[0]?.total || '0';
    } catch (error) {
      systemLogger.error('Error getting system total balance', {
        currency,
        error: error instanceof Error ? error.message : String(error),
      });
      return '0';
    }
  }

  async reconcileAccount(accountId: string): Promise<ReconciliationResult> {
    try {
      const cached = await this.db.query.accountBalances.findFirst({
        where: eq(accountBalances.accountId, accountId),
      });

      const cachedBalance = cached ? this.parseDecimal(cached.balance) : 0;

      const computed = await this.computeBalance(accountId);
      const computedBalance = computed ? this.parseDecimal(computed.balance) : 0;

      const discrepancy = cachedBalance - computedBalance;

      return {
        accountId,
        cachedBalance: cachedBalance.toFixed(4),
        computedBalance: computedBalance.toFixed(4),
        discrepancy: discrepancy.toFixed(4),
        status: Math.abs(discrepancy) < 0.0001 ? 'ok' : 'mismatch',
      };
    } catch (error) {
      systemLogger.error('Error reconciling account', {
        accountId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async reconcileAllAccounts(): Promise<ReconciliationResult[]> {
    try {
      systemLogger.info('Starting reconciliation of all accounts...');

      const allBalances = await this.db.query.accountBalances.findMany();
      const results: ReconciliationResult[] = [];

      for (const cached of allBalances) {
        const result = await this.reconcileAccount(cached.accountId);
        if (result.status === 'mismatch') {
          results.push(result);
          systemLogger.warn('Balance mismatch detected', result);
        }
      }

      systemLogger.info('Reconciliation complete', {
        totalAccounts: allBalances.length,
        mismatches: results.length,
      });

      return results;
    } catch (error) {
      systemLogger.error('Error during reconciliation', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private parseDecimal(value: string | number): number {
    if (typeof value === 'number') return value;
    return parseFloat(value) || 0;
  }
}

export default BalanceServices;
