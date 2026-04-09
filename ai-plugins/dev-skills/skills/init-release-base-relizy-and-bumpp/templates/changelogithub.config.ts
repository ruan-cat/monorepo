import { defineConfig } from "changelogithub";

import changelogConfig from "./changelog.config.ts";

type ChangelogithubConfig = Parameters<typeof defineConfig>[0];
type ChangelogithubTypes = ChangelogithubConfig["types"];

const changelogithubTypes = (
	changelogConfig.types
		? Object.fromEntries(
				Object.entries(changelogConfig.types).filter(([, value]) => typeof value === "object" && value !== null),
			)
		: undefined
) as ChangelogithubTypes;

/**
 * @see https://github.com/antfu/changelogithub
 */
export default defineConfig({
	...changelogConfig,
	types: changelogithubTypes,

	// 尝试让工作流自己生成文件
	// 不应该考虑让 changelogithub 来生成 CHANGELOG.md 文件 ， 因为生成日志很难看 不美观
	// output: "CHANGELOG.md",
	output: false,

	// 是否将每条提交信息首字母大写
	capitalize: false,
});
