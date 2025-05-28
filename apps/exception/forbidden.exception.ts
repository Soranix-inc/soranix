import httpStatus from 'http-status';
import { HttpException } from './http.exception';

export class ForbiddenException extends HttpException {
  constructor(
    msg: string = 'Accessed resource is forbidden',
    ctx: string = 'error context'
  ) {
    super(msg, ctx);
    this.statusCode = httpStatus.FORBIDDEN;
    this.title = 'ForbiddenError';
    Object.setPrototypeOf(this, ForbiddenException.prototype);
  }
}
