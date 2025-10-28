import type { Request, Response, NextFunction } from 'express';

import { systemLogger } from '@packages/logging';
import { JWTVerifier } from '@packages/utils';

import { TokenMissingError, TokenInvalidError, TokenExpiredError } from '../errors/auth-errors.js';
import type { AuthContext, AuthMiddlewareOptions } from '../types/auth-context.js';
import { extractToken } from '../utils/token-extractor.js';

/**
 * Authentication middleware that REQUIRES a valid JWT token
 * Returns 401 if token is missing or invalid
 */
export function requireAuth(options: AuthMiddlewareOptions = {}) {
  const verifier = new JWTVerifier();

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Extract token from request
      const token = extractToken(req);

      if (!token) {
        throw new TokenMissingError();
      }

      // Verify token
      const result = verifier.verify(token);

      if (!result.valid || !result.payload) {
        if (result.error?.includes('expired')) {
          throw new TokenExpiredError(result.error);
        }
        throw new TokenInvalidError(result.error);
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

      systemLogger.debug('User authenticated', {
        userId: authContext.userId,
        email: authContext.email,
      });

      next();
    } catch (error) {
      // Call optional error handler
      if (options.onError) {
        options.onError(error as Error, req, res);
        return;
      }

      // Default error handling
      if (
        error instanceof TokenMissingError ||
        error instanceof TokenInvalidError ||
        error instanceof TokenExpiredError
      ) {
        systemLogger.warn('Authentication failed', {
          error: error.message,
          path: req.path,
        });

        res.status(error.statusCode).json({
          error: error.message,
          code: error.name,
        });
        return;
      }

      // Unexpected error
      systemLogger.error('Authentication error', {
        error: error instanceof Error ? error.message : String(error),
        path: req.path,
      });

      res.status(500).json({
        error: 'Internal server error during authentication',
      });
    }
  };
}
