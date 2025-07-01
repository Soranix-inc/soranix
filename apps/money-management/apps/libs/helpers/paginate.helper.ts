import { FindManyOptions, ObjectLiteral, Repository } from "typeorm";

export type Paginated<T> = {
	docs: T[];
	totalDocs: number;
	limit: number;
	page: number;
	totalPages: number;
	hasNextPage: boolean;
	nextPage: number | null;
	hasPrevPage: boolean;
	prevPage: number | null;
	pagingCounter: number;
};

export async function paginate_helper<T extends ObjectLiteral & { id: string }>(
	db: Repository<T>,
	query: Partial<T>,
	options: FindManyOptions<T> = {}
): Promise<Paginated<T>> {
	const { page, limit: pick, ...rest } = query;

	const p = page ? parseInt(page, 10) : 1;
	const l = pick ? parseInt(pick, 10) : 100;
	const s = (p - 1) * l;

	const [docs, count] = await db.findAndCount({
		...options,
		where: rest as Partial<T>,
		skip: s,
		take: l,
	});

	const total_pages = Math.ceil(count / l);

	return {
		docs,
		hasNextPage: total_pages > p,
		hasPrevPage: p > 1,
		limit: l,
		nextPage: total_pages > p ? p + 1 : null,
		page: p,
		pagingCounter: s + 1,
		prevPage: p > 1 ? p - 1 : null,
		totalDocs: count,
		totalPages: total_pages,
	};
}
