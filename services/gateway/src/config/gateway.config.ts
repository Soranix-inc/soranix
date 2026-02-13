import type { RouteConfig } from '../types/gateway.types.js';

export const routes: RouteConfig[] = [
  {
    path: '/api/v1/auth',
    service: 'auth',
    publicRoutes: [
      '/api/v1/auth/login',
      '/api/v1/auth/signup',
      '/api/v1/auth/refresh',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/api/v1/auth/verify-email',
      '/api/v1/auth/resend-verification',
    ],
    rateLimit: {
      public: { max: parseInt(process.env.RATE_LIMIT_PUBLIC_MAX || '10'), windowMs: 60000 },
      protected: { max: parseInt(process.env.RATE_LIMIT_PROTECTED_MAX || '100'), windowMs: 60000 },
    },
  },
  {
    path: '/api/v1/users',
    service: 'users',
    pathRewrite: {
      '^/api/v1/users': '/api/v1',
    },
    rateLimit: {
      default: { max: parseInt(process.env.RATE_LIMIT_PROTECTED_MAX || '200'), windowMs: 60000 },
    },
  },
  {
    path: '/api/v1/banking',
    service: 'banking',
    pathRewrite: {
      '^/api/v1/banking': '/api/v1',
    },
    rateLimit: {
      default: { max: parseInt(process.env.RATE_LIMIT_PROTECTED_MAX || '300'), windowMs: 60000 },
    },
  },
  {
    path: '/api/v1/payments',
    service: 'payments',
    pathRewrite: {
      '^/api/v1/payments': '/api/v1',
    },
    rateLimit: {
      default: { max: parseInt(process.env.RATE_LIMIT_PROTECTED_MAX || '300'), windowMs: 60000 },
    },
  },
  {
    path: '/api/v1/ledger',
    service: 'ledger',
    rateLimit: {
      default: { max: parseInt(process.env.RATE_LIMIT_PROTECTED_MAX || '500'), windowMs: 60000 },
    },
  },
  {
    path: '/api/v1/portfolio',
    service: 'portfolio',
    rateLimit: {
      default: { max: parseInt(process.env.RATE_LIMIT_PROTECTED_MAX || '200'), windowMs: 60000 },
    },
  },
  {
    path: '/api/v1/bills-payment',
    service: 'billsPayment',
    rateLimit: {
      default: { max: parseInt(process.env.RATE_LIMIT_PROTECTED_MAX || '200'), windowMs: 60000 },
    },
  },
  {
    path: '/api/v1/transfers',
    service: 'transfers',
    rateLimit: {
      default: { max: parseInt(process.env.RATE_LIMIT_PROTECTED_MAX || '300'), windowMs: 60000 },
    },
  },
  {
    path: '/api/v1/flows',
    service: 'flows',
    rateLimit: {
      default: { max: parseInt(process.env.RATE_LIMIT_PROTECTED_MAX || '200'), windowMs: 60000 },
    },
  },
  {
    path: '/api/v1/money-management',
    service: 'moneyManagement',
    rateLimit: {
      default: { max: parseInt(process.env.RATE_LIMIT_PROTECTED_MAX || '200'), windowMs: 60000 },
    },
  },
  {
    path: '/api/v1/notification',
    service: 'notification',
    rateLimit: {
      default: { max: parseInt(process.env.RATE_LIMIT_PROTECTED_MAX || '200'), windowMs: 60000 },
    },
  },
  {
    path: '/api/v1/billing',
    service: 'billing',
    rateLimit: {
      default: { max: parseInt(process.env.RATE_LIMIT_PROTECTED_MAX || '200'), windowMs: 60000 },
    },
  },
  {
    path: '/api/v1/ai',
    service: 'ai',
    rateLimit: {
      default: { max: parseInt(process.env.RATE_LIMIT_PROTECTED_MAX || '100'), windowMs: 60000 },
    },
  },
];

export function getRouteConfig(path: string): RouteConfig | null {
  for (const route of routes) {
    if (path.startsWith(route.path)) {
      return route;
    }
  }
  return null;
}

export function isPublicRoute(path: string, routeConfig: RouteConfig): boolean {
  if (!routeConfig.publicRoutes) {
    return false;
  }

  return routeConfig.publicRoutes.some((publicPath) => {
    if (publicPath.endsWith('*')) {
      const prefix = publicPath.slice(0, -1);
      return path.startsWith(prefix);
    }
    return path === publicPath || path.startsWith(publicPath + '/');
  });
}
