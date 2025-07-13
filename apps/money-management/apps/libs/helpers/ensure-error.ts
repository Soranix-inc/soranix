export const ensureError = (err: unknown) => {
	if (err instanceof Error) return err;
	let msg = "[Error parsing message]";
	try {
		msg = JSON.stringify(err);
	} catch {}
	return new Error(msg);
};
