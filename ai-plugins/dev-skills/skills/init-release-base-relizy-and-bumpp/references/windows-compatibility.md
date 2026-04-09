# Windows 兼容与 Runner 安全层

## Runner 是推荐的默认策略

Runner 同时解决两个独立的、在任意 monorepo 中都可能出现的问题：

| 问题                             | 机制                                                                  | 适用场景             |
| -------------------------------- | --------------------------------------------------------------------- | -------------------- |
| Windows `grep`/`head`/`sed` 缺失 | `ensureRelizyShellEnv()` 注入 Git for Windows 的 `usr/bin` 到 PATH    | Windows 开发环境     |
| Baseline package tags 缺失       | `getPackagesMissingBootstrapTags()` 预检，缺失则阻断并打印补 tag 指令 | 任意操作系统首次接入 |

**第二个问题与操作系统无关**。这是为什么 **`relizy-runner`（`@ruan-cat/utils`）** 应该成为**默认安全层**——而不只是「Windows 专属选项之一」。

## 放弃 `relizy-runner` 的前提条件

只有同时满足以下全部条件，才可以考虑不使用 **`relizy-runner`**：

1. 开发与 CI 环境均为 Linux/macOS（已验证无 Unix 工具依赖问题）。
2. 所有目标子包已手工确认具备 `@scope/pkg@x.y.z` baseline tag。
3. 团队已建立可靠的机制，确保每次新增子包后都会及时打 baseline tag。
4. 已在目标环境完成过至少一次成功的 `relizy release --dry-run`。

若无法确认以上全部条件，应保留 **`relizy-runner`**。

## pnpm patch 的定位

`pnpm patch` 修补上游 relizy 是另一种解决 Windows GNU 工具问题的方式。它**不解决 baseline tag 缺失**。选用场景：

- 不希望增加 `@ruan-cat/utils` 依赖、也不愿使用其 `relizy-runner` bin。
- 团队对 pnpm patch 工作流更熟悉。
- 已在非 `relizy-runner` 流程中解决了 baseline tag 问题。

使用 pnpm patch 时需额外：

- 记录 `pnpm.patchedDependencies` 中 relizy 的精确版本。
- 升级 relizy 后重新评估 patch 是否仍然适用。
- 手工维护 baseline tag 检查流程（见 [`baseline-tags.md`](baseline-tags.md)）。

## `relizy-runner` 落地步骤（简要）

**不要**在目标仓库新建本地 runner 脚本。按 **`@ruan-cat/utils`** 文档操作：

1. 安装依赖：在目标仓库执行 `pnpm add -D @ruan-cat/utils relizy`（或与该仓库包管理器等价的安装命令）。
2. 将根 `package.json` 的 `release` / `changelog` 脚本指向 **`relizy-runner` bin**，并在**脚本中显式附加 `--yes`**（例如 `relizy-runner release --no-publish --no-provider-release --yes`，`changelog` 示例见 [`templates/config-writer.md`](../templates/config-writer.md)）。**禁止**使用 `tsx @ruan-cat/utils/relizy-runner` 等非 bin 写法（见 `packages/utils/.../relizy-runner/index.md`）。
3. 工作区包发现与基线 tag 预检由包内实现驱动；确保根目录存在 **`pnpm-workspace.yaml`**，且与 `relizy.config.ts` 的 `monorepo.packages` 一致。
4. 完整说明、常用命令与编程式 API 见 `packages/utils/src/node-esm/scripts/relizy-runner/index.md`。
