# `init-shadcn-docs-nuxt` 事故驱动加固实施计划

> **供 agentic workers 使用：**必须逐任务执行；可使用 `subagent-driven-development`（推荐）或 `executing-plans`。每一步用复选框追踪，但不得在缺少命令输出时勾选。

**目标：**将 `init-shadcn-docs-nuxt` 升级为能安全处理 Nuxt Content 兼容、生产构建图、Nitro standalone runtime、Element Plus npm alias、Turbo 缓存和 Windows 边界的对外分发技能，并发布 `dev-skills@10.6.0`。

**架构：**`SKILL.md` 只保留路由、硬门和输出合同；故障因果与处方写入 skill 内部 current references；模板只保留默认安全配置。Vitest 静态契约锁定分发边界，发布由 `release-ai-plugins` 统一更新版本和 registry，独立案例文件记录已验证经验。

**技术栈：**Markdown、TypeScript、Vitest、pnpm、Turbo、PowerShell、Node.js registry generator、Codex plugin CLI。

## 全局约束

- 所有用户可读 spec/plan/skill 文本使用简体中文；路径、命令、API 名可保留英文。
- 仅修改计划列出的文件；保留已有 `docs/prompts/index.md` 与 `docs/prompts/release-ai-plugins/02.md` 用户改动。
- 对外 skill 不得包含绝对路径、`docs/reports`、内部 tests/CI 路径或 SmallAliceWeb/EAMS 项目特例；运行时规则必须随 skill 目录分发。
- 不新增 wrapper、scanner、迁移器、Turbo 模板或自动修复脚本。
- `@popperjs/core` alias 仅作为 `element-plus` standalone 精确缺包的条件化案例，不进入通用 `templates/package.json`。
- workspace source alias 仅允许开发期显式 opt-in；production 默认走 package boundary。
- `noExternal`、`inline`、Turbo `--concurrency=1`、Node heap、Windows trace 都必须是有证据的条件化例外。
- 不自行 git commit、push 或部署；本轮发布仅更新仓库内版本/市场元数据并做本地安装 smoke。

---

## 文件结构

| 文件                                                                                                         | 职责                                                                                 |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `tests/init-shadcn-docs-nuxt/skill-behavior.test.ts`                                                         | 分发边界、生产诊断、模板安全与发布版本的静态行为契约。                               |
| `ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/SKILL.md`                                                | 强制路由、验收合同与 current reference 导航。                                        |
| `.../references/production-graph-and-runtime-closure.md`                                                     | 新增 lifecycle、externalization、Element Plus/Popper、Turbo、artifact runtime 专题。 |
| `.../references/README.md`                                                                                   | current reference 的渐进阅读导航和迁移台账。                                         |
| `.../references/{incident-repair,workspace,nuxt-config,windows,mdc-prettier}.md`                             | 修正现行规则、生产边界和安全诊断。                                                   |
| `.../templates/{nuxt.config.full.ts,workspace-aliases.ts,plugins/ui-lib.ts,package.json}`                    | 去除 production source alias 默认值和项目特例。                                      |
| `ai-plugins/dev-skills/CHANGELOG.md`、六份 `plugin.json`、两份 marketplace、`ai-plugins/skill-registry.json` | `release-ai-plugins` 的 `10.6.0` 发布产物。                                          |
| `.agents/skills/fix-bug/record-bug-fix-memory/2026-08-23-init-shadcn-docs-nuxt-production-boundaries.md`     | 经验证的根因、修复和后续约束。                                                       |
| `.agents/skills/fix-bug/record-bug-fix-memory/SKILL.md`                                                      | 仅追加新案例的索引行。                                                               |

## Task 1：建立分发边界的失败测试

**文件：**

- 新建：`tests/init-shadcn-docs-nuxt/skill-behavior.test.ts`
- 读取：`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/**`

**接口：**

- 输入：技能根目录、`SKILL.md`、递归模板/参考文件内容。
- 输出：`distributedSources()`、`listRelativeFiles()` 与 `describe("init-shadcn-docs-nuxt 分发与生产边界", ...)` 静态契约。

- [ ] **步骤 1：写入最小测试基础设施与分发目录契约。**

```ts
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, test } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const skillRoot = resolve(root, "ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt");
const referencesRoot = resolve(skillRoot, "references");
const templateRoot = resolve(skillRoot, "templates");
const skill = readFileSync(resolve(skillRoot, "SKILL.md"), "utf8");

function listRelativeFiles(directory: string): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		const path = resolve(directory, entry.name);
		return entry.isDirectory() ? listRelativeFiles(path).map((child) => `${entry.name}/${child}`) : [entry.name];
	});
}

const distributedSources = () => [
	skill,
	...listRelativeFiles(referencesRoot).map((file) => readFileSync(resolve(referencesRoot, file), "utf8")),
	...listRelativeFiles(templateRoot).map((file) => readFileSync(resolve(templateRoot, file), "utf8")),
];
```

- [ ] **步骤 2：补充分发卫生的失败断言。**

```ts
test("不分发 Nuxt 生成物、内部路径或项目特例", () => {
	expect(existsSync(resolve(templateRoot, ".nuxt"))).toBe(false);
	expect(listRelativeFiles(referencesRoot).sort()).toEqual([
		"README.md",
		"compat.md",
		"incident-repair.md",
		"mdc-prettier.md",
		"nuxt-config.md",
		"production-graph-and-runtime-closure.md",
		"tailwind-css.md",
		"windows.md",
		"workspace.md",
	]);
	for (const source of distributedSources()) {
		expect(source).not.toMatch(
			/(?:[A-Za-z]:[\\/]|\/Users\/|\/home\/|docs\/reports|tests\/init-shadcn-docs-nuxt|@eams-monorepo)/,
		);
	}
});
```

- [ ] **步骤 3：执行测试，确认它因现有 `.nuxt` 生成物、reference 缺失或特例而失败。**

运行：

```powershell
pnpm exec vitest run tests/init-shadcn-docs-nuxt/skill-behavior.test.ts
```

预期：失败信息明确指向 `templates/.nuxt`、缺少新 reference 或分发内容命中项目特例；不能接受 TypeScript/Vitest 加载错误。

- [ ] **步骤 4：记录 RED 证据。**

在执行日志中保留失败的测试名和首个断言差异；不要在此步骤修改生产 skill 文件。

## Task 2：实现生产构建图与 runtime closure 规则

**文件：**

- 新建：`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/references/production-graph-and-runtime-closure.md`
- 新建：`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/references/README.md`
- 修改：`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/SKILL.md`
- 修改：`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/references/incident-repair.md`
- 修改：`tests/init-shadcn-docs-nuxt/skill-behavior.test.ts`

**接口：**

- 消费：任务 1 的 `distributedSources()`。
- 产出：`production-graph-and-runtime-closure.md` 作为 current truth；`SKILL.md` 仅链接和路由。

- [ ] **步骤 1：加入 production/runtime 失败测试，并先运行确认失败。**

```ts
test("将 Element Plus alias、externalization、Turbo 与 artifact 验收限定在正确边界", () => {
	const productionReferencePath = resolve(referencesRoot, "production-graph-and-runtime-closure.md");
	expect(existsSync(productionReferencePath)).toBe(true);
	const productionReference = readFileSync(productionReferencePath, "utf8");
	expect(productionReference).toContain('"@popperjs/core": "npm:@sxzz/popperjs-es@^2.11.7"');
	expect(productionReference).toMatch(/element-plus[\s\S]*ERR_MODULE_NOT_FOUND[\s\S]*部署文档包/);
	expect(productionReference).toMatch(/noExternal[\s\S]*exact error[\s\S]*删除条件/);
	expect(productionReference).toMatch(/turbo run <task> --force[\s\S]*\.output[\s\S]*HTTP smoke/);
	expect(readFileSync(resolve(templateRoot, "package.json"), "utf8")).not.toMatch(/@popperjs\/core|@sxzz\/popperjs-es/);
});
```

运行：`pnpm exec vitest run tests/init-shadcn-docs-nuxt/skill-behavior.test.ts`。

预期：测试断言明确报告缺少 reference；不得以 `ENOENT` 加载错误作为 RED 证据。

- [ ] **步骤 2：编写新的 current reference。**

该文件必须依次覆盖：first failing gate 生命周期表；source alias/宽 externalization 的 graph amplifier；`noExternal` 与 `inline` 的独立准入表；实际部署包 manifest 优先；Element Plus/Popper 四个适用前提、精确 JSON、fresh install 与 artifact 验收；Node heap 作为测量预算；临时 wrapper 的退出条件；Turbo inputs/outputs/cache/并发门；`.output` startup、HTTP、部署的验证矩阵。所有项目名、报告路径和外部 URL 均从正文删除。

- [ ] **步骤 3：更新入口和现行事故参考。**

在 `SKILL.md` 的“历史事故强约束”“故障检修入口”“第 6 步验证”和排查路由中加入 final Nitro OOM、standalone `MODULE_NOT_FOUND`、production graph、Turbo cache 的链接；保留原有 Content/H3 入口。将 `incident-repair.md` 中的 workspace/UI 依赖树宽 `noExternal` 描述改为历史误区，明确 Vite SSR transform、Nitro inline、tracing/manifest 各自不替代。

- [ ] **步骤 4：创建 current reference 导航与迁移台账。**

`references/README.md` 必须列出九个 current reference 的适用信号、入口文件和验证状态；声明不依赖项目级 archive 或外部报告。登记本轮从 `SKILL.md`/旧 references 提炼到新 production reference 的规则来源、目标、原因和验证方式。

- [ ] **步骤 5：重跑测试，确认 production/runtime 契约转绿。**

运行：`pnpm exec vitest run tests/init-shadcn-docs-nuxt/skill-behavior.test.ts`。

预期：任务 2 新增断言通过；任务 1 的 `.nuxt` 与特例断言可仍失败，且失败原因必须与该任务范围一致。

## Task 3：收紧模板默认值并清理分发生成物

**文件：**

- 修改：`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/templates/nuxt.config.full.ts`
- 修改：`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/templates/workspace-aliases.ts`
- 修改：`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/templates/plugins/ui-lib.ts`
- 修改：`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/templates/plugins/workspace-ui.ts`
- 修改：`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/templates/package.json`
- 修改：`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/references/{workspace,nuxt-config,windows,mdc-prettier}.md`
- 删除：`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/templates/.nuxt/**`
- 修改：`tests/init-shadcn-docs-nuxt/skill-behavior.test.ts`

**接口：**

- 消费：任务 2 的 production rules。
- 产出：development-only workspace alias 表达式和无生成物模板树。

- [ ] **步骤 1：加入模板/Windows/MDC 的失败测试。**

```ts
const fullNuxtConfig = readFileSync(resolve(templateRoot, "nuxt.config.full.ts"), "utf8");
const windowsReference = readFileSync(resolve(referencesRoot, "windows.md"), "utf8");
const mdcReference = readFileSync(resolve(referencesRoot, "mdc-prettier.md"), "utf8");

test("workspace 源码仅能开发期 opt-in，Windows 与 MDC 示例不扩大风险", () => {
	expect(fullNuxtConfig).toMatch(
		/process\.env\.NODE_ENV === "development"[\s\S]*SHADCN_DOCS_USE_WORKSPACE_SOURCE === "1"/,
	);
	expect(fullNuxtConfig).not.toContain("alias: getYourLibAliases(),");
	expect(windowsReference).toContain("pnpm exec nuxi build --logLevel=verbose");
	expect(windowsReference).not.toContain("Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force");
	expect(mdcReference).toMatch(/✅ 正确：行首直接写[\s\S]*\n::demo-playground/);
});
```

运行：`pnpm exec vitest run tests/init-shadcn-docs-nuxt/skill-behavior.test.ts`。

预期：当前 full template、Windows 文档或 MDC 正例至少触发一个准确失败。

- [ ] **步骤 2：将 full template 改成开发期显式 alias。**

在 `nuxt.config.full.ts` 使用以下稳定接口；`getYourLibAliases()` 仍来自使用者复制的泛化 helper，但 production 返回空 alias。

```ts
const useWorkspaceSourceAliases =
	process.env.NODE_ENV === "development" && process.env.SHADCN_DOCS_USE_WORKSPACE_SOURCE === "1";

const workspaceAliases = useWorkspaceSourceAliases ? getYourLibAliases() : {};

export default defineNuxtConfig({
	alias: workspaceAliases,
});
```

同时保留 `debug` 的窄兼容例外，并在注释中明确它不得扩展为依赖族 `noExternal`/`inline` 清单。

- [ ] **步骤 3：清理模板和当前参考。**

从 `workspace-aliases.ts`、`plugins/ui-lib.ts`、`plugins/workspace-ui.ts` 删除项目专名示例，使用 `@your-scope/ui-lib` 一类泛化值。`workspace.md` 写明生产 package boundary 和 manifest 优先；`nuxt-config.md` 限制窄 `debug` 例外；`windows.md` 只展示进程 PID/命令行审计，删除全量 kill，改用 `pnpm exec nuxi`；`mdc-prettier.md` 将“正确”例改为行首 `::demo-playground`；`package.json` 仅保留 runtime alias 检查说明。

- [ ] **步骤 4：删除生成物并验证物理目录消失。**

删除 `templates/.nuxt` 下全部 25 个生成文件和空目录。随后运行：

```powershell
if (Test-Path 'ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/templates/.nuxt') {
	throw '模板树仍包含不应分发的 .nuxt 生成物'
}
```

预期：命令零输出、零异常；不得只依据 Git diff，因为这些文件可能被 `.gitignore` 忽略。

- [ ] **步骤 5：运行完整静态契约并检查格式。**

```powershell
pnpm exec vitest run tests/init-shadcn-docs-nuxt/skill-behavior.test.ts
pnpm exec prettier --check ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt tests/init-shadcn-docs-nuxt
```

预期：所有测试通过；格式检查通过。若 Prettier 会改 MDC 参考，停止并按本技能自身的 MDC 防护规则做定向处理，禁止全树格式化。

## Task 4：发布 `dev-skills@10.6.0`

**文件：**

- 修改：`ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/SKILL.md`（由发布脚本将版本升级为 `1.1.0`）
- 修改：六份 `ai-plugins/*/.{claude,cursor,codex}-plugin/plugin.json`
- 修改：`.claude-plugin/marketplace.json`、`.cursor-plugin/marketplace.json`
- 修改：`ai-plugins/common-tools/CHANGELOG.md`、`ai-plugins/dev-skills/CHANGELOG.md`
- 修改：`ai-plugins/skill-registry.json`（仅 generator）

**接口：**

- 消费：任务 1–3 已通过的 skill tree。
- 产出：plugin 主版本 `10.6.0`、目标 skill `1.1.0`、canonical registry。

- [ ] **步骤 1：扩展测试以锁定发布后的技能版本。**

```ts
test("发布后技能版本与生产排障入口一致", () => {
	expect(skill).toContain('version: "1.1.0"');
	expect(skill).toContain("production-graph-and-runtime-closure.md");
});
```

运行：`pnpm exec vitest run tests/init-shadcn-docs-nuxt/skill-behavior.test.ts`。

预期：仅该版本断言失败，证明 release 仍未执行。

- [ ] **步骤 2：运行发布 DryRun 并审核写集。**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ai-plugins/common-tools/skills/release-ai-plugins/scripts/release-ai-plugins.ps1 `
	-Version 10.6.0 -ChangeType minor -Skill init-shadcn-docs-nuxt `
	-Summary "加固 Nuxt 文档站的生产构建图、standalone runtime、Element Plus alias 与 Turbo 缓存诊断" -DryRun
```

预期：计划只包含目标 skill `1.0.1 -> 1.1.0`、六份 plugin manifest、两份 marketplace、两个 CHANGELOG 和 registry；无意外 skill 或用户文件。若脚本内置的全局 `git diff --check` 被已有用户文件的 whitespace 问题阻断，停止发布并报告该路径，不得修改或暂存用户文件。

- [ ] **步骤 3：在 DryRun 与实际 diff 一致后执行 Apply。**

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File ai-plugins/common-tools/skills/release-ai-plugins/scripts/release-ai-plugins.ps1 `
	-Version 10.6.0 -ChangeType minor -Skill init-shadcn-docs-nuxt `
	-Summary "加固 Nuxt 文档站的生产构建图、standalone runtime、Element Plus alias 与 Turbo 缓存诊断" -Apply
```

预期：脚本只集中执行一次 registry Apply 和一次 Check；输出显示 `init-shadcn-docs-nuxt 1.0.1 -> 1.1.0`，并通过九份 JSON、CHANGELOG、Codex 字段与 `git diff --check` 校验。

- [ ] **步骤 4：独立复核发布产物。**

```powershell
node ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.mjs --check
pnpm exec vitest run tests/init-shadcn-docs-nuxt/skill-behavior.test.ts
git diff --check -- ai-plugins/dev-skills ai-plugins/skill-registry.json tests/init-shadcn-docs-nuxt
```

预期：三项均通过；registry 中目标条目的 version 为 `1.1.0`、entry 为 POSIX 相对路径。

## Task 5：本地客户端 smoke 与经验沉淀

**文件：**

- 新建：`.agents/skills/fix-bug/record-bug-fix-memory/2026-08-23-init-shadcn-docs-nuxt-production-boundaries.md`
- 修改：`.agents/skills/fix-bug/record-bug-fix-memory/SKILL.md`

**接口：**

- 消费：任务 4 发布后的分发目录和验证证据。
- 产出：本地安装 smoke 结果及可复用的事故记录。

- [ ] **步骤 1：运行 Codex marketplace 安装/卸载 smoke。**

在临时市场名称可识别且不会覆盖未知市场时执行：

```powershell
codex plugin marketplace add . --json
codex plugin list --available --json --marketplace ruan-cat-tools
codex plugin add dev-skills@ruan-cat-tools --json
codex plugin remove dev-skills@ruan-cat-tools --json
codex plugin marketplace remove ruan-cat-tools --json
```

预期：`init-shadcn-docs-nuxt` 在 available 列表中，安装和卸载均成功，最后清理临时 marketplace。Claude/Cursor 实际 CLI 不可用时，只记录为未验证，不用 JSON 解析代替。

- [ ] **步骤 2：写入独立案例与索引。**

案例文件必须按“现象、根因、关键误导点、有效修复、验证、后续约束”记录：生成 `.nuxt` 泄漏、生产 source alias/宽 bundling、Element Plus logical alias、Turbo cache hit 与 `.output` HTTP 的边界。只记录已验证事实；SmallAliceWeb 的部署只作为证据来源，不写成外发 skill 的运行依赖。随后在记录技能的案例索引追加一条摘要。

- [ ] **步骤 3：最终范围与内容审计。**

```powershell
rg -n 'D:/|[A-Za-z]:[\\/]|/Users/|/home/|docs/reports|tests/|@eams-monorepo' ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt
git diff --check -- ai-plugins/dev-skills ai-plugins/skill-registry.json tests/init-shadcn-docs-nuxt .agents/skills/fix-bug/record-bug-fix-memory
git status --short --untracked-files=all -- ai-plugins/dev-skills ai-plugins/skill-registry.json tests/init-shadcn-docs-nuxt .agents/skills/fix-bug/record-bug-fix-memory docs/superpowers
```

预期：路径扫描零命中；diff 检查通过；状态只包含本计划文件、发布文件、目标测试与案例文件，且不包含用户已有 `docs/prompts/**` 修改。

## 计划自审

- spec 的每一项用户可见结果分别由任务 2、3、4 或 5 覆盖。
- 先 RED 再 GREEN：每次规则改造都有明确的失败断言和预期失败原因。
- 所有文件、版本、命令、测试名和发布输入均已固定；不依赖后续猜测。
- 没有临时占位符、模糊措辞或未定义的接口名。
- 任务 4 的发布写入与任务 5 的客户端状态变更均有清理步骤；不包含 commit、push 或部署。
