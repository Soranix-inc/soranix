import { eq, desc, sql } from 'drizzle-orm';

import { systemLogger } from '@packages/logging';
import { IdempotencyService } from '@packages/utils';

import { getDatabase } from '../../db/connection.js';
import { ledgerEntries, accountBalances } from '../../db/schema/index.js';
import { AccountId } from '../../types/account-types.js';
import type { CreateLedgerEntryInput, LedgerEntry, LedgerEntryPair } from '../../types/ledger-types.js';

class CoreServices {
  private db = getDatabase();
  private idempotencyService = new IdempotencyService({
    ttl: 86400, // 24 hours
    keyPrefix: 'ledger',
    useFingerprintCheck: true,
    fingerprintWindowSeconds: 300, // 5 minutes
  });

  async createDoubleEntry(pair: LedgerEntryPair): Promise<{
    success: boolean;
    entryId: string;
    entries: LedgerEntry[];
  }> {
    const {
      entryId,
      entries: [entry1, entry2],
    } = pair;

    this.validateDoubleEntry(entry1, entry2);

    try {
      const createdEntries = await this.db.transaction(async (tx) => {
        const ledgerEntry1 = await this.createSingleEntry(entry1, entryId, tx);
        const ledgerEntry2 = await this.createSingleEntry(entry2, entryId, tx);

        return [ledgerEntry1, ledgerEntry2];
      });

      systemLogger.info('Double-entry created successfully', {
        entryId,
        account1: entry1.accountId,
        account2: entry2.accountId,
        amount: entry1.debit || entry1.credit,
      });

      return {
        success: true,
        entryId,
        entries: createdEntries,
      };
    } catch (error) {
      systemLogger.error('Failed to create double-entry', {
        entryId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  private async createSingleEntry(input: CreateLedgerEntryInput, entryId: string, tx?: any): Promise<LedgerEntry> {
    const database = tx || this.db;

    // Create request fingerprint
    const fingerprint = {
      resourceId: input.accountId,
      operation: input.transactionType,
      amount: (input.debit || input.credit || '0').toString(),
      context: {
        referenceId: input.referenceId,
        counterAccount: input.counterAccountId,
      },
    };

    // Generate idempotency key
    const idempotencyKey = input.idempotencyKey || this.idempotencyService.generateKey(fingerprint);

    // Check for duplicates (checks both key and fingerprint)
    const duplicate = await this.idempotencyService.check(idempotencyKey);
    if (duplicate.isDuplicate) {
      systemLogger.warn('Duplicate ledger entry attempt', {
        key: idempotencyKey,
        accountId: input.accountId,
        cachedResult: duplicate.cachedResult,
      });
      throw new Error(`Duplicate operation detected: ${idempotencyKey}`);
    }

    // Also check fingerprint for rapid duplicates
    const fingerprintCheck = await this.idempotencyService.checkFingerprint(fingerprint);
    if (fingerprintCheck.isDuplicate) {
      systemLogger.warn('Duplicate fingerprint detected', {
        accountId: input.accountId,
        operation: input.transactionType,
      });
      throw new Error('Duplicate operation detected via fingerprint');
    }

    const { balance: currentBalance, sequenceNumber } = await this.getCurrentBalanceAndSequence(
      input.accountId,
      database
    );

    const debitAmount = this.parseDecimal(input.debit || '0');
    const creditAmount = this.parseDecimal(input.credit || '0');
    const newBalance = currentBalance + creditAmount - debitAmount;

    if (newBalance < 0 && AccountId.isUserAccount(input.accountId)) {
      throw new Error(
        `Insufficient funds in account ${input.accountId}. ` +
          `Current: ${currentBalance}, Required: ${debitAmount}, Available: ${currentBalance}`
      );
    }

    const accountInfo = AccountId.parse(input.accountId);

    const [entry] = await database
      .insert(ledgerEntries)
      .values({
        entryId,
        sequenceNumber,
        accountId: input.accountId,
        accountType: accountInfo.accountType,
        counterAccountId: input.counterAccountId,
        debit: debitAmount.toFixed(4),
        credit: creditAmount.toFixed(4),
        currency: input.currency,
        balance: newBalance.toFixed(4),
        transactionType: input.transactionType,
        referenceId: input.referenceId,
        referenceType: input.referenceType,
        description: input.description,
        metadata: input.metadata,
        createdBy: input.createdBy,
        idempotencyKey,
        immutable: true,
      })
      .returning();

    await this.updateCachedBalance(input.accountId, entry, database);

    // Store idempotency key and fingerprint
    await this.idempotencyService.checkAndStore(
      idempotencyKey,
      fingerprint,
      {
        entryId: entry.id,
        balance: newBalance.toFixed(4),
        sequenceNumber: entry.sequenceNumber,
      },
      {
        accountId: input.accountId,
        transactionType: input.transactionType,
      }
    );

    return entry as LedgerEntry;
  }

  private async getCurrentBalanceAndSequence(
    accountId: string,
    database: any
  ): Promise<{ balance: number; sequenceNumber: number }> {
    const cached = await database.query.accountBalances.findFirst({
      where: eq(accountBalances.accountId, accountId),
    });

    if (cached) {
      return {
        balance: this.parseDecimal(cached.balance),
        sequenceNumber: cached.lastSequenceNumber + 1,
      };
    }

    const lastEntry = await database.query.ledgerEntries.findFirst({
      where: eq(ledgerEntries.accountId, accountId),
      orderBy: [desc(ledgerEntries.sequenceNumber)],
    });

    return {
      balance: lastEntry ? this.parseDecimal(lastEntry.balance) : 0,
      sequenceNumber: lastEntry ? lastEntry.sequenceNumber + 1 : 1,
    };
  }

  private async updateCachedBalance(accountId: string, entry: any, database: any): Promise<void> {
    const accountInfo = AccountId.parse(accountId);

    await database
      .insert(accountBalances)
      .values({
        accountId,
        userId: accountInfo.userId,
        accountType: accountInfo.accountType,
        subAccount: accountInfo.subAccount,
        currency: entry.currency,
        balance: entry.balance,
        availableBalance: entry.balance,
        reservedBalance: '0',
        lastEntryId: entry.id,
        lastSequenceNumber: entry.sequenceNumber,
        entryCount: 1,
      })
      .onConflictDoUpdate({
        target: accountBalances.accountId,
        set: {
          balance: entry.balance,
          availableBalance: entry.balance,
          lastEntryId: entry.id,
          lastSequenceNumber: entry.sequenceNumber,
          entryCount: sql`${accountBalances.entryCount} + 1`,
          updatedAt: new Date(),
        },
      });
  }

  private validateDoubleEntry(entry1: CreateLedgerEntryInput, entry2: CreateLedgerEntryInput): void {
    const amount1 = this.parseDecimal(entry1.debit || entry1.credit || '0');
    const amount2 = this.parseDecimal(entry2.debit || entry2.credit || '0');

    if (amount1 !== amount2) {
      throw new Error(`Double-entry validation failed: amounts don't match (${amount1} != ${amount2})`);
    }

    const hasDebit1 = this.parseDecimal(entry1.debit || '0') > 0;
    const hasCredit1 = this.parseDecimal(entry1.credit || '0') > 0;
    const hasDebit2 = this.parseDecimal(entry2.debit || '0') > 0;
    const hasCredit2 = this.parseDecimal(entry2.credit || '0') > 0;

    if (hasDebit1 === hasDebit2 || hasCredit1 === hasCredit2) {
      throw new Error('Double-entry validation failed: must have one debit and one credit');
    }

    if (entry1.counterAccountId !== entry2.accountId || entry2.counterAccountId !== entry1.accountId) {
      throw new Error('Double-entry validation failed: counter accounts must reference each other');
    }
  }

  private parseDecimal(value: string | number): number {
    if (typeof value === 'number') return value;
    return parseFloat(value) || 0;
  }

  async getBalance(accountId: string): Promise<{
    balance: string;
    availableBalance: string;
    currency: string;
  } | null> {
    const cached = await this.db.query.accountBalances.findFirst({
      where: eq(accountBalances.accountId, accountId),
    });

    if (!cached) {
      return null;
    }

    return {
      balance: cached.balance,
      availableBalance: cached.availableBalance,
      currency: cached.currency,
    };
  }

  async getTransactionHistory(accountId: string, limit: number = 50, offset: number = 0): Promise<LedgerEntry[]> {
    const entries = await this.db.query.ledgerEntries.findMany({
      where: eq(ledgerEntries.accountId, accountId),
      orderBy: [desc(ledgerEntries.createdAt)],
      limit,
      offset,
    });

    return entries as LedgerEntry[];
  }
}

export default CoreServices;
