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

/** 部署目标的具体项目配置 */
export interface DeployTarget {
	/** 目标的工作目录 */
	targetCWD: string;
	/** 生产环境的访问url */
	url: string[];
	/** 实际部署的构建命令 */
	buildCommand: string[];
}

/** 项目配置 */
export interface Config {
	/** 项目名称 */
	vercelProjetName: string;

	/** 用户token */
	vercelToken: string;
	/** 用户组织id */
	vercelOrgId: string;
	/** 用户项目id */
	vercelProjectId: string;

	/**
	 * 部署目标
	 * @description
	 * 考虑到可能要部署一揽子的项目，所以这里使用数组
	 *
	 * 考虑monorepo的情况
	 */
	deployTarget: DeployTarget[];
}

// 拓展返回值
declare module "@dotenvx/dotenvx" {
	interface DotenvParseOutput {
		[name: string]: string;
		/**
		 * token
		 * @description
		 * 默认名称为 `VERCEL_TOKEN`
		 */
		VERCEL_TOKEN: string;
		/**
		 * 组织id
		 * @description
		 * 默认名称为 `VERCEL_ORG_ID`
		 */
		VERCEL_ORG_ID: string;
		/**
		 * 项目id
		 * @description
		 * 默认名称为 `VERCEL_PROJECT_ID`
		 */
		VERCEL_PROJECT_ID: string;
	}
}

/** 当前的环境变量 */
const currentDotenvConfig = dotenvConfig({
	// 具体识别的路径，会自动识别根目录下面的env文件，故这里不作处理
	//  path: "../../../.env"
}).parsed;

console.log(" 查看来自 @dotenvx/dotenvx 获取的环境变量： ", currentDotenvConfig);

/** 项目内的vercel配置 */
const config: Config = {
	vercelProjetName: "vercel-monorepo-test-1-zn20",
	vercelToken: "",
	vercelOrgId: "",
	vercelProjectId: "",

	deployTarget: [
		{
			targetCWD: "./packages/docs-01-star",
			url: ["docs-01-star.ruancat6312.top"],
			buildCommand: [
				// FIXME: 在具体的execa中，无法使用pnpm的筛选命令。只能指定其工作目录。
				// "pnpm -F @ruan-cat-vercel-monorepo-test/docs-01-star build:docs",
				// "pnpm -F @ruan-cat-vercel-monorepo-test/docs-01-star copy-dist",
				"pnpm -C=./packages/docs-01-star build:docs",
				"pnpm -C=./packages/docs-01-star copy-dist",
			],
		},
	],
};
// ('rimraf .vercel/output/static && mkdirp .vercel/output/static && cpx "docs/.vitepress/dist/**/*" .vercel/output/static && shx ls -R .vercel/output/static');

/**
 * vercel 的空配置
 * @description
 * 设计理由
 *
 * 用于驱动vercel构建简单的目录结构，不需要额外的配置
 *
 * 该配置会被写入到 `vercel.null.def.json` 文件中
 */
const vercelNullConfig = <const>{
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

/**
 * 空配置文件的路径
 * @description
 * 生成空配置文件。这样用户在其他项目内，就不需要自己提供vercel配置文件了。
 */
const vercelNullConfigPath = "./vercel.null.def.json";

/** 初始化vercel的空配置文件 */
function generateVercelNullConfig() {
	fs.writeFileSync(vercelNullConfigPath, JSON.stringify(vercelNullConfig, null, 2));
}

/**
 * 初始化配置
 * @description
 * 初始化环境变量
 */
function initVercelConfig() {
	const {} = currentDotenvConfig;

	const res: Config = merge(config, {
		// vercelOrgId: process.env.VERCEL_ORG_ID,
		// vercelProjectId: process.env.VERCEL_PROJECT_ID,
		// vercelToken: process.env.VERCEL_TOKEN,
		vercelOrgId: process.env.VERCEL_ORG_ID,
		vercelProjectId: process.env.VERCEL_PROJECT_ID,
		vercelToken: process.env.VERCEL_TOKEN,
	} satisfies Partial<Config>);

	return res;
}

generateVercelNullConfig();
initVercelConfig();

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

// TODO: 实现 deploy 命令；
