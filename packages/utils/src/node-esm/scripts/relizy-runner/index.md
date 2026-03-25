# relizy-runner

`relizy` 发版兼容层脚本。在执行 `relizy` 前做前置处理，**不改变** relizy 自身的发版与版本计算逻辑：

1. **Windows GNU 工具补齐**：Windows 下自动补齐 Git for Windows 的 `usr\bin` 路径，避免 relizy 内部调用 `grep` / `head` / `sed` 失败。
2. **Independent 基线 tag 检查**：在 `release` / `bump` 前校验 independent 基线 tag，缺失时打印补打命令并终止。
3. **`release` / `bump` 的 `--yes` 预设**：对这两个子命令，若参数中尚未包含 `--yes`，runner 会在调用 relizy 前**自动追加** `--yes`，避免 bump 前交互确认在 CI 或非 TTY 下阻塞。若你需要本地逐步人工确认，请传入 runner 专用参数 **`--no-yes`**（不会转发给 relizy，且会关闭上述自动注入）。背景可参考各业务仓 README「Relizy 发版」与 relizy 文档中的 _Skip confirmation prompt_。

## 为什么需要这个兼容层？

不是所有接入 `relizy` 的项目都必须额外包一层脚本。若项目已运行在 **Linux / macOS / CI**，且每个子包都已有完整的独立 **package tag** 历史，可以直接执行 `relizy release ...`。

但只要命中以下**任一**条件，就建议使用本兼容层：

- 需要在 **Windows 本地**直接执行发版命令。`relizy` 在 independent 模式下会直接调用 `grep` / `head` / `sed` 处理 git tag；Git Bash 或 CI 通常无妨，但 **PowerShell / cmd** 下不一定天然可用。
- **首次接入** independent，仓库里还没有每个子包各自的**基线 tag**。此时 `relizy` 需要先知道每个包从哪个 `@scope/pkg@x.y.z` tag 起算后续变更。

## 关于 Windows 下的误报「No packages to bump」

如果你在 **Windows + independent monorepo** 下遇到：

```text
× No packages to bump, no relevant commits found
```

先不要立刻把它理解成「确实没有待发版改动」。这条报错历史上有过一类**误报**，根因不在 runner，而在 relizy 自身的包级提交过滤逻辑。

### 为什么会误报？

旧版本 relizy 在 `isCommitOfTrackedPackages` / `getPackageCommits` 里，会拿：

- `path.relative(cwd, pkg.path)` 算出来的包相对路径
- 去匹配 `git log --name-status` 产生的 `commit.body`

问题在于：

- Git 的 `--name-status` 输出始终是 **POSIX 正斜杠**，例如 `packages/admin/src/main.ts`
- `path.relative()` 在 Windows 上通常返回 **反斜杠路径**，例如 `packages\\admin`
- 于是 `commit.body.includes(relativePath)` 在 Windows 上会直接返回 `false`

结果就是：明明有 `feat` / `fix` 提交命中了某个包，但 relizy 仍把该包的 commits 过滤空，最终退化成 `No packages to bump`。

### 这个故障在哪个 PR 修复了？

这个问题已经在上游 PR **[#53](https://github.com/LouisMazel/relizy/pull/53)** 修复：

- 标题：`fix(repo): normalize path separators to POSIX before commit body matching`
- 合并时间：**2026-03-24**
- 修复方式：在 `src/core/repo.ts` 中，把 `relative(...)` 的结果先做 `.split(sep).join("/")`，再参与 `includes` 匹配
- 覆盖范围：同时修复了 `isCommitOfTrackedPackages` 与 `getPackageCommits`
- 验证补充：同一个 PR 还加入了 Windows 路径分隔符回归测试

公开可验证的修复依据以上游 PR 为准：<https://github.com/LouisMazel/relizy/pull/53>

### 这和 relizy-runner 的关系是什么？

这里要区分清楚：

- `relizy-runner` **负责** Windows GNU 工具补齐、independent 基线 tag 预检、`release` / `bump` 默认补 `--yes`
- `relizy-runner` **不负责** 改写 relizy 自身的 bump 计算、commit 过滤、版本推导逻辑

也就是说，如果你使用的 relizy 版本**尚未包含** PR #53 的修复，那么即便走 `relizy-runner`，仍可能看到这类误报。因为 runner 的设计目标就是在执行前补环境、补前置校验，而不是偷偷篡改上游 release 算法。

### 现在遇到这条报错，应该怎么判断？

可以按下面顺序排查：

1. 先确认当前 relizy 版本是否已包含 PR #53。
2. 如果还没包含，优先升级到带修复的版本，或对 relizy 做临时 patch。
3. 如果已经包含，再检查是否真的是「没有可 bump 的提交」。
4. 若仓库使用了自定义 `types` 白名单，也要确认最近提交的 `feat` / `fix` 等类型没有被配置过滤掉。

这一节的目的，是避免把「Windows 路径分隔符误报」和 runner 当前仍承担的「GNU 工具补齐 / baseline tag 预检」混为一谈。

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

## runner 专用参数

| 参数       | 含义                                                                            |
| ---------- | ------------------------------------------------------------------------------- |
| `--no-yes` | 关闭 `release` / `bump` 的自动 `--yes`，恢复 relizy 交互确认；不会传给 relizy。 |

## relizy 常用参数（透传）

以下参数由 relizy 本身处理；除 `--no-yes` 外，relizy-runner 仅负责透传（并在 `release` / `bump` 上按需追加 `--yes`）：

| 参数                                 | 含义                                                                                   |
| ------------------------------------ | -------------------------------------------------------------------------------------- |
| `--dry-run`                          | 预览，不写文件、不打 tag、不提交、不 publish                                           |
| `--no-push`                          | 不 push 到远端                                                                         |
| `--no-publish`                       | 不执行 npm publish                                                                     |
| `--no-provider-release`              | 不在 GitHub/GitLab 创建 Release                                                        |
| `--no-commit`                        | 不创建提交与 tag（与其它跳过项组合使用）                                               |
| `--no-changelog`                     | 不生成 changelog 文件                                                                  |
| `--no-verify`                        | 提交时跳过 git hooks                                                                   |
| `--yes`                              | 跳过 relizy 确认提示；`release` / `bump` 下 runner 也会自动追加（除非使用 `--no-yes`） |
| `--major` / `--minor` / `--patch` 等 | 指定 semver 升级策略                                                                   |

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

// 运行 relizy（release / bump 会自动追加 --yes，除非传入 --no-yes）
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
