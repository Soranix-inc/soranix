import { pgTable, varchar, decimal, timestamp, integer, index } from 'drizzle-orm/pg-core';

/**
 * Account Balances Table - Cached Balances for Fast Reads
 *
 * This table caches the current balance for each account.
 * It's derived from ledger_entries and verified through reconciliation.
 *
 * The true balance is ALWAYS computed from ledger_entries.
 * This table is a performance optimization.
 */
export const accountBalances = pgTable(
  'account_balances',
  {
    // Identity
    accountId: varchar('account_id', { length: 255 }).primaryKey(),

    // Account Classification
    userId: varchar('user_id', { length: 255 }), // Null for system accounts
    accountType: varchar('account_type', { length: 50 }).notNull(),
    subAccount: varchar('sub_account', { length: 50 }).notNull(),
    currency: varchar('currency', { length: 10 }).notNull(),

    // Balances
    balance: decimal('balance', { precision: 19, scale: 4 }).notNull().default('0'),
    availableBalance: decimal('available_balance', { precision: 19, scale: 4 }).notNull().default('0'),
    reservedBalance: decimal('reserved_balance', { precision: 19, scale: 4 }).notNull().default('0'),

    // Tracking
    lastEntryId: varchar('last_entry_id', { length: 255 }).notNull(),
    lastSequenceNumber: integer('last_sequence_number').notNull().default(0),
    entryCount: integer('entry_count').notNull().default(0), // Total number of entries

    // Timestamps
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
    lastReconciledAt: timestamp('last_reconciled_at', { withTimezone: true }),
  },
  (table) => ({
    // Index for user lookups (all accounts for a user)
    userIdx: index('idx_user_balances').on(table.userId),

    // Index for currency queries
    currencyIdx: index('idx_currency_balances').on(table.currency),

    // Index for account type queries
    accountTypeIdx: index('idx_account_type').on(table.accountType, table.subAccount),

    // Composite index for user + currency queries
    userCurrencyIdx: index('idx_user_currency').on(table.userId, table.currency),
  })
);

export type AccountBalance = typeof accountBalances.$inferSelect;
export type NewAccountBalance = typeof accountBalances.$inferInsert;

