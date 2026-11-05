# Vite 8 构建工具链

## ADDED Requirements

### Requirement: 核心工具链版本可审计

系统 MUST 对根 Vite 8、Vitest 4、Node 和 pnpm 版本建立可审计的声明、锁定和版本树检查。

#### 场景：冻结安装

- **当** 使用冻结锁文件安装依赖
- **则** 根工具链版本与声明一致
- **并且** 版本差异能够定位到具体文档框架或包

### Requirement: 插件兼容性先于版本收敛

系统 MUST 在 Vite 8 构建前验证 Vue、dts、Rollup/Vite 插件和仓库自有插件的 peer 范围及实际构建结果。

#### 场景：插件不支持 Vite 8

- **当** 任一必需插件 peer 范围不包含 Vite 8 或构建失败
- **则** 该包保持在兼容轨道并记录阻塞证据
- **并且** 不使用无说明的 override 强行安装

### Requirement: 文档框架允许双轨

系统 MUST 将 VitePress/VuePress 文档构建与核心 Vite 8 构建分开验收。

#### 场景：文档框架仍锁定旧 Vite

- **当** VitePress 或 VuePress bundler 的稳定版本仍依赖 Vite 5/6
- **则** 文档构建继续使用其兼容版本
- **并且** 根工具链报告明确说明双版本不是升级遗漏

### Requirement: 构建失败可回滚

每个大版本迁移阶段 MUST 能单独回滚到最近一个可验证边界。

#### 场景：Rolldown/Oxc 触发构建回归

- **当** 非文档包出现无法接受的构建回归
- **则** 回退该阶段而不回退已经验证的 Vitest projects 边界
- **并且** 保留失败命令、包名和最小复现证据

### Requirement: Rolldown 兼容性按实际插件验证

Vite 8 迁移 MUST 对现有 library build、`preserveModules`、external、类型声明、别名和仓库自有插件 hook 做实际验证，不得仅凭配置名称完成迁移。

#### 场景：自有插件使用 Rollup hook

- **当** 插件实现 `resolveId`、`load`、`transform`、`generateBundle` 或 `writeBundle`
- **则** 验证其输入输出、执行顺序和产物副作用在 Rolldown 下保持预期
- **并且** 构建失败时记录最小复现与回滚边界

### Requirement: 文档轨道拥有独立出口

VitePress 与 VuePress 文档轨道 MUST 分别验证 dev、build、链接、主题/插件加载和部署产物。

#### 场景：核心包构建通过但文档失败

- **当** 非文档包已经通过 Vite 8 构建而文档轨道仍失败
- **则** 核心轨道可以阶段性通过，但不能宣称全仓统一
- **并且** 文档轨道保留旧 Vite 或回滚到最近绿色边界
