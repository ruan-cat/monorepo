---
"@ruan-cat/vercel-deploy-tool": major
---

# @ruan-cat/vercel-deploy-tool v1.0.0 - 重大重构更新

## 🎉 重大更新

这是一个 **破坏性更新**，将工具从简单的部署脚本升级为功能完善的 CLI 工具和 API 库。

## ✨ 新功能

### CLI 命令支持

- 🔧 提供 `deploy` 命令用于执行部署
- 🎨 提供 `init` 命令用于初始化配置文件
- 🚀 支持三个命令别名：`vercel-deploy-tool`、`vdt`、`@ruan-cat/vercel-deploy-tool`

### API 导出

- 📦 导出 `defineConfig` 函数，提供类型安全的配置
- 🔌 导出 `executeDeploymentWorkflow` 支持编程式调用
- 🎯 导出完整的 TypeScript 类型定义
- 🛠️ 导出命令工厂函数用于高级集成

### 构建系统升级

- 🏗️ 从 Vite 切换到 tsup 构建
- 📤 输出 ESM 格式，提供类型声明文件
- ⚡ 更快的构建速度和更小的包体积

### 任务调度升级

- 🎨 从 `definePromiseTasks` 迁移到 `tasuku`
- 📊 提供可视化的任务执行进度
- ⚡ 更好的并行任务调度性能

### 配置系统增强

- 🔧 基于 c12 的配置加载系统
- 📝 支持多种配置文件格式（`.ts`、`.js`、`.mjs`、`.json`）
- 🌍 自动读取环境变量（`VERCEL_TOKEN`、`VERCEL_ORG_ID`、`VERCEL_PROJECT_ID`）
- 💡 `defineConfig` 提供完整的 TypeScript 类型提示

### 代码架构优化

- 📁 模块化目录结构（`commands/`、`core/`、`config/`、`utils/`、`types/`）
- 🧩 清晰的职责分离和代码组织
- 🔄 更易于维护和扩展

## 💥 破坏性变更

### 1. 使用方式变更

**旧版本**：

```bash
tsx ./bin/vercel-deploy-tool.ts
```

**新版本**：

```bash
vercel-deploy-tool deploy
```

### 2. 配置文件格式变更

- 配置文件位置：从 `.config/vercel-deploy-tool.ts` 改为根目录的 `vercel-deploy-tool.config.ts`
- 字段名修正：`vercelProjetName` → `vercelProjectName`（修正拼写错误）
- 导入路径：从 `@ruan-cat/vercel-deploy-tool/src/config.ts` 改为 `@ruan-cat/vercel-deploy-tool`
- 配置包裹：使用 `defineConfig()` 函数包裹配置对象

### 3. API 导入路径变更

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

### 4. 移除的功能

- ❌ 不再支持直接运行 TypeScript 脚本
- ❌ 移除 `--env-path` 参数（改用标准 `.env` 文件）

### 5. 类型定义变更

- `Config` → `VercelDeployConfig`
- 新增 `DeployTarget`、`DeployTargetBase`、`DeployTargetWithUserCommands` 等类型

## 🛠️ 内部改进

### 模块化重构

- 将 590 行的 `index.ts` 拆分为多个职责清晰的模块
- 创建独立的任务模块（link、build、after-build、user-commands、copy-dist、deploy、alias）
- 统一的任务编排入口（`core/tasks/index.ts`）

### 工具函数封装

- Vercel 命令参数生成器（`core/vercel.ts`）
- 类型守卫工具（`utils/type-guards.ts`）
- 任务执行器封装（`core/executor.ts`）

### 代码质量提升

- 完整的 TypeScript 类型定义
- 更好的错误处理
- 清晰的代码注释和文档

## 📚 文档更新

### 新增文档

- 📖 完整重写的 README.md
- 🔄 详细的迁移指南（`src/docs/migration-guide.md`）
- 📝 配置模板文件（`src/templates/vercel-deploy-tool.config.ts`）

### 文档内容

- CLI 使用说明和示例
- API 使用说明和示例
- 完整的配置说明
- 环境变量配置指南
- GitHub Actions 集成示例
- 常见问题解答

## 🔗 迁移指南

详细的迁移步骤请参考：

- [迁移指南](./packages/vercel-deploy-tool/src/docs/migration-guide.md)
- [完整文档](./packages/vercel-deploy-tool/README.md)

### 快速迁移

1. **更新依赖**：

   ```bash
   pnpm add -D @ruan-cat/vercel-deploy-tool@latest
   ```

2. **生成配置**：

   ```bash
   npx vercel-deploy-tool init
   ```

3. **迁移配置内容**：
   - 复制 `deployTargets` 配置
   - 修正 `vercelProjetName` → `vercelProjectName`
   - 使用 `defineConfig()` 包裹配置

4. **更新脚本**：

   ```json
   {
   	"scripts": {
   		"deploy-vercel": "vercel-deploy-tool deploy"
   	}
   }
   ```

5. **删除旧文件**：
   - 删除 `bin/vercel-deploy-tool.ts` 或 `scripts/vercel-deploy-tool.ts`
   - 删除 `.config/vercel-deploy-tool.ts`

6. **测试部署**：
   ```bash
   pnpm run deploy-vercel
   ```

## 🎯 升级建议

- ✅ 推荐所有用户升级到 v1.0 以获得更好的开发体验
- ✅ CLI 模式更简洁，无需维护额外的脚本文件
- ✅ 类型安全的配置减少配置错误
- ✅ 可视化的任务执行进度提供更好的反馈
- ✅ 模块化架构便于未来功能扩展

## 🔧 技术栈

- **构建工具**: tsup
- **任务调度**: tasuku
- **配置加载**: c12
- **CLI 框架**: commander
- **日志输出**: consola

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 noreply@anthropic.com
