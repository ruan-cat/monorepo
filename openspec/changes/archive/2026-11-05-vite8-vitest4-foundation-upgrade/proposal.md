# Vite 8 与 Vitest 4 基础设施升级

## Why

当前 monorepo 的 Vite 与 Vitest 仍处于 Vite 6 / Vitest 3 组合，测试入口使用已经弃用的 `vitest.workspace.ts`，并以 `packages/*` 作为宽泛发现范围。基线测试已经暴露出源码子路径、未构建 `dist`、包级依赖和文档测试入口等既有契约问题。

这些问题不是 Vitest 4 引入的，但会在大规模升级时放大噪音。与此同时，Vite 8 已切换到 Rolldown/Oxc，Vitest 4 已移除 workspace 并要求使用 projects。需要先把迁移边界、兼容性门槛、构建/测试顺序和回滚方式写清楚，再分阶段实施。

## What Changes

- **破坏性变更**：将核心构建链路迁移到 Vite 8，并同步校验 `@vitejs/plugin-vue`、`vite-plugin-dts` 及自有 Vite 插件的 peer 兼容性。
- **破坏性变更**：将 Vitest 3 的 workspace 配置迁移为 Vitest 4 的显式 `test.projects`，禁止隐式纳入没有测试配置的包。
- 建立明确的包级测试发现范围、构建产物前置条件和依赖声明规则。
- 将 VitePress/VuePress 文档栈作为独立兼容轨道；只有上游版本和插件证据满足门槛时才收敛到 Vite 8。
- 增加版本、锁文件、构建、测试和 CI 的分层验收矩阵，并保留可回滚的阶段边界。
- 不在本变更中顺手升级 TypeScript、ESLint、Prettier 或业务 API；不把现有基线问题伪装成升级回归。

## Capabilities

### New Capabilities

- `vitest-project-model`：定义 Vitest 4 projects 的显式发现、配置继承、环境隔离和命令边界。
- `vite8-build-toolchain`：定义 Vite 8/Rolldown 构建链、插件兼容性、文档双轨和版本收敛规则。
- `toolchain-upgrade-verification`：定义分阶段的安装、构建、测试、文档和 CI 验收证据。

### Modified Capabilities

<!-- 当前没有需要修改的既有能力规格。 -->

## Impact

- 根 `package.json`、`pnpm-lock.yaml`、Vite/Vitest 配置和各包的构建配置。
- `packages/*`、`tests/*`、学习组件和 Vite 插件相关的测试/构建入口。
- VitePress、VuePress bundler、`@vitejs/plugin-vue`、`vite-plugin-dts` 等外围依赖及其 peer 约束。
- GitHub Actions 中 Node/pnpm 矩阵、构建、文档和单元测试命令。
- 迁移期间可能保留 Vite 5/6 文档依赖的双版本锁定；“根依赖升级”不自动等于“全仓单版本统一”。
