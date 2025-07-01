import { NotFoundException } from "@/exception/not-found.exception";
import { EntityManager, FindOptions, ObjectLiteral, Repository } from "typeorm";

export async function remove_helper<T extends ObjectLiteral & { id: string }>(
	db: Repository<T>,
	id: string,
	manager?: EntityManager,
	options?: FindOptions<T>
) {
	const opt = options ?? {};
	const repo = manager?.getRepository<T>(db.target) ?? db;
	const response = await repo.findOne({
		where: { _id: id },
		...opt,
	} as any);
	if (!response)
		throw new NotFoundException(`Unable to find entity with id - ${id}`);
	await repo.softDelete(id);
	return response;
}
