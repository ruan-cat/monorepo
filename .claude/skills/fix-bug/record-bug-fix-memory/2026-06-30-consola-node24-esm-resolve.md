# 2026-06-30 consola Node.js 24 ESM 解析故障

## 现象

GitHub Actions CI（`ubuntu-latest` + Node.js `24.18.0`）执行 `pnpm run ci` 时，`@ruan-cat/utils:prebuild` 阶段的 `automd` 命令崩溃：

```log
Error: Cannot find package '/home/runner/work/monorepo/monorepo/packages/utils/node_modules/consola/index.js' imported from /home/runner/work/monorepo/monorepo/packages/utils/node_modules/automd/dist/cli.mjs
    at legacyMainResolve (node:internal/modules/esm/resolve:201:26)
```

错误后常伴随 `Segmentation fault` 或 `Bus error`，退出码 `139` / `135`。

## 根因

`consola@3.4.2` 的 `package.json` 使用条件嵌套的 `exports`（`node` / `default`）并将 `main` 指向 `./lib/index.cjs`。在 Node.js 24 的 ESM 解析路径下，`automd/dist/cli.mjs` 导入 `consola` 时未命中 `exports`，回退到 `legacyMainResolve`；`legacyMainResolve` 按旧式规则尝试 `main` 字段和 `index.js`，而 `./lib/index.cjs` 不被 ESM 直接识别，最终尝试 `consola/index.js` 失败。

本地 Node.js 22 与 Windows + Node.js 24.18.0 均未复现，说明问题还与 Linux CI 的 pnpm 隔离/缓存状态耦合。

## 修复

使用 `pnpm patch` 持久化修改 `consola@3.4.2` 的 `package.json`：

- 将 `main` 从 `./lib/index.cjs` 改为 `./dist/index.mjs`。
- 简化 `exports["."]` 和 `exports["./basic"]` 的条件嵌套，使用扁平的 `types` / `import` / `require` / `default` 映射。
- 在 `pnpm-workspace.yaml` 中注册 `patchedDependencies`，并将 `pnpm-lock.yaml` 纳入版本控制，确保 Windows 本地与 Linux CI 的 patch 状态一致。

同时清理了此前的运行时 `index.js` 垫片方案和 workflow 兜底步骤，避免多方案并存导致根因判断混乱。

## 验证

### 本地 Windows

删除所有 consola `index.js` 垫片后：

```log
$ cd packages/utils
$ pnpm exec automd --help
Your automated markdown maintainer! (automd v0.4.3)
...

$ pnpm run prebuild
> automd
√ Automd updated (72.89ms)
```

### 云端 Linux CI

推送后 `ci.yaml` / `release.yml` 的 `pnpm run ci` 通过，`@ruan-cat/utils:prebuild` 不再报 `ERR_MODULE_NOT_FOUND`。

## 教训

1. **CI 与本地不一致时，优先用 `pnpm patch` 持久化修复**，而非依赖运行时脚本或 workflow 兜底。patch 随 lockfile 生效，跨平台确定性强。
2. **`legacyMainResolve` 出现在 ESM 错误堆栈中，意味着 `exports` 字段未命中**。应优先怀疑 package.json 的解析结果，而非假设包损坏。
3. **pnpm isolated 模式下，workspace 包解析的依赖可能来自 `.pnpm/<direct-dependent>@*/node_modules/<dep>`**。修复或诊断时必须覆盖实际被解析的副本。
4. **monorepo 应将 lockfile 纳入版本控制**，否则 CI 与本地 transitive dependency 版本漂移会导致同类症状反复出现。
5. **根治后应及时清理临时 hack**，避免多方案并存掩盖真实根因。
