import type { Request, Response, NextFunction } from 'express';

import { systemLogger } from '@packages/logging';
import { JWTVerifier } from '@packages/utils';

import type { AuthContext, AuthMiddlewareOptions } from '../types/auth-context.js';
import { extractToken } from '../utils/token-extractor.js';

/**
 * Optional authentication middleware
 * Attaches user context if valid token is present, but doesn't fail if missing/invalid
 * Useful for endpoints that work for both authenticated and anonymous users
 */
export function optionalAuth(options: AuthMiddlewareOptions = {}) {
  const verifier = new JWTVerifier();

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract token from request
      const token = extractToken(req);

      // No token? That's ok, just continue
      if (!token) {
        next();
        return;
      }

      // Verify token
      const result = verifier.verify(token);

      // Invalid token? Log it but continue
      if (!result.valid || !result.payload) {
        systemLogger.debug('Optional auth: Invalid token provided', {
          error: result.error,
          path: req.path,
        });
        next();
        return;
      }

      // Attach user context to request
      const authContext: AuthContext = {
        userId: result.payload.sub,
        email: result.payload.email,
        roles: result.payload.roles,
        sessionId: result.payload.sessionId,
        iat: result.payload.iat,
        exp: result.payload.exp,
      };

      req.user = authContext;

      // Call optional success handler
      if (options.onSuccess) {
        options.onSuccess(authContext, req);
      }

      systemLogger.debug('Optional auth: User authenticated', {
        userId: authContext.userId,
        email: authContext.email,
      });

      next();
    } catch (error) {
      // Log error but don't fail the request
      systemLogger.debug('Optional auth: Error during authentication', {
        error: error instanceof Error ? error.message : String(error),
        path: req.path,
      });

      next();
    }
  };
}
