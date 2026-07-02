---
name: use-vercel-deploy-in-monorepo
description: >-
  在 pnpm workspace 组织的 monorepo 或独立仓库中完成 Vercel 部署的辅助型技能。
  先按"部署形态"分层（monorepo 子包 / 独立仓库），再按框架（Nuxt、Nitro、Vite、UniApp H5）
  给出模板。覆盖 Root Directory、Output Directory、Build Command、package.json 脚本与
  turbo.json 任务链配置，解决 pnpm workspace 依赖解析和产物路径问题。本地配置完成后可
  结合支持 Vercel MCP 的 AI 客户端检查项目状态与触发部署。
metadata:
  version: "1.0.0"
---

# Monorepo 与独立仓库的 Vercel 部署技能

## 1. 适用场景

- 目标使用 **pnpm workspace** 组织的 monorepo，需要把某个子包部署到 Vercel。
- 目标是一个非 monorepo 的独立仓库，只有一个可部署目标。
- 子包或仓库使用以下四种框架之一：Nuxt、Nitro、Vite（Vue3）、UniApp H5。
- 用户已在 Vercel 平台创建项目（或准备通过 CLI 创建）。

## 2. 部署形态判断

形态判断是配置的第一步。不同形态下，Root Directory、Output Directory、Build Command 的口径不同。

### 2.1 判断依据

| 判断项   | 形态 1：Monorepo 子包部署                                         | 形态 2：独立仓库部署                              |
| :------- | :---------------------------------------------------------------- | :------------------------------------------------ |
| 仓库结构 | 根目录存在 `pnpm-workspace.yaml`                                  | 无 `pnpm-workspace.yaml`，或只含一个可部署目标    |
| Git 连接 | Vercel 项目 Git 连接指向仓库根目录                                | Vercel 项目 Git 连接指向仓库根目录                |
| 依赖安装 | 必须在 monorepo 根目录执行 `pnpm install`，才能解析 `workspace:*` | 在仓库根目录执行 `pnpm install` 即可              |
| 产物位置 | 子包构建产物通常需要搬运到根目录 `.vercel/output`                 | 框架 preset 通常直接生成到根目录 `.vercel/output` |

### 2.2 形态 1 的两种产物处理模式

- **模式 A：产物搬运到根目录（推荐）**
  - 适用：Nuxt、Nitro、Vite 等能直接输出 `.vercel/output` 的框架。
  - 做法：子包构建生成 `.vercel/output`，再用 `move-vercel-output-to-root`（来自 `@ruan-cat/utils`）搬运到 monorepo 根目录。
  - Vercel Output Directory：`.vercel/output`

- **模式 B：直接指向子包产物路径**
  - 适用：UniApp H5 等静态站点，产物路径固定且结构简单。
  - 做法：Vercel Output Directory 直接写子包产物路径，如 `apps/app/dist/build/h5`。
  - 注意：Vercel 会直接读取该路径作为静态站点根目录，不需要搬运到根目录 `.vercel/output`。

### 2.3 远程配置实锤（已通过 Vercel API 验证）

| Vercel 项目             | GitHub 仓库         | 本地路径                    | Framework Preset | Build Command                              | Output Directory         | 形态                          |
| :---------------------- | :------------------ | :-------------------------- | :--------------- | :----------------------------------------- | :----------------------- | :---------------------------- |
| notes-my-pull-requests  | ruan-cat/notes      | notes/docs/my-pull-requests | Other            | `pnpm run build:docs:my-pr`                | `.vercel/output`         | 形态 1 / 模式 A               |
| 11comm-nitro-server     | ruan-cat/11comm     | 01s-11comm/apps/api         | Other            | `pnpm -F @01s-11comm/api run build:vercel` | `.vercel/output`         | 形态 1 / 模式 A               |
| 11comm-admin            | ruan-cat/11comm     | 01s-11comm/apps/admin       | Nitro            | `pnpm run build:vercel:admin`              | `.vercel/output`         | 形态 1 / 模式 A（根目录脚本） |
| 11comm-app-h5           | ruan-cat/11comm     | 01s-11comm/apps/app         | Other            | `pnpm run build:vercel:app`                | `apps/app/dist/build/h5` | 形态 1 / 模式 B               |
| 11comm-app-nitro-server | ruan-cat/11comm-app | 01s-11comm-app              | Nitro            | `pnpm build:nitro:vercel`                  | `.vercel/output`         | 形态 2                        |

## 3. 核心原则 [CRITICAL]

1. **Root Directory 管"生"**：必须留空或写 `./`，让 Vercel 在仓库根目录执行 `pnpm install`。对 monorepo 而言，这是保证 `workspace:*` 和 `pnpm-workspace.yaml` 正常解析的必要条件。
2. **Output Directory 管"拿"**：Vercel 固定去 Root Directory 下的 `Output Directory` 拿产物。形态 1 模式 A 和形态 2 通常写 `.vercel/output`；形态 1 模式 B 直接写子包产物路径。
3. **搬运桥梁（形态 1 模式 A）**：子包使用 `move-vercel-output-to-root` bin（来自 `@ruan-cat/utils`），把子包内的 `.vercel/output` 复制到 monorepo 根目录。
4. **Turbo 任务链**：构建任务 → 搬运任务，通过 `turbo.json` 的 `dependsOn` 与 `outputs` 保证缓存正确。
5. **Framework Preset 选择**：多数 monorepo 子包场景用 `Other`；少数框架可被 Vercel 自动识别（如 Nitro），此时让 Vercel 自动选择。独立仓库按实际框架选择。

## 4. 完整工作流

### 4.1 阶段 1：项目侦察

1. 读取目标子包或仓库的 `package.json`，确认 `name` 和现有脚本。
2. 判断仓库结构：
   - 根目录存在 `pnpm-workspace.yaml` → 形态 1。
   - 不存在 → 形态 2。
3. 判断产物处理模式：
   - 框架为 Nuxt / Nitro / Vite → 形态 1 模式 A。
   - 框架为 UniApp H5 等静态站点 → 形态 1 模式 B。
4. 使用 Vercel CLI 或 Vercel API 检查目标项目配置（见第 6 节）。

### 4.2 阶段 2：模式匹配与脚本写入

根据形态和框架选择模板：

| 形态   | 模式   | 框架        | 模板文件                                                                         |
| :----- | :----- | :---------- | :------------------------------------------------------------------------------- |
| 形态 1 | 模式 A | Nuxt        | [templates/package-scripts-nuxt.md](templates/package-scripts-nuxt.md)           |
| 形态 1 | 模式 A | Nitro       | [templates/package-scripts-nitro.md](templates/package-scripts-nitro.md)         |
| 形态 1 | 模式 A | Vite / Vue3 | [templates/package-scripts-vite.md](templates/package-scripts-vite.md)           |
| 形态 1 | 模式 B | UniApp H5   | [templates/package-scripts-uniapp-h5.md](templates/package-scripts-uniapp-h5.md) |
| 形态 2 | —      | Nitro       | [templates/standalone-repo-nitro.md](templates/standalone-repo-nitro.md)         |

### 4.3 形态 1 / 模式 A 工作流

1. 在子包 `package.json` 中追加 `build:vercel` + `move-vercel-output-to-root` 脚本。
2. 在子包 `turbo.json` 中追加构建任务与 `move-vercel-output-to-root` 任务，声明 `dependsOn` 和 `outputs`。
3. 在 Vercel 项目设置中配置：
   - **Framework Preset**：`Other`（多数情况）或让 Vercel 自动识别（少数如 Nitro）
   - **Root Directory**：`./` 或留空
   - **Output Directory**：`.vercel/output`
   - **Build Command**：`pnpm -F <子包名> run build:vercel` 或 `pnpm run build:vercel:<name>`
   - **Install Command**：`pnpm install`

### 4.4 形态 1 / 模式 B 工作流

1. 在子包 `package.json` 中追加构建脚本（如 `build:vercel:h5`）。
2. 在仓库根目录 `package.json` 中可选追加聚合脚本（如 `build:vercel:app`）。
3. 在 Vercel 项目设置中配置：
   - **Framework Preset**：`Other`
   - **Root Directory**：`./` 或留空
   - **Output Directory**：子包产物路径，如 `apps/app/dist/build/h5`
   - **Build Command**：`pnpm run build:vercel:<name>`
   - **Install Command**：`pnpm install`

### 4.5 形态 2 工作流

1. 在仓库根目录 `package.json` 中追加 `build:nitro:vercel` 等脚本。
2. 在 Vercel 项目设置中配置：
   - **Framework Preset**：根据框架选择（如 Nitro）
   - **Root Directory**：`./` 或留空
   - **Output Directory**：`.vercel/output`（框架 preset 自动生成）
   - **Build Command**：`pnpm run build:nitro:vercel`
   - **Install Command**：`pnpm install`

### 4.6 阶段 3：本地验证

1. 在仓库根目录执行对应的 Build Command。
2. 检查产物路径是否与 Vercel Output Directory 一致。
3. 检查 `.vercel/output/static`（前端）或 `.vercel/output/functions`（后端）是否非空。
4. 检查 `turbo.json` 的 `outputs` 是否包含产物路径。

### 4.7 阶段 4：部署

1. 使用 Vercel CLI：`vercel deploy --prebuilt --prod`
2. 或使用支持 Vercel MCP 的 AI 客户端触发部署（本地配置完成后）。
3. 使用 `vercel deploy --prebuilt` 或 Vercel MCP 检查部署状态。

## 5. 四种框架脚本示例

### 5.1 Nuxt（形态 1 / 模式 A）

```json
{
	"scripts": {
		"build:vercel": "turbo run move-vercel-output-to-root --filter=@your-scope/your-app",
		"nuxt:build:vercel": "cross-env NODE_OPTIONS=--max-old-space-size=8192 nuxi build --preset vercel",
		"move-vercel-output-to-root": "move-vercel-output-to-root"
	}
}
```

子包 `turbo.json`：

```json
{
	"tasks": {
		"nuxt:build:vercel": {
			"outputs": [".vercel/output/**"]
		},
		"move-vercel-output-to-root": {
			"dependsOn": ["nuxt:build:vercel"],
			"outputs": [".vercel/output/**"]
		}
	}
}
```

### 5.2 Nitro（形态 1 / 模式 A）

```json
{
	"scripts": {
		"build:vercel": "turbo move-vercel-output-to-root",
		"nitro:build:vercel": "nitro build --preset vercel",
		"move-vercel-output-to-root": "move-vercel-output-to-root"
	}
}
```

子包 `turbo.json`：

```json
{
	"tasks": {
		"nitro:build:vercel": {
			"outputs": [".vercel/output/**"]
		},
		"move-vercel-output-to-root": {
			"dependsOn": ["nitro:build:vercel"],
			"outputs": [".vercel/output/**"]
		}
	}
}
```

### 5.3 Vite / Vue3（形态 1 / 模式 A）

```json
{
	"scripts": {
		"build:vercel": "turbo move-vercel-output-to-root",
		"vite:build:vercel": "cross-env NODE_OPTIONS=--max-old-space-size=8192 vite build --mode production --configLoader runner",
		"move-vercel-output-to-root": "move-vercel-output-to-root"
	}
}
```

子包 `turbo.json`：

```json
{
	"tasks": {
		"vite:build:vercel": {
			"outputs": [".vercel/output/**"]
		},
		"move-vercel-output-to-root": {
			"dependsOn": ["vite:build:vercel"],
			"outputs": [".vercel/output/**"]
		}
	}
}
```

### 5.4 UniApp H5（形态 1 / 模式 B）

```json
{
	"scripts": {
		"build": "uni build",
		"build:h5:prod": "uni build --mode production",
		"build:vercel": "pnpm run build:vercel:h5",
		"build:vercel:h5": "pnpm run build:h5:prod",
		"preview:h5": "vite preview --outDir dist/build/h5"
	}
}
```

子包 `turbo.json`：

```json
{
	"tasks": {
		"build:h5:prod": {
			"outputs": ["dist/build/h5/**"]
		}
	}
}
```

注意：UniApp H5 在模式 B 下 Output Directory 直接指向 `apps/<子包>/dist/build/h5`，不需要搬运到根目录。如果项目同时需要形态 1 模式 A 的 `.vercel/output` 结构，则额外启用 `move-h5-output-to-root` 脚本：

```json
{
	"scripts": {
		"build:vercel:h5": "pnpm run build:h5:prod && pnpm run move-h5-output-to-root",
		"move-h5-output-to-root": "shx rm -rf ../../.vercel/output && shx mkdir -p ../../.vercel/output/static && shx cp -r dist/build/h5/* ../../.vercel/output/static/"
	}
}
```

## 6. 远程配置校验

本地配置完成后，应使用 Vercel CLI 或 Vercel API 核对远程项目配置，避免界面设置与仓库脚本不一致。

### 6.1 使用 Vercel CLI

```bash
# 查看项目详细配置
vercel project inspect <project-name>

# 或列出项目并过滤
vercel project ls
```

关键核对字段：

| 字段              | 形态 1 / 模式 A                                                       | 形态 1 / 模式 B                | 形态 2                              |
| :---------------- | :-------------------------------------------------------------------- | :----------------------------- | :---------------------------------- |
| `framework`       | `other` 或框架自动识别                                                | `other`                        | 框架自动识别（如 `nitro`）          |
| `rootDirectory`   | `null` 或 `./`                                                        | `null` 或 `./`                 | `null` 或 `./`                      |
| `outputDirectory` | `.vercel/output`                                                      | `apps/<子包>/dist/build/h5`    | `.vercel/output`                    |
| `buildCommand`    | `pnpm -F <子包名> run build:vercel` 或 `pnpm run build:vercel:<name>` | `pnpm run build:vercel:<name>` | `pnpm run build:<framework>:vercel` |

### 6.2 使用 Vercel API

```bash
# 获取项目配置
curl -s "https://api.vercel.com/v9/projects/<project-name>?teamId=<team-id>" \
  -H "Authorization: Bearer <token>"
```

返回的 JSON 中包含 `rootDirectory`、`outputDirectory`、`buildCommand`、`framework` 等字段，可与本地配置逐项比对。

详细说明见 [references/vercel-cli-remote-inspection.md](references/vercel-cli-remote-inspection.md)。

## 7. Vercel MCP 使用清单

本地 Vercel 配置完成后，可通过支持 Vercel MCP 的 AI 客户端检查项目与部署状态。

| MCP 工具                        | 触发时机        | 说明                                              |
| :------------------------------ | :-------------- | :------------------------------------------------ |
| `mcp__vercel__list_teams`       | 阶段 1          | 列出用户所属团队，确认 `orgId`                    |
| `mcp__vercel__list_projects`    | 阶段 1          | 查看团队下项目列表，确认目标项目存在              |
| `mcp__vercel__get_project`      | 阶段 1 / 阶段 5 | 查看项目配置、Root Directory、Output Directory 等 |
| `mcp__vercel__list_deployments` | 阶段 5          | 查看项目历史部署                                  |
| `mcp__vercel__get_deployment`   | 阶段 5          | 查看单个部署详情与状态                            |
| `mcp__vercel__deploy_to_vercel` | 阶段 5          | 触发部署（需要本地已完成 Vercel 登录和项目配置）  |

详细说明见 [references/vercel-mcp-operations.md](references/vercel-mcp-operations.md)。

## 8. 关于 move-vercel-output-to-root 的来源

`move-vercel-output-to-root` 是一个 bin 命令，由 `@ruan-cat/utils` 包通过 `package.json` 的 `bin` 字段暴露。它的作用是把子包目录下的 `.vercel/output` 复制到 monorepo 根目录。

- **正确来源**：`@ruan-cat/utils` 包提供了 `move-vercel-output-to-root` bin。
- **注意**：`@ruan-cat/vercel-deploy-tool` 是另一个独立工具，用于通过配置文件批量部署多个 Vercel 项目；它依赖 `@ruan-cat/utils`，但本身不直接暴露 `move-vercel-output-to-root` bin。如果你只需要使用 `move-vercel-output-to-root` 命令，直接安装 `@ruan-cat/utils` 即可。

前置依赖安装（构建脚本和搬运脚本均需要）：

```bash
pnpm add -D cross-env shx turbo @ruan-cat/utils
# Vite 项目额外
pnpm add -D vite-plugin-vercel
```

`move-vercel-output-to-root` bin 内部使用 Node.js fs 实现，Windows 与 macOS/Linux 通用。若手动编写搬运脚本，请使用 `shx` 代替 `cp/mkdir/rm`，避免 Windows 环境不兼容。

安装示例：

```bash
pnpm add -D @ruan-cat/utils
```

脚本中直接调用：

```json
{
	"scripts": {
		"move-vercel-output-to-root": "move-vercel-output-to-root"
	}
}
```

## 9. 常见陷阱与检查清单

### 9.1 常见陷阱

1. **Root Directory 设成子包路径**：导致 `pnpm install` 找不到 workspace，构建失败。
2. **Output Directory 与产物实际路径不一致**：Vercel 只认配置里的 Output Directory，写错会报 404 或空部署。
3. **形态 1 模式 A 漏掉 `move-vercel-output-to-root`**：产物在子包目录，Vercel 拿不到。
4. **形态 1 模式 B 误用搬运脚本**：Output Directory 已指向子包产物路径，额外搬运会重复或覆盖。
5. **turbo.json 没有声明 outputs**：缓存失效，产物不会跨任务传递。
6. **Nuxt 没有关闭 `payloadExtraction`**：`--preset vercel` 时应关闭 `experimental.payloadExtraction`。
7. **Vite 项目未启用 `vite-plugin-vercel`**：产物不会生成 `.vercel/output` 结构。
8. **UniApp H5 产物未转换结构**：需要把 `dist/build/h5` 复制到 `.vercel/output/static`（模式 A 时）。
9. **Windows 下直接使用 `cp/mkdir/rm`**：`move-vercel-output-to-root` bin 内部使用 Node.js fs，跨平台通用；若手动编写搬运脚本，请使用 `shx` 代替 `cp/mkdir/rm`。

### 9.2 检查清单

- [ ] 已确认仓库形态（monorepo 子包 / 独立仓库）。
- [ ] 已确认产物处理模式（模式 A / 模式 B）。
- [ ] 已确认 `pnpm-workspace.yaml` 包含目标子包（形态 1）。
- [ ] Vercel 项目 Root Directory 为 `./`（留空）。
- [ ] Vercel 项目 Output Directory 与本地产物路径一致。
- [ ] Vercel 项目 Build Command 与本地脚本一致。
- [ ] 子包 `turbo.json` 包含构建任务与搬运任务，并正确声明 `dependsOn` 和 `outputs`（形态 1 模式 A）。
- [ ] Nuxt / Nitro / Vite 子包：`package.json` 包含 `build:vercel` 和 `move-vercel-output-to-root` 脚本。
- [ ] UniApp H5 子包：`package.json` 包含 `build:vercel`（入口） + `build:vercel:h5` + `move-h5-output-to-root` 脚本（模式 A）。
- [ ] 本地执行 Build Command 后，产物路径与 Vercel Output Directory 一致。
- [ ] 已安装 `@ruan-cat/utils`（提供 `move-vercel-output-to-root` 命令）。
- [ ] 已安装 `cross-env`、`shx`、`turbo`（Vite 项目还需 `vite-plugin-vercel`）。
- [ ] 已使用 Vercel CLI 核对远程项目配置。
- [ ] 环境变量已在 Vercel 项目设置中同步。

## 10. 参考文档

- [references/monorepo-deployment-patterns.md](references/monorepo-deployment-patterns.md)：两种形态、四种框架的完整部署模式。
- [references/vercel-cli-remote-inspection.md](references/vercel-cli-remote-inspection.md)：使用 Vercel CLI 验证远程项目配置。
- [references/vercel-mcp-operations.md](references/vercel-mcp-operations.md)：支持 Vercel MCP 的 AI 客户端工具使用清单。
- [templates/package-scripts-nuxt.md](templates/package-scripts-nuxt.md)：Nuxt 子包脚本模板（形态 1 / 模式 A）。
- [templates/package-scripts-nitro.md](templates/package-scripts-nitro.md)：Nitro 子包脚本模板（形态 1 / 模式 A）。
- [templates/package-scripts-vite.md](templates/package-scripts-vite.md)：Vite / Vue3 脚本模板（形态 1 / 模式 A）。
- [templates/package-scripts-uniapp-h5.md](templates/package-scripts-uniapp-h5.md)：UniApp H5 脚本模板（形态 1 / 模式 B）。
- [templates/standalone-repo-nitro.md](templates/standalone-repo-nitro.md)：独立仓库 Nitro 脚本模板（形态 2）。
- [templates/turbo-task-move-vercel-output.md](templates/turbo-task-move-vercel-output.md)：turbo 任务模板索引。
- [templates/turbo-task-nuxt.json](templates/turbo-task-nuxt.json)：Nuxt turbo 任务模板。
- [templates/turbo-task-nitro.json](templates/turbo-task-nitro.json)：Nitro turbo 任务模板。
- [templates/turbo-task-vite.json](templates/turbo-task-vite.json)：Vite / Vue3 turbo 任务模板。
- [templates/turbo-task-uniapp-h5.json](templates/turbo-task-uniapp-h5.json)：UniApp H5 turbo 任务模板。
