import type { Request, Response, NextFunction } from 'express';

import { systemLogger } from '@packages/logging';
import { JWT } from '@packages/utils';

import { getRouteConfig, isPublicRoute } from '../config/gateway.config.js';
import type { AuthContext } from '../types/gateway.types.js';
import { extractToken } from '../utils/token-extractor.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthContext;
    }
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const routeConfig = getRouteConfig(req.path);

  if (!routeConfig) {
    systemLogger.warn('No route configuration found for path', { path: req.path });
    return next();
  }

  if (isPublicRoute(req.path, routeConfig)) {
    systemLogger.debug('Public route, skipping authentication', { path: req.path });
    return next();
  }

  try {
    const token = extractToken(req);

    if (!token) {
      systemLogger.warn('Authentication required but token missing', { path: req.path });
      res.status(401).json({
        error: 'Authentication required',
        code: 'TOKEN_MISSING',
      });
      return;
    }

    const jwt = new JWT(process.env.JWT_SECRET, {
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE,
    });

    const result = jwt.verify(token);

    if (!result.valid || !result.payload) {
      systemLogger.warn('Token verification failed', {
        path: req.path,
        error: result.error,
      });

      const statusCode = result.error?.includes('expired') ? 401 : 401;
      res.status(statusCode).json({
        error: result.error || 'Invalid token',
        code: 'TOKEN_INVALID',
      });
      return;
    }

    const userContext: AuthContext = {
      userId: result.payload.sub,
      email: result.payload.email,
      roles: result.payload.roles || [],
      sessionId: result.payload.sessionId || '',
      iat: result.payload.iat,
      exp: result.payload.exp,
    };

    req.user = userContext;

    systemLogger.debug('User authenticated', {
      userId: userContext.userId,
      email: userContext.email,
      path: req.path,
    });

    next();
  } catch (error) {
    systemLogger.error('Authentication error', {
      error: error instanceof Error ? error.message : String(error),
      path: req.path,
    });

    res.status(500).json({
      error: 'Internal server error during authentication',
      code: 'AUTH_ERROR',
    });
  }
}
