import httpStatus from 'http-status';
import { HttpException } from './http.exception';

export class BadRequestException extends HttpException {
  constructor(
    msg: string = 'A bad request has been made by the user',
    ctx: string = 'error context'
  ) {
    super(msg, ctx);
    this.statusCode = httpStatus.BAD_REQUEST;
    this.title = 'BadRequestError';
  }
}
