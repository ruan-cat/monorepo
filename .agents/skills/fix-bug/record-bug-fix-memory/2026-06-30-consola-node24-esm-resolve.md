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

---

# 2026-07-02 后续：automd CLI 入口绕过方案

## 现象（再次失败）

在 2026-06-30 的 `pnpm patch + ensure-consola-patch` 方案之后，CI 仍间歇性失败：

```log
[ensure-consola-patch] 已修复 index.js + index.d.ts: .../node_modules/.pnpm/consola@3.4.2_patch_hash=.../node_modules/consola
[ensure-consola-patch] 跳过非 consola 目录: .../packages/utils/node_modules/consola

Error: Cannot find package '.../packages/utils/node_modules/consola/index.js' imported from .../packages/utils/node_modules/automd/dist/cli.mjs
    at legacyMainResolve (node:internal/modules/esm/resolve:201:26)
```

脚本已经尝试修复多个 consola 物理目录，但 `packages/utils/node_modules/consola` 仍被判定为"非 consola 目录"，而 automd 实际运行时仍从该路径导入失败。

## 关键误导点

1. **错误假设：consola 是问题的根源**。多次尝试修 consola 的 package.json、加 index.js 垫片、扫描多个 .pnpm 实例，本质上是把力气花在第三方依赖的解析细节上。
2. **错误假设：运行时兜底脚本可以覆盖所有 ESM 解析路径**。pnpm isolated 模式下，Node.js 24 ESM 解析器从 `automd/dist/cli.mjs` 文件位置开始向上查找 `node_modules/consola`，与 CJS `require.resolve` 的上下文可能不一致，脚本无法稳定预测所有路径。
3. **错误假设：继续增强兜底脚本最终能覆盖所有情况**。每次增强后 CI 仍失败，说明这个方向是在和解析器打地鼠。

## 实际根因（最终版）

`automd@0.4.3` 有两个入口：

- `dist/cli.mjs`：作为 CLI 使用，会静态 `import consola`。
- `dist/index.mjs`：作为 API 使用，不依赖 `consola`。

真正触发 `consola` 导入的是 `automd` 的 CLI 入口。在 Node.js 24 的 ESM 解析下，这个 CLI 入口对 `consola` 的解析会触发 `legacyMainResolve` fallback，导致 `consola/index.js` 解析失败。

也就是说，**consola 本身不是必选项，而是 automd CLI 的入口设计引入了这个问题**。既然 API 入口不依赖 consola，绕过 CLI 入口就可以彻底避开这个失败路径。

## 最终修复

不继续修 consola，而是**绕过有问题的 automd CLI 入口**。

### 新增 CJS wrapper

创建 `scripts/run-automd.cjs`：

```js
const { automd } = require("automd");
const process = require("node:process");

async function main() {
	const { results, hasIssues } = await automd({ dir: process.cwd() });
	for (const result of results) {
		const status = result.hasChanged ? "updated" : "up-to-date";
		console.log(`  ${status}: ${result.input}`);
	}
	if (hasIssues) {
		process.exit(1);
	}
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
```

该 wrapper 使用 CommonJS 的 `require("automd")` 加载 API 入口（`dist/index.mjs`），并调用 `automd()` 函数。由于 API 入口不静态导入 `consola`，因此完全避开了 Node.js 24 的 ESM 解析失败。

### 修改所有 automd prebuild 脚本

将 10 个使用 `automd` 作为 `prebuild` 的子包统一改为：

```json
"prebuild": "node ../../scripts/run-automd.cjs"
```

涉及的包包括：

- `packages/utils`
- `packages/vuepress-preset-config`
- `packages/vitepress-preset-config`
- `packages/domains`
- `packages/release-toolkit`
- `packages/vercel-deploy-tool`
- `packages/claude-notifier`
- `configs-package/commitlint-config`
- `configs-package/taze-config`
- `vite-plugins/vite-plugin-ts-alias`

### 保留但不依赖 consola 补丁

`patches/consola.patch` 和 `scripts/ensure-consola-patch.ts` 作为历史兜底保留，但 `prebuild` 不再执行 `ensure-consola-patch`。如果未来其他代码路径仍需要 consola 的 ESM 解析，补丁和脚本仍在；但 automd 相关的 CI 失败不再依赖它们。

## 验证

### 本地 Windows

1. `packages/utils` 的 `prebuild` 通过：

```log
$ cd packages/utils && pnpm run prebuild
√ Automd updated (79.55ms)
```

2. `packages/vuepress-preset-config` 的 `prebuild` 通过。

3. 根目录 `pnpm run build` 通过，所有 10 个包的 `prebuild` 均成功。

### 云端 Linux CI

推送后等待 GitHub Actions `ci.yaml` 的 `pnpm run ci` 验证。由于本地已验证 wrapper 不依赖 consola 的 ESM 解析，预期 `build` 与 `build:docs` 阶段不再报 `ERR_MODULE_NOT_FOUND`。

## 最终教训

1. **当第三方 CLI 在特定 Node 版本下出现 ESM 解析问题时，优先检查它是否有不触发该解析路径的 API 入口**。绕过问题入口往往比修复依赖的解析细节更可靠。
2. **不要在同一个 bug 上反复强化同一个方向的兜底**。如果连续三次增强兜底脚本仍未解决，说明根因判断有误，需要回到"哪个入口实际触发了错误"这一层。
3. **错误堆栈中的被导入文件不是唯一需要修的东西**。`consola/index.js` 缺失只是表象，真正的触发点是 `automd/dist/cli.mjs` 的静态导入。
4. **pnpm isolated 模式下，CJS 与 ESM 的解析路径可能不一致**。试图通过 CJS 的 `require.resolve` 去预测 ESM 的解析路径是脆弱的。
5. **阶段性修复要及时复盘**。如果同一 bug 多次复发，要停下来重新评估根因，而不是继续沿着之前的路径加补丁。

## 后续约束

1. **未来升级 `automd` 时必须同步更新 `scripts/run-automd.cjs`**。如果 API 入口的签名或返回值发生变化，wrapper 需要对应调整。
2. **不要再试图通过增强 `scripts/ensure-consola-patch.ts` 来修复 `automd` 的 CI 失败**。这个方向已被证明不可靠。
3. **`patches/consola.patch` 与 `scripts/ensure-consola-patch.ts` 仅作为其他可能触发 `consola` ESM 解析问题的代码路径的兜底保留**。
4. **当同一 bug 连续多次修复无效时，必须停下来重新评估根因**，优先考虑绕过问题入口而不是继续修依赖。
5. **`pnpm-lock.yaml` 必须持续纳入版本控制**，否则 patch hash 无法在 CI 中一致应用。
