import { describe, expect, test } from "vitest";

import { projects } from "../types.ts";
import {
	getProjectRoutePaths,
	getProjectSidebarItems,
	getSortedProjects,
} from "../../docs/.vitepress/project-navigation.ts";

describe("project-navigation", () => {
	test("应让带 order 的项目按升序排列，未配置 order 的项目排在后面", () => {
		const sortedNames = getSortedProjects().map((project) => project.name);

		expect(sortedNames.slice(0, 9)).toEqual([
			"utils",
			"ruan-cat-notes",
			"gh",
			"vue-element-cui",
			"gzpc",
			"domain",
			"vitepress-preset",
			"claude-notifier",
			"vercel-deploy-tool",
		]);
	});

	test("应保持未配置 order 的项目相对顺序不变", () => {
		const unorderedProjects = projects.filter((project) => project.order === undefined);
		const unorderedNames = unorderedProjects.map((project) => project.name);
		const sortedUnorderedNames = getSortedProjects()
			.filter((project) => project.order === undefined)
			.map((project) => project.name);

		expect(sortedUnorderedNames).toEqual(unorderedNames);
	});

	test("应基于同一排序结果生成侧边栏项", () => {
		expect(getProjectSidebarItems().slice(0, 3)).toEqual([
			{ text: "utils", link: "/domain/utils" },
			{ text: "ruan-cat-notes", link: "/domain/ruan-cat-notes" },
			{ text: "gh", link: "/domain/gh" },
		]);
	});

	test("应基于同一排序结果生成动态路由参数", () => {
		expect(getProjectRoutePaths().slice(0, 3)).toEqual([
			{ params: { project: "utils" } },
			{ params: { project: "ruan-cat-notes" } },
			{ params: { project: "gh" } },
		]);
	});
});
