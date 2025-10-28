/**
 * Authenticated user context
 * This information is attached to requests after successful JWT verification
 */
export interface AuthContext {
  userId: string;
  email: string;
  roles?: string[];
  sessionId?: string;
  iat?: number; // Issued at timestamp
  exp?: number; // Expiration timestamp
}

/**
 * Options for authentication middleware
 */
export interface AuthMiddlewareOptions {
  /**
   * Whether the authentication is required
   * If true, returns 401 when token is missing/invalid
   * If false, continues without setting req.user
   */
  required?: boolean;

  /**
   * Custom error handler
   */
  onError?: (error: Error, req: any, res: any) => void;

  /**
   * Custom success handler (called after successful auth)
   */
  onSuccess?: (user: AuthContext, req: any) => void;
}
