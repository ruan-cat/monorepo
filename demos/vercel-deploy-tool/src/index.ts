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
}

const config = {
	vercelProjetName: "vercel-monorepo-test-1-zn20",
	vercelToken: "QF9Q3Hv5U8q2fKz1Jc4W8B1Y",
	vercelOrgId: "QF9Q3Hv5U8q2fKz1Jc4W8B1Y",
	vercelProjectId: "QF9Q3Hv5U8q2fKz1Jc4W8B1Y",
	targetCWD: "./packages/docs-01-star",
	url: "docs-01-star.ruancat6312.top",
};

merge(config, {
	vercelOrgId: process.env.VERCEL_ORG_ID,
	vercelProjectId: process.env.VERCEL_PROJECT_ID,
	vercelToken: process.env.VERCEL_TOKEN,
	// vercelProjetName: process.env.VERCEL_PROJECT_NAME,
	// targetCWD: process.env.TARGET_CWD,
	// url: process.env.URL,
} satisfies Partial<Config>);

function link() {
	return execa`vc link --yes --cwd=${config.targetCWD} --project=${config.vercelProjetName} -t ${config.vercelToken}`;
}
// const { stdout } = link();
// console.log(" ? link  ", stdout);

const linkRes =
	await execa`vc link --yes --cwd=${config.targetCWD} --project=${config.vercelProjetName} -t ${config.vercelToken}`;
console.log(" ? linkRes  ", linkRes.stdout);

const deployRes =
	await execa`vc deploy --yes --prod --cwd=${config.targetCWD} -A ./vercel.null.json -t ${config.vercelToken}`;
console.log(" ? deployRes  ", deployRes.stdout);

// vc build --yes --prod --cwd=${{env.docs01Star}} -A ./vercel.null.json -t ${{env.vct}}
