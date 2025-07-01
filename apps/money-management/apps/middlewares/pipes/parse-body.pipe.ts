import { InternalServerException } from "@/exception/internal-server-error.exception";
import { ValidationException } from "@/exception/validation.exception";
import { validate } from "class-validator";
import { NextFunction, Request, Response } from "express";

/** this function takes in a dto and uses it to evaluate a request */
/** if any of the challenges are failed it then passes the error to the next middleware */
export const parseBodyPipe = (dto: new (...args: any[]) => object) => {
	return (req: Request, _res: Response, next: NextFunction) => {
		const validator = new dto();

		Object.assign(validator, req.body);

		validate(validator)
			.then((errors) => {
				if (errors.length > 0) {
					next(
						new ValidationException(
							errors,
							`Error occured during ${dto.name} validation`
						)
					);
				} else {
					next();
				}
			})
			.catch((error) => {
				next(
					new InternalServerException("Error occured during validation", error)
				);
			});
	};
};
