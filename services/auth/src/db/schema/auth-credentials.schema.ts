import { pgTable, uuid, varchar, boolean, integer, timestamp, text, jsonb } from 'drizzle-orm/pg-core';

export const authCredentials = pgTable('auth_credentials', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: varchar('user_id', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  emailVerified: boolean('email_verified').notNull().default(false),
  refreshTokenHash: text('refresh_token_hash'),
  refreshTokenVersion: integer('refresh_token_version').notNull().default(0),
  mfaEnabled: boolean('mfa_enabled').notNull().default(false),
  mfaSecret: text('mfa_secret'),
  mfaBackupCodes: jsonb('mfa_backup_codes').$type<string[]>(),
  failedLoginAttempts: integer('failed_login_attempts').notNull().default(0),
  lockedUntil: timestamp('locked_until'),
  lastPasswordChange: timestamp('last_password_change').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export type AuthCredential = typeof authCredentials.$inferSelect;
export type NewAuthCredential = typeof authCredentials.$inferInsert;

