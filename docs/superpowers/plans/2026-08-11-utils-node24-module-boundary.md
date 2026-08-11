# @ruan-cat/utils Node.js 24 模块边界修复实施计划

> **执行提示：** 按任务顺序落实本计划；使用复选框（`- [ ]`）记录每个有验证证据的步骤。

**目标：** 让 VitePress 只加载所需的 `@ruan-cat/utils` 窄子路径，并以 Node.js 24 的真实构建产物测试取代对 `consola` patch 和 ESM 内联的猜测。

**架构：** 为 `conditions` 与 `monorepo` 提供构建产物子路径；VitePress 配置改从这些子路径导入，避免经过会加载 `print.ts` 的宽 barrel。回归测试通过阻止 `consola` 解析来证明窄入口没有隐式日志依赖，并在 CI 的 Node.js 24 环境中执行；默认 ESM 与 `node-esm` 仅内联经该测试证实无法从 pnpm 工作区解析的依赖。

**技术栈：** pnpm workspace、tsup、Vitest、Node.js ESM loader、GitHub Actions。

## 全局约束

- 不向 CJS、CLI 或全部依赖扩散 ESM `noExternal`；仅维护入口测试证实的兼容依赖列表。
- 不使用 `@ruan-cat/utils/src/*` 作为 VitePress 的运行时导入路径。
- 所有新增测试使用 `describe` 与 `test`，文件名为 `*.test.ts`。
- 删除 `consola` patch 前必须获得 Node.js 24 CI 的发布入口测试证据。
- 不修改无关用户工作区变更；提交按代码与经验文档的职责分界。

---

### 任务 1：为窄子路径建立失败的运行时回归测试

**文件：**

- 创建：`packages/utils/src/tests/public-subpath-exports.test.ts`
- 修改：`packages/utils/package.json`

**接口：**

- 消费：`@ruan-cat/utils/conditions` 的 `isConditionsSome`。
- 消费：`@ruan-cat/utils/monorepo` 的 `findMonorepoRoot`。
- 产出：`test:entrypoints`，在已构建的包产物上执行测试。

- [x] **步骤 1：写出失败测试**

```ts
test("在禁止解析 consola 时加载 conditions", () => {
	expect(runEntrypoint("@ruan-cat/utils/conditions", "isConditionsSome")).toBe(0);
});
```

测试子进程使用 ESM loader 拒绝 `consola`，并导入构建后的包出口。当前包未声明该子路径，测试应以 `ERR_PACKAGE_PATH_NOT_EXPORTED` 失败。

- [x] **步骤 2：验证失败**

运行：`pnpm --filter @ruan-cat/utils build && pnpm --filter @ruan-cat/utils test:entrypoints`

预期：两个子路径均失败，原因是尚未导出对应构建产物。

### 任务 2：建立构建产物窄出口并迁移 VitePress 消费者

**文件：**

- 修改：`packages/utils/tsup.config.ts`
- 修改：`packages/utils/package.json`
- 修改：`packages/vitepress-preset-config/src/config/copy-readme.ts`
- 修改：`packages/vitepress-preset-config/src/config/copy-claude-files.ts`

**接口：**

- 产出 `dist/conditions.js` 与 `dist/monorepo/index.js`。
- 导出 `@ruan-cat/utils/conditions`、`@ruan-cat/utils/monorepo`。

- [x] **步骤 1：最小实现**

在 tsup 默认 ESM 构建中增加 `src/conditions.ts` 和 `src/monorepo/index.ts` 两个 entry；在 package exports 中以 `types`、`import` 顺序指向其 `dist` 产物。

- [x] **步骤 2：迁移消费者**

`copy-readme.ts` 从 `@ruan-cat/utils/conditions` 导入 `isConditionsSome`；`copy-claude-files.ts` 从 `@ruan-cat/utils/monorepo` 导入 `findMonorepoRoot`。

- [x] **步骤 3：验证通过**

运行：`pnpm --filter @ruan-cat/utils build && pnpm --filter @ruan-cat/utils test:entrypoints`

预期：两个子路径都能在 `consola` 被拒绝解析时完成真实导入并验证函数行为。

### 任务 3：以 Node.js 24 CI 执行发布入口验证并移除临时 resolver 改动

**文件：**

- 修改：`.github/workflows/ci.yaml`
- 修改：`.github/actions/setup-monorepo/action.yml`
- 修改：`packages/utils/tsup.config.ts`
- 修改：`pnpm-workspace.yaml`
- 删除：`patches/consola.patch`
- 删除：`scripts/ensure-consola-patch.ts`

**接口：**

- CI 在 `pnpm run ci` 后运行 `pnpm --filter @ruan-cat/utils test:entrypoints`。
- utils 的默认 ESM 与 `node-esm` 只内联测试证实无法经 pnpm 工作区解析的依赖。

- [x] **步骤 1：保留真实入口回归门禁**

在 CI 中于构建后执行 `test:entrypoints`，使 Node.js 24 对默认 ESM、node-esm、`conditions`、`monorepo` 的解析结果成为可观察证据。

- [x] **步骤 2：删除已被窄边界替代的全局 patch**

移除 `patchedDependencies.consola`、`patches/consola.patch`、孤儿 `ensure-consola-patch.ts` 与 setup action 的历史 `consola` 诊断；保留 `run-automd.cjs`，因为它是 automd CLI 的独立兼容边界。

- [x] **步骤 3：以入口测试确定最小 ESM 内联边界**

默认 ESM 与 `node-esm` 仅内联 `consola`、`tinyglobby`、`pnpm-workspace-yaml`：前两个包的单独内联不足，最新远端入口测试进一步暴露第三个包处于同一 Node.js 24 + pnpm ESM 解析失败路径；全量内联会使 CJS `yaml` 在 ESM 中触发动态 `require`，因此 `yaml` 保持外部依赖，且不扩散到全部依赖、CJS 或 CLI。

- [x] **步骤 4：验证完整 CI**

运行：`pnpm run ci`、`pnpm --filter @ruan-cat/utils test:entrypoints`，随后推送并确认**当前提交**的 GitHub Actions Node.js 24 job 成功；本次最终证据为 [run 31498466901](https://github.com/ruan-cat/monorepo/actions/runs/31498466901)。

### 任务 4：更新事故记录并按职责提交

**文件：**

- 修改：`.agents/skills/fix-bug/record-bug-fix-memory/2026-08-11-vitepress-node24-pnpm-entrypoint.md`
- 修改：`.agents/skills/fix-bug/record-bug-fix-memory/SKILL.md`
- 修改：`AGENTS.md`
- 修改：`CLAUDE.md`
- 修改：`GEMINI.md`

- [x] **步骤 1：记录最终证据**

只在 Node.js 24 CI 成功后，把经验文档的“当前止血”改为最终边界方案，并说明 `run-automd.cjs` 保留、第三方 package patch 删除的依据。

- [x] **步骤 2：分两类提交**

先提交运行时、构建、测试与 CI 的统一修复；再提交经验记录。每次提交前运行 `git diff --check`、检查暂存内容与 rename 风险。
