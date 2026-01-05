<!-- Anthropic 模型生成的报告 不删除 -->

# 2025-01-05 npm 配置警告分析与解决方案

## 问题概述

在项目中运行 npm 命令时出现多个配置警告，提示某些配置项将在下一个主要版本的 npm 中停止工作。

## 警告日志

```log
npm warn Unknown project config "link-workspace-packages". This will stop working in the next
major version of npm.
npm warn Unknown project config "shamefully-hoist". This will stop working in the next major version of npm.
npm warn Unknown project config "public-hoist-pattern". This will stop working in the next major version of npm.
npm warn Unknown project config "ignore-workspace-root-check". This will stop working in the next major version of npm.
npm warn Unknown user config "COREPACK_NPM_REGISTRY". This will stop working in the next major version of npm.
npm warn Unknown user config "COREPACK_INTEGRITY_KEYS". This will stop working in the next major version of npm.
npm warn Unknown user config "NODE_TLS_REJECT_UNAUTHORIZED". This will stop working in the next major version of npm.
npm warn Unknown user config "store-dir". This will stop working in the next major version of
npm.
npm warn Unknown user config "cache-dir". This will stop working in the next major version of
npm.
```

## 根本原因分析

### 1. 包管理器混用问题

本项目是一个基于 **pnpm workspace** 的 monorepo 项目，但警告是由 **npm** 命令触发的。核心问题在于：

1. npm 读取了包含 pnpm 专有配置的 `.npmrc` 文件
2. npm 无法识别这些 pnpm 特有的配置项，因此产生警告

### 2. 配置项分类

#### 2.1 项目级 pnpm 专有配置（`.npmrc`）

这些配置来自项目根目录的 `.npmrc` 文件，都是 pnpm 的专有配置：

1. **link-workspace-packages=deep**
   - 用途：允许 monorepo 中的包互相引用
   - pnpm 文档：https://pnpm.io/zh/cli/recursive#--link-workspace-packages
   - npm 不支持此配置

2. **shamefully-hoist=true**
   - 用途：将依赖提升到根目录的 node_modules，解决某些包的依赖查找问题
   - 使用场景：修复 vitepress-plugin-mermaid 的问题
   - npm 不支持此配置

3. **public-hoist-pattern[]=...**
   - 用途：指定特定包的提升模式
   - 使用场景：解决 vitepress-plugin-mermaid、eslint、prettier 等包的依赖问题
   - npm 不支持此配置

4. **ignore-workspace-root-check=true**
   - 用途：允许在工作区根目录安装包，无需 -w 选项
   - pnpm 文档：https://pnpm.io/zh/cli/add#--ignore-workspace-root-check
   - npm 不支持此配置

#### 2.2 全局级配置问题（`C:\Users\pc\.npmrc`）

这些配置来自用户全局的 `.npmrc` 文件，存在以下问题：

1. **环境变量误放入 `.npmrc`**
   - `COREPACK_NPM_REGISTRY=https://registry.npmmirror.com/`
   - `COREPACK_INTEGRITY_KEYS=0`
   - `NODE_TLS_REJECT_UNAUTHORIZED=0`

   问题：这些是**环境变量**，不应该放在 `.npmrc` 文件中。`.npmrc` 文件用于配置 npm/pnpm 的行为，而环境变量应该在系统环境变量中设置。

2. **pnpm 专有配置**
   - `store-dir=F:\store\pnpm\store` - pnpm 的存储目录配置
   - `cache-dir=F:\store\pnpm\pnpm-cache` - pnpm 的缓存目录配置

   问题：这些是 pnpm 专有配置，npm 无法识别。

### 3. 为什么会出现这些警告？

1. **包管理器混用**：项目应该使用 pnpm，但可能执行了 npm 命令（如 `npm install`、`npm run` 等）
2. **配置文件共享**：npm 和 pnpm 都会读取 `.npmrc` 文件，但它们支持的配置项不同
3. **环境变量误用**：将环境变量写入了 `.npmrc` 文件中

## 解决方案

### 方案一：确保只使用 pnpm（推荐）

本项目已经在 `package.json` 中配置了强制使用 pnpm：

```json
{
	"scripts": {
		"preinstall": "npx only-allow pnpm"
	},
	"packageManager": "pnpm@10.17.0"
}
```

**操作建议：**

1. **完全停止使用 npm 命令**，改用 pnpm：
   - `npm install` → `pnpm install`
   - `npm run dev` → `pnpm dev`
   - `npm test` → `pnpm test`

2. **项目的 `.npmrc` 保持不变**
   - 这些 pnpm 配置对项目正常运行是必需的
   - pnpm 能够正确识别和处理这些配置

3. **全局 `.npmrc` 需要清理**（见方案二）

### 方案二：清理全局配置文件

#### 2.1 移除环境变量

将 `C:\Users\pc\.npmrc` 中的以下行**删除**，并将它们添加到系统环境变量中：

需要删除的行：

```ini
COREPACK_NPM_REGISTRY=https://registry.npmmirror.com/
COREPACK_INTEGRITY_KEYS=0
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**添加到系统环境变量的方法：**

Windows PowerShell 方式：

```powershell
# 临时设置（当前会话）
$env:COREPACK_NPM_REGISTRY = "https://registry.npmmirror.com/"
$env:COREPACK_INTEGRITY_KEYS = "0"
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0"

# 永久设置（推荐）
[System.Environment]::SetEnvironmentVariable("COREPACK_NPM_REGISTRY", "https://registry.npmmirror.com/", "User")
[System.Environment]::SetEnvironmentVariable("COREPACK_INTEGRITY_KEYS", "0", "User")
[System.Environment]::SetEnvironmentVariable("NODE_TLS_REJECT_UNAUTHORIZED", "0", "User")
```

或通过系统设置 GUI：

1. 右键"此电脑" → 属性 → 高级系统设置
2. 环境变量 → 用户变量 → 新建
3. 添加上述三个变量

#### 2.2 保留或移除 pnpm 配置

`C:\Users\pc\.npmrc` 中的 pnpm 配置：

```ini
store-dir=F:\store\pnpm\store
cache-dir=F:\store\pnpm\pnpm-cache
```

**选项 A：保留**（如果全局使用 pnpm）

- 如果你在所有项目中都使用 pnpm，可以保留这些配置
- pnpm 会正确识别这些配置
- npm 会警告，但不影响功能

**选项 B：移除**（如果混用 npm 和 pnpm）

- 删除这两行，让 pnpm 使用默认存储位置
- 或者创建一个独立的 `.pnpmrc` 文件（虽然 pnpm 主要读取 `.npmrc`）

#### 2.3 清理后的全局 `.npmrc` 示例

推荐的 `C:\Users\pc\.npmrc` 内容：

环境变量移到系统环境变量中，不再放在 `.npmrc` 文件里。

### 方案三：项目级别强化 pnpm 使用

在项目 `package.json` 中（已存在，无需修改）：

```json
{
	"scripts": {
		"preinstall": "npx only-allow pnpm"
	},
	"packageManager": "pnpm@10.17.0",
	"engines": {
		"node": ">=22.14.0",
		"pnpm": ">=10.0.0"
	}
}
```

这样可以确保：

1. 任何人运行 `npm install` 时会被阻止
2. 强制使用 pnpm 10.17.0
3. 确保 Node.js 版本符合要求

## 如何避免这些警告？

### 1. 立即执行的措施

1. **只使用 pnpm 命令**

   ```bash
   # 错误示例
   npm install
   npm run build

   # 正确示例
   pnpm install
   pnpm build
   ```

2. **清理全局 `.npmrc` 文件**
   - 移除环境变量配置
   - 将环境变量添加到系统环境变量中

3. **确认 preinstall 钩子生效**
   - 项目已配置 `npx only-allow pnpm`
   - 如果有人尝试使用 npm，会被阻止

### 2. 长期最佳实践

1. **配置文件规范**
   - `.npmrc` 仅用于包管理器配置
   - 环境变量放在系统环境变量或 `.env` 文件中
   - 区分通用配置和包管理器专有配置

2. **Monorepo 项目规范**
   - 明确文档说明使用 pnpm
   - 在 README.md 中说明包管理器要求
   - 使用 packageManager 字段锁定版本

3. **团队协作规范**
   - 统一使用同一包管理器
   - 配置编辑器插件（如 VSCode 可以配置默认终端命令）
   - 在 CI/CD 中明确使用 pnpm

## 迁移检查清单

- [ ] 确认项目中没有人使用 npm 命令
- [ ] 清理全局 `C:\Users\pc\.npmrc` 文件
  - [ ] 删除 COREPACK_NPM_REGISTRY
  - [ ] 删除 COREPACK_INTEGRITY_KEYS
  - [ ] 删除 NODE_TLS_REJECT_UNAUTHORIZED
- [ ] 将环境变量添加到系统环境变量
  - [ ] COREPACK_NPM_REGISTRY
  - [ ] COREPACK_INTEGRITY_KEYS
  - [ ] NODE_TLS_REJECT_UNAUTHORIZED
- [ ] 决定全局 pnpm 配置的处理方式
  - [ ] 保留 store-dir 和 cache-dir（如果全局使用 pnpm）
  - [ ] 或删除它们使用默认配置
- [ ] 项目 `.npmrc` 保持不变（无需修改）
- [ ] 测试：运行 `pnpm install` 确认无警告
- [ ] 文档：更新 README.md 说明包管理器要求

## 总结

这些警告的根本原因是**在 pnpm 项目中使用了 npm 命令**。解决方案很简单：

1. **项目层面**：只使用 pnpm 命令，项目的 `.npmrc` 配置无需修改
2. **全局层面**：清理 `C:\Users\pc\.npmrc` 文件，将环境变量移到系统环境变量中

执行这些更改后，警告将完全消失。
