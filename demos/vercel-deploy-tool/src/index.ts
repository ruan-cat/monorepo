// 学习一下如何使用 https://github.com/sindresorhus/execa/blob/main/readme.md
import fs from "fs";
import { execa } from "execa";
import { config as dotenvConfig } from "@dotenvx/dotenvx";
import { merge, concat } from "lodash-es";

export {};

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
	// 具体识别的路径，会自动识别根目录下面的env文件，故这里不作处理
	//  path: "../../../.env"
}).parsed;

console.log(" 查看来自 @dotenvx/dotenvx 获取的环境变量： ", currentDotenvConfig);

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
	// targetCWD: "./packages/docs-01-star",
	targetCWD: "packages/docs-01-star",
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
// await execa`pnpm -v && pnpm -F @ruan-cat-vercel-monorepo-test/docs-01-star build:docs`;
// const command = "pnpm -v";
// const testRes = await execa`${config.buildCommand[0]}`;
// console.log(" ? testRes  ", testRes.stdout);

const vercelNullConfig = {
	framework: null,
	buildCommand: null,
	installCommand: null,
	outputDirectory: null,
	devCommand: null,
	public: false,
	git: {
		deploymentEnabled: {
			main: false,
		},
	},
};

const vercelNullConfigPath = "./vercel.null.def.json";

function initVercelNullConfig() {
	fs.writeFileSync(vercelNullConfigPath, JSON.stringify(vercelNullConfig, null, 2));
}
initVercelNullConfig();

merge(config, {
	vercelOrgId: process.env.VERCEL_ORG_ID,
	vercelProjectId: process.env.VERCEL_PROJECT_ID,
	vercelToken: process.env.VERCEL_TOKEN,
} satisfies Partial<Config>);

function link() {
	return execa`vc link --yes --cwd=${config.targetCWD} --project=${config.vercelProjetName} -t ${config.vercelToken}`;
}

const linkRes =
	await execa`vc link --yes --cwd=${config.targetCWD} --project=${config.vercelProjetName} -t ${config.vercelToken}`;
console.log(" ? linkRes  ", linkRes.stdout);

const baseCommandArgument = ["build", "--yes", "--prod", `--cwd=${config.targetCWD}`, `-t`, config.vercelToken];
const nullConfigCommandArgument = [`-A`, vercelNullConfigPath];
const vercelConfigCommandArgument = [
	"--framework=null",
	"--buildCommand=null",
	"--installCommand=null",
	"--outputDirectory=null",
	"--devCommand=null",
];

const buildStaticRes = await execa("vc build", concat(baseCommandArgument, nullConfigCommandArgument), {
	shell: true,
});

console.log(" ? buildStaticRes  ", buildStaticRes.stdout);

const buildCommands = config.buildCommand.map((buildCommand) => {
	return async function () {
		return await execa`${buildCommand}`;
	};
});

for await (const buildCommand of buildCommands) {
	const buildCommandStdout = await buildCommand();
	console.log(" in buildCommandStdout ", buildCommandStdout.stdout);
}
