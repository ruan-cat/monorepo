# 2026-07-02 use-vercel-deploy-in-monorepo Skill 设计

## 背景与目标

在 monorepo 内使用 Vercel 部署多子包时，常见错误是：

1. 把 Vercel Root Directory 设成子包目录，导致 pnpm workspace 依赖安装失败（`workspace:*` 无法解析）。
2. 构建产物留在子包目录，Vercel 只在它预期的根目录 `.vercel/output` 找产物，部署为空或 404。

同时，部分仓库并非 monorepo，而是独立仓库直接部署。本 Skill 旨在给出一个通用、可复用的操作指南，帮助用户在 monorepo 子包和独立仓库两种形态下完成 Vercel 部署，同时利用支持 Vercel MCP 的 AI 客户端做项目状态检查与部署。

## 核心方法论：部署形态分层

不再只按框架分类，而是先按"部署形态"分层，再按框架给出模板。

### 形态 1：Monorepo 子包部署

特征：

- 仓库根目录存在 `pnpm-workspace.yaml`。
- 多个子包共享根目录的 `node_modules` 和 lockfile。
- Vercel 项目 Git 连接指向仓库根目录。

配置口径：

- **Framework Preset**：`Other`（多数情况）或框架自动识别（少数情况，如 `11comm-admin` 实际为 Nitro）
- **Root Directory**：`./` 或留空（必须在 monorepo 根目录执行 pnpm install）
- **Output Directory**：`.vercel/output`（推荐）或子包产物路径（如 `11comm-app-h5` 的 `apps/app/dist/build/h5`）
- **Build Command**：在根目录通过 `pnpm -F <子包名> run build:vercel` 或 `pnpm run build:vercel:<name>` 触发

产物处理两种模式：

- **模式 A：产物搬运到根目录**（推荐，适用于 Nuxt/Nitro/Vite）：子包构建生成 `.vercel/output`，再用 `move-vercel-output-to-root`（来自 `@ruan-cat/utils`）搬运到根目录。
- **模式 B：直接指向子包产物路径**（适用于 UniApp H5 等静态站点）：Vercel Output Directory 直接写 `apps/<子包>/dist/build/h5` 等。

### 形态 2：独立仓库部署

特征：

- 仓库本身不是 monorepo，或只有一个可部署目标。
- 无需处理 workspace 依赖解析问题。
- Vercel 项目 Git 连接指向仓库根目录。

配置口径：

- **Framework Preset**：根据框架选择（如 Nitro）
- **Root Directory**：`./` 或留空
- **Output Directory**：`.vercel/output`（框架 preset 自动生成）
- **Build Command**：`pnpm run build:nitro:vercel` 等，直接在仓库根目录执行

## Skill 信息

- **名称**: `use-vercel-deploy-in-monorepo`
- **路径**: `ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/`
- **类型**: 文档 + 配置模板 Skill
- **版本**: `0.1.0`

## 目录结构

```plain
ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/
├── SKILL.md                                  # 主流程指南
├── references/
│   ├── monorepo-deployment-patterns.md      # 两种形态、四种框架的部署模式
│   ├── vercel-cli-remote-inspection.md      # 使用 Vercel CLI 验证远程项目配置
│   └── vercel-mcp-operations.md             # 支持 Vercel MCP 的 AI 客户端工具清单
└── templates/
    ├── package-scripts-nuxt.md               # Nuxt 子包脚本（形态 1 / 模式 A）
    ├── package-scripts-nitro.md              # Nitro 子包脚本（形态 1 / 模式 A）
    ├── package-scripts-vite.md               # Vite / Vue3 子包脚本（形态 1 / 模式 A）
    ├── package-scripts-uniapp-h5.md          # UniApp H5 子包脚本（形态 1 / 模式 B）
    ├── standalone-repo-nitro.md              # 独立仓库 Nitro 脚本（形态 2）
    └── turbo-task-move-vercel-output.md      # turbo 任务模板索引
```

## 内容边界

### 覆盖范围

- 判断项目属于 monorepo 子包形态还是独立仓库形态。
- 识别四种框架类型：Nuxt、Nitro、Vite（Vue3 后台）、UniApp H5。
- 配置 `package.json` 构建脚本（turbo + pnpm filter + move-vercel-output-to-root）。
- 配置 `turbo.json` 任务（构建 → 产物搬运）。
- 配置 Vercel 项目：Root Directory 留空、Output Directory 按形态选择。
- 使用 Vercel CLI 验证远程项目配置。
- 本地配置完成后使用支持 Vercel MCP 的 AI 客户端检查项目状态与执行部署。

### 不覆盖范围

- 不提供自动创建 Vercel 项目的脚本（使用 Vercel CLI 或 MCP 的 `deploy_to_vercel`）。
- 不覆盖环境变量密钥管理本身，只提醒同步范围。
- 不替代各框架官方部署文档，只聚焦部署形态和路径问题。

## 工作流设计

### 阶段 1：形态判断

1. 检查仓库根目录是否存在 `pnpm-workspace.yaml`。
2. 检查 Vercel 项目 Git 连接指向仓库根目录还是子目录。
3. 判断产物处理模式：Nuxt / Nitro / Vite 走模式 A，UniApp H5 等静态站点走模式 B。

### 阶段 2：项目侦察

1. 读取目标子包或仓库的 `package.json`。
2. 读取根目录 `package.json`、`turbo.json`（形态 1 还需 `pnpm-workspace.yaml`）。
3. 使用 Vercel CLI 或 Vercel API 检查目标项目配置。

### 阶段 3：模式匹配

根据形态和框架选择对应模板：

| 形态   | 模式   | 框架        | 产物路径         | 关键命令                            |
| :----- | :----- | :---------- | :--------------- | :---------------------------------- |
| 形态 1 | 模式 A | Nuxt        | `.vercel/output` | `nuxi build --preset vercel`        |
| 形态 1 | 模式 A | Nitro       | `.vercel/output` | `nitro build --preset vercel`       |
| 形态 1 | 模式 A | Vite / Vue3 | `.vercel/output` | `vite build` + `vite-plugin-vercel` |
| 形态 1 | 模式 B | UniApp H5   | `dist/build/h5`  | `uni build`                         |
| 形态 2 | —      | Nitro       | `.vercel/output` | `nitro build --preset vercel`       |

### 阶段 4：脚本与配置写入

1. 按形态和框架写入 `package.json` 脚本。
2. 形态 1 模式 A 在子包 `turbo.json` 增加构建任务和搬运任务。
3. 在 Vercel 项目设置中配置：
   - Root Directory：`./` 或留空
   - Output Directory：按形态选择
   - Build Command：按形态选择

### 阶段 5：验证与部署

1. 本地运行 Build Command。
2. 检查产物路径与 Vercel Output Directory 一致。
3. 使用 Vercel CLI 核对远程项目配置。
4. 使用 Vercel CLI `vercel deploy --prebuilt --prod` 或支持 Vercel MCP 的 AI 客户端触发部署。
5. 使用 `get_deployment` 检查部署状态。

## 远程配置验证方法

本地配置完成后，应使用 Vercel CLI 或 Vercel API 核对远程项目配置，避免界面设置与仓库脚本不一致。

### 使用 Vercel CLI

```bash
# 查看项目详细配置
vercel project inspect <project-name>
```

输出包含 `framework`、`rootDirectory`、`outputDirectory`、`buildCommand` 等字段，可与本地配置逐项比对。

### 使用 Vercel API

```bash
curl -s "https://api.vercel.com/v9/projects/<project-name>?teamId=<team-id>" \
  -H "Authorization: Bearer <token>"
```

返回 JSON 中的关键字段：

| 字段              | 含义         | 期望值         |
| :---------------- | :----------- | :------------- |
| `framework`       | 框架预设     | 按形态选择     |
| `rootDirectory`   | 构建根目录   | `null` 或 `./` |
| `outputDirectory` | 产物输出目录 | 按形态选择     |
| `buildCommand`    | 构建命令     | 按形态选择     |

## 参考项目映射（已通过 Vercel API 验证）

| Vercel 项目             | GitHub 仓库         | 本地路径                    | Framework Preset | Build Command                              | Output Directory         | 形态                          |
| :---------------------- | :------------------ | :-------------------------- | :--------------- | :----------------------------------------- | :----------------------- | :---------------------------- |
| notes-my-pull-requests  | ruan-cat/notes      | notes/docs/my-pull-requests | Other            | `pnpm run build:docs:my-pr`                | `.vercel/output`         | 形态 1 / 模式 A               |
| 11comm-nitro-server     | ruan-cat/11comm     | 01s-11comm/apps/api         | Other            | `pnpm -F @01s-11comm/api run build:vercel` | `.vercel/output`         | 形态 1 / 模式 A               |
| 11comm-admin            | ruan-cat/11comm     | 01s-11comm/apps/admin       | Nitro            | `pnpm run build:vercel:admin`              | `.vercel/output`         | 形态 1 / 模式 A（根目录脚本） |
| 11comm-app-h5           | ruan-cat/11comm     | 01s-11comm/apps/app         | Other            | `pnpm run build:vercel:app`                | `apps/app/dist/build/h5` | 形态 1 / 模式 B               |
| 11comm-app-nitro-server | ruan-cat/11comm-app | 01s-11comm-app              | Nitro            | `pnpm build:nitro:vercel`                  | `.vercel/output`         | 形态 2                        |

## 关于 move-vercel-output-to-root 的来源

- `move-vercel-output-to-root` bin 由 `@ruan-cat/utils` 包暴露，子包或仓库需要安装 `@ruan-cat/utils` 作为 devDependencies。
- `@ruan-cat/vercel-deploy-tool` 是另一个独立工具，用于通过配置文件批量部署多个 Vercel 项目；它依赖 `@ruan-cat/utils`，但本身不直接暴露 `move-vercel-output-to-root` bin。

安装示例：

```bash
pnpm add -D @ruan-cat/utils
```

## 验收标准

1. Skill 目录结构符合 `ai-plugins/dev-skills/skills/<name>/` 约定。
2. SKILL.md 包含部署形态判断、完整工作流、配置清单、远程配置校验、常见陷阱。
3. 参考文档覆盖两种形态、四种框架的部署脚本与 turbo 配置。
4. 模板文件可直接复制到子包或仓库根目录使用，并标注适用形态。
5. 内容通过内部审查，无占位符、无矛盾、无歧义。
6. 不出现任何 AI 客户端名称，涉及 AI 客户端时使用通用表述。
