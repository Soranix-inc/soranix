import type { Request, Response, NextFunction } from 'express';

import { systemLogger } from '@packages/logging';

import { InsufficientPermissionsError } from '../errors/auth-errors.js';

/**
 * Middleware to check if authenticated user has required roles
 * Must be used AFTER requireAuth middleware
 */
export function requireRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasRequiredRole = roles.some((role) => userRoles.includes(role));

    if (!hasRequiredRole) {
      systemLogger.warn('Insufficient permissions', {
        userId: req.user.userId,
        requiredRoles: roles,
        userRoles,
        path: req.path,
      });

      const error = new InsufficientPermissionsError(`Required roles: ${roles.join(', ')}`);

      res.status(error.statusCode).json({
        error: error.message,
        code: error.name,
      });
      return;
    }

    next();
  };
}

/**
 * Check if user has ANY of the specified roles
 */
export function requireAnyRole(...roles: string[]) {
  return requireRoles(...roles);
}

/**
 * Check if user has ALL of the specified roles
 */
export function requireAllRoles(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required',
        code: 'AUTHENTICATION_REQUIRED',
      });
      return;
    }

    const userRoles = req.user.roles || [];
    const hasAllRoles = roles.every((role) => userRoles.includes(role));

    if (!hasAllRoles) {
      systemLogger.warn('Insufficient permissions', {
        userId: req.user.userId,
        requiredRoles: roles,
        userRoles,
        path: req.path,
      });

      const error = new InsufficientPermissionsError(`Required all roles: ${roles.join(', ')}`);

      res.status(error.statusCode).json({
        error: error.message,
        code: error.name,
      });
      return;
    }

    next();
  };
}
