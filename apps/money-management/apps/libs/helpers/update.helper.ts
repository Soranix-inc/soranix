import { NotFoundException } from "@/exception/not-found.exception";
import { EntityManager, FindOptions, ObjectLiteral, Repository } from "typeorm";

export async function update_helper<T extends ObjectLiteral & { id: string }>(
	db: Repository<T>,
	id: string,
	updates: Partial<T> = {},
	session?: EntityManager,
	options?: FindOptions<T>
) {
	const repo = session?.getRepository<T>(db.target as any) ?? db;
	await repo.update(id, updates);
	const response = await repo.findOne({
		where: { _id: id },
		...options,
	} as any);
	if (!response) {
		throw new NotFoundException(`Cannot find entity with id - ${id}`);
	}
	return response;
}
