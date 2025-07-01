import { BUDGET_STATE_ENUM, BUDGET_STATUS_ENUM, timestamps } from '@/libs';
import {
  pgTable,
  varchar,
  boolean,
  uuid,
  pgEnum,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core';

export const stateEnum = pgEnum('state', BUDGET_STATE_ENUM);
export const statusEnum = pgEnum('budget_status', BUDGET_STATUS_ENUM);

export const budget_schema = pgTable('budget', {
  id: uuid('id').unique().primaryKey().defaultRandom().notNull(),
  name: varchar('name').notNull(),
  description: varchar('description'),
  status: statusEnum().default(BUDGET_STATUS_ENUM.ON_TRACK),
  parentBudget: uuid('parent_budget'),
  state: stateEnum().notNull(),
  allocatedAmount: integer('allocated_amount').default(0),
  isGlobal: boolean('is_global').notNull(),
  userId: uuid('user_id').notNull(),
  accountId: uuid('account_id'),
  configuration: jsonb(),
  ...timestamps,
});
