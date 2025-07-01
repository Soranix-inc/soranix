import { EntityManager, ObjectLiteral, Repository } from "typeorm";

export async function delete_many_helper<
	T extends ObjectLiteral & { id: string },
>(db: Repository<T>, criteria: Partial<T>, manager?: EntityManager) {
	const repo = manager?.getRepository<T>(db.target) ?? db;
	await repo.delete(criteria);
}
