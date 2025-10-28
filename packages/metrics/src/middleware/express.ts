import { Request, Response, NextFunction } from 'express';

import { systemLogger } from '@packages/logging';

import { SoranixMetrics } from '../prometheus/client.js';

export interface MetricsMiddlewareOptions {
  metrics: SoranixMetrics;
  excludePaths?: string[];
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
}

export function metricsMiddleware(options: MetricsMiddlewareOptions) {
  const { metrics, excludePaths = [], includeRequestBody = false, includeResponseBody = false } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Skip if path is excluded
    if (excludePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Store original end function
    const originalEnd = res.end;

    // Override end function to capture response
    res.end = function (chunk?: any, encoding?: any) {
      const responseTime = (Date.now() - startTime) / 1000; // Convert to seconds
      const requestSize = req.get('content-length') ? parseInt(req.get('content-length')!) : 0;
      const responseSize = chunk ? Buffer.byteLength(chunk, encoding) : 0;

      // Track HTTP metrics
      metrics.incrementCounter('http_requests_total', {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode.toString(),
      });

      metrics.observeHistogram('http_request_duration_seconds', responseTime, {
        method: req.method,
        route: req.route?.path || req.path,
        status_code: res.statusCode.toString(),
      });

      if (requestSize > 0) {
        metrics.observeHistogram('http_request_size_bytes', requestSize, {
          method: req.method,
          route: req.route?.path || req.path,
        });
      }

      if (responseSize > 0) {
        metrics.observeHistogram('http_response_size_bytes', responseSize, {
          method: req.method,
          route: req.route?.path || req.path,
          status_code: res.statusCode.toString(),
        });
      }

      // Call original end function
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}

export function createMetricsEndpoint(metrics: SoranixMetrics) {
  return async (req: Request, res: Response) => {
    try {
      const metricsData = await metrics.getMetrics();
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      res.send(metricsData);
    } catch (error) {
      systemLogger.error('Failed to get metrics', { error: error instanceof Error ? error.message : String(error) });
      res.status(500).send('Failed to get metrics');
    }
  };
}
