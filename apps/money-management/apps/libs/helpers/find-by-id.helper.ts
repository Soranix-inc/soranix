import { NotFoundException } from "@/exception/not-found.exception";
import {
	FindOneOptions,
	FindOptionsWhere,
	ObjectLiteral,
	Repository,
} from "typeorm";

export async function find_one_by_id_helper<
	T extends ObjectLiteral & { id: string },
>(db: Repository<T>, id: string, options: FindOneOptions<T> = {}) {
	const response = await db.findOne({
		where: { id: id } as FindOptionsWhere<T>,
		...options,
	});
	if (!response)
		throw new NotFoundException(`Cannot find entity with id - ${id}`);
	return response;
}
