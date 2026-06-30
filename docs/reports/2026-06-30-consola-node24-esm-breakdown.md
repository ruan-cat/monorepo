# 2026-06-30 consola Node.js 24 ESM 解析故障跟进日志

## 问题现象

2026-06-30 期间，GitHub Actions CI 在 `ubuntu-latest` + Node.js `24.18.0` 环境下反复出现 `ERR_MODULE_NOT_FOUND`：

```log
Error: Cannot find package '/home/runner/work/monorepo/monorepo/packages/utils/node_modules/consola/index.js' imported from /home/runner/work/monorepo/monorepo/packages/utils/node_modules/automd/dist/cli.mjs
Did you mean to import "consola/lib/index.cjs"?
    at legacyMainResolve (node:internal/modules/esm/resolve:201:26)
    at packageResolve (node:internal/modules/esm/resolve:778:12)
```

触发路径为 `pnpm run ci` → `turbo build` → `@ruan-cat/utils:prebuild` → `automd`。错误后常伴随 `Segmentation fault (core dumped)` 或 `Bus error (core dumped)`，退出码 `139` 或 `135`。

## 根因

`consola@3.4.2` 的 `package.json` 使用了带条件分支的 `exports` 结构（`node` / `default` 二级嵌套），并将 `main` 指向 `./lib/index.cjs`。在 Node.js 24 的 ESM 解析器下，当 `exports` 字段的解析因某种原因失效或回退时，会进入 `legacyMainResolve`。`legacyMainResolve` 按旧式规则尝试 `main` 字段、然后 `index.js`，而 `./lib/index.cjs` 在 ESM 直接导入场景下无法被识别，最终尝试 `consola/index.js` 失败。

根本问题不是 consola 缺少 `main` 入口，而是其 `exports` + `main` 的组合在 Node.js 24 + pnpm isolated 模式下对 `automd/dist/cli.mjs` 的 ESM 导入不可解析。本地 Node.js 22 无此问题；本地 Node.js 24.18.0 在 Windows 下亦未复现，说明与 CI 的 Linux 环境状态存在耦合。

## 关键误导点

1. **"consola package.json 没有 main 入口"**：实际其 `package.json` 规范且完整，有 `main`、`module`、`exports`。真正问题不是缺字段，而是字段组合在特定解析路径下不兼容。
2. **"创建 index.js 垫片即可修复"**：`scripts/fix-consola-esm.ts` 在根和 workspace 的 `node_modules/consola` 下创建 `index.js` 垫片，但 CI 仍然失败。因为 automd 实际解析的是 pnpm store 中的 consola 副本（通过 symlink），垫片未覆盖到 automd 真正使用的实例。
3. **"修正 workflow 顺序即可修复"**：`pnpm/action-setup@v5` 的 `run_install` 语法错误确实需要修正，但 workflow 顺序调整只能减少环境差异，无法根治 ESM 解析失败。
4. **"降级 Node 到 22.x"**：这是有效的短期止血方案，但用户要求继续使用 Node.js 24，因此不可作为最终方案。

## 有效修复

使用 `pnpm patch` 持久化修改 `consola@3.4.2` 的 `package.json`，使其 ESM 主入口对 Node.js 24 明确且稳定：

1. 将 `main` 从 `./lib/index.cjs` 改为 `./dist/index.mjs`。
2. 简化 `exports["."]` 和 `exports["./basic"]` 的条件嵌套，采用扁平的 `types` / `import` / `require` / `default` 四级映射。
3. 将 patch 注册到 `pnpm-workspace.yaml` 的 `patchedDependencies`，使 Windows 本地与 Linux CI 安装同一 lockfile 时均自动应用。

patch 文件：`patches/consola.patch`

```diff
-  "main": "./lib/index.cjs",
+  "main": "./dist/index.mjs",

   "exports": {
     ".": {
-      "node": { "import": {...}, "require": {...} },
-      "default": { "import": {...}, "require": {...} }
+      "types": "./dist/index.d.mts",
+      "import": "./dist/index.mjs",
+      "require": "./lib/index.cjs",
+      "default": "./dist/index.mjs"
     },
     "./basic": {
-      "node": { "import": {...}, "require": {...} },
-      "default": { "import": {...}, "require": {...} }
+      "import": { "types": ..., "default": ... },
+      "require": { "types": ..., "default": ... }
     },
     ...
   }
```

同时增加运行时兜底：

- 新增 `scripts/ensure-consola-patch.ts`，在每次 `@ruan-cat/utils:prebuild` 运行前显式校验并修复 consola 的 `package.json`。
- 修改 `packages/utils/package.json` 的 `prebuild` 脚本为：`pnpm exec tsx ../../scripts/ensure-consola-patch.ts && automd`。
- 该兜底用于覆盖 pnpm patch 在 CI 某些阶段（如 turbo 多次触发 prebuild、remote cache 恢复后）未稳定生效的场景。

清理了此前的临时 hack：

- `package.json` 的 `postinstall` 不再调用 `scripts/fix-consola-esm.ts`。
- `.github/actions/setup-monorepo/action.yml` 移除"修复 consola ESM 垫片"步骤，保留诊断步骤用于确认 patch 状态。

## 验证方式

### 本地 Windows 验证

1. 删除所有 consola 的 `index.js` 垫片，确保不再依赖运行时垫片：

```log
$ rm -f node_modules/.pnpm/consola@3.4.2*/node_modules/consola/index.js
$ rm -f node_modules/consola/index.js
$ rm -f packages/utils/node_modules/consola/index.js
```

2. 验证 `automd` 可正常启动：

```log
$ cd packages/utils
$ pnpm exec automd --help
Your automated markdown maintainer! (automd v0.4.3)
USAGE automd [OPTIONS]
...
```

3. 验证 `packages/utils` 的 `prebuild` 通过：

```log
$ pnpm run prebuild
> automd
√ Automd updated (72.89ms)
```

### 云端 Linux CI 验证

推送后，`ci.yaml` 与 `release.yml` 均通过 `pnpm run ci`，`@ruan-cat/utils:prebuild` 不再报 `ERR_MODULE_NOT_FOUND`。

## 后续约束

1. **升级 consola 前必须同步更新 patch 与兜底脚本**：一旦 consola 版本升级，当前 `patches/consola.patch` 和 `scripts/ensure-consola-patch.ts` 中的目标字段都会失效。需在升级后重新生成 patch 并同步脚本中的 `TARGET_MAIN` 与 `TARGET_EXPORTS`。
2. **不要恢复 `index.js` 垫片方案**：`scripts/fix-consola-esm.ts` 作为历史 fallback 保留在仓库中，但不应重新启用为 `postinstall`。patch + `ensure-consola-patch` 运行时兜底是更可靠、可复现、跨平台一致的修复方式。
3. **CI 诊断步骤继续保留**：`.github/actions/setup-monorepo/action.yml` 中的 consola 状态诊断应保留，便于未来快速确认 patch 是否生效。
4. **lockfile 必须纳入版本控制**：`pnpm-lock.yaml` 已提交。patch 的 hash 记录在 lockfile 中，忽略 lockfile 会导致 CI 与本地 patch 状态不一致。
5. **`ensure-consola-patch` 是防御性兜底而非根治**：它用于覆盖 pnpm patch 在 CI 复杂阶段未稳定生效的边角场景。若未来 consola 或 pnpm 修复了底层兼容性问题，可考虑移除该兜底。

## 本地与云端 Linux 修复过程记录

### 第一阶段：垫片方案（未根治）

- 创建 `scripts/fix-consola-esm.ts`，在根目录与各 workspace 的 `node_modules/consola` 下创建 `index.js` 垫片。
- 在 `.github/workflows/release.yml` 中增加 `postinstall` 和显式兜底执行。
- 结果：release.yml 有所改善，但触发 `pnpm run ci` 的 `ci.yaml` 未同步修改，症状反复。

### 第二阶段：统一初始化逻辑（未根治）

- 创建 `.github/actions/setup-monorepo` composite action，统一 pnpm、Node、全局工具、依赖安装和 consola 诊断步骤。
- 修正 `pnpm/action-setup@v5` 的 `run_install` 语法错误，避免错误全局安装工具。
- 增强 `fix-consola-esm.ts` 扫描范围，覆盖 `.pnpm/consola@*` 和 `.pnpm/automd@*/node_modules/consola`。
- 结果：ci.yaml 和 release.yml 均复用统一 action，但 CI 仍报同一错误。

### 第三阶段：pnpm patch 重写 package.json（根治）

- 使用 `pnpm patch --edit-dir patches/consola consola` 创建编辑目录。
- 修改 `patches/consola/package.json`：简化 `exports`，将 `main` 指向 ESM 入口。
- 执行 `pnpm patch-commit patches/consola` 生成 `patches/consola.patch`。
- 在 `pnpm-workspace.yaml` 中注册 `patchedDependencies`。
- 重新生成 `pnpm-lock.yaml`，确保 patch hash 被记录。
- 清理 `package.json` 的 `postinstall` 和 action 中的垫片步骤。
- 结果：本地 Windows 通过；GitHub Linux CI 的 `pnpm run build` 阶段通过，但 `pnpm run build:docs` 阶段再次触发 `@ruan-cat/utils:prebuild` 时失败。

### 第四阶段：prebuild 运行时兜底修复

- 分析：第一次 `pnpm run build` 成功，第二次 `pnpm run build:docs` 中 `@ruan-cat/utils:prebuild` 失败，说明 pnpm patch 在 CI 的复杂阶段（turbo 多次触发 prebuild、remote cache 恢复）未能稳定生效。
- 新增 `scripts/ensure-consola-patch.ts`：通过 `require.resolve('consola')` 定位 consola 真实目录，校验 `main` 与 `exports` 字段，不正确则重写为 patch 后的内容。
- 修改 `packages/utils/package.json` 的 `prebuild` 脚本：`pnpm exec tsx ../../scripts/ensure-consola-patch.ts && automd`。
- 结果：每次 prebuild 前都会强制确保 consola package.json 正确，CI 的 build 与 build:docs 阶段均通过。

## 关键宝贵经验

1. **当 CI 与本地行为不一致时，优先把修复持久化为依赖补丁而非运行时脚本**。运行时脚本受执行顺序、缓存、symlink 层级影响，跨平台复现性差；`pnpm patch` 随 lockfile 生效，行为确定。
2. **错误堆栈中的 `legacyMainResolve` 是强信号**。在 Node.js ESM 解析中，出现该函数意味着 `exports` 字段未命中或失效。此时应怀疑 package.json 解析结果，而非假设包本身损坏。
3. **pnpm isolated 模式下，workspace 包看到的依赖可能不是你以为的那个副本**。automd 解析的 consola 可能来自 `.pnpm/automd@*/node_modules/consola` 而非 workspace 的 `node_modules/consola`，扫描和 patch 必须覆盖 automd 的真实依赖实例。
4. **不要同时保留多个相互覆盖的修复方案**。垫片、workflow 兜底、patch 三者并存时，会让根因判断变得困难。确定 patch 有效后，应及时清理临时 hack。
5. **lockfile 纳入版本控制是 monorepo 长期稳定的基础**。没有 lockfile，CI 每次安装都可能解析出不同的 transitive dependency 版本，导致同一症状在不同时间以不同形式出现。
6. **对于 CI 中阶段性地复现的失败，需要增加运行时兜底而非继续追加假设性补丁**。当 `pnpm patch` 在大部分场景生效，但在 turbo 多次触发 prebuild 时失效，应在 prebuild 脚本内增加轻量级校验与修复，确保每次执行前状态正确，而不是反复调整 workflow 或 patch。
7. **诊断步骤应覆盖失败发生的精确时刻**。只在 setup 阶段打印一次 consola 状态不足以定位阶段性问题；应在 prebuild 脚本或 workflow 的 build/build:docs 之间增加诊断，捕获失败前的真实状态。
