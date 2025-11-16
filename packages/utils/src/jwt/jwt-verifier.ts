import jwt from 'jsonwebtoken';

import type { JWTPayload, JWTVerifyOptions, JWTVerifyResult } from './jwt-types.js';
import { loadPublicKey } from './key-loader.js';

/**
 * JWT Verifier - Verifies JWT tokens with RSA public key
 * Used by all services to verify tokens issued by Auth Service
 */
export class JWTVerifier {
  private publicKey: string;
  private defaultOptions: JWTVerifyOptions;

  constructor(options?: JWTVerifyOptions) {
    this.publicKey = loadPublicKey();
    this.defaultOptions = {
      issuer: process.env.JWT_ISSUER || 'soranix-auth',
      audience: process.env.JWT_AUDIENCE?.split(',') || ['soranix'],
      ...options,
    };
  }

  /**
   * Verify a JWT token
   * @param token - JWT token string
   * @param options - Override default verification options
   * @returns Verification result with payload if valid
   */
  verify(token: string, options?: JWTVerifyOptions): JWTVerifyResult {
    const verifyOptions: jwt.VerifyOptions = {
      algorithms: ['RS256'],
      issuer: options?.issuer || this.defaultOptions.issuer,
      audience: options?.audience || this.defaultOptions.audience,
    };

    try {
      const decoded = jwt.verify(token, this.publicKey, verifyOptions) as JWTPayload;
      return {
        valid: true,
        payload: decoded,
      };
    } catch (error) {
      let errorMessage = 'Invalid token';

      if (error instanceof jwt.TokenExpiredError) {
        errorMessage = 'Token has expired';
      } else if (error instanceof jwt.JsonWebTokenError) {
        errorMessage = error.message;
      } else if (error instanceof jwt.NotBeforeError) {
        errorMessage = 'Token not yet valid';
      }

      return {
        valid: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Verify token and throw error if invalid
   * @param token - JWT token string
   * @param options - Override default verification options
   * @returns Decoded payload
   * @throws Error if token is invalid
   */
  verifyOrThrow(token: string, options?: JWTVerifyOptions): JWTPayload {
    const result = this.verify(token, options);
    if (!result.valid || !result.payload) {
      throw new Error(result.error || 'Invalid token');
    }
    return result.payload;
  }

  /**
   * Decode token without verification (useful for debugging)
   * WARNING: Do not use for authentication! This does not verify the signature!
   * @param token - JWT token string
   * @returns Decoded payload or null
   */
  decode(token: string): JWTPayload | null {
    try {
      return jwt.decode(token) as JWTPayload;
    } catch {
      return null;
    }
  }

  /**
   * Check if a token is expired without full verification
   * @param token - JWT token string
   * @returns true if expired
   */
  isExpired(token: string): boolean {
    const decoded = this.decode(token);
    if (!decoded || !decoded.exp) {
      return true;
    }
    return decoded.exp * 1000 < Date.now();
  }
}

