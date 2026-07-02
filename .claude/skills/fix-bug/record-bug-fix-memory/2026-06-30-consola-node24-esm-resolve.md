# 2026-06-30 consola Node.js 24 ESM 解析故障

## 现象

GitHub Actions CI（`ubuntu-latest` + Node.js `24.18.0`）执行 `pnpm run ci` 时，`@ruan-cat/utils:prebuild` 阶段的 `automd` 命令崩溃：

```log
Error: Cannot find package '/home/runner/work/monorepo/monorepo/packages/utils/node_modules/consola/index.js' imported from /home/runner/work/monorepo/monorepo/packages/utils/node_modules/automd/dist/cli.mjs
    at legacyMainResolve (node:internal/modules/esm/resolve:201:26)
```

错误后常伴随 `Segmentation fault` 或 `Bus error`，退出码 `139` / `135`。

关键转折：第一次 `pnpm run build` 阶段 `@ruan-cat/utils:prebuild` 成功；在随后的 `pnpm run build:docs` 阶段，`@ruan-cat/utils:prebuild` 被再次触发时失败。说明问题不是持续性的，而是与 CI 阶段状态（remote cache、多次 prebuild 触发）相关。

## 根因

`consola@3.4.2` 的 `package.json` 使用条件嵌套的 `exports`（`node` / `default`）并将 `main` 指向 `./lib/index.cjs`。在 Node.js 24 的 ESM 解析路径下，`automd/dist/cli.mjs` 导入 `consola` 时未命中 `exports`，回退到 `legacyMainResolve`；`legacyMainResolve` 按旧式规则尝试 `main` 字段和 `index.js`，而 `./lib/index.cjs` 不被 ESM 直接识别，最终尝试 `consola/index.js` 失败。

`pnpm patch` 在本地与 CI 的 `build` 阶段均生效，但在 CI 的 `build:docs` 阶段（turbo 再次触发 `prebuild`、remote cache 恢复等复杂状态）未能稳定生效，导致 automd 在该阶段解析到未 patch 的 consola 副本。

本地 Node.js 22 与 Windows + Node.js 24.18.0 均未复现该阶段性失败。

## 修复

### 第一层：pnpm patch 持久化修改

使用 `pnpm patch` 修改 `consola@3.4.2` 的 `package.json`：

- 将 `main` 从 `./lib/index.cjs` 改为 `./dist/index.mjs`。
- 简化 `exports["."]` 和 `exports["./basic"]` 的条件嵌套，使用扁平的 `types` / `import` / `require` / `default` 映射。
- 在 `pnpm-workspace.yaml` 中注册 `patchedDependencies`，并将 `pnpm-lock.yaml` 纳入版本控制。

### 第二层：prebuild 运行时兜底创建 index.js

由于 `pnpm patch` 在 CI 的 `build:docs` 阶段未能稳定生效，重写 `scripts/ensure-consola-patch.ts`：

- 通过 `require.resolve('consola')` 定位当前 workspace 包解析到的 consola 真实目录。
- 同时尝试从 `automd` 的上下文解析其依赖的 consola 目录，覆盖 automd 实际使用的副本。
- 校验 `main` 与 `exports` 字段；不正确则重写为 patch 后的内容。
- **在 consola 包根目录下创建 `index.js` 垫片**，重新导出 `dist/index.mjs`，直接满足 Node.js 24 `legacyMainResolve` fallback 尝试的文件路径。

在 `packages/utils/package.json` 的 `prebuild` 脚本中先执行该脚本，再运行 `automd`：

```json
"prebuild": "pnpm exec tsx ../../scripts/ensure-consola-patch.ts && automd"
```

同时清理了此前的 `postinstall` 垫片方案和 workflow 兜底步骤，避免多方案并存掩盖根因。

## 验证

### 本地 Windows

1. 删除所有 consola `index.js` 垫片后：

```log
$ cd packages/utils
$ NODE_OPTIONS= pnpm exec tsx ../../scripts/ensure-consola-patch.ts
[ensure-consola-patch] 已修复 index.js: D:\code\ruan-cat\monorepo\node_modules\.pnpm\consola@3.4.2_patch_hash=...\node_modules\consola
```

2. 验证 `automd` 可正常启动：

```log
$ NODE_OPTIONS= pnpm exec automd --help
Your automated markdown maintainer! (automd v0.4.3)
...
```

3. 验证 `packages/utils` 的 `prebuild` 通过：

```log
$ NODE_OPTIONS= pnpm run prebuild
[ensure-consola-patch] 已正确: ...\node_modules\consola
√ Automd updated (66.9ms)

  ─    README.md already up-to-date (4.83ms)
```

### 云端 Linux CI

推送后 `ci.yaml` / `release.yml` 的 `pnpm run ci` 通过，`@ruan-cat/utils:prebuild` 在 `build` 与 `build:docs` 阶段均不再报 `ERR_MODULE_NOT_FOUND`。

## 教训

1. **当错误信息明确指向某个文件时，优先确保这个文件存在**。`consola/index.js` 是 Node.js 24 错误堆栈中直接尝试的路径，创建它就是最确定性的修复。
2. **`legacyMainResolve` 出现在 ESM 错误堆栈中，意味着 `exports` 字段未命中**。应优先怀疑 package.json 的解析结果，而非假设包损坏。
3. **pnpm isolated 模式下，workspace 包解析的依赖可能来自 `.pnpm/<direct-dependent>@*/node_modules/<dep>`**。修复或诊断时必须覆盖实际被解析的副本。
4. **monorepo 应将 lockfile 纳入版本控制**，否则 CI 与本地 transitive dependency 版本漂移会导致同类症状反复出现。
5. **当 patch 在大部分场景生效、仅在 CI 复杂阶段间歇失效时，应在触发点增加轻量级运行时兜底**，而不是继续追加假设性 patch 或 workflow 调整。
6. **诊断步骤应覆盖失败发生的精确时刻**。仅在 setup 阶段诊断不足以定位阶段性问题；在 prebuild 脚本内增加状态打印能捕获失败前的真实状态。
7. **根治后应及时清理临时 hack**，避免多方案并存掩盖真实根因。`postinstall` 和 workflow 兜底步骤已清理，最终只保留 `pnpm patch + ensure-consola-patch` 两层防御。
8. **不是 turbo cache 问题**。日志中 `cache bypass, force executing` 表明失败与缓存无关，而是 CI 阶段依赖状态不一致。
