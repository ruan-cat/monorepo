import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const packageDir = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sha =
	process.env.GITHUB_SHA ||
	(() => {
		try {
			return execFileSync("git", ["rev-parse", "HEAD"], { cwd: packageDir, encoding: "utf8" }).trim();
		} catch {
			return "__BUILD_GIT_SHA__";
		}
	})();
if (!/^[0-9a-f]{7,128}$/.test(sha)) throw new Error("build SHA must be a hexadecimal commit SHA");
const output = `/** Generated at build time; runtime never reads Git or process.env. */\nexport const BUILD_GIT_SHA = ${JSON.stringify(sha)};\n\nexport interface BuildInfo {\n  buildGitSha: string;\n}\n\nexport const buildInfo: BuildInfo = { buildGitSha: BUILD_GIT_SHA };\n`;
writeFileSync(resolve(packageDir, "runtime/build-info.generated.ts"), output, "utf8");
