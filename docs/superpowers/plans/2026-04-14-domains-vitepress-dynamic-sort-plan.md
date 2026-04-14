# Domains VitePress Dynamic Sort Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 `packages/domains` 的 VitePress 动态路由与域名页侧边栏统一按 `projects[].order` 排序，并对未配置 `order` 的项目使用“保持原始顺序且排在末尾”的兜底规则。

**Architecture:** 在 `packages/domains/docs/.vitepress/` 中新增一个仅供文档站使用的共享导航模块，集中产出排序后的项目列表、侧边栏项和动态路由参数。`config.mts` 与 `[project].paths.ts` 都改为消费该共享模块，避免重复逻辑和顺序漂移。

**Tech Stack:** TypeScript, VitePress dynamic routes, Vitest, pnpm

---

### Task 1: 为文档导航排序补测试护栏

**Files:**

- Create: `packages/domains/src/tests/projectNavigation.test.ts`
- Reference: `packages/domains/src/types.ts`

- [ ] **Step 1: 写失败测试，固定排序规则与派生结果**

```ts
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
```

- [ ] **Step 2: 确认现有 Vitest 入口足以承载新测试**

保持 `packages/domains/vitest.config.ts` 为现有的：

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		include: ["src/tests/**/*.test.ts"],
		environment: "node",
	},
});
```

说明：

- 不新增 `docs/**/*.test.ts` 入口
- 新测试直接放入现有 `src/tests/` 目录
- 测试通过跨目录导入共享导航模块来覆盖文档层逻辑

- [ ] **Step 3: 运行新测试，确认当前实现先失败**

Run:

```bash
pnpm --dir packages/domains vitest run src/tests/projectNavigation.test.ts
```

Expected:

- FAIL
- 报错原因应为 `../../docs/.vitepress/project-navigation.ts` 尚不存在，或对应导出尚未实现

- [ ] **Step 4: Commit**

```bash
git add packages/domains/src/tests/projectNavigation.test.ts
git commit -m "🧪 test(domains): 补充文档导航排序测试"
```

### Task 2: 抽取共享导航模块并让两处消费点复用

**Files:**

- Create: `packages/domains/docs/.vitepress/project-navigation.ts`
- Modify: `packages/domains/docs/.vitepress/config.mts`
- Modify: `packages/domains/docs/domain/[project].paths.ts`
- Reference: `packages/domains/src/types.ts`

- [ ] **Step 1: 新增共享导航模块，集中实现稳定排序和派生函数**

```ts
import { projects } from "../../src/types";

type ProjectItem = (typeof projects)[number];

function hasOrder(project: ProjectItem): project is ProjectItem & { order: number } {
	return typeof project.order === "number";
}

export function getSortedProjects(): ProjectItem[] {
	return projects
		.map((project, index) => ({ project, index }))
		.toSorted((left, right) => {
			const leftHasOrder = hasOrder(left.project);
			const rightHasOrder = hasOrder(right.project);

			if (leftHasOrder && rightHasOrder) {
				return left.project.order - right.project.order;
			}

			if (leftHasOrder) {
				return -1;
			}

			if (rightHasOrder) {
				return 1;
			}

			return left.index - right.index;
		})
		.map(({ project }) => project);
}

export function getProjectSidebarItems() {
	return getSortedProjects().map((project) => ({
		text: project.name,
		link: `/domain/${project.name}`,
	}));
}

export function getProjectRoutePaths() {
	return getSortedProjects().map((project) => ({
		params: {
			project: project.name,
		},
	}));
}
```

- [ ] **Step 2: 改造 `config.mts`，移除本地 `projects.map(...)`**

把相关片段改成：

```ts
import { getProjectSidebarItems } from "./project-navigation";
```

```ts
const sidebarDomain = [
	{
		text: "域名集",
		collapsed: true,
		items: getProjectSidebarItems(),
	},
];
```

同时删除这条已不再需要的导入：

```ts
import { projects } from "../../src/types";
```

- [ ] **Step 3: 改造 `[project].paths.ts`，让动态路由直接消费共享函数**

把整个文件改成：

```ts
import { getProjectRoutePaths } from "../.vitepress/project-navigation";

export default {
	paths() {
		return getProjectRoutePaths();
	},
};
```

- [ ] **Step 4: 运行排序测试，确认共享模块和两个派生函数都通过**

Run:

```bash
pnpm --dir packages/domains vitest run src/tests/projectNavigation.test.ts
```

Expected:

- PASS
- `4 passed`

- [ ] **Step 5: Commit**

```bash
git add packages/domains/docs/.vitepress/project-navigation.ts packages/domains/docs/.vitepress/config.mts packages/domains/docs/domain/[project].paths.ts
git commit -m "✨ feat(domains): 统一文档导航排序来源"
```

### Task 3: 做运行时验证并补回归检查

**Files:**

- Verify: `packages/domains/package.json`
- Verify: `packages/domains/docs/.vitepress/config.mts`
- Verify: `packages/domains/docs/domain/[project].paths.ts`
- Verify: `packages/domains/docs/.vitepress/project-navigation.ts`

- [ ] **Step 1: 启动 VitePress 文档开发服务器**

Run:

```bash
pnpm --dir packages/domains docs:dev
```

Expected:

- dev server 启动成功
- 终端输出本地访问地址，通常为 `http://localhost:5173/`

- [ ] **Step 2: 在浏览器中验证侧边栏顺序**

Manual check:

- 打开首页或任一文档页
- 找到“域名集”侧边栏分组
- 观察前 9 个项目顺序应为：

```text
utils
ruan-cat-notes
gh
vue-element-cui
gzpc
domain
vitepress-preset
claude-notifier
vercel-deploy-tool
```

- [ ] **Step 3: 在浏览器中验证动态路由页可正常访问**

Manual check:

- 依次访问：

```text
/domain/utils
/domain/ruan-cat-notes
/domain/gh
```

- 每个页面都应正常渲染 `ProjectDomainDisplay`
- 不应出现 404、空白页或 VitePress 动态路由报错

- [ ] **Step 4: 运行现有包测试，确认没有破坏其他能力**

Run:

```bash
pnpm --dir packages/domains test
```

Expected:

- PASS
- 现有 `getDomains.test.ts` 与新增 `projectNavigation.test.ts` 一并通过

- [ ] **Step 5: 记录最终工作树状态**

Run:

```bash
git status --short
```

Expected:

- 仅剩本轮未提交的预期变更，或工作树干净
