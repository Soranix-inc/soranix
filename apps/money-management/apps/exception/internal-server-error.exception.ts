import httpStatus from 'http-status';
import { HttpException } from './http.exception';

export class InternalServerException extends HttpException {
  constructor(
    msg: string = 'Internal Server Error',
    ctx: string = 'error context'
  ) {
    super(msg, ctx);
    this.statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    this.title = 'InternalServerError';
  }
}
