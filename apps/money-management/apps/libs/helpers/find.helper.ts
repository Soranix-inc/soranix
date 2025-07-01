import {
	FindManyOptions,
	FindOptionsWhere,
	ObjectLiteral,
	Repository,
} from "typeorm";
import { sanitize_query } from "./filter.helper";

export async function find_helper<T extends ObjectLiteral & { id: string }>(
	db: Repository<T>,
	query: Partial<T> = {},
	options: FindManyOptions<T> = {}
) {
	const sanitized = sanitize_query(query);
	return db.find({
		where: { ...sanitized } as FindOptionsWhere<T>,
		...options,
	});
}
