import { Request, Response, NextFunction } from 'express';

import { systemLogger } from '@packages/logging';
import { SoranixMetrics } from '@packages/metrics';

import { getErrorConfig } from '../config/error-config.js';
import { SoranixError } from '../errors/soranix-error.js';
import { ErrorResponse, ErrorConfig } from '../types/base-error.js';

export interface ErrorHandlerOptions {
  config?: Partial<ErrorConfig>;
  metrics?: SoranixMetrics;
}

export function errorHandler(options: ErrorHandlerOptions = {}) {
  const config = { ...getErrorConfig(), ...options.config };
  const metrics = options.metrics;

  return (error: Error, req: Request, res: Response, next: NextFunction) => {
    // Log error if enabled
    if (config.logErrors) {
      systemLogger.error('Request error', {
        error: error.message,
        stack: config.includeStack ? error.stack : undefined,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        traceId: (error as SoranixError).traceId,
        spanId: (error as SoranixError).spanId,
        context: (error as SoranixError).context,
      });
    }

    // Track metrics if enabled and metrics instance provided
    if (config.trackMetrics && metrics) {
      metrics.incrementCounter('errors_total', {
        error_type: error.constructor.name,
        status_code: (error as SoranixError).statusCode?.toString() || '500',
        path: req.path,
        method: req.method,
      });
    }

    // Handle SoranixError
    if (SoranixError.isSoranixError(error)) {
      const errorResponse: ErrorResponse = {
        error: {
          code: error.code,
          message: error.message,
          statusCode: error.statusCode,
          timestamp: error.timestamp.toISOString(),
          traceId: error.traceId,
          spanId: error.spanId,
          ...(config.includeContext && error.context && { context: error.context }),
        },
        request: {
          id: (req as any).id,
          method: req.method,
          path: req.path,
          timestamp: new Date().toISOString(),
        },
      };

      return res.status(error.statusCode).json(errorResponse);
    }

    // Handle unknown errors
    const unknownErrorResponse: ErrorResponse = {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: config.sanitizeErrors ? 'An unexpected error occurred' : error.message,
        statusCode: 500,
        timestamp: new Date().toISOString(),
        ...(config.includeStack && { stack: error.stack }),
      },
      request: {
        id: (req as any).id,
        method: req.method,
        path: req.path,
        timestamp: new Date().toISOString(),
      },
    };

    res.status(500).json(unknownErrorResponse);
  };
}
