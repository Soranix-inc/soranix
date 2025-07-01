import { spawn } from "child_process";

export const run = (
	cmd: string,
	arg?: string[],
	env?: Record<string, string>
) => {
	return new Promise((resolve, reject) => {
		const child = spawn(cmd, arg ?? [], {
			stdio: "inherit",
			shell: false,
			env: {
				...process.env,
				...env,
			},
		});

		child.on("exit", (code) => {
			if (code === 0) resolve(code);
			else reject(new Error(`command exited with code ${code}`));
		});
	});
};

export const cmd = (
	cmd: string,
	arg?: string[],
	env?: Record<string, string>
) => {
	return new Promise<{ stdout: string; stderr: string; code: number }>(
		(resolve, reject) => {
			const child = spawn(cmd, arg, {
				shell: false,
				env: {
					...process.env,
					...env,
				},
			});

			let stdout = "";
			let stderr = "";

			child.stdout?.on("data", (data) => {
				stdout += data.toString();
			});

			child.stderr?.on("data", (data) => {
				stderr += data.toString();
			});

			child.on("close", (code) => {
				if (code === 0) resolve({ stdout, stderr, code });
				else reject(new Error(`command failed with code ${code}\n${stderr}`));
			});
		}
	);
};
