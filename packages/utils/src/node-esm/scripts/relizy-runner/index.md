# relizy-runner

`relizy` 的**历史兼容层**脚本。它最初主要服务于 `relizy@1.2.1` 一类版本：在执行 `relizy` 前补齐 Windows / independent 首次发版的前置条件，但**不改写** relizy 自身的版本计算与发版算法。

随着上游 PR [#53](https://github.com/LouisMazel/relizy/pull/53) 与 PR [#58](https://github.com/LouisMazel/relizy/pull/58) 合并，本文需要把 runner 的能力拆成两类来看：

1. **`release` / `bump` 的 `--yes` 预设**：当前仍然有效。对这两个子命令，若参数中尚未包含 `--yes`，runner 会在调用 relizy 前**自动追加** `--yes`，避免 bump 前交互确认在 CI 或非 TTY 下阻塞。若你需要本地逐步人工确认，请传入 runner 专用参数 **`--no-yes`**（不会转发给 relizy，且会关闭上述自动注入）。
2. **Windows GNU 工具补齐**：这是**历史兼容能力**。它只对**尚未包含** PR #58 的 relizy 版本仍然有意义；一旦你使用的 relizy 已经包含 PR #58，这部分能力就属于过时兜底。
3. **Independent 基线 tag 硬性预检**：这也是**历史兼容能力**。它同样只对**尚未包含** PR #58 的 relizy 版本仍然有意义；如果上游已支持 first-release bootstrap，这里的“先补 baseline tag 再继续”就不再是长期推荐路径。

## 先说结论：上游现在到底修没修？

截至 **2026-04-14**，结论要分三层说，不能简单写成一句“已经修了”：

| 观察面                            | 状态             | 说明                                                                                                                                                  |
| --------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 仓库历史里是否已经有修复          | **有**           | PR #53 与 PR #58 都已经合并                                                                                                                           |
| `main` / 最新稳定版是否已包含修复 | **没有全部包含** | `main` 当前仍指向 `v1.2.1`，发布时间是 **2026-03-19**，早于这两个 PR                                                                                  |
| 哪些分支或标签已经拿到修复        | **部分拿到**     | PR #53 已进入 `develop`，并出现在 `v1.2.2-beta.0`；PR #58 已合并到 `fix/windows-support`，但截至 2026-04-14 仍不在 `main`，也晚于 `v1.3.0-beta.0` tag |

换句话说：

- 如果你问的是“`LouisMazel/relizy` 这个仓库里有没有修复提交”，答案是：**有**。
- 如果你问的是“今天直接安装最新稳定版 npm 包就一定拿到了这些修复吗”，答案是：**不一定，至少最新稳定版 `v1.2.1` 还没有**。
- 如果你问的是“`relizy-runner` 文档里哪些能力应该标记为历史能力”，答案是：**Windows GNU 工具补齐**与**independent 基线 tag 硬性预检**都该标记为“随上游版本推进而过时”的内容。

## 两个关键 PR 分别修了什么？

### PR #53：修复 Windows 路径分隔符误报

上游 PR **[#53](https://github.com/LouisMazel/relizy/pull/53)**：

- 标题：`fix(repo): normalize path separators to POSIX before commit body matching`
- 合并日期：**2026-03-24**
- 合入分支：`develop`
- 已进入标签：`v1.2.2-beta.0`

它修复的是这类误报：

```text
× No packages to bump, no relevant commits found
```

根因是旧版本 relizy 在 `isCommitOfTrackedPackages` / `getPackageCommits` 里，用 Windows 的 `path.relative()` 结果去匹配 Git `--name-status` 的 POSIX 路径，导致：

- Git 输出是 `packages/admin/src/main.ts`
- Windows `relative()` 常得到 `packages\\admin`
- `commit.body.includes(relativePath)` 因分隔符不一致直接失败

PR #53 的修复方式，是先把 `relative(...)` 的结果做成 POSIX 风格，再参与 `includes` 匹配。这个修复同时覆盖了：

- `isCommitOfTrackedPackages`
- `getPackageCommits`

所以，**“Windows 路径分隔符误报”这个具体问题，已经被 PR #53 修掉了**。但前提是：**你实际使用的 relizy 版本必须已经包含 PR #53**。

### PR #58：修复 Windows GNU 管道依赖与首次 independent 发版 bootstrap

上游 PR **[#58](https://github.com/LouisMazel/relizy/pull/58)**：

- 标题：`fix: support Windows initial independent releases`
- 合并日期：**2026-04-13**
- 合入分支：`fix/windows-support`
- 截至 **2026-04-14** 的状态：**还不在 `main`，也晚于 `v1.3.0-beta.0` tag**

它补的是 PR #53 之外的另一半问题：

1. 去掉 Windows 纯 shell 环境下对 `grep` / `head` / `sed` 的剩余依赖，改成 `git tag --sort=-creatordate` 后在 Node.js 内过滤。
2. 让全新仓库 / 全新子包在没有 baseline tag 时，也能通过内部 `NEW_PACKAGE_MARKER` + bootstrap baseline 正常走首次 independent 发版。

这意味着：**一旦你使用的 relizy 版本真正包含 PR #58，runner 里的两类历史兼容能力就会明显过时**：

- Windows GNU 工具补齐
- “没有 baseline tag 就直接阻断”的硬性预检

## 现在还要不要用这个兼容层？

不要只看操作系统，更要先看你实际用的是哪一版 relizy。

| 你的 relizy 来源                                    | 是否还建议依赖 runner              | 原因                                                                                                                                |
| --------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `main` / 最新稳定版 `v1.2.1`                        | **仍然建议**                       | PR #53、PR #58 都还不在稳定版里                                                                                                     |
| 已包含 PR #53，但未包含 PR #58 的 beta / 分支       | **部分建议**                       | 路径分隔符误报已修，但 GNU 工具补齐与首次 bootstrap 仍可能需要 runner                                                               |
| 已包含 PR #58 的当前 canary / 分支（如本次 canary） | **仍需谨慎，不能直接删除 runner**  | 2026-04-14 的独立 worktree 测试表明：`1.3.0-canary.a8967ef.0` 在 brand-new independent first release 场景下仍未 end-to-end 成功     |
| 未来正式版且已重新通过同套矩阵验证                  | **才适合进一步降级这两类兼容能力** | 只有当 upstream 版本既包含修复、又真正通过“全新 monorepo + Windows + independent 首发”矩阵时，Windows GNU / baseline 两项才适合下调 |

也就是说，今天再介绍 `relizy-runner`，不应该继续把它写成“永远都必须存在的 relizy 伴生层”。更准确的表述应该是：

- 它是**为旧版 relizy 或尚未吃到上游修复的版本准备的过渡层**。
- 它的长期保留价值，更多在于**仓库级参数策略**（例如默认补 `--yes`），而不是继续替代上游的 Windows / bootstrap 逻辑。

## 为什么当前还有留存的必要性？

基于 `docs/reports/2026-04-14-relizy-canary-initial-independent-release-test.md` 的实测结果，截至 **2026-04-15**，这里还不能把 `relizy-runner` 直接写成“已经彻底过时，可以删除”。

那份报告的测试条件不是口头推测，而是一套明确的 A/B 矩阵：

1. 在**独立 git worktree** 内新建了一个全新的 pnpm monorepo。
2. 两套 sandbox 都**绕过 `relizy-runner`**，直接调用 `relizy@1.3.0-canary.a8967ef.0`。
3. sandbox A 保留正常 Windows PATH；sandbox B 则主动裁剪 PATH，确保 `bash`、`sh`、`sed`、`grep` 都不可见。
4. 验证目标同时覆盖：
   - `relizy changelog --dry-run`
   - `relizy release --dry-run`
   - 真实 `relizy release --no-publish --no-provider-release --no-push --yes`
5. 真实 release 的成功标准是：**必须同时生成 changelog、release commit、package tags**。

原因要分清楚：

1. **稳定版 relizy 仍未吃到全部修复**
   `main` / `latest` 仍停在 `v1.2.1`，PR #53 与 PR #58 都没有完整进入稳定版。对这类版本，runner 里的 `--yes` 预设、Windows GNU 工具补齐、baseline tag 预检依然有现实意义。
2. **即便切到包含 PR #58 的 canary，也还没有验证出“完全不需要 runner”**
   针对 `relizy@1.3.0-canary.a8967ef.0` 做过一次独立 worktree 的全新 monorepo 回归测试，结论不是“已经全通”，而是：
   - 去掉 runner 后，最初会先暴露 `origin` 缺失导致的 provider 推断崩溃；
   - 补了本地 bare `origin` 后，又统一失败在 `initialCommit^...main` 这个首次 independent release 的提交范围计算；
   - sandbox B 在 `bash`、`sh`、`sed`、`grep` 全部不可见时，仍然和 sandbox A 失败在同一处；
   - 两套 sandbox 最终都**没有生成 `CHANGELOG.md`、没有 release commit、没有 package tags**。
3. **runner 现在更像“保守默认值”而不是“永久算法补丁”**
   它不能修掉上游 relizy 自己的 `initialCommit^...main` 逻辑错误，但它仍然承担仓库级保守策略：统一补 `--yes`、在旧版 relizy 下补环境、在文档与技能里保留对首发风险的显式提醒。

所以，当前保留 runner 的准确理由不是“它已经证明自己永远不可替代”，而是：

- **上游稳定版还没全量修完**
- **canary 也还没通过 brand-new independent first release 的 end-to-end 验证**
- **仓库侧仍然需要一个保守、统一、可解释的调用入口**

同样要强调：**“仍需留存”不等于“runner 已经修掉上游 bug”**。这两个判断必须分开。当前 runner 的价值，是继续充当**过渡期的兼容入口与策略包装层**；等 upstream 真正修完并重新通过整套矩阵，再讨论是否进一步降级它的必要性，才是更稳妥的路径。

## 这份报告对本文的直接影响

`docs/reports/2026-04-14-relizy-canary-initial-independent-release-test.md` 给本文带来的，不是“runner 被证明永远必要”，而是更克制的三条结论：

1. **不能只因为 PR #58 已合并，就把本文里的兼容说明全部删除。**
2. **不能把 `1.3.0-canary.a8967ef.0` 误写成“已经足以替代 runner 的版本”。**
3. **本文必须把 runner 描述成“过渡期兼容入口”，而不是“永久修补 relizy 的上游替代品”。**

所以，当前这份文档的写法故意保留了两个层次：

- 一方面明确说明：Windows GNU 工具补齐与 baseline tag 预检，属于**会随 upstream 演进而过时的历史兼容能力**；
- 另一方面也明确写出：**在 2026-04-14 这次实测里，当前 canary 还没证明这些能力已经可以整体移除**。

## 关于 Windows 下的误报「No packages to bump」

如果你在 **Windows + independent monorepo** 下遇到：

```text
× No packages to bump, no relevant commits found
```

先不要立刻把它理解成「确实没有待发版改动」，但也不要再把所有同名报错都归因于历史上的路径分隔符故障。正确判断顺序应该是：

1. 先确认当前 relizy 版本是否已经包含 PR #53。
2. 若**未包含**，优先把这条报错视为“可能命中历史上的 Windows 路径分隔符误报”。
3. 若**已经包含** PR #53，再去检查是否真的没有可 bump 的提交、`types` 白名单是否过滤掉了最近的 `feat` / `fix`，以及是否还命中了 PR #58 修复前的首次 bootstrap / GNU 工具问题。
4. 若**已经包含** PR #58，再出现同名报错时，就不应再优先怀疑 runner 或旧版 Windows 兼容 bug，而应优先检查当前配置与提交本身。

这一节的目的，是避免把三个问题混为一谈：

- 历史上的 **Windows 路径分隔符误报**（PR #53）
- 历史上的 **GNU 管道依赖 / 首次 independent bootstrap**（PR #58）
- 当前仓库真实存在的 **无可 bump 提交 / 配置过滤 / 类型白名单** 问题

## 这和 relizy-runner 的关系是什么？

这里要区分清楚：

- `relizy-runner` **负责**：仓库级参数包装（默认补 `--yes`）、旧版 relizy 的 Windows GNU 工具补齐、旧版 relizy 的 baseline tag 预检
- `relizy-runner` **不负责**：改写 relizy 自身的 bump 计算、commit 过滤、版本推导、first-release 语义

所以：

- 在**旧版** relizy 上，runner 只是“补环境、补前置校验”，并**不能替代** PR #53 的路径分隔符修复。
- 在**新版且已包含 PR #58** 的 relizy 上，runner 里的 GNU / baseline 两项又会逐渐显得**过时**，因为这些逻辑本来就应该由上游 relizy 自己承担。

## 顺带结论：`move-vercel-output-to-root` 不是这次过时点

`move-vercel-output-to-root` 是 **Vercel 构建产物路径兼容脚本**，不是 relizy 发版算法的一部分。它和 PR #53 / #58 的关系是：

- **没有直接关系**
- **没有被这两个 PR 废弃**
- 只是随着 Vercel 官方提供 `rootDirectory`、`sourceFilesOutsideRootDirectory`、`vercel build --output` 等能力，它的适用面比最初更窄了

更准确的评价是：

- 它**不是像 relizy-runner 的 GNU / baseline 两项那样“被上游 relizy 修复后直接过时”**
- 它只是变成了一个**更偏工作流、而不是平台刚需**的脚本

如果你的 Vercel 工作流已经能直接用官方 `rootDirectory` / `outputDirectory` / `vercel build --output` 解决 `.vercel/output` 位置问题，通常就不再需要它；但对那些仍然先在子包里跑框架原生构建、再统一从 monorepo 根目录做 prebuilt 部署的流程，它依然有存在价值

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

## 首次接入 independent 模式（旧版 relizy 的历史流程）

如果你使用的 relizy **尚未包含** PR #58，那么首次接入 independent 时，仍应按旧流程先补基线 tag（版本号以当前 `package.json` 为准）。此时 relizy-runner 会在 `release` / `bump` 前自动检查，若缺少基线 tag 会打印类似以下命令：

```bash
git tag "@my-scope/admin@1.0.0"
git tag "@my-scope/type@0.1.0"
git push origin "@my-scope/admin@1.0.0" "@my-scope/type@0.1.0"
```

执行上述命令补齐基线 tag 后，即可继续旧版 relizy 的发版流程。

如果你使用的 relizy **已经包含** PR #58，请优先以该版本的 first-release bootstrap 行为为准，不要再把“必须手工补 baseline tag”视为唯一正确流程。

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
