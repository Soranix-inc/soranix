import { EntityManager, ObjectLiteral, Repository } from "typeorm";

export async function update_many_helper<
	T extends ObjectLiteral & { id: string },
>(
	db: Repository<T>,
	criteria: Partial<T>,
	updates: Partial<T> = {},
	session?: EntityManager
) {
	const repo = session?.getRepository<T>(db.target as any) ?? db;
	await repo.update(criteria, updates);
	return repo.findBy(criteria);
}
