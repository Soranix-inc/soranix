import { pgTable, uuid, varchar, decimal, timestamp, text, jsonb } from 'drizzle-orm/pg-core';

export const portfolios = pgTable('portfolios', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique(),
  totalValue: decimal('total_value', { precision: 15, scale: 2 }).notNull().default('0.00'),
  totalInvested: decimal('total_invested', { precision: 15, scale: 2 }).notNull().default('0.00'),
  totalReturns: decimal('total_returns', { precision: 15, scale: 2 }).notNull().default('0.00'),
  returnPercentage: decimal('return_percentage', { precision: 10, scale: 2 }).notNull().default('0.00'),
  riskLevel: varchar('risk_level', { length: 50 }).notNull().default('moderate'),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const investments = pgTable('investments', {
  id: uuid('id').primaryKey().defaultRandom(),
  portfolioId: uuid('portfolio_id')
    .notNull()
    .references(() => portfolios.id),
  assetType: varchar('asset_type', { length: 50 }).notNull(), // stocks, crypto, bonds, etf, mutual_funds
  assetSymbol: varchar('asset_symbol', { length: 50 }).notNull(),
  assetName: varchar('asset_name', { length: 255 }).notNull(),
  quantity: decimal('quantity', { precision: 20, scale: 8 }).notNull(),
  averageBuyPrice: decimal('average_buy_price', { precision: 15, scale: 2 }).notNull(),
  currentPrice: decimal('current_price', { precision: 15, scale: 2 }).notNull(),
  totalInvested: decimal('total_invested', { precision: 15, scale: 2 }).notNull(),
  currentValue: decimal('current_value', { precision: 15, scale: 2 }).notNull(),
  unrealizedGainLoss: decimal('unrealized_gain_loss', { precision: 15, scale: 2 }).notNull(),
  unrealizedGainLossPercentage: decimal('unrealized_gain_loss_percentage', { precision: 10, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).notNull().default('USD'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const investmentTransactions = pgTable('investment_transactions', {
  id: uuid('id').primaryKey().defaultRandom(),
  investmentId: uuid('investment_id')
    .notNull()
    .references(() => investments.id),
  portfolioId: uuid('portfolio_id')
    .notNull()
    .references(() => portfolios.id),
  type: varchar('type', { length: 50 }).notNull(), // buy, sell
  quantity: decimal('quantity', { precision: 20, scale: 8 }).notNull(),
  price: decimal('price', { precision: 15, scale: 2 }).notNull(),
  totalAmount: decimal('total_amount', { precision: 15, scale: 2 }).notNull(),
  fees: decimal('fees', { precision: 15, scale: 2 }).notNull().default('0.00'),
  status: varchar('status', { length: 50 }).notNull().default('completed'),
  transactionReference: varchar('transaction_reference', { length: 255 }),
  notes: text('notes'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const portfolioPerformance = pgTable('portfolio_performance', {
  id: uuid('id').primaryKey().defaultRandom(),
  portfolioId: uuid('portfolio_id')
    .notNull()
    .references(() => portfolios.id),
  date: timestamp('date').notNull(),
  totalValue: decimal('total_value', { precision: 15, scale: 2 }).notNull(),
  totalInvested: decimal('total_invested', { precision: 15, scale: 2 }).notNull(),
  totalReturns: decimal('total_returns', { precision: 15, scale: 2 }).notNull(),
  returnPercentage: decimal('return_percentage', { precision: 10, scale: 2 }).notNull(),
  dayChange: decimal('day_change', { precision: 15, scale: 2 }),
  dayChangePercentage: decimal('day_change_percentage', { precision: 10, scale: 2 }),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});
