# CP-03 构建顺序与包级依赖完整性证据（2026-11-05）

## 1. del/cpy/mkdirp 依赖缺口实证（任务第二项）

```log
$ grep -rn 'from "del"|"cpy"|"mkdirp"' packages/ tests/ configs-package/ vite-plugins/ --include="*.ts"   # 零命中
$ grep -rl '"del"|"cpy"|"mkdirp"' packages/*/package.json tests/*/package.json configs-package/*/package.json   # 零命中
$ grep -rln 'mkdirp|"del"|"cpy"' packages/*/src packages/*/tests tests/ ...   # 仅命中 .vitepress/dist 产物 JS 与 prompts 文档
```

- **结论：全仓零 import、零声明缺口**。tasks.md 该项所述的基线缺口在当前代码状态不存在（应为此前调研后被处理）。任务以"确认版本来源与实际使用一致（使用为零）"收口，无依赖变更，lockfile 零改动。

## 2. dist 前置声明（任务第一项 + 第三项）

新建 `packages/vitepress-preset-config/vitest.config.ts`：配置加载期 `existsSync` 检查 `dist/config.mjs`，缺失即抛出含包名与产物路径的错误（不用根 alias 掩盖）。两条路径实测：

```log
# 缺失路径（临时移走 dist/config.mjs）
Error: [vitepress-preset-config] 缺少构建产物 dist/config.mjs。
  请先运行 `pnpm --dir packages/vitepress-preset-config run build` 再执行包入口测试。
# （Startup Error，测试启动前置阶段失败）

# 存在路径（产物恢复后）
Test Files  2 passed (2)      Tests  6 passed (6)
```

`$ pnpm --dir packages/vitepress-preset-config run build` → DTS Build success（dist/config.mjs、config.d.mts、theme.* 产出）。

## 3. 新增包级显式配置（CP-01 方案 B 项落地）

- `packages/vercel-deploy-tool/vitest.config.ts`：name=vercel-deploy-tool，node，include `tests/**/*.test.ts`（测试引用 src 源码，无 dist 前置）→ 3 文件 33 测试全过
- `packages/vitepress-preset-config/vitest.config.ts`：name=vitepress-preset-config，node，include `src/docs/tests/**/*.test.ts`（dist 前置检查如上）

## 4. 全量定向测试两轮（第一轮诊断 + 第二轮稳定性）

| 包/目录                                 | 环境           | 第一轮                 | 第二轮         |
| --------------------------------------- | -------------- | ---------------------- | -------------- |
| packages/utils                          | node           | 8/9 文件（1 外部 404） | （CP-02 已验） |
| packages/domains                        | node           | 2 文件 17 测试 ✅      | 2 passed ✅    |
| packages/cf-build-notifier              | node           | 3 文件 33 测试 ✅      | 3 passed ✅    |
| configs-package/commitlint-config       | node           | 5 文件 73 测试 ✅      | 5 passed ✅    |
| configs-package/taze-config             | node           | 1 文件 7 测试 ✅       | 1 passed ✅    |
| packages/vercel-deploy-tool             | node（新配置） | 3 文件 33 测试 ✅      | 3 passed ✅    |
| packages/vitepress-preset-config        | node（新配置） | 2 文件 6 测试 ✅       | 2 passed ✅    |
| tests/useIconEffect                     | jsdom          | 1 文件 59 测试 ✅      | 1 passed ✅    |
| tests/cleanup-agent-team-node-processes | node           | 2 文件 20 测试 ✅      | 2 passed ✅    |

## 5. 新发现的既有基线问题（移交 CP-04）

**tests/ 根配置环境错配**：`tests/vitest.config.ts`（node，include `**/*.test.ts`）从 tests/ 目录跑时产生 **77 个失败**，模式为 `ReferenceError: window is not defined`——需要 jsdom/window 的测试（init-simple-memorix、sync-local-global-agents-skills、useIconEffect 等）被 node 环境误捕。各子配置单独跑全绿（useIconEffect jsdom 59 ✅、cleanup 20 ✅），证明失败来自根配置 include 过宽而非测试本身。CP-04 迁移时必须收窄 `tests/vitest.config.ts` 的 include 范围（排除 jsdom 需求子目录），并以逐 project 运行验证。

**vitest 3 workspace 目录 glob 怪癖**：从包目录跑 vitest 时向上命中根 `vitest.workspace.ts`，其 `packages/*` 目录条目探测语义直接报错（`references a non-existing file`）。CP-04 迁移为显式文件引用后，该怪癖自然消除。

## 6. 验证边界声明

- `pnpm install --frozen-lockfile`：CP-01 已通过；CP-03 依赖图零变更，无需重装。
- 完整 clean node_modules 重装：**未执行**——理由：本轮零依赖变更（lockfile 无 diff），且 Windows 下 pnpm 原生模块重装有既知风险（历史会话 gotcha）。以"依赖图零变更 + frozen-lockfile 通过 + 两轮定向测试稳定"作为可复现性替代证据。
