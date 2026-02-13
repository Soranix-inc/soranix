import type { Request } from 'express';
import { randomUUID } from 'crypto';

import type { AuthContext } from '../types/gateway.types.js';

export function generateRequestId(): string {
  return randomUUID();
}

export function injectHeaders(req: Request, userContext?: AuthContext): void {
  if (!req.headers['x-request-id']) {
    req.headers['x-request-id'] = generateRequestId();
  }

  req.headers['x-gateway'] = 'soranix-gateway';
  req.headers['x-forwarded-by'] = 'soranix-gateway';

  if (userContext) {
    req.headers['x-user-id'] = userContext.userId;
    req.headers['x-user-email'] = userContext.email;
    req.headers['x-user-roles'] = JSON.stringify(userContext.roles);
    req.headers['x-session-id'] = userContext.sessionId;

    delete req.headers['authorization'];
  } else {
    delete req.headers['authorization'];
  }
}

