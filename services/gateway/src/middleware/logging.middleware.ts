import type { Request, Response, NextFunction } from 'express';

import { systemLogger } from '@packages/logging';

export function requestLoggingMiddleware(req: Request, res: Response, next: NextFunction): void {
  const startTime = Date.now();

  systemLogger.info('Incoming request', {
    method: req.method,
    path: req.path,
    ip: req.ip || req.socket.remoteAddress,
    userAgent: req.get('user-agent'),
    userId: (req as any).user?.userId,
  });

  res.on('finish', () => {
    const duration = Date.now() - startTime;

    systemLogger.info('Request completed', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.socket.remoteAddress,
      userId: (req as any).user?.userId,
    });
  });

  next();
}

