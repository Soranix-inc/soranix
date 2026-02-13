import type { Request, Response, NextFunction } from 'express';

import { errorHandler, SoranixError } from '@packages/errors';
import { systemLogger } from '@packages/logging';

export const gatewayErrorHandler = errorHandler({
  config: {
    logErrors: true,
    includeStack: process.env.NODE_ENV === 'development',
    sanitizeErrors: process.env.NODE_ENV === 'production',
    includeContext: true,
    trackMetrics: true,
  },
});

export function notFoundMiddleware(req: Request, res: Response): void {
  systemLogger.warn('Route not found', {
    method: req.method,
    path: req.path,
  });

  const notFoundError = new SoranixError('NOT_FOUND', `Route ${req.method} ${req.path} not found`, 404, {
    context: {
      path: req.path,
      method: req.method,
    },
  });

  (gatewayErrorHandler as any)(notFoundError, req, res, () => {});
}
