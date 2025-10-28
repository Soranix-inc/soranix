import { pgTable, uuid, varchar, decimal, timestamp, text, jsonb } from 'drizzle-orm/pg-core';

export const billPayments = pgTable('bill_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  billerName: varchar('biller_name', { length: 255 }).notNull(),
  billerCategory: varchar('biller_category', { length: 100 }).notNull(),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  paymentProvider: varchar('payment_provider', { length: 50 }).notNull(),
  customerReference: varchar('customer_reference', { length: 255 }).notNull(),
  transactionId: varchar('transaction_id', { length: 255 }),
  status: varchar('status', { length: 50 }).notNull().default('pending'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const billPaymentHistory = pgTable('bill_payment_history', {
  id: uuid('id').primaryKey().defaultRandom(),
  billPaymentId: uuid('bill_payment_id')
    .notNull()
    .references(() => billPayments.id),
  status: varchar('status', { length: 50 }).notNull(),
  message: text('message'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
