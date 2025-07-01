export const OmitObject = <T extends Object, K extends keyof T>(
	c: new () => T,
	keys: K[]
): Partial<Omit<T, K>> => {
	const instance: T = new c();
	const omit: Partial<Omit<T, K>> = {};

	for (const key of Object.keys(instance) as (keyof T)[]) {
		if (keys.includes(key as K)) continue;
		(omit as any)[key] = (instance as any)[key];
	}
	return omit;
};
