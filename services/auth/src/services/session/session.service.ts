import crypto from 'crypto';

import { systemLogger } from '@packages/logging';

import { redisClient } from '../../config/redis.config.js';
import { securityConfig } from '../../config/security.config.js';
import { SessionData, DeviceInfo } from '../../types/auth-types.js';

/**
 * Stateless Session Service using Redis
 */
export class SessionService {
  /**
   * Create new session in Redis
   */
  async createSession(
    userId: string,
    deviceInfo: DeviceInfo,
    location?: { country?: string; city?: string }
  ): Promise<string> {
    const sessionId = `sess_${crypto.randomBytes(16).toString('hex')}`;
    const expiresAt = new Date(Date.now() + securityConfig.sessionTimeout);

    const sessionData: SessionData = {
      sessionId,
      userId,
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ipAddress: deviceInfo.ipAddress,
      country: location?.country,
      city: location?.city,
      createdAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt,
      isActive: true,
    };

    // Store in Redis with TTL
    const key = `session:${sessionId}`;
    const ttlSeconds = Math.floor(securityConfig.sessionTimeout / 1000);

    await redisClient.setEx(key, ttlSeconds, JSON.stringify(sessionData));

    // Track user sessions
    const userSessionsKey = `user_sessions:${userId}`;
    await redisClient.sAdd(userSessionsKey, sessionId);
    await redisClient.expire(userSessionsKey, ttlSeconds);

    systemLogger.info('Session created in Redis', {
      userId,
      sessionId,
      deviceId: deviceInfo.deviceId,
    });

    // Enforce max sessions
    await this.enforceMaxSessions(userId);

    return sessionId;
  }

  /**
   * Get session from Redis
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const key = `session:${sessionId}`;
    const stored = await redisClient.get(key);

    if (!stored) {
      return null;
    }

    const session = JSON.parse(stored) as SessionData;

    // Convert date strings back to Date objects
    session.createdAt = new Date(session.createdAt);
    session.lastActivityAt = new Date(session.lastActivityAt);
    session.expiresAt = new Date(session.expiresAt);

    return session;
  }

  /**
   * Update session activity (extends TTL)
   */
  async updateActivity(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return;
    }

    session.lastActivityAt = new Date();
    session.expiresAt = new Date(Date.now() + securityConfig.sessionTimeout);

    const key = `session:${sessionId}`;
    const ttlSeconds = Math.floor(securityConfig.sessionTimeout / 1000);

    await redisClient.setEx(key, ttlSeconds, JSON.stringify(session));

    systemLogger.debug('Session activity updated', { sessionId });
  }

  /**
   * Revoke session (delete from Redis)
   */
  async revokeSession(sessionId: string): Promise<void> {
    const session = await this.getSession(sessionId);

    if (session) {
      // Remove from user sessions set
      const userSessionsKey = `user_sessions:${session.userId}`;
      await redisClient.sRem(userSessionsKey, sessionId);
    }

    // Delete session
    await redisClient.del(`session:${sessionId}`);

    systemLogger.info('Session revoked', { sessionId });
  }

  /**
   * Revoke all user sessions
   */
  async revokeAllUserSessions(userId: string): Promise<void> {
    const userSessionsKey = `user_sessions:${userId}`;
    const sessionIds = await redisClient.sMembers(userSessionsKey);

    // Delete all sessions
    for (const sessionId of sessionIds) {
      await redisClient.del(`session:${sessionId}`);
    }

    // Delete user sessions set
    await redisClient.del(userSessionsKey);

    systemLogger.info('All user sessions revoked', { userId, count: sessionIds.length });
  }

  /**
   * Get all active sessions for user
   */
  async getUserActiveSessions(userId: string): Promise<SessionData[]> {
    const userSessionsKey = `user_sessions:${userId}`;
    const sessionIds = await redisClient.sMembers(userSessionsKey);

    const sessions: SessionData[] = [];

    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      }
    }

    return sessions.sort((a, b) => b.lastActivityAt.getTime() - a.lastActivityAt.getTime());
  }

  /**
   * Check if session is valid
   */
  async isSessionValid(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);

    if (!session) {
      return false;
    }

    if (session.expiresAt < new Date()) {
      await this.revokeSession(sessionId);
      return false;
    }

    return session.isActive;
  }

  /**
   * Enforce maximum sessions per user
   */
  private async enforceMaxSessions(userId: string): Promise<void> {
    const sessions = await this.getUserActiveSessions(userId);

    if (sessions.length > securityConfig.maxActiveSessions) {
      // Revoke oldest sessions (keep only maxActiveSessions newest)
      const sessionsToRevoke = sessions
        .sort((a, b) => a.lastActivityAt.getTime() - b.lastActivityAt.getTime())
        .slice(0, sessions.length - securityConfig.maxActiveSessions);

      for (const session of sessionsToRevoke) {
        await this.revokeSession(session.sessionId);
      }

      systemLogger.info('Excess sessions revoked', {
        userId,
        revokedCount: sessionsToRevoke.length,
      });
    }
  }
}
