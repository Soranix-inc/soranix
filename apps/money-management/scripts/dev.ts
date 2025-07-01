import { run } from "./cmd";

const args = process.argv.slice(2).join(" ");
const tkns = args.split(" ");

const envs = tkns[0] as string;

const known_environments = ["dev", "loc", "pro"] as const;

function isKnownEnv(val: string): val is (typeof known_environments)[number] {
	return known_environments.includes(val as any);
}

if (!isKnownEnv(envs)) {
	console.error(`environment not understood - ${envs}`);
	process.exit(1);
}

const options: Record<(typeof known_environments)[number], string> = {
	dev: "run dev",
	loc: "run dev:loc",
	pro: "run start",
};

(async () => {
	const action = options[envs];

	/** create the database */
	await run("npm", ["run", "db:create"]);

	/** run migrations on the database */
	await run("npm", ["run", "migrations:create"]);

	/** start the application */
	await run("npm", action.split(" "));
})().catch((e) => {
	console.error(`Error occured: ${e}`);
	process.exit(1);
});
