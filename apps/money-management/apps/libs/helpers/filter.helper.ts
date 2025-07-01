import type { ObjectLiteral } from "typeorm";

export function sanitize_query<T extends ObjectLiteral>(
	query: Partial<T>
): Record<string, any> {
	const filters: Record<string, any> = {};

	for (const key in query) {
		const value = query[key];

		if (value === null || value === undefined || value === "") {
			continue;
		}

		const match = key.match(/^(\w+)\[(gte|lte|gt|lt)\]$/);
		if (match) {
			const [_, field, operator] = match;

			if (!filters[field]) filters[field] = {};
			const parsedValue = isNaN(Date.parse(value)) ? value : new Date(value);
			filters[field][operator] = parsedValue;
			continue;
		}

		filters[key] = value;
	}

	return filters;
}
