import { pgTable, uuid, varchar, boolean, integer, timestamp, text } from 'drizzle-orm/pg-core';

export const credentials = pgTable('credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: text('password').notNull(),
  email_verified: boolean('email_verified').notNull().default(false),
  refresh_token: text('refresh_token').array(),
  refresh_token_version: integer('refresh_token_version').notNull().default(0),
  user_agent: text('user_agent').notNull(),
  created_at: timestamp('created_at').notNull().defaultNow(),
});

export type Credential = typeof credentials.$inferSelect;
export type NewCredential = typeof credentials.$inferInsert;
