// Export authentication middleware
export { requireAuth } from './middleware/require-auth.js';
export { optionalAuth } from './middleware/optional-auth.js';
export { requireRoles, requireAnyRole, requireAllRoles } from './middleware/require-roles.js';

// Export financial middleware
export { validateBalance, attachBalance, checkAccount } from './middleware/financial/index.js';
export type {
  ValidateBalanceOptions,
  AttachBalanceOptions,
  CheckAccountOptions,
} from './middleware/financial/index.js';

// Export types
export type { AuthContext, AuthMiddlewareOptions } from './types/auth-context.js';
export type { FinancialContext } from './types/financial-context.js';

// Export errors
export {
  AuthenticationError,
  TokenMissingError,
  TokenInvalidError,
  TokenExpiredError,
  InsufficientPermissionsError,
} from './errors/auth-errors.js';

// Export utilities
export { extractToken, extractTokenFromHeader, extractTokenFromCookie } from './utils/token-extractor.js';
