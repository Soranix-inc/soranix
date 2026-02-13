import type { Request } from 'express';

export interface AuthContext {
  userId: string;
  email: string;
  roles: string[];
  sessionId: string;
  iat?: number;
  exp?: number;
}

export interface RateLimitConfig {
  max: number;
  windowMs: number;
}

export interface RouteRateLimitConfig {
  public?: RateLimitConfig;
  protected?: RateLimitConfig;
  default?: RateLimitConfig;
}

export interface RouteConfig {
  path: string;
  service: string;
  publicRoutes?: string[];
  rateLimit?: RouteRateLimitConfig;
  pathRewrite?: {
    [pattern: string]: string;
  };
}

export interface ServiceRegistry {
  [serviceName: string]: string;
}

export interface GatewayRequest extends Request {
  user?: AuthContext;
  targetService?: string;
  targetUrl?: string;
}
