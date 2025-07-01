import { Request, Response, NextFunction } from 'express';
import { winstonLogger } from '@/config';
import { ValidationException } from '@/exception/validation.exception';
import { HttpException } from '@/exception/http.exception';

export const errorHandler = (
  error: unknown,
  req: Request,
  res: Response,
  nxt: NextFunction
) => {
  let statusCode: number;
  let msg: string;
  let title: string;
  let errors: string[] = [];

  console.log('----error', error);

  if (error instanceof ValidationException) {
    msg = error.msg;
    statusCode = error.statusCode;
    title = error.title;
    errors = error.errors.flatMap((error) =>
      Object.values(error.constraints ?? {})
    );
  } else if (error instanceof HttpException) {
    msg = error.msg;
    statusCode = error.statusCode;
    title = error.title;
  } else {
    title = 'Internal Server Error';
    msg = 'Error Occured';
    statusCode = 500;
  }
  winstonLogger.error(`${title}, ${msg}`);
  res.status(statusCode).json({ title, msg, status: statusCode, errors });
};
