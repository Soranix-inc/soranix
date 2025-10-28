import { Request, Response, NextFunction } from 'express';

import { systemLogger } from '@packages/logging';

import { SoranixAnalytics } from '../mixpanel/client.js';
import { APICallEvent } from '../types/events.js';

export interface AnalyticsMiddlewareOptions {
  analytics: SoranixAnalytics;
  trackAnonymous?: boolean;
  excludePaths?: string[];
  includeRequestBody?: boolean;
  includeResponseBody?: boolean;
}

export function analyticsMiddleware(options: AnalyticsMiddlewareOptions) {
  const {
    analytics,
    trackAnonymous = false,
    excludePaths = [],
    includeRequestBody = false,
    includeResponseBody = false,
  } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();

    // Skip if path is excluded
    if (excludePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    // Skip if no user and anonymous tracking is disabled
    if (!req.user && !trackAnonymous) {
      return next();
    }

    // Store original end function
    const originalEnd = res.end;

    // Override end function to capture response
    res.end = function (chunk?: any, encoding?: any) {
      const responseTime = Date.now() - startTime;

      // Create API call event
      const event: APICallEvent = {
        event: 'API Call',
        distinct_id: (req.user as any)?.id || 'anonymous',
        properties: {
          endpoint: req.path,
          method: req.method as any,
          status_code: res.statusCode,
          response_time_ms: responseTime,
          user_id: (req.user as any)?.id,
          service: process.env.SERVICE_NAME || 'unknown',
          ...(includeRequestBody && req.body && { request_body: req.body }),
          ...(includeResponseBody && chunk && { response_body: chunk.toString() }),
        },
      };

      // Track the event asynchronously
      analytics.track(event).catch((error) => {
        systemLogger.error('Failed to track API call event', {
          error: error.message,
          endpoint: req.path,
          method: req.method,
        });
      });

      // Call original end function
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
}
