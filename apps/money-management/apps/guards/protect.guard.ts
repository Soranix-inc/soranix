import { UnauthorizedException } from '@/exception/unauthorized.exception';
import { Request, Response, NextFunction } from 'express';

export function protect(req: Request, _res: Response, nxt: NextFunction) {
  const authorization = req.headers['authorization'] as string;
  const token = authorization.split(' ')[1];

  if (!token) {
    throw new UnauthorizedException();
  }

  try {
    nxt();
  } catch {
    throw new UnauthorizedException();
  }
}
