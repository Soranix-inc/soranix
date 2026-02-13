import type { Application, Request, Response } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';

import { systemLogger } from '@packages/logging';

import { routes } from '../config/gateway.config.js';
import { getServiceUrl } from './service-registry.js';
import { injectHeaders } from '../utils/header-injector.js';
import type { AuthContext } from '../types/gateway.types.js';

interface ServiceProxyConfig {
  path: string;
  service: string;
  targetUrl: string;
  timeout?: number;
}

export class ServiceProxy {
  private static readonly DEFAULT_TIMEOUT = 30000;

  private static createProxyOptions(
    config: ServiceProxyConfig,
    routeConfig: { pathRewrite?: { [pattern: string]: string } }
  ): Options {
    return {
      target: config.targetUrl,
      changeOrigin: true,
      pathRewrite: routeConfig.pathRewrite || {},
      timeout: config.timeout || ServiceProxy.DEFAULT_TIMEOUT,
      on: {
        proxyReq: ServiceProxy.handleProxyRequest as any,
        proxyRes: ServiceProxy.handleProxyResponse as any,
        error: ServiceProxy.handleProxyError as any,
      },
    };
  }

  private static handleProxyRequest(proxyReq: any, req: Request, res: Response): void {
    const userContext: AuthContext | undefined = (req as Request & { user?: AuthContext }).user;
    injectHeaders(req, userContext);

    systemLogger.debug('Proxying request', {
      method: req.method,
      originalPath: req.path,
      targetPath: proxyReq.path,
    });
  }

  private static handleProxyResponse(proxyRes: any, req: Request, res: Response): void {
    systemLogger.debug('Proxied response', {
      statusCode: proxyRes.statusCode,
      path: req.path,
    });
  }

  private static handleProxyError(err: Error, req: Request, res: Response): void {
    systemLogger.error('Proxy error', {
      error: err.message,
      path: req.path,
      stack: err.stack,
    });

    if (!res.headersSent) {
      res.status(502).json({
        error: 'Service unavailable',
        code: 'SERVICE_UNAVAILABLE',
        message: 'The backend service is temporarily unavailable',
        timestamp: new Date().toISOString(),
      });
    }
  }

  public static setupProxy(
    app: Application,
    authMiddleware: (req: Request, res: Response, next: () => void) => void,
    rateLimitMiddleware: (req: Request, res: Response, next: () => void) => Promise<void>
  ): void {
    routes.forEach((routeConfig) => {
      const targetUrl = getServiceUrl(routeConfig.service);

      if (!targetUrl) {
        systemLogger.error('Service URL not found, skipping proxy setup', {
          service: routeConfig.service,
          path: routeConfig.path,
        });
        return;
      }

      try {
        const proxyConfig: ServiceProxyConfig = {
          path: routeConfig.path,
          service: routeConfig.service,
          targetUrl: targetUrl,
          timeout: ServiceProxy.DEFAULT_TIMEOUT,
        };

        const proxyOptions = ServiceProxy.createProxyOptions(proxyConfig, routeConfig);
        const proxy = createProxyMiddleware(proxyOptions);

        app.use(routeConfig.path, authMiddleware, rateLimitMiddleware, proxy);

        systemLogger.info('Proxy route configured', {
          path: routeConfig.path,
          service: routeConfig.service,
          targetUrl: targetUrl,
        });
      } catch (error) {
        systemLogger.error('Failed to create proxy for route', {
          path: routeConfig.path,
          service: routeConfig.service,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    });
  }
}
