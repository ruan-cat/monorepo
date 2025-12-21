import { commitTypes } from "./commit-types.ts";
import { isConditionsSome } from "@ruan-cat/utils/node-cjs";
import type { ChangelogConfig } from "changelogen";

export type ChangelogogenUseTypes = ChangelogConfig["types"];

/** 用于 changelogen 的提交类型 */
export const changelogogenUseTypes: ChangelogogenUseTypes = Object.fromEntries(
	commitTypes
		.map((commitType) => {
			const { type, description, emoji, semver } = commitType;
			return [type, { title: `${emoji} ${description}`, semver }];
		})
		.filter(([type]) =>
			isConditionsSome([
				() => type === "feat",
				() => type === "fix",
				() => type === "refactor",
				() => type === "build",
				() => type === "config",
			]),
		),
);
