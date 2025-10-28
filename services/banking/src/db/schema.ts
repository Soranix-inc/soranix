import { pgTable, uuid, varchar, decimal, timestamp, text, jsonb, boolean } from 'drizzle-orm/pg-core';

export const bankAccounts = pgTable('bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  accountType: varchar('account_type', { length: 50 }).notNull(), // checking, savings, business
  accountNumber: varchar('account_number', { length: 50 }).notNull().unique(),
  accountName: varchar('account_name', { length: 255 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  balance: decimal('balance', { precision: 15, scale: 2 }).notNull().default('0.00'),
  availableBalance: decimal('available_balance', { precision: 15, scale: 2 }).notNull().default('0.00'),
  status: varchar('status', { length: 50 }).notNull().default('active'),
  isDefault: boolean('is_default').notNull().default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const externalBankAccounts = pgTable('external_bank_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  bankName: varchar('bank_name', { length: 255 }).notNull(),
  accountNumber: varchar('account_number', { length: 50 }).notNull(),
  accountName: varchar('account_name', { length: 255 }).notNull(),
  routingNumber: varchar('routing_number', { length: 50 }),
  accountType: varchar('account_type', { length: 50 }).notNull(),
  country: varchar('country', { length: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  isVerified: boolean('is_verified').notNull().default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const accountTransactions = pgTable('account_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => bankAccounts.id),
  type: varchar('type', { length: 50 }).notNull(), // debit, credit
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  balanceBefore: decimal('balance_before', { precision: 15, scale: 2 }).notNull(),
  balanceAfter: decimal('balance_after', { precision: 15, scale: 2 }).notNull(),
  description: text('description'),
  reference: varchar('reference', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('completed'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
