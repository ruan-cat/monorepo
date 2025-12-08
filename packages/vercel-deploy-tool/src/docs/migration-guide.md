# 从 v0.x 迁移到 v1.0

本文档提供了从 `@ruan-cat/vercel-deploy-tool` v0.x 迁移到 v1.0 的完整指南。

## 📋 概览

v1.0 是一个 **major 版本更新**，包含多个破坏性变更。主要目的是将工具从简单的部署脚本升级为功能完善的 CLI 工具和 API 库。

### 版本信息

- **旧版本**: v0.12.2 及以下
- **新版本**: v1.0.0+

## 🎯 主要变更总结

### 新增功能 ✨

- ✅ **CLI 命令支持**：提供 `deploy` 和 `init` 命令
- ✅ **API 导出**：支持编程式调用部署功能
- ✅ **类型安全配置**：导出 `defineConfig` 函数提供类型提示
- ✅ **多命令别名**：支持 `vercel-deploy-tool`、`vdt`、`@ruan-cat/vercel-deploy-tool`
- ✅ **配置模板生成**：`init` 命令自动生成配置文件
- ✅ **tasuku 任务调度**：可视化的任务执行进度
- ✅ **模块化架构**：代码组织更清晰，易于维护

### 破坏性变更 💥

#### 1. 使用方式变更

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
# 使用 CLI 命令
vercel-deploy-tool deploy
```

```json
// package.json
{
	"scripts": {
		"deploy-vercel": "vercel-deploy-tool deploy"
	}
}
```

#### 2. 配置文件格式变更

**旧版本**：

```typescript
// .config/vercel-deploy-tool.ts
import { type Config } from "@ruan-cat/vercel-deploy-tool/src/config.ts";

const config: Config = {
	vercelProjetName: "my-project", // 注意：拼写错误
	vercelOrgId: "team_xxx",
	vercelProjectId: "prj_xxx",
	vercelToken: "",
	deployTargets: [
		/* ... */
	],
};

export default config;
```

**新版本**：

```typescript
// vercel-deploy-tool.config.ts (新文件名)
import { defineConfig } from "@ruan-cat/vercel-deploy-tool";

export default defineConfig({
	vercelProjectName: "my-project", // 注意：拼写已修正
	vercelOrgId: "team_xxx",
	vercelProjectId: "prj_xxx",
	vercelToken: process.env.VERCEL_TOKEN || "",
	deployTargets: [
		/* ... */
	],
});
```

**关键变更**：

- 配置文件名从 `.config/vercel-deploy-tool.ts` 改为根目录的 `vercel-deploy-tool.config.ts`
- 字段名修正：`vercelProjetName` → `vercelProjectName`
- 导入路径变更：`@ruan-cat/vercel-deploy-tool/src/config.ts` → `@ruan-cat/vercel-deploy-tool`
- 使用 `defineConfig` 函数包裹配置（提供类型提示）

#### 3. API 导入路径变更

**旧版本**：

```typescript
import { type Config } from "@ruan-cat/vercel-deploy-tool/src/config.ts";
import "@ruan-cat/vercel-deploy-tool/src/index.ts";
```

**新版本**：

```typescript
import { defineConfig, executeDeploymentWorkflow } from "@ruan-cat/vercel-deploy-tool";
import type { VercelDeployConfig } from "@ruan-cat/vercel-deploy-tool";
```

#### 4. 构建系统变更

- **旧版本**：使用 Vite 构建
- **新版本**：使用 tsup 构建，输出 ESM 格式

#### 5. 任务调度库变更

- **旧版本**：使用 `definePromiseTasks`（来自 `@ruan-cat/utils`）
- **新版本**：使用 `tasuku`（更好的可视化和性能）

#### 6. 移除的功能

- ❌ 不再支持直接运行 TypeScript 脚本
- ❌ 移除 `--env-path` 参数（请使用标准的 `.env` 文件或 `dotenvx`）

## 🚀 迁移步骤

### 第一步：更新依赖

```bash
# 更新到 v1.0
pnpm add -D @ruan-cat/vercel-deploy-tool@latest
```

### 第二步：生成新配置文件

运行 `init` 命令生成配置模板：

```bash
npx vercel-deploy-tool init
```

这将在项目根目录创建 `vercel-deploy-tool.config.ts` 文件，并自动更新 `package.json` 添加 `deploy-vercel` 脚本。

### 第三步：迁移配置

将旧配置文件（`.config/vercel-deploy-tool.ts`）的内容迁移到新文件：

```typescript
// vercel-deploy-tool.config.ts
import { defineConfig } from "@ruan-cat/vercel-deploy-tool";

export default defineConfig({
	// 修正字段名：vercelProjetName → vercelProjectName
	vercelProjectName: "my-project",

	// 推荐使用环境变量
	vercelToken: process.env.VERCEL_TOKEN || "",
	vercelOrgId: process.env.VERCEL_ORG_ID || "",
	vercelProjectId: process.env.VERCEL_PROJECT_ID || "",

	// deployTargets 配置保持不变（只需复制过来）
	deployTargets: [
		{
			type: "userCommands",
			targetCWD: "./packages/docs",
			url: ["docs.example.com"],
			userCommands: ["pnpm build:docs"],
			outputDirectory: "docs/.vitepress/dist",
			// 可选：明确指定是否复制文件（默认为 true）
			isCopyDist: true,
		},
	],

	// afterBuildTasks 保持不变
	afterBuildTasks: [
		// "echo 'Build completed!'"
	],
});
```

**配置字段映射表**：

| 旧字段名 (v0.x)    | 新字段名 (v1.0)     | 说明         |
| ------------------ | ------------------- | ------------ |
| `vercelProjetName` | `vercelProjectName` | 拼写修正     |
| `vercelToken`      | `vercelToken`       | 不变         |
| `vercelOrgId`      | `vercelOrgId`       | 不变         |
| `vercelProjectId`  | `vercelProjectId`   | 不变         |
| `vercelJsonPath`   | `vercelJsonPath`    | 不变（可选） |
| `deployTargets`    | `deployTargets`     | 不变         |
| `afterBuildTasks`  | `afterBuildTasks`   | 不变（可选） |

### 第四步：更新 package.json

```json
{
	"scripts": {
		"deploy-vercel": "vercel-deploy-tool deploy"
	}
}
```

如果 `init` 命令已自动添加此脚本，可跳过此步骤。

### 第五步：删除旧文件

```bash
# 删除旧的部署脚本
rm -rf bin/vercel-deploy-tool.ts
rm -rf scripts/vercel-deploy-tool.ts

# 删除旧的配置文件
rm -rf .config/vercel-deploy-tool.ts
```

### 第六步：更新环境变量（可选）

如果你在 `.env` 文件中配置了环境变量，格式保持不变：

```bash
# .env
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=team_your_vercel_orgId
VERCEL_PROJECT_ID=prj_your_vercel_projectId
```

环境变量名称要求：

- 必须全大写
- 使用下划线分隔
- 名称必须完全匹配（`VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID`）

### 第七步：测试部署

运行部署命令测试是否正常工作：

```bash
pnpm run deploy-vercel
```

或直接使用 CLI：

```bash
npx vercel-deploy-tool deploy
# 或
npx vdt deploy
```

## 🔍 常见问题

### Q1: 为什么配置字段名从 `vercelProjetName` 改为 `vercelProjectName`？

**A**: 原字段名存在拼写错误（`Projet` 应为 `Project`），v1.0 进行了修正。这是一个破坏性变更，但提供了更正确的命名。

### Q2: 我可以继续使用旧的导入路径吗？

**A**: 不可以。v1.0 完全重构了导出结构，必须使用新的导入路径：

```typescript
// ❌ 旧路径（不再支持）
import { type Config } from "@ruan-cat/vercel-deploy-tool/src/config.ts";

// ✅ 新路径
import { defineConfig } from "@ruan-cat/vercel-deploy-tool";
import type { VercelDeployConfig } from "@ruan-cat/vercel-deploy-tool";
```

### Q3: 为什么移除了 `--env-path` 参数？

**A**: 新版本使用标准的 `.env` 文件和 [c12](https://github.com/unjs/c12) 配置加载器，会自动读取 `.env` 文件。如需更复杂的环境变量管理，推荐使用 [dotenvx](https://dotenvx.com/)。

### Q4: 我的 TypeScript 脚本不能运行了？

**A**: v1.0 不再支持直接运行 TypeScript 脚本。请使用新的 CLI 命令：

```bash
# ❌ 旧方式（不再支持）
tsx ./bin/vercel-deploy-tool.ts

# ✅ 新方式
vercel-deploy-tool deploy
```

### Q5: 如何在 GitHub Actions 中使用 v1.0？

**A**: 示例工作流：

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v2
        with:
          version: 9

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Deploy to Vercel
        run: pnpm run deploy-vercel
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
          VERCEL_ORG_ID: ${{ secrets.VERCEL_ORG_ID }}
          VERCEL_PROJECT_ID: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Q6: 如何使用 API 模式进行编程式调用？

**A**: v1.0 新增了 API 导出，可以在代码中直接调用：

```typescript
import { defineConfig, executeDeploymentWorkflow } from "@ruan-cat/vercel-deploy-tool";

const config = defineConfig({
	vercelProjectName: "my-project",
	vercelToken: process.env.VERCEL_TOKEN || "",
	vercelOrgId: process.env.VERCEL_ORG_ID || "",
	vercelProjectId: process.env.VERCEL_PROJECT_ID || "",
	deployTargets: [
		/* ... */
	],
});

// 执行部署
await executeDeploymentWorkflow(config);
```

### Q7: 配置文件必须叫 `vercel-deploy-tool.config.ts` 吗？

**A**: 不一定。[c12](https://github.com/unjs/c12) 支持多种命名约定：

- `vercel-deploy-tool.config.ts`
- `vercel-deploy-tool.config.js`
- `vercel-deploy-tool.config.mjs`
- `.vercel-deploy-toolrc`

推荐使用 `.ts` 格式以获得类型提示。

### Q8: 部署任务的执行顺序有变化吗？

**A**: 没有变化。v1.0 保持了相同的部署工作流顺序：

1. Link 阶段（并行）
2. Build 阶段（并行）
3. AfterBuild 阶段（串行）
4. UserCommands + CopyDist 阶段（并行目标，串行步骤）
5. Deploy + Alias 阶段（并行目标，串行步骤）

### Q9: 我需要修改 `deployTargets` 的配置吗？

**A**: 通常不需要。`deployTargets` 的配置格式保持不变，直接复制到新配置文件即可。但建议检查以下可选字段：

```typescript
{
	type: "userCommands",
	targetCWD: "./packages/docs",
	url: ["docs.example.com"],
	userCommands: ["pnpm build:docs"],
	outputDirectory: "docs/.vitepress/dist",

	// 可选：是否需要执行 vercel build（默认 true）
	isNeedVercelBuild: true,

	// 可选：是否复制构建产物（默认 true）
	isCopyDist: true,
}
```

## 📚 进一步阅读

- [完整 README 文档](../../README.md)
- [配置示例](../templates/vercel-deploy-tool.config.ts)
- [tasuku - 任务执行器](https://github.com/privatenumber/tasuku)
- [c12 - 配置加载器](https://github.com/unjs/c12)

## 🆘 获取帮助

如果在迁移过程中遇到问题：

1. 查看 [README 文档](../../README.md) 中的完整配置说明
2. 参考 [配置模板](../templates/vercel-deploy-tool.config.ts)
3. 在 [GitHub Issues](https://github.com/ruan-cat/monorepo/issues) 提交问题

## ✅ 迁移检查清单

完成迁移后，请检查以下事项：

- [ ] 已更新到 v1.0.0+
- [ ] 已运行 `npx vercel-deploy-tool init` 生成新配置
- [ ] 已迁移配置内容（修正 `vercelProjectName` 拼写）
- [ ] 已更新 `package.json` 脚本
- [ ] 已删除旧的部署脚本和配置文件
- [ ] 已配置环境变量（推荐使用 `.env` 文件）
- [ ] 已测试 `pnpm run deploy-vercel` 命令
- [ ] 如使用 GitHub Actions，已更新工作流文件
- [ ] 已将 `.vercel` 和 `vercel.null.def.json` 添加到 `.gitignore`

完成所有检查项后，迁移就成功完成了！🎉
