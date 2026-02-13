import type { Request } from 'express';

export function extractTokenFromHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    return parts[1];
  }

  return null;
}

export function extractTokenFromCookie(req: Request): string | null {
  if (!req.cookies) {
    return null;
  }

  return req.cookies.access_token || req.cookies.token || null;
}

export function extractToken(req: Request): string | null {
  const headerToken = extractTokenFromHeader(req);
  if (headerToken) {
    return headerToken;
  }

  return extractTokenFromCookie(req);
}

