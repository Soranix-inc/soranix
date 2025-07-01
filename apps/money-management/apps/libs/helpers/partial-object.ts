export const PartialObject = <T extends Object>(c: new () => T): Partial<T> => {
	const instance: T = new c();
	const partial = {};

	for (const key of Object.keys(instance)) {
		(partial as any)[key] = undefined;
	}
	return partial;
};
