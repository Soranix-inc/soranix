import { FindOneOptions, ObjectLiteral, Repository } from "typeorm";

export async function find_by_id_or_null_helper<
	T extends ObjectLiteral & { id: string },
>(db: Repository<T>, id: string, options: FindOneOptions<T> = {}) {
	return db.findOne({
		where: { _id: id },
		...options,
	} as any);
}
