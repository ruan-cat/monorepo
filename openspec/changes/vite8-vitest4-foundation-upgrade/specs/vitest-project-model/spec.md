# Vitest projects 测试项目模型

## ADDED Requirements

### Requirement: 显式声明测试项目

系统 MUST 使用 Vitest 4 支持的 `test.projects` 声明测试项目，并停止把 `vitest.workspace.ts` 作为最终发现入口。

#### 场景：根配置加载测试项目

- **当** 执行根 Vitest 列表或运行命令
- **则** 根配置能解析所有预期 project
- **并且** 不依赖已移除的 workspace 配置语义

### Requirement: 限制项目发现范围

系统 MUST 只发现具有明确配置或明确列出的测试目录，不得用 `packages/*` 自动纳入没有独立 Vitest 配置的包。

#### 场景：包没有 Vitest 配置

- **当** 某个 `packages/*` 目录没有独立 Vitest 配置
- **则** 该包不会因为目录 glob 被隐式加入测试
- **并且** 它仍可通过显式命令单独构建或测试

### Requirement: 保持环境与配置边界

每个 project MUST 显式声明必要的 `include`、运行环境、setup 文件和配置继承关系。

#### 场景：node 与 jsdom 项目并存

- **当** 同时运行 node 测试和 jsdom 测试
- **则** 各 project 使用自身环境和 setup
- **并且** 一个 project 的环境设置不会污染另一个 project

### Requirement: 构建前置条件可复现

测试入口 MUST 明确区分源码测试与包入口测试；依赖 `dist` 的测试必须在命令或项目编排中声明构建前置条件。

#### 场景：包入口尚未构建

- **当** 包入口测试需要 `dist` 文件但产物不存在
- **则** 测试命令在前置构建阶段失败并给出包名与缺失产物
- **并且** 不通过隐式全仓构建或根目录依赖提升掩盖失败

### Requirement: 迁移前配置风险可审计

迁移 MUST 扫描 workspace、pool、coverage、browser provider、reporter 和 Module Runner 相关配置，只处理仓库实际使用的选项。

#### 场景：仓库未使用高级 Vitest 选项

- **当** 静态扫描确认没有 `poolOptions`、browser provider 或自定义 coverage 配置
- **则** 迁移不新增推测性的兼容层
- **并且** 验收记录扫描结果而不是虚构改动
