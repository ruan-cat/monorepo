# Windows 兼容与 Runner 安全层

## Runner 是推荐的默认策略

Runner 同时解决两个独立的、在任意 monorepo 中都可能出现的问题：

| 问题                             | 机制                                                                  | 适用场景             |
| -------------------------------- | --------------------------------------------------------------------- | -------------------- |
| Windows `grep`/`head`/`sed` 缺失 | `ensureRelizyShellEnv()` 注入 Git for Windows 的 `usr/bin` 到 PATH    | Windows 开发环境     |
| Baseline package tags 缺失       | `getPackagesMissingBootstrapTags()` 预检，缺失则阻断并打印补 tag 指令 | 任意操作系统首次接入 |

**第二个问题与操作系统无关**。这是为什么 runner 应该成为**默认安全层**——而不只是「Windows 专属选项之一」。

## 放弃 runner 的前提条件

只有同时满足以下全部条件，才可以考虑不使用 runner：

1. 开发与 CI 环境均为 Linux/macOS（已验证无 Unix 工具依赖问题）。
2. 所有目标子包已手工确认具备 `@scope/pkg@x.y.z` baseline tag。
3. 团队已建立可靠的机制，确保每次新增子包后都会及时打 baseline tag。
4. 已在目标环境完成过至少一次成功的 `relizy release --dry-run`。

若无法确认以上全部条件，应保留 runner。

## pnpm patch 的定位

`pnpm patch` 修补上游 relizy 是另一种解决 Windows GNU 工具问题的方式。它**不解决 baseline tag 缺失**。选用场景：

- 不希望在仓库内维护一个 runner 脚本与配套测试。
- 团队对 pnpm patch 工作流更熟悉。
- 已在非 runner 流程中解决了 baseline tag 问题。

使用 pnpm patch 时需额外：

- 记录 `pnpm.patchedDependencies` 中 relizy 的精确版本。
- 升级 relizy 后重新评估 patch 是否仍然适用。
- 手工维护 baseline tag 检查流程（见 [`baseline-tags.md`](baseline-tags.md)）。

## Runner 落地步骤（简要）

详细可复制模板见 [`templates/relizy-runner.ts`](../templates/relizy-runner.ts)。

1. 复制模板到 `scripts/relizy-runner.ts`。
2. 按仓库的 workspace 目录修改 `getWorkspacePackages()` 中的扫描路径。
3. 在 `devDependencies` 中加入 `tsx`（用于执行 runner）。
4. 将根 `package.json` 的 `release` / `bump` 脚本指向 runner：`tsx scripts/relizy-runner.ts release`。
5. 编写最小测试覆盖 `buildBootstrapInstructions` 与 `shouldCheckIndependentBootstrap`（可参考已验证原型的测试文件结构）。
