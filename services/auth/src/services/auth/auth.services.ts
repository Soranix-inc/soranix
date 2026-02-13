import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { systemLogger } from '@packages/logging';
import { NodePgDatabase } from 'drizzle-orm/node-postgres/driver.js';
import * as schemas from '../../db/schema/index.js';
import { Pool } from 'pg';
import { EmailAlreadyExistsError } from '@packages/errors/src/common/user-errors.js';
import { redisClient } from '../../config/redis.config.js';
import { PasswordService } from '../../utils/passwordUtils.js';
import { eventBus } from '../../events/event-bus.js';
import { credentials } from '../../db/schema/credentials.schema.js';
import { RegisterType } from './auth.types.js';
import { EmailVerificationRequestedData } from '@packages/events';

export class AuthService {
  private readonly db: NodePgDatabase<typeof schemas> & { $client: Pool };
  private readonly passwordService: PasswordService;

  constructor(db: NodePgDatabase<typeof schemas> & { $client: Pool }) {
    this.db = db;
    this.passwordService = new PasswordService();
  }

  async register(data: RegisterType, userAgent: string) {
    const existingCredential = await this.db
      .select()
      .from(credentials)
      .where(eq(credentials.email, data.email))
      .limit(1);

    if (existingCredential.length > 0) {
      throw new EmailAlreadyExistsError(data.email);
    }

    const passwordHash = await this.passwordService.hashPassword(data.password);

    const [newCredential] = await this.db
      .insert(credentials)
      .values({
        email: data.email,
        password: passwordHash,
        email_verified: false,
        refresh_token: [],
        refresh_token_version: 0,
        user_agent: userAgent,
      })
      .returning();

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await redisClient.setEx(
      `email_verification:${verificationToken}`,
      24 * 60 * 60,
      JSON.stringify({
        userId: newCredential.id,
        email: data.email,
        createdAt: new Date().toISOString(),
      })
    );

    const authEventPublisher = eventBus.getAuthEventPublisher();
    const verificationData: EmailVerificationRequestedData = {
      userId: newCredential.id,
      email: data.email,
      token: verificationToken,
      expiresAt: expiresAt.toISOString(),
    };

    await authEventPublisher.publishEmailVerificationRequested(newCredential.id, verificationData);

    systemLogger.info('User registration initiated', {
      userId: newCredential.id,
      email: data.email,
    });

    return {
      id: newCredential.id,
      email: newCredential.email,
      emailVerified: false,
      message: 'Registration successful. Please check your email to verify your account.',
    };
  }

  async verifyEmail(token: string) {
    const tokenKey = `email_verification:${token}`;
    const tokenData = await redisClient.get(tokenKey);

    if (!tokenData) {
      throw new Error('Invalid or expired verification token');
    }

    const { userId, email } = JSON.parse(tokenData);

    const [credential] = await this.db.select().from(credentials).where(eq(credentials.id, userId)).limit(1);

    if (!credential) {
      throw new Error('Credential not found');
    }

    if (credential.email_verified) {
      await redisClient.del(tokenKey);
      return {
        message: 'Email already verified',
        emailVerified: true,
      };
    }

    await this.db.update(credentials).set({ email_verified: true }).where(eq(credentials.id, userId));

    await redisClient.del(tokenKey);

    const authEventPublisher = eventBus.getAuthEventPublisher();
    await authEventPublisher.publishUserRegistered(userId, {
      userId,
      email,
    });

    systemLogger.info('Email verified and user registered event published', {
      userId,
      email,
    });

    return {
      message: 'Email verified successfully',
      emailVerified: true,
    };
  }
}
