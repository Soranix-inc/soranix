import { sql } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  decimal,
  timestamp,
  integer,
  text,
  jsonb,
  boolean,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

/**
 * Ledger Entries Table - Immutable, Append-Only
 *
 * This is the core of the financial system.
 * Every monetary movement is recorded here.
 * Entries are NEVER updated or deleted - only inserted.
 */
export const ledgerEntries = pgTable(
  'ledger_entries',
  {
    // Identity
    id: uuid('id').primaryKey().defaultRandom(),
    entryId: uuid('entry_id').notNull(), // Groups related entries in double-entry
    sequenceNumber: integer('sequence_number').notNull(), // Per-account sequence for ordering

    // Account Information
    accountId: varchar('account_id', { length: 255 }).notNull(),
    accountType: varchar('account_type', { length: 50 }).notNull(),
    counterAccountId: varchar('counter_account_id', { length: 255 }).notNull(),

    // Transaction Amounts (stored as string to prevent floating point errors)
    debit: decimal('debit', { precision: 19, scale: 4 }).notNull().default('0'),
    credit: decimal('credit', { precision: 19, scale: 4 }).notNull().default('0'),
    currency: varchar('currency', { length: 10 }).notNull(),

    // Running Balance (balance AFTER this transaction)
    balance: decimal('balance', { precision: 19, scale: 4 }).notNull(),

    // Transaction Metadata
    transactionType: varchar('transaction_type', { length: 50 }).notNull(),
    referenceId: varchar('reference_id', { length: 255 }), // Original transaction ID
    referenceType: varchar('reference_type', { length: 50 }), // payment, transfer, etc.
    description: text('description').notNull(),
    metadata: jsonb('metadata'), // Flexible data storage

    // Tracking
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    createdBy: varchar('created_by', { length: 255 }).notNull(),

    // Idempotency
    idempotencyKey: varchar('idempotency_key', { length: 255 }).notNull(),

    // Immutability Flag
    immutable: boolean('immutable').notNull().default(true),
  },
  (table) => ({
    // Unique constraint on idempotency key (prevents duplicates)
    idempotencyIdx: uniqueIndex('idx_idempotency_key').on(table.idempotencyKey),

    // Unique constraint on account sequence (prevents concurrent conflicts)
    accountSequenceIdx: uniqueIndex('idx_account_sequence').on(table.accountId, table.sequenceNumber),

    // Index for fast balance queries (get latest entry)
    accountTimeIdx: index('idx_account_time').on(table.accountId, table.createdAt.desc()),

    // Index for grouping entries (double-entry pairs)
    entryGroupIdx: index('idx_entry_group').on(table.entryId),

    // Index for transaction type queries
    transactionTypeIdx: index('idx_transaction_type').on(table.transactionType, table.createdAt),

    // Index for user account queries
    userAccountIdx: index('idx_user_account')
      .on(table.accountId)
      .where(sql`${table.accountType} IN ('wallet', 'investment', 'bills')`),

    // Index for reference lookups
    referenceIdx: index('idx_reference').on(table.referenceId, table.referenceType),
  })
);

export type LedgerEntry = typeof ledgerEntries.$inferSelect;
export type NewLedgerEntry = typeof ledgerEntries.$inferInsert;
