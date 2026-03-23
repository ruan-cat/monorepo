# relizy-runner

`relizy` 发版兼容层脚本。在执行 `relizy` 前做两件前置处理，**不改变** relizy 自身的发版与版本计算逻辑：

1. **Windows GNU 工具补齐**：Windows 下自动补齐 Git for Windows 的 `usr\bin` 路径，避免 relizy 内部调用 `grep` / `head` / `sed` 失败。
2. **Independent 基线 tag 检查**：在 `release` / `bump` 前校验 independent 基线 tag，缺失时打印补打命令并终止。

## 为什么需要这个兼容层？

不是所有接入 `relizy` 的项目都必须额外包一层脚本。若项目已运行在 **Linux / macOS / CI**，且每个子包都已有完整的独立 **package tag** 历史，可以直接执行 `relizy release ...`。

但只要命中以下**任一**条件，就建议使用本兼容层：

- 需要在 **Windows 本地**直接执行发版命令。`relizy` 在 independent 模式下会直接调用 `grep` / `head` / `sed` 处理 git tag；Git Bash 或 CI 通常无妨，但 **PowerShell / cmd** 下不一定天然可用。
- **首次接入** independent，仓库里还没有每个子包各自的**基线 tag**。此时 `relizy` 需要先知道每个包从哪个 `@scope/pkg@x.y.z` tag 起算后续变更。

## ⚠️ 重要：必须使用 bin 命令调用

> [!CAUTION]
> **禁止**使用 `tsx @ruan-cat/utils/relizy-runner` 方式调用本脚本。
>
> 这种写法会导致 `ERR_MODULE_NOT_FOUND` 错误。原因是 `tsx`/`node` 等运行时的 CLI 参数只解释为**文件系统路径**，不会触发 `node_modules` 内 `package.json` 的 `exports` 模块解析。

本包通过标准的 `bin` 字段提供可执行命令，安装 `@ruan-cat/utils` 后即可直接调用。

## 安装

作为 monorepo 内的 workspace 依赖引用：

```json
{
	"devDependencies": {
		"@ruan-cat/utils": "workspace:^"
	}
}
```

或者作为 npm 包安装：

```bash
pnpm add -D @ruan-cat/utils
```

同时确保项目安装了 `relizy`：

```bash
pnpm add -D relizy
```

## 使用方式

### 方式一：通过快捷命令（推荐）

安装本包后，`relizy-runner` 命令自动注册到 `node_modules/.bin`：

```bash
npx relizy-runner release --no-publish --no-provider-release
```

### 方式二：通过统一入口命令

```bash
npx ruan-cat-utils relizy-runner release --no-publish --no-provider-release
```

两种方式完全等价。

## 在 monorepo 根 package.json 中配置

在 monorepo 根目录的 `package.json` 中，推荐如下配置：

```json
{
	"scripts": {
		"release": "relizy-runner release --no-publish --no-provider-release",
		"release:relizy": "relizy-runner release --no-publish --no-provider-release"
	}
}
```

> 通过 pnpm 脚本向 relizy 追加参数时，使用 `--` 分隔：
>
> ```bash
> pnpm release:relizy -- --patch --dry-run --no-clean
> ```

## 常用命令示例

```bash
# 正式发版（默认行为）
pnpm release

# 仅预览 changelog 生成（不写盘、不改仓库）
relizy-runner changelog --dry-run

# 预览完整 release 流程
relizy-runner release --dry-run --no-publish --no-provider-release

# 仅本地生成提交与 tag、不 push
relizy-runner release --no-publish --no-provider-release --no-push

# 指定 semver 升级策略
pnpm release:relizy -- --patch
pnpm release:relizy -- --minor
```

## relizy 常用参数（透传）

以下参数由 relizy 本身处理，relizy-runner 仅负责透传：

| 参数                                 | 含义                                         |
| ------------------------------------ | -------------------------------------------- |
| `--dry-run`                          | 预览，不写文件、不打 tag、不提交、不 publish |
| `--no-push`                          | 不 push 到远端                               |
| `--no-publish`                       | 不执行 npm publish                           |
| `--no-provider-release`              | 不在 GitHub/GitLab 创建 Release              |
| `--no-commit`                        | 不创建提交与 tag（与其它跳过项组合使用）     |
| `--no-changelog`                     | 不生成 changelog 文件                        |
| `--no-verify`                        | 提交时跳过 git hooks                         |
| `--major` / `--minor` / `--patch` 等 | 指定 semver 升级策略                         |

查看 relizy 全部选项与子命令：

```bash
relizy-runner --help
npx relizy --help
npx relizy release --help
```

## 首次接入 independent 模式

首次接入 independent 前需补基线 tag（版本号以当前 `package.json` 为准）。relizy-runner 会在 `release` / `bump` 前自动检查，若缺少基线 tag 会打印类似以下命令：

```bash
git tag "@my-scope/admin@1.0.0"
git tag "@my-scope/type@0.1.0"
git push origin "@my-scope/admin@1.0.0" "@my-scope/type@0.1.0"
```

执行上述命令补齐基线 tag 后，即可正常发版。

## 配套 relizy.config.ts

relizy-runner 不要求特定的 `relizy.config.ts` 配置，但推荐配合 `pnpm-workspace-yaml` 解析工作区清单：

```typescript
import { readFileSync } from "node:fs";
import { defineConfig } from "relizy";
import { parsePnpmWorkspaceYaml } from "pnpm-workspace-yaml";

const workspaceYaml = parsePnpmWorkspaceYaml(readFileSync("pnpm-workspace.yaml", "utf8"));
const workspacePackages = (workspaceYaml.toJSON().packages ?? []).filter((p) => !p.startsWith("!"));

export default defineConfig({
	monorepo: {
		packages: workspacePackages,
		versionMode: "independent",
	},
	publish: false,
	providerRelease: false,
});
```

## 编程式调用

如果需要在 TypeScript/JavaScript 代码中调用本脚本的功能：

```typescript
import { runRelizyRunner, getWorkspacePackages, buildBootstrapInstructions } from "@ruan-cat/utils/node-esm";

// 运行 relizy
const exitCode = runRelizyRunner(["release", "--no-publish", "--no-provider-release"]);

// 获取工作区包信息
const packages = getWorkspacePackages();

// 生成基线 tag 提示
const instructions = buildBootstrapInstructions(packages);
```

## 自动化测试

```bash
pnpm exec vitest run packages/utils/src/node-esm/scripts/relizy-runner/index.test.ts
```
