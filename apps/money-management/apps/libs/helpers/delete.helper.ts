import { NotFoundException } from "@/exception/not-found.exception";
import { EntityManager, FindOptions, ObjectLiteral, Repository } from "typeorm";

export async function delete_helper<T extends ObjectLiteral & { id: string }>(
	db: Repository<T>,
	_id: string,
	manager?: EntityManager,
	options?: FindOptions<T>
) {
	const repo = manager?.getRepository<T>(db.target) ?? db;
	const opt = options ?? {};
	const response = await repo.findOne({
		...opt,
		where: { _id },
	} as any);
	if (!response)
		throw new NotFoundException(`Cannot find entity with id - ${_id}`);
	await repo.delete(_id);
	return response;
}
