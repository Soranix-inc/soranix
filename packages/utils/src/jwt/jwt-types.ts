/**
 * JWT Payload structure
 * Contains user information and token metadata
 */
export interface JWTPayload {
  sub: string; // Subject (user ID)
  email: string; // User email
  roles?: string[]; // Optional user roles
  sessionId?: string; // Optional session tracking
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
  iss: string; // Issuer (auth-service)
  aud?: string[]; // Audience (which services can use this token)
}

/**
 * Options for signing JWTs
 */
export interface JWTSignOptions {
  expiresIn?: string | number; // e.g., '7d', '1h', 3600
  issuer?: string; // Service that issued the token
  audience?: string | string[]; // Services that can use the token
}

/**
 * Options for verifying JWTs
 */
export interface JWTVerifyOptions {
  issuer?: string; // Expected issuer
  audience?: string | string[]; // Expected audience
}

/**
 * Result of JWT verification
 */
export interface JWTVerifyResult {
  valid: boolean;
  payload?: JWTPayload;
  error?: string;
}
