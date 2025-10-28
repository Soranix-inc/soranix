import crypto from 'crypto';

import jwt from 'jsonwebtoken';

import { systemLogger } from '@packages/logging';

import { redisClient } from '../../config/redis.config.js';
import { jwtConfig, securityConfig } from '../../config/security.config.js';
import { AccessTokenPayload, RefreshTokenPayload } from '../../types/auth-types.js';

/**
 * Stateless Token Service
 * Uses Redis for refresh token storage (not database)
 */
export class TokenService {
  /**
   * Generate access token (JWT only, no storage)
   */
  generateAccessToken(payload: Omit<AccessTokenPayload, 'type'>): string {
    const tokenPayload: AccessTokenPayload = {
      ...payload,
      type: 'access',
    };

    return jwt.sign(tokenPayload, jwtConfig.accessTokenSecret, {
      expiresIn: securityConfig.accessTokenExpiry,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
  }

  /**
   * Generate refresh token and store in Redis
   */
  async generateRefreshToken(userId: string, sessionId: string, deviceId: string): Promise<string> {
    // Generate token family for rotation tracking
    const tokenFamily = `fam_${crypto.randomBytes(16).toString('hex')}`;

    const tokenPayload: RefreshTokenPayload = {
      userId,
      sessionId,
      deviceId,
      tokenFamily,
      type: 'refresh',
    };

    // Generate JWT
    const token = jwt.sign(tokenPayload, jwtConfig.refreshTokenSecret, {
      expiresIn: securityConfig.refreshTokenExpiry,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    // Hash token for Redis storage
    const tokenHash = this.hashToken(token);

    // Store in Redis with expiry (7 days)
    const key = `refresh_token:${tokenHash}`;
    await redisClient.setEx(
      key,
      7 * 24 * 60 * 60, // 7 days in seconds
      JSON.stringify({
        userId,
        sessionId,
        deviceId,
        tokenFamily,
        createdAt: new Date().toISOString(),
      })
    );

    // Also track token family for reuse detection
    const familyKey = `token_family:${tokenFamily}`;
    await redisClient.sAdd(familyKey, tokenHash);
    await redisClient.expire(familyKey, 7 * 24 * 60 * 60);

    systemLogger.debug('Refresh token generated and stored in Redis', {
      userId,
      sessionId,
      tokenFamily,
    });

    return token;
  }

  /**
   * Verify access token
   */
  verifyAccessToken(token: string): AccessTokenPayload {
    try {
      const payload = jwt.verify(token, jwtConfig.accessTokenSecret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }) as AccessTokenPayload;

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return payload;
    } catch (error) {
      systemLogger.warn('Access token verification failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Invalid or expired access token');
    }
  }

  /**
   * Verify refresh token and check for reuse (Redis-based)
   */
  async verifyRefreshToken(token: string): Promise<{
    payload: RefreshTokenPayload;
    isReused: boolean;
  }> {
    try {
      // Verify JWT signature and expiry
      const payload = jwt.verify(token, jwtConfig.refreshTokenSecret, {
        issuer: jwtConfig.issuer,
        audience: jwtConfig.audience,
      }) as RefreshTokenPayload;

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      // Hash token
      const tokenHash = this.hashToken(token);

      // Check if token exists in Redis
      const key = `refresh_token:${tokenHash}`;
      const stored = await redisClient.get(key);

      if (!stored) {
        // Token not found - REUSE DETECTED!
        systemLogger.error('Refresh token not found in Redis - possible reuse attack', {
          userId: payload.userId,
          tokenFamily: payload.tokenFamily,
        });

        // Revoke all tokens in this family
        await this.revokeTokenFamily(payload.tokenFamily);

        return { payload, isReused: true };
      }

      // Token is valid
      return { payload, isReused: false };
    } catch (error) {
      systemLogger.warn('Refresh token verification failed', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw new Error('Invalid or expired refresh token');
    }
  }

  /**
   * Rotate refresh token (delete old, create new)
   */
  async rotateRefreshToken(oldToken: string): Promise<string> {
    // Verify old token
    const { payload, isReused } = await this.verifyRefreshToken(oldToken);

    if (isReused) {
      throw new Error('Token reuse detected - all sessions revoked');
    }

    // Delete old token from Redis
    const oldTokenHash = this.hashToken(oldToken);
    await redisClient.del(`refresh_token:${oldTokenHash}`);

    // Generate new token with SAME family (for reuse detection)
    const newTokenPayload: RefreshTokenPayload = {
      userId: payload.userId,
      sessionId: payload.sessionId,
      deviceId: payload.deviceId,
      tokenFamily: payload.tokenFamily, // SAME FAMILY!
      type: 'refresh',
    };

    const newToken = jwt.sign(newTokenPayload, jwtConfig.refreshTokenSecret, {
      expiresIn: securityConfig.refreshTokenExpiry,
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });

    // Store new token in Redis
    const newTokenHash = this.hashToken(newToken);
    const key = `refresh_token:${newTokenHash}`;
    await redisClient.setEx(
      key,
      7 * 24 * 60 * 60,
      JSON.stringify({
        userId: payload.userId,
        sessionId: payload.sessionId,
        deviceId: payload.deviceId,
        tokenFamily: payload.tokenFamily,
        createdAt: new Date().toISOString(),
      })
    );

    // Add to token family set
    const familyKey = `token_family:${payload.tokenFamily}`;
    await redisClient.sAdd(familyKey, newTokenHash);

    systemLogger.info('Refresh token rotated', {
      userId: payload.userId,
      sessionId: payload.sessionId,
      tokenFamily: payload.tokenFamily,
    });

    return newToken;
  }

  /**
   * Revoke token family (for reuse detection)
   */
  async revokeTokenFamily(tokenFamily: string): Promise<void> {
    const familyKey = `token_family:${tokenFamily}`;
    const tokenHashes = await redisClient.sMembers(familyKey);

    // Delete all tokens in family
    for (const hash of tokenHashes) {
      await redisClient.del(`refresh_token:${hash}`);
    }

    // Delete family set
    await redisClient.del(familyKey);

    systemLogger.warn('Token family revoked - security incident', { tokenFamily });
  }

  /**
   * Revoke all tokens for a session
   */
  async revokeSessionTokens(sessionId: string): Promise<void> {
    // Get all refresh token keys
    const keys = await redisClient.keys(`refresh_token:*`);

    for (const key of keys) {
      const stored = await redisClient.get(key);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.sessionId === sessionId) {
          await redisClient.del(key);

          // Remove from family set
          const familyKey = `token_family:${data.tokenFamily}`;
          const tokenHash = key.replace('refresh_token:', '');
          await redisClient.sRem(familyKey, tokenHash);
        }
      }
    }

    systemLogger.info('Session tokens revoked', { sessionId });
  }

  /**
   * Hash token using SHA-256
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
