import { DeepPartial, EntityManager, ObjectLiteral, Repository } from "typeorm";

export async function create_helper<T extends ObjectLiteral & { id: string }>(
	db: Repository<T>,
	body: DeepPartial<T>,
	manager?: EntityManager
) {
	const repo = manager?.getRepository<T>(db.target) ?? db;
	const response = repo.create(body);
	return repo.save(response);
}
