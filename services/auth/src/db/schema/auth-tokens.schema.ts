import { pgTable, uuid, varchar, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';

export const tokenTypeEnum = pgEnum('token_type', [
  'email_verification',
  'password_reset',
  'mfa_recovery',
  'magic_link',
]);

export const authTokens = pgTable('auth_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  tokenType: tokenTypeEnum('token_type').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  metadata: jsonb('metadata').$type<{
    ipAddress?: string;
    userAgent?: string;
    [key: string]: any;
  }>(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type AuthToken = typeof authTokens.$inferSelect;
export type NewAuthToken = typeof authTokens.$inferInsert;
