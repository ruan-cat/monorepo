# 配置落盘骨架（模板）

> 插槽语义、字段约束与类型收口见 [`references/config-templates.md`](../references/config-templates.md) 与 [`references/type-compatibility.md`](../references/type-compatibility.md)。
> `relizy-runner` 行为与参数见 `packages/utils/src/node-esm/scripts/relizy-runner/index.md`；兼容策略见 [`references/windows-compatibility.md`](../references/windows-compatibility.md) 与 [`references/baseline-tags.md`](../references/baseline-tags.md)。
> 组合发版架构见 [`references/release-workflow-architecture.md`](../references/release-workflow-architecture.md)。

## 1. 依赖（根 `package.json`）

**推荐**：一次性安装所有必需的开发依赖：

```bash
pnpm add -D bumpp changelogen changelogithub relizy conventional-changelog-cli @ruan-cat/commitlint-config @ruan-cat/utils @types/node pnpm-workspace-yaml
```

**不再**为执行 runner 而添加 `tsx` 或新建 `scripts/relizy-runner.ts`；runner 由 `@ruan-cat/utils` 的 `bin` 提供。

## 2. 故障预检

在安装依赖后、写入配置前，执行依赖冲突预检：

```bash
node --input-type=module -e "const m = await import('conventional-changelog-angular'); console.log('export type:', typeof m.default);"
```

期望输出 `export type: function`。若输出 `object`，说明存在旧版依赖冲突，须先修复（见 [`references/dependency-conflict-precheck.md`](../references/dependency-conflict-precheck.md)）。

## 3. 配置文件落盘（5 个文件）

按以下顺序将模板文件复制到目标仓库根目录：

### 3.1 `changelog.config.ts`

从 [`templates/changelog.config.ts`](changelog.config.ts) 复制。承载 changelogen 的 `types`、`templates` 配置，被 `relizy.config.ts` 和 `changelogithub.config.ts` 共同引用。

### 3.2 `relizy.config.ts`

从 [`templates/relizy.config.ts`](relizy.config.ts) 复制。须修改：

- `projectName`：替换为目标项目名称
- `monorepo.packages`：通过 `readWorkspacePackageGlobs()` 自动从 `pnpm-workspace.yaml` 读取，无需手动维护

须包含默认 `release` 配置块，与 `relizy-runner` 及显式「不 publish / 不 provider release」的发版习惯对齐。

### 3.3 `bump.config.ts`

从 [`templates/bump.config.ts`](bump.config.ts) 复制。关键配置：

- `push: false`：不单独推送，等待最后统一 push
- `tag: "v%s"`：根包使用 `v0.12.0` 格式的 tag
- `execute: "pnpm run changelog:conventional-changelog"`：bump 后自动生成根包 CHANGELOG
- `commit: "📢 publish(root): release v%s"`：与子包的 `publish` scope 区分

### 3.4 `changelogithub.config.ts`

从 [`templates/changelogithub.config.ts`](changelogithub.config.ts) 复制。复用 `changelog.config.ts` 的 types，`output: false`（不让 changelogithub 生成 CHANGELOG 文件）。

### 3.5 `.github/workflows/release.yaml`

从 [`templates/release.yaml`](release.yaml) 复制到 `.github/workflows/release.yaml`。按需调整：

- pnpm / node 安装步骤
- 是否需要构建步骤（`pnpm run build`）

## 4. 根 `package.json` 脚本

从 [`templates/package-scripts.md`](package-scripts.md) 复制全部 scripts。

> **`--yes`（必选）**：跳过交互确认。所有 `relizy-runner release`、`bumpp --yes` 命令都必须显式包含。

须调整 `format:changelog` 的 glob 匹配路径以覆盖目标仓库的实际子包目录。

## 5. 不在仓库内新建 runner 脚本

接入时**不要**复制或编写本地 `scripts/relizy-runner.ts`。基线 tag 预检与工作区包发现由 `@ruan-cat/utils` 内置实现。

## 6. `pnpm-workspace.yaml`

仅在需要调整工作区范围时修改；`relizy.config.ts` 的 `readWorkspacePackageGlobs()` 会自动读取。

## 7. 最小根 `tsconfig`（可选）

仅在根目录配置文件需被 tsc 消费且现网无合适 include 时添加；限制 `include` 范围，避免整仓类型检查。
