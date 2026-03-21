# 2026-03-22 .npmrc 配置警告分析与迁移方案

## 问题现象

在运行 `pnpm install` 或其他涉及 npm 的命令时，出现以下警告日志：

```log
npm warn Unknown project config "link-workspace-packages". This will stop working in the next major version of npm.
npm warn Unknown project config "shamefully-hoist". This will stop working in the next major version of npm.
npm warn Unknown project config "public-hoist-pattern". This will stop working in the next major version of npm.
npm warn Unknown project config "ignore-workspace-root-check". This will stop working in the next major version of npm.
npm warn Unknown user config "COREPACK_NPM_REGISTRY". This will stop working in the next major version of npm.
npm warn Unknown user config "COREPACK_INTEGRITY_KEYS". This will stop working in the next major version of npm.
npm warn Unknown user config "NODE_TLS_REJECT_UNAUTHORIZED". This will stop working in the next major version of npm.
npm warn Unknown user config "store-dir". This will stop working in the next major version of npm.
npm warn Unknown user config "cache-dir". This will stop working in the next major version of npm.
```

## 根因分析

### 核心原因：npm 和 pnpm 共用 `.npmrc` 配置文件格式

npm 和 pnpm 都读取 `.npmrc` 文件来获取配置信息。两者共用同一种配置文件格式，但各自支持的配置项不同：

- **pnpm 专有配置项**（如 `link-workspace-packages`、`shamefully-hoist`、`store-dir` 等）对 npm 来说是"未知配置"
- **环境变量**（如 `COREPACK_NPM_REGISTRY`、`NODE_TLS_REJECT_UNAUTHORIZED`）被放在了 `.npmrc` 中，npm 也不认识它们

当 npm 被调用时，它会读取这些配置并发出"Unknown config"警告。

### 触发警告的时机

**本项目中 npm 被调用的关键路径**是 `package.json` 中的 `preinstall` 脚本：

```json
"preinstall": "npx only-allow pnpm && npm run corepack:pnpm"
```

当运行 `pnpm install` 时：

1. pnpm 读取 `.npmrc` → 正常，pnpm 认识全部配置项，无警告
2. pnpm 执行 `preinstall` 生命周期脚本
3. `npx only-allow pnpm` 被执行 → npx 属于 npm 基础设施，读取项目和全局 `.npmrc` → **项目级警告出现**
4. `npm run corepack:pnpm` 被执行 → npm 再次读取两级 `.npmrc` → **全部警告再次出现**

### 警告逐条分类

#### 第一类：项目级配置警告（来自项目 `.npmrc`）

| 配置项                        | 用途                                     | 所属工具 |
| :---------------------------- | :--------------------------------------- | :------- |
| `link-workspace-packages`     | 在 monorepo 中自动链接工作区包           | pnpm     |
| `shamefully-hoist`            | 将依赖提升到根 node_modules              | pnpm     |
| `public-hoist-pattern`        | 选择性公开提升特定依赖                   | pnpm     |
| `ignore-workspace-root-check` | 允许在工作区根目录安装包（不需 -w 选项） | pnpm     |

这些是 pnpm 管理 monorepo 所必需的配置。它们不能被移除，也没有 npm 的等价替代项。

#### 第二类：用户级配置警告（来自全局 `C:\Users\pc\.npmrc`）

| 配置项                         | 用途                                       | 应当存放的位置                |
| :----------------------------- | :----------------------------------------- | :---------------------------- |
| `COREPACK_NPM_REGISTRY`        | corepack 下载包管理器时使用的镜像源        | 系统环境变量                  |
| `COREPACK_INTEGRITY_KEYS`      | corepack 完整性校验密钥（设为 0 表示禁用） | 系统环境变量                  |
| `NODE_TLS_REJECT_UNAUTHORIZED` | Node.js TLS 证书校验开关                   | 系统环境变量                  |
| `store-dir`                    | pnpm 全局存储目录                          | 保留在 `.npmrc`（无替代方案） |
| `cache-dir`                    | pnpm 缓存目录                              | 保留在 `.npmrc`（无替代方案） |

## 迁移方案

### 方案一：项目级修复（已实施）

**问题**：`preinstall` 脚本调用了 `npx` 和 `npm run`，触发 npm 读取 `.npmrc`。

**修复**：用纯 Node.js 脚本替代 `npx only-allow pnpm`，并内联 corepack 命令替代 `npm run corepack:pnpm`。

修改前：

```json
"preinstall": "npx only-allow pnpm && npm run corepack:pnpm"
```

修改后：

```json
"preinstall": "node scripts/check-pnpm.mjs && corepack enable && corepack install"
```

新建 `scripts/check-pnpm.mjs` 脚本替代 `npx only-allow pnpm` 的功能，通过检查 `process.env.npm_config_user_agent` 来判断当前是否是 pnpm 在运行。这与 `only-allow` 包的内部实现原理一致。

**效果**：`pnpm install` 过程中不再调用任何 npm/npx 命令，彻底消除全部 9 条警告。

### 方案二：全局 `.npmrc` 环境变量迁移（需手动操作）

以下三个配置项是**环境变量**，不应放在 `.npmrc` 中。应迁移到 Windows 系统环境变量。

**操作步骤**（PowerShell 管理员模式）：

```powershell
# 设置系统级环境变量（永久生效）
[System.Environment]::SetEnvironmentVariable("COREPACK_NPM_REGISTRY", "https://registry.npmmirror.com", "User")
[System.Environment]::SetEnvironmentVariable("COREPACK_INTEGRITY_KEYS", "0", "User")
[System.Environment]::SetEnvironmentVariable("NODE_TLS_REJECT_UNAUTHORIZED", "0", "User")
```

设置完成后，从全局 `.npmrc`（`C:\Users\pc\.npmrc`）中删除以下三行：

```ini
COREPACK_NPM_REGISTRY=https://registry.npmmirror.com
COREPACK_INTEGRITY_KEYS=0
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**注意**：`store-dir` 和 `cache-dir` 必须保留在全局 `.npmrc` 中。pnpm 只从 `.npmrc` 读取这两个配置，没有环境变量或其他替代途径。当 npm 不被直接调用时（即方案一实施后），这两个配置不会再触发警告。

### 方案三：`.npmrc` 重复条目清理（已实施）

项目 `.npmrc` 中存在以下重复的 `public-hoist-pattern` 条目：

- `@braintree/sanitize-url` — 出现 2 次
- `cytoscape` — 出现 2 次
- `cytoscape-cose-bilkent` — 出现 2 次

已将重复条目合并去重，并统一了引用来源注释。

## 补充说明

### `shamefully-hoist=true` 与 `public-hoist-pattern` 的关系

`shamefully-hoist=true` 等价于 `public-hoist-pattern=*`，即将**所有**依赖提升到根 `node_modules`。在该设置生效的前提下，单独配置的 `public-hoist-pattern[]` 条目实际上是**冗余**的。

当前保留这些条目的原因是：若未来移除 `shamefully-hoist=true`（改为更精确的依赖管理策略），`public-hoist-pattern` 条目可以作为已知需要提升的依赖清单，避免因缺少提升而导致运行时错误。

### 为什么 npm 开始发出这些警告

npm v10+ 开始对 `.npmrc` 中的未知配置项发出警告，并明确表示"在下一个 major 版本中将停止工作"。这意味着 npm v11+ 可能会直接**报错**而非警告。此举的目的是清理 `.npmrc` 中的非标准配置，推动各工具使用各自独立的配置机制。

### 影响评估

- **方案一实施后**：在正常的 `pnpm install` 流程中，全部 9 条警告将被消除
- **方案二实施后**：即使意外调用 npm，全局层面的 5 条环境变量警告也将消失
- **仍然可能出现警告的场景**：直接运行 `npm` 命令时（如 `npm login`），npm 仍会读取项目 `.npmrc` 并警告 pnpm 专有的 4 个配置项。但由于本项目强制使用 pnpm，这属于极少数场景

## 修改文件清单

| 文件                     | 修改内容                                                                                                               |
| :----------------------- | :--------------------------------------------------------------------------------------------------------------------- |
| `package.json`           | `preinstall` 脚本：不再使用 `npx`/`npm run`，改为 `node scripts/check-pnpm.mjs && corepack enable && corepack install` |
| `scripts/check-pnpm.mjs` | 新建文件，替代 `npx only-allow pnpm` 的 pnpm 包管理器校验功能                                                          |
| `.npmrc`                 | 去重 `public-hoist-pattern` 中的重复条目，合并引用来源注释                                                             |
