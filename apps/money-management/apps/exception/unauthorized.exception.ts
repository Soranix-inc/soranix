import httpStatus from 'http-status';
import { HttpException } from './http.exception';

export class UnauthorizedException extends HttpException {
  constructor(
    msg: string = 'An unauthorized request has been made',
    ctx: string = 'error context'
  ) {
    super(msg, ctx);
    this.statusCode = httpStatus.UNAUTHORIZED;
    this.title = 'UnauthorizedError';
    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }
}
