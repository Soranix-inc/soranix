import httpStatus from 'http-status';
import { HttpException } from './http.exception';

export class NotFoundException extends HttpException {
  constructor(
    msg: string = 'The requested resource was not found',
    ctx: string = 'error context'
  ) {
    super(msg, ctx);
    this.title = 'NotFoundError';
    this.statusCode = httpStatus.NOT_FOUND;
  }
}
