import { ErrorConfig } from '../types/base-error.js';

export const getErrorConfig = (): ErrorConfig => {
  const environment = (process.env.NODE_ENV as any) || 'development';

  return {
    environment,
    includeContext: process.env.ERROR_INCLUDE_CONTEXT !== 'false',
    includeStack: process.env.ERROR_INCLUDE_STACK === 'true' && environment === 'development',
    logErrors: process.env.ERROR_LOG_ERRORS !== 'false',
    trackMetrics: process.env.ERROR_TRACK_METRICS !== 'false',
    sanitizeErrors: process.env.ERROR_SANITIZE_ERRORS !== 'false' && environment === 'production',
  };
};
