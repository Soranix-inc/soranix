import type { AuthContext } from './auth-context.js';

/**
 * Extend Express Request to include authenticated user
 */
declare global {
  namespace Express {
    interface Request {
      /**
       * Authenticated user context
       * Available after authentication middleware processes the request
       */
      user?: AuthContext;
    }
  }
}

export {};
