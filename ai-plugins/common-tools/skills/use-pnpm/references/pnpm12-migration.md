# pnpm 12 断代差异与迁移清单

pnpm 12（2026-08-26 发布，Rust 重写）对 pnpm 10/11 的命令、flags、lockfile 格式（9.0）保持兼容，但有四类「语义收紧」会让旧仓库在新版本下安装、构建或 CI 失败。本清单来自 18 个仓库批量升级的实证。

## 0. 快速判定：是不是撞上了 pnpm 12 收紧

安装或 CI 失败时，按错误关键词对号入座：

| 错误/现象                                  | 对应章节 |
| ------------------------------------------ | -------- |
| `ERR_PNPM_IGNORED_BUILDS`                  | 1        |
| `ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS` | 2        |
| `blockExoticSubdeps` 拦截 URL/git 依赖     | 3        |
| `ERR_PNPM_MISSING_TARBALL_INTEGRITY`       | 3        |
| `.npmrc` 设置项疑似不生效                  | 4        |
| `pnpm.overrides` 在 package.json 里被无视  | 4        |

## 1. 构建脚本审批：警告变硬错误

- pnpm 10 时代「Ignored build scripts」只是警告；pnpm 12 下是 `ERR_PNPM_IGNORED_BUILDS` 硬错误，install 直接失败。
- 旧字段 `onlyBuiltDependencies` **不再授予**构建权限；授权表是 `allowBuilds`（map 语法）：

```yaml
# pnpm-workspace.yaml
allowBuilds:
  esbuild: true
  simple-git-hooks: true
```

- 非交互批准全部待审批依赖：`pnpm approve-builds --all`（批准状态会写入项目配置文件，进 git diff，可审查）。全局场景的交互审批纪律仍遵守 [`global-upgrade-checklist.md`](global-upgrade-checklist.md)，禁止 `--all` 兜底。

## 2. pnpm-workspace.yaml 未知键报错

- 拼写错误的设置项不再被静默忽略：pin 了 pnpm 版本且运行版本满足 pin 时，`ERR_PNPM_UNRECOGNIZED_WORKSPACE_SETTINGS` 直接失败。
- 修复方向是核对字段名，不是关闭报错。

## 3. 供应链：异种依赖与 integrity

- `blockExoticSubdeps`（pnpm 12 默认收紧）拦截**传递依赖**里的 URL/git 型依赖（如 `xlsx@https://cdn.sheetjs.com/...`、git 形式的 webpack）。直接声明在 package.json 里的 URL 依赖合法。
- 确属刻意异种依赖时，在 `pnpm-workspace.yaml` 显式放行并注释原因：

```yaml
blockExoticSubdeps: false
```

- 旧 lockfile 里 URL 条目没有 `integrity` 字段时，pnpm 12 校验直接失败（`ERR_PNPM_MISSING_TARBALL_INTEGRITY`）。修复不是手改 lockfile，而是重建：

```bash
pnpm clean --lockfile   # 移除 node_modules 与 pnpm-lock.yaml（git 跟踪的 lockfile 可随时恢复）
pnpm install            # 全新 resolution，新 lockfile 会带上 integrity
```

## 4. 配置读取位置迁移（最大面积)

pnpm 12 **不再读取**两处旧位置的设置，全部迁到 `pnpm-workspace.yaml`（camelCase）：

| 旧位置                                                                                                                             | 失效表现                                              | 迁移后                                                                           |
| ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| `.npmrc` 的 `shell-emulator` / `shamefully-hoist` / `public-hoist-pattern[]` / `auto-install-peers` / `link-workspace-packages` 等 | POSIX 风格脚本炸 cmd、幻影依赖断裂、hoist 依赖 TS2307 | `shellEmulator: true` / `shamefullyHoist: true` / `publicHoistPattern: [...]` 等 |
| package.json 的 `pnpm.overrides` / 其他 pnpm 字段                                                                                  | 被静默忽略，override 失效后裸解析崩溃                 | `pnpm-workspace.yaml` 的 `overrides:`，并删除 package.json 死配置块              |

- `.npmrc` 里的 `registry`、`@scope:registry`、auth 仍有效，**只有设置项**迁移。
- 迁移 hoist 类设置后必须重跑 `pnpm install` 重建链接布局。

## 5. 其他一次性 diff（预期现象，不是故障）

- 首次 re-resolve 会对循环依赖的 peer variants 重写，lockfile 产生一次性 diff——接受并入库。
- `pnpm install --resolution-only` 被移除，替代命令 `pnpm peers check`。

## 6. CI 适配

- `pnpm/action-setup@v5/v6`、官方 `pnpm/setup` 均自动读取 `packageManager` 字段——**删除 workflow 里的 version 硬编码**，否则报 `Multiple versions of pnpm specified`。
- action-setup 的 `run_install` args 全局安装模式与 pnpm 12 的全局 bin 目录校验不兼容（`ERR_PNPM_GLOBAL_BIN_DIR_NOT_IN_PATH`）——全局工具改用显式 `pnpm add -g` 步骤并声明 `PNPM_HOME`，或迁移官方 `pnpm/setup`。
- Vercel：`ENABLE_EXPERIMENTAL_COREPACK=1` + packageManager 字段已被原生支持（构建日志可验证 `using pnpm v12.4.1`），无需仓库内 corepack 脚本。
