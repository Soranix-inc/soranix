import httpStatus from 'http-status';

export class HttpException extends Error {
  public statusCode: number = httpStatus.INTERNAL_SERVER_ERROR;
  public msg: string;
  public context: string;
  public title: string;

  constructor(
    msg: string = 'An error occured',
    ctx: string = 'error context'
  ) {
    super(msg);
    this.msg = msg;
    this.context = ctx;
    this.title = 'HttpError';
    Object.setPrototypeOf(this, HttpException.prototype);
  }
}
