import jwt from 'jsonwebtoken';

import type { JWTPayload, JWTSignOptions } from './jwt-types.js';
import { loadPrivateKey } from './key-loader.js';

/**
 * JWT Signer - Creates and signs JWTs with RSA private key
 * Should only be used in the Auth Service
 */
export class JWTSigner {
  private privateKey: string;
  private defaultOptions: JWTSignOptions;

  constructor(options?: JWTSignOptions) {
    this.privateKey = loadPrivateKey();
    this.defaultOptions = {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      issuer: process.env.JWT_ISSUER || 'soranix-auth',
      audience: process.env.JWT_AUDIENCE?.split(',') || ['soranix'],
      ...options,
    };
  }

  /**
   * Sign a JWT token for a user
   * @param userId - Unique user identifier
   * @param email - User email
   * @param additionalClaims - Any additional claims to include in the token
   * @param options - Override default signing options
   * @returns Signed JWT token string
   */
  sign(userId: string, email: string, additionalClaims?: Partial<JWTPayload>, options?: JWTSignOptions): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      sub: userId,
      email,
      iss: options?.issuer || this.defaultOptions.issuer!,
      ...additionalClaims,
    };

    const signOptions: jwt.SignOptions = {
      algorithm: 'RS256', // RSA with SHA-256
      expiresIn: options?.expiresIn || this.defaultOptions.expiresIn,
      issuer: options?.issuer || this.defaultOptions.issuer,
      audience: options?.audience || this.defaultOptions.audience,
    };

    try {
      return jwt.sign(payload, this.privateKey, signOptions);
    } catch (error) {
      throw new Error(`Failed to sign JWT: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Create a refresh token (longer expiration)
   * @param userId - Unique user identifier
   * @param sessionId - Session identifier for tracking
   * @returns Signed refresh token
   */
  signRefreshToken(userId: string, sessionId: string): string {
    return this.sign(
      userId,
      '', // Refresh tokens don't need email
      { sessionId },
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      }
    );
  }
}
