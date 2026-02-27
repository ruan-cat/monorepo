# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 主动问询实施细节

在我与你沟通并要求你具体实施更改时，难免会遇到很多模糊不清的事情。

请你**深度思考**这些`遗漏点`，`缺漏点`，和`冲突相悖点`，**并主动的向我问询这些你不清楚的实施细节**。请主动使用 claude code 内置的 `AskUserQuestion` 工具，将你不清楚的内容设计成一些列问题，并询问我，向我索要细节，或着与我协作沟通。

我会与你共同补充细化实现细节。我们会先迭代出一轮完整完善的实施清单，然后再由你亲自落实实施下去。

## 术语说明

在我和你沟通时，我会使用以下术语，便于你理解。

### 全局术语

在任何沟通下，这些术语都生效。

- `生成更新日志` ： 指的是在 `.changeset` 目录内，编写面向 changeset 的更新日志文件。其`发版标签`分为 `major` `minor` `patch` 这三个档次。如果我在要求你生成更新日志时，没有说明清楚`发版标签`具体发版到那个等级，请及时询问我。要求我给你说明清楚。
- `生成发版日志` ： `生成更新日志` 的别名，是同一个意思。

## 沟通协作要求

### `计划模式`

在`计划模式`下，请你按照以下方式与我协作：

1. 你不需要考虑任何向后兼容的设计，允许你做出破坏性的写法。请先设计一个合适的方案，和我沟通后再修改实施。
2. 如果有疑惑，请询问我。
3. 完成任务后，请告知我你做了那些破坏性变更。

请注意，在绝大多数情况下，我不会要求你以这种 `计划模式` 来和我协作。

## 编写测试用例规范

1. 请你使用 vitest 的 `import { test, describe } from "vitest";` 来编写。我希望测试用例格式为 describe 和 test。
2. 测试用例的文件格式为 `*.test.ts` 。
3. 测试用例的目录一般情况下为 `**/tests/` ，`**/src/tests/` 格式。
4. 在 对应 monorepo 的 tests 目录内，编写测试用例。如果你无法独立识别清楚到底在那个具体的 monorepo 子包内编写测试用例，请直接咨询我应该在那个目录下编写测试用例。

## 报告编写规范

在大多数情况下，你的更改是**不需要**编写任何说明报告的。但是每当你需要编写报告时，请你首先遵循以下要求：

- 报告地址： 默认在 `docs\reports` 文件夹内编写报告。
- 报告文件格式： `*.md` 通常是 markdown 文件格式。
- 报告文件名称命名要求：
  1. 前缀以日期命名。包括年月日。日期格式 `YYYY-MM-DD` 。
  2. 用小写英文加短横杠的方式命名。
- 报告的一级标题： 必须是日期`YYYY-MM-DD`+报告名的格式。
  - 好的例子： `2025-12-09 修复 @ruan-cat/commitlint-config 包的 negation pattern 处理错误` 。前缀包含有 `YYYY-MM-DD` 日期。
  - 糟糕的例子： `构建与 fdir/Vite 事件复盘报告` 。前缀缺少 `YYYY-MM-DD` 日期。
- 报告日志信息的代码块语言： 一律用 `log` 作为日志信息的代码块语言。如下例子：

  ````markdown
  日志如下：

  ```log
  日志信息……
  ```
  ````

- 报告语言： 默认用简体中文。

## 生成发版日志的操作规范

在你生成发版日志时，按照以下规范来完成：

1. 新建文件： 运行命令 `pnpm dlx @changesets/cli add --empty` ，该命令会在 `.changeset` 目录下，新建一个空的 markdown 文件，这个文件就是你要写入的发版日志。
2. 发版日志文件重命名： 这个命令会新建一个随机名称的发版日志文件，请你按照报告的规格，换成日期加语义化更新内容的名称。比如 `2025-12-15-add-pnpm-workspace-yaml.md` 就是有意义的命名。
3. yaml 区域写入 changeset 规格的发版信息： 写入发版包名，和`发版标签`的等级。
4. 写入更新日志： 在正文内编写更新日志。
5. 编写更新日志正文的行文规范：
   - 禁止使用任何等级的 markdown 标题： 编写任何`发版标签`的更新日志时，不允许使用任何等级的 markdown 标题，比如一级标题、二级标题等。这会影响自动合并的 `CHANGELOG.md` 文档的美观度。必须使用 markdown 的序号语法。
   - major： 详细，清晰。说明清楚 major 版本的重大变更。
   - minor： 用有序序号，简明扼要的说明清楚更新日志即可。
   - patch： 用有序序号，简明扼要的说明清楚更新日志即可。

## Monorepo 结构

这是一个基于 **pnpm workspace** 的 monorepo 项目，包含以下工作区：

- `packages/*` - 核心发布包（utils、release-toolkit、vercel-deploy-tool、vitepress-preset-config、vuepress-preset-config、domains、generate-code-workspace）
- `configs-package/*` - 共享配置包（commitlint-config、taze-config）
- `vite-plugins/*` - Vite 相关插件
- `demos/*` - 示例应用
- `tests/*`、`fork/*`、`learn-create-compoents-lib/*`、`docs/*` - 其他辅助工作区

**关键的 monorepo 事实**：`.claude/agents` 仅存在于 monorepo 根目录。当从嵌套子项目运行脚本时，`process.cwd()` 可能指向子项目根目录，而非 monorepo 根目录。使用 `findMonorepoRoot()` 模式（参见 `packages/utils/src/node-esm/scripts/copy-claude-agents.ts`）通过向上查找 `pnpm-workspace.yaml` 来定位 monorepo 根目录。

## 常用命令

### 包管理

```bash
pnpm install                    # 安装依赖
pnpm up-taze                    # 交互式更新依赖
pnpm clear:deps                 # 清理所有 node_modules
pnpm clear:cache                # 清理构建缓存 (dist, .turbo, .vercel 等)
```

### 构建

```bash
pnpm build                      # 构建所有包（使用 Turbo）
pnpm build:docs                 # 构建所有文档站点
pnpm ci                         # 运行完整 CI 构建（包 + 文档）
```

### 测试

```bash
pnpm test                       # 运行 Vitest，启用 UI 界面，端口 4000
```

### 代码质量

```bash
pnpm format                     # 使用 Prettier 格式化所有代码
```

### Git 工作流

```bash
pnpm commit                     # 使用 commitizen 提交（基于 cz-git）
pnpm git:push                   # 推送并携带标签
pnpm git:fetch                  # 获取远程更新并清理
```

### 发版流程（Changesets）

```bash
pnpm changeset:add              # 添加变更集用于版本升级
pnpm changeset:version          # 升级版本并更新变更日志
pnpm release                    # 构建并发布到 npm
```

发版工作流使用：

- **Changesets** 进行版本管理
- **@svitejs/changesets-changelog-github-compact** 生成变更日志
- **主分支**：`main`
- **自定义插件**：`@ruan-cat/release-toolkit` 提供基于 changelogen 的增强功能
- **GitHub Release 同步**：通过 `scripts/sync-github-release.ts` 自动同步

### Vercel 部署

```bash
pnpm deploy-vercel              # 部署文档站点到 Vercel
```

## 构建系统架构

### Turbo 流水线

Monorepo 使用 **Turbo** 进行基于依赖关系的任务编排：

- `build` 任务：输出到 `**/dist/**` 和 `**/.output/**`，依赖 `^build`（上游包）
- `build:docs` 任务：输出到 `**/.vitepress/dist/**` 和 `**/.vuepress/dist/**`，依赖 `^build`
- 发布任务依赖于成功的构建

**Turbo 远程缓存配置**：

- Team: `ruancat-projects`
- 需要配置 `TURBO_TOKEN` 环境变量（CI 中自动设置）

### TypeScript 项目引用

代码库使用 **TypeScript Project References**：

- `tsconfig.base.json` 中设置 `composite: true` 和 `incremental: true`
- `declaration: true` 和 `declarationMap: true` 用于类型生成
- `emitDeclarationOnly: true` - 大多数包使用外部打包器（tsup/vite）生成 JS 文件

### 包构建模式

大多数包使用 **tsup** 进行构建：

- 源码：`src/` 目录，包含 `.ts/.mts` 文件
- 输出：`dist/` 目录，包含 `.js/.cjs/.mjs` 文件
- 入口点在 `exports` 字段中定义，支持 ESM/CJS 双格式

**tsup 配置示例**（参见 `packages/utils/tsup.config.ts`）：

- ESM 格式：用于常规浏览器/现代 Node.js 环境
- CJS 格式（`dist/node-cjs`）：专用于 Node.js CommonJS 场景
- ESM 格式（`dist/node-esm`）：专用于 Node.js ESM 场景，启用 `shims`

## 核心包架构

### @ruan-cat/utils

通用工具包，包含 Node.js 脚本：

- `node-esm/scripts/copy-claude-agents.ts` - 从 monorepo 根目录复制 `.claude/agents`（演示 monorepo 根目录检测）
- 导出工具：条件判断、Promise 工具、打印工具、VueUse 辅助函数等
- **多环境构建**：同时支持浏览器、Node.js CJS、Node.js ESM

### @ruan-cat/release-toolkit

基于 changelogen 增强 Changesets 工作流：

- 插件：`changelog-with-changelogen` - 语义化提交解析和 GitHub Release 生成
- 与 `@changesets/cli` 作为 peer dependency 集成
- 使用 `@octokit/rest` 进行 GitHub API 集成
- **发布标签**：所有包默认发布到 `beta` 标签

### @ruan-cat/vitepress-preset-config

VitePress 配置预设：

- 主导出：`./config`（构建输出：`dist/config.mjs`，类型：`src/config.mts`）
- 主题导出：`./theme`（源码：`src/theme.ts`）
- 文档站点位于 `src/docs/`
- 使用插件：vitepress-demo-plugin、@nolebase/git-changelog、vitepress-sidebar 等

## 配置文件说明

### TypeScript

- **基础配置**：`tsconfig.base.json` - 共享编译选项
- **路径配置**：`tsconfig.path.json` - 路径别名
- **测试配置**：`tsconfig.test.json` - 测试专用设置
- **Markdown 配置**：`tsconfig.md.json` - 用于 Markdown 中的 TypeScript 代码块

### 代码检查与格式化

- **ESLint**：使用 `@antfu/eslint-config` 配合 Prettier 集成
  - 双引号、分号、2 空格缩进
  - 启用 TypeScript、Vue、CSS、HTML、Markdown 格式化器
  - JSDoc 规则：强制要求描述（`jsdoc/require-description`）
- **Prettier**：使用 `@prettier/plugin-oxc` 插件进行额外格式化
- **lint-staged**：通过 `simple-git-hooks` 在 pre-commit 时格式化所有文件

### Git Hooks

- 通过 `simple-git-hooks.mjs` 配置
- 在 `postinstall` 时自动初始化
- **重要**：修改 `simple-git-hooks.mjs` 后必须运行 `npx simple-git-hooks` 使其生效
- `commit-msg` hook：使用 Commitlint 强制约定式提交（配置：`@ruan-cat/commitlint-config`）
- `pre-commit` hook：运行 `lint-staged` 格式化暂存文件

### 提交规范

- 使用 **commitizen** + **cz-git** 进行交互式提交
- 通过 `@ruan-cat/commitlint-config` 验证提交信息
- 配置项：`isPrintScopes: false`（不打印作用域列表）

## 开发工作流

### 添加新包

1. 在合适的工作区文件夹（`packages/*` 等）创建目录
2. 添加 `package.json`，使用 `workspace:^` 协议声明工作区依赖
3. 在其他包的 `devDependencies` 或 `dependencies` 中引用
4. 运行 `pnpm install` 链接工作区包
5. 在 `package.json` 中添加构建脚本（通常为 `"build": "tsup"`）
6. 创建 `tsup.config.ts` 配置文件（可参考 `packages/utils/tsup.config.ts`）

### 使用工作区依赖

使用 `workspace:^` 协议声明内部依赖：

```json
{
	"dependencies": {
		"@ruan-cat/utils": "workspace:^"
	}
}
```

### 文档站点

- VitePress 站点构建到 `.vitepress/dist/`
- VuePress 站点构建到 `.vuepress/dist/`
- 每个包含文档的包应有 `build:docs` 脚本
- 文档构建依赖于包构建完成（Turbo 依赖链）

### 发布工作流

1. 在相关包中进行修改
2. 运行 `pnpm changeset:add` 创建变更集
3. 提交 `.changeset/` 中的变更集文件
4. 准备发布时，运行 `pnpm changeset:version` 升级版本
5. 运行 `pnpm release` 构建并发布

**发布配置**：

- 所有包发布到 npm，`"access": "public"`
- 默认标签：`"tag": "beta"`
- GitHub Actions 自动化：推送到 `main` 分支时自动发布
- 发布后自动同步 GitHub Release
- 发布后触发部署工作流（`deploy-after-release` 事件）

### CI/CD 流水线

**Release 流水线**（`.github/workflows/release.yml`）：

1. 检出代码（fetch-depth: 0，获取完整历史）
2. 安装 pnpm + Node.js 22.14.0
3. 安装依赖并链接 Turbo 远程缓存
4. 构建项目（`pnpm build`）
5. 使用 Changesets Action 发布包
6. 同步 GitHub Release（`scripts/sync-github-release.ts`）
7. 触发部署工作流

**环境要求**：

- Node.js >= 22.14.0
- pnpm 10.17.0（通过 packageManager 字段指定）
- 仅允许使用 pnpm（通过 `preinstall` 脚本强制）

## 代码规范

- 要使用 `tinyglobby` ，而不是 `glob` 。

## 简单任务的高效执行原则

当用户交代的任务范围明确清晰时，必须**直接行动**，禁止进行不必要的大范围侦察。

### 判断任务规模，选择正确的行动姿态

| 任务信号                         | 正确行动               |
| :------------------------------- | :--------------------- |
| 用户通过 `@文件` 明确了操作范围  | 直接读该文件，立即动手 |
| 用户说"帮我改这个"、"写个日志"   | 行动优先，缺什么补什么 |
| 用户涉及多包架构改动、新功能设计 | 先侦察，再行动         |

**核心原则**：用户提供的上下文（@文件引用、对话内容、当前打开文件）就是最直接的线索，优先使用，不要用命令重新发现已知信息。

### 禁止行为清单

以下行为在**简单任务**（单文件改动、写 changeset、写提交信息等）中是被禁止的：

- 禁止连续执行超过 3 次 `git log` 来"了解全貌"
- 禁止在明确知道目标文件的情况下，仍去扫描整个项目目录
- 禁止把"读遍所有相关文档"当作行动前置条件
- 禁止在用户已给出 @文件 的情况下，用命令重新搜索文件位置

### 对用户纠偏提示立即响应

当用户发出以下信号时，必须**立即停止当前路径**，回归最小行动路径：

- "太复杂了"
- "不要反复查询"
- "直接做就行"
- "按要求做即可"

正确反应：停止当前侦察行为 → 明确当前已知信息 → 直接执行最核心的操作步骤。

### 简单任务的标准执行路径示例

以"为某文件修改编写更新日志"为例，正确路径只有 3 步：

1. 读目标文件，理解改了什么
2. 执行 `pnpm dlx @changesets/cli add --empty`，重命名文件，写入内容
3. 提交

不需要查 git log，不需要扫描全部 tags，不需要对比所有包的版本号。

## 16. 获取技术栈对应的上下文

### 16.2. claude code skill

- 编写语法与格式： https://code.claude.com/docs/zh-CN/skills
- 最佳实践： https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/best-practices
- 规范文档： https://agentskills.io/home
