# 阮喵喵自用的 Vercel 部署工具

<!-- automd:badges color="yellow" name="@ruan-cat/vercel-deploy-tool" -->

[![npm version](https://img.shields.io/npm/v/@ruan-cat/vercel-deploy-tool?color=yellow)](https://npmjs.com/package/@ruan-cat/vercel-deploy-tool)
[![npm downloads](https://img.shields.io/npm/dm/@ruan-cat/vercel-deploy-tool?color=yellow)](https://npm.chart.dev/@ruan-cat/vercel-deploy-tool)

<!-- /automd -->

一个功能完善的 Vercel 部署工具，支持 **CLI 命令行** 和 **API 编程式** 两种使用方式。

生成满足 [Vercel Output API (v3)](https://vercel.com/docs/build-output-api) 规范的目录结构，并自动部署到 Vercel 平台。

## ✨ 特性

- 🚀 **CLI 工具**：提供 `deploy` 和 `init` 命令，开箱即用
- 📦 **API 导出**：支持编程式调用，灵活集成到自定义工作流
- 🏗️ **Monorepo 支持**：完美支持 monorepo 和单体项目
- ⚡ **并行执行**：使用 [tasuku](https://github.com/privatenumber/tasuku) 实现任务可视化和并行调度
- 🎯 **类型安全**：导出 `defineConfig` 提供完整的 TypeScript 类型提示
- 🔧 **灵活配置**：基于 [c12](https://github.com/unjs/c12) 支持多种配置文件格式
- 🎨 **多命令别名**：支持 `vercel-deploy-tool`、`vdt`、`@ruan-cat/vercel-deploy-tool`

## 📦 安装

<!-- automd:pm-install name="@ruan-cat/vercel-deploy-tool" dev -->

```sh
# ✨ Auto-detect
npx nypm install -D @ruan-cat/vercel-deploy-tool

# npm
npm install -D @ruan-cat/vercel-deploy-tool

# yarn
yarn add -D @ruan-cat/vercel-deploy-tool

# pnpm
pnpm add -D @ruan-cat/vercel-deploy-tool

# bun
bun install -D @ruan-cat/vercel-deploy-tool

# deno
deno install --dev npm:@ruan-cat/vercel-deploy-tool
```

<!-- /automd -->

### 安装 Vercel CLI peer 依赖

`@ruan-cat/vercel-deploy-tool` 不再内置 `vercel` 包。部署命令会调用项目内的 Vercel CLI，请在使用方项目主动安装：

```sh
pnpm add -D vercel@latest
```

Vercel 部署接口要求 CLI 版本至少为 `47.2.2`。推荐使用 `vercel@latest`，避免 CI 因锁文件中的旧版 CLI 被服务端拒绝。

## 🔧 环境要求

- Node.js >= 18
- pnpm >= 9 (推荐)
- Vercel CLI >= 47.2.2（peerDependency，推荐安装 `vercel@latest`）

## 🚀 快速开始

### 方式一：使用 CLI（推荐）

#### 1. 初始化配置

```bash
npx vercel-deploy-tool init
```

这将在项目根目录生成 `vercel-deploy-tool.config.ts` 配置文件，并自动更新 `package.json` 添加部署脚本。

#### 2. 配置 Vercel 凭据

获取 Vercel 项目凭据（使用 `vc link` 命令）：

```bash
npx vercel link
```

将凭据添加到环境变量（推荐）或配置文件：

```bash
# .env
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=team_your_vercel_orgId
VERCEL_PROJECT_ID=prj_your_vercel_projectId
```

#### 3. 编辑配置文件

```typescript
// vercel-deploy-tool.config.ts
import { defineConfig } from "@ruan-cat/vercel-deploy-tool";

export default defineConfig({
	vercelProjectName: "my-awesome-project",
	vercelToken: process.env.VERCEL_TOKEN || "",
	vercelOrgId: process.env.VERCEL_ORG_ID || "",
	vercelProjectId: process.env.VERCEL_PROJECT_ID || "",

	deployTargets: [
		{
			type: "userCommands",
			targetCWD: "./packages/docs",
			url: ["docs.example.com"],
			userCommands: ["pnpm build:docs"],
			outputDirectory: "docs/.vitepress/dist",
			isCopyDist: true, // 默认为 true
		},
	],

	// 可选：在所有构建完成后执行的全局任务
	afterBuildTasks: [
		// "echo 'All builds completed!'",
	],
});
```

#### 4. 运行部署

```bash
pnpm run deploy-vercel
# 或直接使用 CLI
npx vercel-deploy-tool deploy
# 或使用短别名
npx vdt deploy

# 如需指定自定义 dotenv 文件
npx vdt deploy --env-path .env.production
# 等价：设置环境变量再运行
VERCEL_DEPLOY_TOOL_ENV_PATH=.env.production npx vdt deploy
# 多文件场景（依赖 dotenvx）
dotenvx run -f .env.test -f .env.test-2 -- vdt deploy
```

### 方式二：使用 API

适用于需要在代码中编程式调用部署功能的场景。

```typescript
import { defineConfig, executeDeploymentWorkflow } from "@ruan-cat/vercel-deploy-tool";

const config = defineConfig({
	vercelProjectName: "my-project",
	vercelToken: process.env.VERCEL_TOKEN || "",
	vercelOrgId: process.env.VERCEL_ORG_ID || "",
	vercelProjectId: process.env.VERCEL_PROJECT_ID || "",
	deployTargets: [
		{
			type: "userCommands",
			targetCWD: "./apps/web",
			url: ["app.example.com"],
			userCommands: ["pnpm build"],
			outputDirectory: "dist",
		},
	],
});

// 执行部署工作流
await executeDeploymentWorkflow(config);
```

## 📝 配置说明

### 主配置项

```typescript
interface VercelDeployConfig {
	/** Vercel 项目名称 */
	vercelProjectName: string;

	/** Vercel Token（推荐使用环境变量） */
	vercelToken: string;

	/** Vercel 组织 ID */
	vercelOrgId: string;

	/** Vercel 项目 ID */
	vercelProjectId: string;

	/** 可选：自定义 Vercel 配置文件路径 */
	vercelJsonPath?: string;

	/** 可选：在所有构建完成后执行的全局任务 */
	afterBuildTasks?: string[];

	/** 部署目标列表 */
	deployTargets: DeployTarget[];
}
```

### 部署目标配置

#### 基础配置

```typescript
interface DeployTargetBase {
	/** 目标类型 */
	type: "static" | "userCommands";

	/** 目标工作目录（相对于项目根目录） */
	targetCWD: `./${string}`;

	/** 部署后的自定义域名列表 */
	url: string[];

	/** 是否需要执行 vercel build（默认 true） */
	isNeedVercelBuild?: boolean;
}
```

#### 用户命令配置

当 `type: "userCommands"` 时，额外支持：

```typescript
interface DeployTargetWithUserCommands extends DeployTargetBase {
	type: "userCommands";

	/** 构建命令列表（按顺序执行） */
	userCommands: string[];

	/** 构建产物目录 */
	outputDirectory: string;

	/** 是否复制构建产物到部署目录（默认 true） */
	isCopyDist?: boolean;
}
```

### 配置示例

#### Monorepo 多项目部署

```typescript
import { defineConfig } from "@ruan-cat/vercel-deploy-tool";

export default defineConfig({
	vercelProjectName: "my-monorepo",
	vercelToken: process.env.VERCEL_TOKEN || "",
	vercelOrgId: process.env.VERCEL_ORG_ID || "",
	vercelProjectId: process.env.VERCEL_PROJECT_ID || "",

	deployTargets: [
		// VitePress 文档站点
		{
			type: "userCommands",
			targetCWD: "./packages/docs",
			url: ["docs.example.com"],
			userCommands: ["pnpm build:docs"],
			outputDirectory: "docs/.vitepress/dist",
		},

		// VuePress 文档站点
		{
			type: "userCommands",
			targetCWD: "./apps/blog",
			url: ["blog.example.com"],
			userCommands: ["pnpm build"],
			outputDirectory: ".vuepress/dist",
		},

		// 静态站点（无需自定义构建命令）
		{
			type: "static",
			targetCWD: "./apps/landing",
			url: ["www.example.com"],
			isNeedVercelBuild: true,
		},
	],

	// 全局后置任务（在所有构建完成后执行）
	afterBuildTasks: ["echo 'Deployment completed!'", "curl -X POST https://api.example.com/notify"],
});
```

## 🔄 部署工作流

工具会按以下顺序执行任务：

1. **Link 阶段**（并行）：将所有目标与 Vercel 项目关联
2. **Build 阶段**（并行）：执行所有需要构建的目标
3. **AfterBuild 阶段**（串行）：执行全局后置任务
4. **UserCommands + CopyDist 阶段**（并行目标，串行步骤）：
   - 执行用户自定义构建命令
   - 复制构建产物到部署目录
5. **Deploy + Alias 阶段**（并行目标，串行步骤）：
   - 部署到 Vercel
   - 设置自定义域名别名

### 环境变量优先级

- `--env-path` / `VERCEL_DEPLOY_TOOL_ENV_PATH` 指定的 dotenv（如 `.env.production`）
- 现有 `process.env`
- c12 自动加载的 `.env*`
- 配置默认值

## 📋 .gitignore 配置

添加以下内容到 `.gitignore`：

```bash
# Vercel 本地文件
.vercel
vercel.null.def.json

# 环境变量文件（如果使用 .env）
.env
.env.local
.env.*.local
```

## 🎯 CLI 命令

### `deploy`

执行部署工作流：

```bash
vercel-deploy-tool deploy
# 或
vdt deploy
# 或
@ruan-cat/vercel-deploy-tool deploy
```

### `init`

初始化配置文件：

```bash
vercel-deploy-tool init [options]

Options:
  -f, --force  强制覆盖已存在的配置文件
```

## 📚 API 导出

### 配置系统

```typescript
import { defineConfig, loadConfig, getConfig } from "@ruan-cat/vercel-deploy-tool";

// 定义配置（提供类型提示）
export const config = defineConfig({
	/* ... */
});

// 加载配置（异步工厂函数）
const config = await loadConfig();

// 获取配置（同步获取）
const config = getConfig();
```

### 类型定义

```typescript
import type {
	VercelDeployConfig,
	DeployTarget,
	DeployTargetBase,
	DeployTargetWithUserCommands,
	DeployTargetType,
} from "@ruan-cat/vercel-deploy-tool";
```

### 核心功能

```typescript
import { executeDeploymentWorkflow } from "@ruan-cat/vercel-deploy-tool";

// 执行完整的部署工作流
await executeDeploymentWorkflow(config);
```

### 命令工厂（高级用法）

```typescript
import { createDeployCommand, createInitCommand } from "@ruan-cat/vercel-deploy-tool";
import { Command } from "commander";

const program = new Command();
program.addCommand(createDeployCommand());
program.addCommand(createInitCommand());
program.parse();
```

## 🔧 环境变量

工具会自动读取以下环境变量（优先级高于配置文件）：

| 环境变量            | 说明             | 示例                        |
| ------------------- | ---------------- | --------------------------- |
| `VERCEL_TOKEN`      | Vercel API Token | `your_vercel_token`         |
| `VERCEL_ORG_ID`     | Vercel 组织 ID   | `team_your_vercel_orgId`    |
| `VERCEL_PROJECT_ID` | Vercel 项目 ID   | `prj_your_vercel_projectId` |

推荐使用 `.env` 文件管理环境变量（确保已添加到 `.gitignore`）。

## 📖 从 v0.x 迁移到 v1.0

v1.0 是一个**破坏性更新**，请参考 [迁移指南](./src/docs/migration-guide.md) 了解详细的迁移步骤。

### 主要变更

- ❌ 移除：直接运行 TypeScript 脚本的方式
- ✅ 新增：CLI 命令（`vercel-deploy-tool deploy`）
- ✅ 新增：`defineConfig` 类型安全配置
- ✅ 新增：`init` 命令生成配置模板
- 🔄 变更：配置字段重命名（`vercelProjetName` → `vercelProjectName`）
- 🔄 变更：API 导入路径

### 快速迁移

**旧版本 (v0.x)**：

```typescript
// bin/vercel-deploy-tool.ts
import "@ruan-cat/vercel-deploy-tool/src/index.ts";
```

```json
// package.json
{
	"scripts": {
		"deploy-vercel": "tsx ./bin/vercel-deploy-tool.ts"
	}
}
```

**新版本 (v1.0)**：

```bash
# 初始化配置
npx vercel-deploy-tool init
```

```json
// package.json
{
	"scripts": {
		"deploy-vercel": "vercel-deploy-tool deploy"
	}
}
```

## 🛠️ 设计初衷

- ✅ 优化冗长的 GitHub Actions 写法
- ✅ 同时支持 monorepo 和单体项目的部署
- ✅ 自动实现文件移动，避免用户手写文件操作命令
- ✅ 实现复杂部署任务的并行执行，提高运行性能
- ✅ 配置实现类型提示，对用户友好
- ✅ 实现单一 Vercel 项目的多目标部署，绕开 Vercel 针对 monorepo 的部署限制
- ✅ 提供 CLI 和 API 双模式，适应不同使用场景

## 📜 许可证

ISC

## 🔗 相关链接

- [Vercel CLI 文档](https://vercel.com/docs/cli)
- [Vercel Output API](https://vercel.com/docs/build-output-api)
- [tasuku - 任务执行器](https://github.com/privatenumber/tasuku)
- [c12 - 配置加载器](https://github.com/unjs/c12)
