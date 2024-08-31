// 学习一下如何使用 https://github.com/sindresorhus/execa/blob/main/readme.md
import { execa } from "execa";
import { config as dotenvConfig } from "@dotenvx/dotenvx";
import { merge } from "lodash-es";

export {};

export function add(a: number, b: number): number {
	return a + b;
}
// console.log(add(2, 3)); // Output: 5

// const pkgNames = <const>["pnpm", "turbopack", "vite", "vue", "koishi", "lodash", "axios"];
// 查询多个包的版本
// const response = await Promise.all(
// 	pkgNames.map((name) => {
// 		return execa`pnpm v ${name}`;
// 	}),
// );
// response.forEach((res) => {
// 	console.log(" res.stdout ", res.stdout);
// });

const currentDotenvConfig = dotenvConfig({
	//  path: "../../../.env"
}).parsed;

console.log(" 、 currentDotenvConfig ", currentDotenvConfig);
// process.env.psql_database_url;

// @dotenvx/dotenvx

interface Config {
	vercelProjetName: string;
	vercelToken: string;
	vercelOrgId: string;
	vercelProjectId: string;
	targetCWD: string;
	url: string;
	buildCommand: string[];
}

const config: Config = {
	vercelProjetName: "vercel-monorepo-test-1-zn20",
	vercelToken: "QF9Q3Hv5U8q2fKz1Jc4W8B1Y",
	vercelOrgId: "QF9Q3Hv5U8q2fKz1Jc4W8B1Y",
	vercelProjectId: "QF9Q3Hv5U8q2fKz1Jc4W8B1Y",
	targetCWD: "./packages/docs-01-star",
	url: "docs-01-star.ruancat6312.top",
	buildCommand: [
		// "pnpm -F @ruan-cat-vercel-monorepo-test/docs-01-star build:docs",
		// "pnpm -F @ruan-cat-vercel-monorepo-test/docs-01-star copy-dist",
		"pnpm -C=packages/docs-01-star build:docs",
		"pnpm -C=packages/docs-01-star copy-dist",
	],
};

// await execa`${config.buildCommand[0]}`;
// await execa`pnpm run ${config.buildCommand[0]}`;
await execa`pnpm -v && pnpm -F @ruan-cat-vercel-monorepo-test/docs-01-star build:docs`;

const command = "pnpm -v";
// const testRes = await execa`pnpm -v && ${command}`;
// const testRes = await execa`${command}`;
const testRes = await execa`${config.buildCommand[0]}`;
console.log(" ? testRes  ", testRes.stdout);
// execa No results for "&&"

merge(config, {
	vercelOrgId: process.env.VERCEL_ORG_ID,
	vercelProjectId: process.env.VERCEL_PROJECT_ID,
	vercelToken: process.env.VERCEL_TOKEN,
} satisfies Partial<Config>);

function link() {
	return execa`vc link --yes --cwd=${config.targetCWD} --project=${config.vercelProjetName} -t ${config.vercelToken}`;
}
// const { stdout } = link();
// console.log(" ? link  ", stdout);

const linkRes =
	await execa`vc link --yes --cwd=${config.targetCWD} --project=${config.vercelProjetName} -t ${config.vercelToken}`;
console.log(" ? linkRes  ", linkRes.stdout);

const buildStaticRes =
	await execa`vc build --yes --prod --cwd=${config.targetCWD} -A ./vercel.null.json -t ${config.vercelToken}`;
console.log(" ? buildStaticRes  ", buildStaticRes.stdout);

// const buildRes = await execa``;
const buildCommands = config.buildCommand.map((buildCommand) => {
	return async function () {
		// return execa`${buildCommand}`;
		// console.log(" ??? in map = ", buildCommand);
		// await execa`${buildCommand}`;
		// await execa`pnpm -F @ruan-cat-vercel-monorepo-test/docs-01-star build:docs`;

		// return await execa`pnpm -v && ${buildCommand}`;
		return await execa`${buildCommand}`;
	};
});

for await (const buildCommand of buildCommands) {
	const buildCommandStdout = await buildCommand();
	console.log(" in buildCommandStdout ", buildCommandStdout.stdout);
}

// vc build --yes --prod --cwd=${{env.docs01Star}} -A ./vercel.null.json -t ${{env.vct}}
