---
name: use-vercel-deploy-in-monorepo
description: >-
  在 pnpm workspace 组织的 monorepo 或独立仓库中完成 Vercel 部署的辅助型技能。
  先按"部署形态"分层（monorepo 子包 / 独立仓库），再按框架（Nuxt、Nitro、Vite、UniApp H5）
  给出模板。覆盖 Root Directory、Output Directory、Build Command、package.json 脚本与
  turbo.json 任务链配置，解决 pnpm workspace 依赖解析和产物路径问题。本地配置完成后可
  排查 vercel.json 覆盖、多项目配置污染和 .vercel/project.json 绑定问题，并结合支持 Vercel MCP
  的 AI 客户端检查项目状态与触发部署。
metadata:
  version: "1.1.0"
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

- **模式 A：产物搬运到仓库根目录（推荐）**
  - 适用：采用仓库根安装、仓库根 Build Command、仓库根 `.vercel/output` 的 pnpm workspace 项目；Nuxt、Nitro、Vite、UniApp H5 静态产物均可按此模式落地。
  - 做法：子包先构建出自身产物，再用 `move-vercel-output-to-root`（来自 `@ruan-cat/utils`）搬运到 monorepo 根目录 `.vercel/output`。
  - Vercel Output Directory：`.vercel/output`

- **模式 B：直接指向子包产物路径**
  - 适用：静态站点产物路径固定且项目已确认不会被仓库根 `vercel.json`、子目录 `vercel.json` 或错误 Root Directory 污染。
  - 做法：Vercel Output Directory 直接写子包产物路径，如 `apps/app/dist/build/h5`。
  - 注意：这是可选模式，不是 UniApp H5 的默认结论。若项目已有根入口脚本负责搬运到 `.vercel/output`，以项目实测脚本链路和 Vercel 成功日志为准，不要照搬子包产物路径。

### 2.3 README / 事故沉淀的期望值与远程复核项

| Vercel 项目             | GitHub 仓库         | 本地路径                    | Root Directory          | Framework Preset | Build Command                 | Output Directory | Install Command         | 形态                          |
| :---------------------- | :------------------ | :-------------------------- | :---------------------- | :--------------- | :---------------------------- | :--------------- | :---------------------- | :---------------------------- |
| notes-my-pull-requests  | ruan-cat/notes      | notes/docs/my-pull-requests | `./` 或留空             | Other            | `pnpm run build:docs:my-pr`   | `.vercel/output` | `pnpm install`          | 形态 1 / 模式 A               |
| 11comm-nitro-server     | ruan-cat/11comm     | 01s-11comm/apps/api         | 仓库根目录（默认/留空） | Other            | `pnpm run build:vercel:api`   | `.vercel/output` | `ls -A && pnpm install` | 形态 1 / 模式 A（根目录脚本） |
| 11comm-admin            | ruan-cat/11comm     | 01s-11comm/apps/admin       | 仓库根目录（默认/留空） | Other            | `pnpm run build:vercel:admin` | `.vercel/output` | `ls -A && pnpm install` | 形态 1 / 模式 A（根目录脚本） |
| 11comm-app-h5           | ruan-cat/11comm     | 01s-11comm/apps/app         | 仓库根目录（默认/留空） | Other            | `pnpm run build:vercel:app`   | `.vercel/output` | `ls -A && pnpm install` | 形态 1 / 模式 A（根目录脚本） |
| 11comm-app-nitro-server | ruan-cat/11comm-app | 01s-11comm-app              | `./` 或留空             | Nitro            | `pnpm build:nitro:vercel`     | `.vercel/output` | `pnpm install`          | 形态 2                        |

> 这张表记录 README 与事故复盘沉淀出的期望值。执行部署前仍要用 Vercel CLI / API / MCP 重新核对远程项目；如果工具没有返回某字段，必须写明“未返回”，不要把推断说成远程事实。11comm 的 admin/app/api 当前云端 Build Command 走仓库根入口，子包脚本负责构建并搬运到仓库根 `.vercel/output`。旧模板若把 `11comm-app-h5` 写成直接读取 `apps/app/dist/build/h5`，或把 `11comm-admin` 写成直接读取 `apps/admin/dist`，不得照搬。

## 3. 核心原则 [CRITICAL]

1. **Root Directory 管"生"**：在本技能推荐的“仓库根安装 + 仓库根 Build Command + 仓库根 `.vercel/output`”模式下，Root Directory 应留空或写 `./`，让 Vercel 在仓库根目录执行 `pnpm install` 或项目确认后的等价安装命令（例如 11comm 的 `ls -A && pnpm install`）。Vercel 官方的“Root Directory 指向 app 目录”模式也合法，但一旦采用该模式，Install Command、Build Command、Output Directory、`.vercel/project.json` 绑定位置都必须同步改成 app 目录口径，禁止和仓库根脚本混用。
2. **Output Directory 管"拿"**：Vercel 固定去 Root Directory 下的 `Output Directory` 拿产物。形态 1 模式 A 和形态 2 通常写 `.vercel/output`；形态 1 模式 B 直接写子包产物路径。
3. **搬运桥梁（形态 1 模式 A）**：子包使用 `move-vercel-output-to-root` bin（来自 `@ruan-cat/utils`），把子包构建产物或子包内 `.vercel/output` 搬运到 monorepo 根目录 `.vercel/output`。
4. **Turbo 任务链**：构建任务 → 搬运任务，通过 `turbo.json` 的 `dependsOn` 与 `outputs` 保证缓存正确。
5. **Framework Preset 选择**：多数 monorepo 子包场景用 `Other`；少数框架可被 Vercel 自动识别（如 Nitro），此时让 Vercel 自动选择。独立仓库按实际框架选择。
6. **Project Settings 管项目专属配置**：同一 Git 仓库绑定多个 Vercel Projects 时，Root Directory、Framework Preset、Build Command、Output Directory、Install Command、Ignored Build Step、环境变量等项目专属项优先维护在 Vercel 云端 Project Settings；README 或技能文档只记录期望值。
7. **`vercel.json` 是覆盖项，不是多项目隔离器**：`vercel.json` 可覆盖构建、输出、安装等项目设置。仓库根 `vercel.json` 会被以仓库根为 Project Root 的多个 Vercel Projects 读取，容易成为跨项目污染源。

## 4. 配置来源与优先级边界 [CRITICAL]

处理 Vercel 部署时，先分清三类配置来源：

| 配置来源               | 作用                                                                    | 使用方式                                                                                  |
| :--------------------- | :---------------------------------------------------------------------- | :---------------------------------------------------------------------------------------- |
| Vercel Dashboard / API | 远程项目配置真相，包含 framework、buildCommand、outputDirectory 等      | 用 CLI/API/MCP 核对；不要只凭 README 或本地文件推断                                       |
| `vercel.json`          | 仓库内静态配置，可覆盖 Build Command、Output Directory、Install Command | 只有确认不会污染其他 Vercel Project 时才使用；多项目 monorepo 默认先视为高风险覆盖项      |
| `.vercel/project.json` | Vercel CLI 的本地 link 绑定，通常包含 `orgId`、`projectId`              | 只用于确认当前目录绑定到哪个 Vercel Project；它不是远程项目配置本身，也不证明云端字段正确 |

### 4.1 多项目 monorepo 的 `vercel.json` 风险

当同一个 Git 仓库绑定多个 Vercel Projects（例如 admin、app、api 分别部署）时，仓库根 `vercel.json` 不是“某个子项目的专属配置”，而是共享覆盖面。它可能把一个项目的 `outputDirectory`、`buildCommand` 或 `installCommand` 覆盖到另一个项目上。

如果看到 `No Output Directory named ... found`、`STATIC_BUILD_NO_OUT_DIR`、构建日志中的目录与 README/Project Settings 不一致，不要先猜目录字符串；先检查：

```bash
rg --files -g "vercel.json"
```

只要存在根目录或子目录 `vercel.json`，就必须逐项核对它是否覆盖了云端 Project Settings。

### 4.2 11comm 事故沉淀

2026-07-09 的 11comm app H5 部署事故说明：删除错误的仓库 `vercel.json` 和保留正确的 `build:vercel` 搬运链路不是矛盾动作。

正确边界是：

- Vercel 云端 Project Settings 管 Root Directory、Framework Preset、Build Command、Output Directory、Install Command、Ignored Build Step、环境变量。
- 子包 `package.json` / `turbo.json` 管自己的构建、缓存和产物搬运。
- README 只记录云端期望值，不把这些值落成仓库根或子目录 `vercel.json`。

对 11comm 当前口径，admin/app/api 均应走仓库根入口 `pnpm run build:vercel:<name>`，Root Directory 保持仓库根默认/留空，Install Command 使用 `ls -A && pnpm install`，最终让 Vercel 从仓库根 `.vercel/output` 取产物。当前 11comm 仓库不应存在根目录或 `apps/*` 下的项目专属 `vercel.json`；发现任何 `vercel.json` 时，先停下来审查污染风险。

## 5. 完整工作流

### 5.1 阶段 1：项目侦察

1. 读取目标子包或仓库的 `package.json`，确认 `name` 和现有脚本。
2. 判断仓库结构：
   - 根目录存在 `pnpm-workspace.yaml` → 形态 1。
   - 不存在 → 形态 2。
3. 判断产物处理模式：
   - 框架为 Nuxt / Nitro / Vite → 形态 1 模式 A。
   - 框架为 UniApp H5 等静态站点 → 先查现有脚本和云端成功日志；若已有根入口搬运到 `.vercel/output`，归为模式 A；若云端直接读取子包静态产物，归为模式 B。
4. 使用 Vercel CLI 或 Vercel API 检查目标项目配置（见第 7 节）。
5. 检查当前工作目录是否存在 `.vercel/project.json`，读取 `orgId`、`projectId`，确认 CLI 绑定是否指向目标项目。
6. 用 Vercel CLI/API/MCP 核对远程项目的 Git 连接，至少确认 `link.repo` / `link.org` 与当前仓库一致，禁止凭目录名、域名或项目名猜测。
7. 检查 Root Directory 所在目录及仓库根目录是否存在 `vercel.json`。如果存在，记录它是否覆盖 `buildCommand`、`outputDirectory`、`installCommand`、`framework`。
8. 明确 Root Directory 策略属于“仓库根安装模式”还是“app 目录 Root Directory 模式”，后续脚本和产物路径不得混用。

### 5.2 阶段 2：模式匹配与脚本写入

根据形态和框架选择模板：

| 形态   | 模式     | 框架        | 模板文件                                                                                                                          |
| :----- | :------- | :---------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| 形态 1 | 模式 A   | Nuxt        | [templates/package-scripts-nuxt.md](templates/package-scripts-nuxt.md)                                                            |
| 形态 1 | 模式 A   | Nitro       | [templates/package-scripts-nitro.md](templates/package-scripts-nitro.md)                                                          |
| 形态 1 | 模式 A   | Vite / Vue3 | [templates/package-scripts-vite.md](templates/package-scripts-vite.md)                                                            |
| 形态 1 | 模式 A/B | UniApp H5   | [templates/package-scripts-uniapp-h5.md](templates/package-scripts-uniapp-h5.md)，先按项目实测链路判断是否搬运到 `.vercel/output` |
| 形态 2 | —        | Nitro       | [templates/standalone-repo-nitro.md](templates/standalone-repo-nitro.md)                                                          |

### 5.3 形态 1 / 模式 A 工作流

1. 在子包 `package.json` 中追加 `build:vercel` + `move-vercel-output-to-root` 脚本。
2. 在子包 `turbo.json` 中追加构建任务与 `move-vercel-output-to-root` 任务，声明 `dependsOn` 和 `outputs`。
3. 在 Vercel 项目设置中配置：
   - **Framework Preset**：`Other`（多数情况）或让 Vercel 自动识别（少数如 Nitro）
   - **Root Directory**：`./` 或留空
   - **Output Directory**：`.vercel/output`
   - **Build Command**：`pnpm -F <子包名> run build:vercel` 或 `pnpm run build:vercel:<name>`
   - **Install Command**：`pnpm install` 或项目确认后的等价命令（如 `ls -A && pnpm install`）

### 5.4 形态 1 / 模式 B 工作流

1. 在子包 `package.json` 中追加构建脚本（如 `build:vercel:h5`）。
2. 在仓库根目录 `package.json` 中可选追加聚合脚本（如 `build:vercel:app`）。
3. 在 Vercel 项目设置中配置：
   - **Framework Preset**：`Other`
   - **Root Directory**：`./` 或留空
   - **Output Directory**：子包产物路径，如 `apps/app/dist/build/h5`
   - **Build Command**：`pnpm run build:vercel:<name>`
   - **Install Command**：`pnpm install` 或项目确认后的等价命令

### 5.5 形态 2 工作流

1. 在仓库根目录 `package.json` 中追加 `build:nitro:vercel` 等脚本。
2. 在 Vercel 项目设置中配置：
   - **Framework Preset**：根据框架选择（如 Nitro）
   - **Root Directory**：`./` 或留空
   - **Output Directory**：`.vercel/output`（框架 preset 自动生成）
   - **Build Command**：`pnpm run build:nitro:vercel`
   - **Install Command**：`pnpm install` 或项目确认后的等价命令

### 5.6 阶段 3：本地验证

1. 在仓库根目录执行对应的 Build Command。
2. 检查产物路径是否与 Vercel Output Directory 一致。
3. 检查 `.vercel/output/static`（前端）或 `.vercel/output/functions`（后端）是否非空。
4. 检查 `turbo.json` 的 `outputs` 是否包含产物路径。

### 5.7 阶段 4：部署

1. 使用 Vercel CLI：`vercel deploy --prebuilt --prod`
2. 执行部署前，确认当前目录的 `.vercel/project.json` 绑定到目标 Vercel Project。多项目 monorepo 中，仓库根 `.vercel/project.json` 是单槽绑定；部署 admin/app/api 任一项目之前都要重新确认或重新 link 到目标 project，错误目录执行 `vercel deploy --prebuilt` 可能部署到同团队下的另一个项目。
3. 或使用支持 Vercel MCP 的 AI 客户端触发部署（本地配置完成后）。
4. 使用 `vercel deploy --prebuilt` 或 Vercel MCP 检查部署状态。

## 6. 四种框架脚本示例

### 6.1 Nuxt（形态 1 / 模式 A）

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

### 6.2 Nitro（形态 1 / 模式 A）

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

### 6.3 Vite / Vue3（形态 1 / 模式 A）

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

### 6.4 UniApp H5（形态 1 / 模式 B，可选）

本模板只表示“直接让 Vercel 读取子包静态产物”的可选基础形态。若项目已经采用仓库根 Build Command 并搬运到 `.vercel/output`，应优先采用项目实测链路，不要因为框架是 UniApp H5 就自动判定为模式 B。

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

注意：UniApp H5 在模式 B 下 Output Directory 直接指向 `apps/<子包>/dist/build/h5`，不需要搬运到根目录。如果项目采用形态 1 模式 A 的 `.vercel/output` 结构，则额外启用 `move-h5-output-to-root` 脚本，并把云端 Output Directory 设为 `.vercel/output`：

```json
{
	"scripts": {
		"build:vercel:h5": "pnpm run build:h5:prod && pnpm run move-h5-output-to-root",
		"move-h5-output-to-root": "shx rm -rf ../../.vercel/output && shx mkdir -p ../../.vercel/output/static && shx cp -r dist/build/h5/* ../../.vercel/output/static/"
	}
}
```

## 7. 远程配置校验

本地配置完成后，应使用 Vercel CLI 或 Vercel API 核对远程项目配置，避免界面设置与仓库脚本不一致。

### 7.1 本地 CLI 绑定校验

先确认当前目录绑定到正确的 Vercel Project：

```bash
# 在 monorepo 根目录执行；monorepo 项目优先使用 --repo
vercel link --repo

# 或显式绑定目标项目
vercel link --yes --project <project-name-or-id>
```

检查 `.vercel/project.json`：

- `orgId` 必须对应目标 team。
- `projectId` 必须对应目标 Vercel Project。
- 文件所在目录必须和部署命令执行目录一致。若准备在仓库根目录执行 `vercel deploy --prebuilt`，就不要只在子包目录留下 `.vercel/project.json`。

注意：`.vercel/project.json` 只证明本地 CLI 绑定关系，不证明云端 `buildCommand`、`outputDirectory`、`installCommand` 等字段正确。

### 7.2 使用 Vercel CLI

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
| `rootDirectory`   | 仓库根模式为 `null` 或 `./`                                           | 仓库根模式为 `null` 或 `./`    | `null` 或 `./`                      |
| `outputDirectory` | `.vercel/output`                                                      | `apps/<子包>/dist/build/h5`    | `.vercel/output`                    |
| `buildCommand`    | `pnpm -F <子包名> run build:vercel` 或 `pnpm run build:vercel:<name>` | `pnpm run build:vercel:<name>` | `pnpm run build:<framework>:vercel` |
| `installCommand`  | `pnpm install` 或项目确认后的等价命令                                 | `pnpm install`                 | `pnpm install`                      |
| `link.repo`       | 必须是当前 Git 仓库                                                   | 必须是当前 Git 仓库            | 必须是当前 Git 仓库                 |
| `link.org`        | 必须是当前 GitHub 组织或用户                                          | 必须是当前 GitHub 组织或用户   | 必须是当前 GitHub 组织或用户        |

如果项目采用官方 app 目录 Root Directory 模式，`rootDirectory` 可指向 app 目录；但这时 `installCommand`、`buildCommand`、`outputDirectory` 和本地 `.vercel/project.json` 也必须跟随该目录口径，不能继续使用仓库根模式的脚本和产物路径。

### 7.3 使用 Vercel API

```bash
# 获取项目配置
curl -s "https://api.vercel.com/v9/projects/<project-name>?teamId=<team-id>" \
  -H "Authorization: Bearer <token>"
```

返回的 JSON 中通常包含 `rootDirectory`、`outputDirectory`、`buildCommand`、`installCommand`、`framework`、`link.repo`、`link.org` 等字段，可与本地配置逐项比对。若某次工具返回不含某个字段，必须明确标注“未返回”，不要把推断写成直接读取到的事实。

详细说明见 [references/vercel-cli-remote-inspection.md](references/vercel-cli-remote-inspection.md)。

## 8. Vercel MCP 使用清单

本地 Vercel 配置完成后，可通过支持 Vercel MCP 的 AI 客户端检查项目与部署状态。

| MCP 工具                        | 触发时机        | 说明                                              |
| :------------------------------ | :-------------- | :------------------------------------------------ |
| `mcp__vercel__list_teams`       | 项目侦察        | 列出用户所属团队，确认 `orgId`                    |
| `mcp__vercel__list_projects`    | 项目侦察        | 查看团队下项目列表，确认目标项目存在              |
| `mcp__vercel__get_project`      | 项目侦察 / 复核 | 查看项目配置、Root Directory、Output Directory 等 |
| `mcp__vercel__list_deployments` | 部署后验证      | 查看项目历史部署                                  |
| `mcp__vercel__get_deployment`   | 部署后验证      | 查看单个部署详情与状态                            |
| `mcp__vercel__deploy_to_vercel` | 本地配置完成后  | 触发部署（需要本地已完成 Vercel 登录和项目配置）  |

详细说明见 [references/vercel-mcp-operations.md](references/vercel-mcp-operations.md)。

## 9. 关于 move-vercel-output-to-root 的来源

`move-vercel-output-to-root` 是一个 bin 命令，由 `@ruan-cat/utils` 包通过 `package.json` 的 `bin` 字段暴露。它的作用是把子包构建产物复制到 monorepo 根目录 `.vercel/output`。常见来源包括子包自己的 `.vercel/output`、Vite/Vue 的 `dist`、UniApp H5 的 `dist/build/h5` 等，具体以脚本参数和项目实测链路为准。

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

## 10. 常见陷阱与检查清单

### 10.1 常见陷阱

1. **仓库根安装模式下把 Root Directory 设成子包路径**：容易导致 `pnpm install` 找不到 workspace 或构建命令与产物路径错位。若选择官方 app 目录 Root Directory 模式，必须整套切换 install/build/output 配置。
2. **Output Directory 与产物实际路径不一致**：Vercel 只认配置里的 Output Directory，写错会报 404 或空部署。
3. **形态 1 模式 A 漏掉 `move-vercel-output-to-root`**：产物在子包目录，Vercel 拿不到。
4. **形态 1 模式 B 误用搬运脚本**：Output Directory 已指向子包产物路径，额外搬运会重复或覆盖。
5. **turbo.json 没有声明 outputs**：缓存失效，产物不会跨任务传递。
6. **Nuxt 没有关闭 `payloadExtraction`**：`--preset vercel` 时应关闭 `experimental.payloadExtraction`。
7. **Vite 项目未启用 `vite-plugin-vercel`**：产物不会生成 `.vercel/output` 结构。
8. **UniApp H5 产物未转换结构**：需要把 `dist/build/h5` 复制到 `.vercel/output/static`（模式 A 时）。
9. **Windows 下直接使用 `cp/mkdir/rm`**：`move-vercel-output-to-root` bin 内部使用 Node.js fs，跨平台通用；若手动编写搬运脚本，请使用 `shx` 代替 `cp/mkdir/rm`。
10. **仓库根 `vercel.json` 污染同仓库其他项目**：在一个 Git 仓库绑定多个 Vercel Projects 时，根配置会覆盖多个项目的 Project Settings。排查 Output Directory 错误时，先查 `vercel.json`，不要先猜目录名。
11. **子目录 `vercel.json` 误当项目隔离配置**：如果 Root Directory 或部署命令实际仍在仓库根，子目录配置可能无法表达真实云端入口，反而造成 Build Command 和 Output Directory 口径分裂。
12. **`.vercel/project.json` 放错目录**：在子包目录 link 了项目，却从仓库根执行 `vercel deploy --prebuilt`，可能找不到绑定或部署到错误项目。
13. **只看 Dashboard，不查覆盖项**：Dashboard 显示的 Project Settings 可能被仓库内 `vercel.json` 覆盖。必须同时看 Dashboard/API、`vercel.json`、部署日志。
14. **照搬官方 app Root Directory 模式但脚本仍按仓库根执行**：官方模式合法，但必须整套切换；混用会导致 install/build/output 三者不一致。
15. **把 11comm app H5 旧模板当成当前事实**：当前 11comm app H5 以 `pnpm run build:vercel:app` 搬运到 `.vercel/output` 为准，不再按直接 Output Directory `apps/app/dist/build/h5` 推断。
16. **把 11comm admin 旧输出目录当成当前事实**：当前 11comm admin 以 `pnpm run build:vercel:admin` 先生成 `dist/` 再搬运到 `.vercel/output` 为准，不要把云端 Output Directory 改回 `apps/admin/dist`。

### 10.2 11comm 快速复核抓手

处理 11comm admin/app/api 部署问题时，先跑下面两类检查，不要从 Output Directory 字符串开始猜：

```bash
# 当前 11comm 仓库不应存在任何 Vercel 静态配置文件
rg --files -g "vercel.json"

# 复核云端入口脚本和 .vercel/output 搬运链路
rg -n "build:vercel:admin|build:vercel:app|build:vercel:api|move-vercel-output-to-root|\\.vercel/output" package.json apps/*/package.json apps/*/turbo.json
```

如果第一条命令输出任何路径，优先审查 `vercel.json` 对 Project Settings 的覆盖风险；如果第二条命令缺少目标项目的根入口或搬运链路，优先审查脚本是否被误删。

### 10.3 检查清单

- [ ] 已确认仓库形态（monorepo 子包 / 独立仓库）。
- [ ] 已确认产物处理模式（模式 A / 模式 B）。
- [ ] 已确认 Root Directory 策略属于“仓库根安装模式”或“app 目录 Root Directory 模式”，没有混用。
- [ ] 已确认 `pnpm-workspace.yaml` 包含目标子包（形态 1）。
- [ ] 仓库根安装模式下，Vercel 项目 Root Directory 为 `./` 或留空。
- [ ] 已确认 `.vercel/project.json` 的 `projectId` / `orgId` 与目标 Vercel 项目一致。
- [ ] 多项目 monorepo 中，已确认当前部署目录的 `.vercel/project.json` 单槽绑定就是目标 project，而不是同仓库另一个 project。
- [ ] 已确认远程项目 `link.repo` / `link.org` 与当前 Git 仓库一致。
- [ ] 已检查 Root Directory 所在目录和仓库根目录是否存在 `vercel.json`；若存在，已与 Dashboard/API 配置逐项比对。
- [ ] Vercel 项目 Output Directory 与本地产物路径一致。
- [ ] Vercel 项目 Build Command 与本地脚本一致。
- [ ] Vercel 项目 Install Command 与 Root Directory 策略一致，pnpm workspace 项目能在云端解析 workspace 依赖。
- [ ] 子包 `turbo.json` 包含构建任务与搬运任务，并正确声明 `dependsOn` 和 `outputs`（形态 1 模式 A）。
- [ ] Nuxt / Nitro / Vite 子包：`package.json` 包含 `build:vercel` 和 `move-vercel-output-to-root` 脚本。
- [ ] UniApp H5 子包：已确认是模式 A 搬运到 `.vercel/output`，还是模式 B 直接指向子包产物；未照搬旧模板。
- [ ] 本地执行 Build Command 后，产物路径与 Vercel Output Directory 一致。
- [ ] 已安装 `@ruan-cat/utils`（提供 `move-vercel-output-to-root` 命令）。
- [ ] 已安装 `cross-env`、`shx`、`turbo`（Vite 项目还需 `vite-plugin-vercel`）。
- [ ] 已使用 Vercel CLI 核对远程项目配置。
- [ ] 使用 `vercel deploy --prebuilt` 前，已确认命令执行目录与 `.vercel/project.json` 绑定目录一致。
- [ ] 环境变量已在 Vercel 项目设置中同步。

## 11. 参考文档

- [references/monorepo-deployment-patterns.md](references/monorepo-deployment-patterns.md)：两种形态、四种框架的完整部署模式。
- [references/vercel-cli-remote-inspection.md](references/vercel-cli-remote-inspection.md)：使用 Vercel CLI 验证远程项目配置。
- [references/vercel-mcp-operations.md](references/vercel-mcp-operations.md)：支持 Vercel MCP 的 AI 客户端工具使用清单。
- [Vercel Monorepos](https://vercel.com/docs/monorepos)：官方 monorepo Root Directory 与 `vercel link --repo` 说明。
- [Vercel Project Settings](https://vercel.com/docs/project-configuration/project-settings)：Build Command、Install Command、Output Directory 等云端项目配置。
- [Vercel `vercel.json`](https://vercel.com/docs/project-configuration/vercel-json)：仓库内静态配置文件的覆盖能力与字段说明。
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
