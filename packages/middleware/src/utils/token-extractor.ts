import type { Request } from 'express';

/**
 * Extract JWT token from Authorization header
 * Supports: "Bearer <token>" format
 */
export function extractTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  // Check for Bearer token format
  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
}

/**
 * Extract JWT token from cookies
 * Looks for 'access_token' or 'token' cookie
 */
export function extractTokenFromCookie(req: Request): string | null {
  if (!req.cookies) {
    return null;
  }

  return req.cookies.access_token || req.cookies.token || null;
}

/**
 * Extract JWT token from request
 * Tries in order: Authorization header, cookies
 */
export function extractToken(req: Request): string | null {
  // Try Authorization header first
  const headerToken = extractTokenFromHeader(req);
  if (headerToken) {
    return headerToken;
  }

  // Fallback to cookies
  return extractTokenFromCookie(req);
}
