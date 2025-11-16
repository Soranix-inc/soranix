// Main exports
export { SoranixAnalytics } from './mixpanel/client.js';
export { getMixpanelConfig, type MixpanelConfig } from './mixpanel/config.js';

// Type exports
export * from './types/index.js';

// Middleware exports
export { analyticsMiddleware, type AnalyticsMiddlewareOptions } from './middleware/express.js';

