import httpStatus from 'http-status';
import { ValidationError as ValidationErrors } from 'class-validator';
import { HttpException } from './http.exception';

export class ValidationException extends HttpException {
  public errors: ValidationErrors[] = [];
  constructor(
    errors: ValidationErrors[] = [],
    msg: string = 'An error with validation has occured',
    ctx: string = 'error context'
  ) {
    super(msg, ctx);
    this.statusCode = httpStatus.BAD_REQUEST;
    this.title = 'ValidationError';
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationException.prototype);
  }
}
