import { Request } from 'express';

export interface ARequest extends Request {
  user?: any;
}
