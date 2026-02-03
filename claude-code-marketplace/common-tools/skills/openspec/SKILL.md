---
name: openspec
description: |
  OpenSpec 规范驱动开发助手 - 基于 OPSX 工作流的 AI 辅助编程框架。在编写代码前与 AI 就需求达成一致，使用 Schema 驱动的工件依赖系统管理变更。

  触发条件：
  1. 用户提及 "openspec"、"opsx"、规范驱动开发
  2. 用户想要开始新功能开发或重构
  3. 用户需要探索复杂问题或明确需求
  4. 用户抱怨 AI 理解偏差或频繁返工
  5. 用户使用斜杠命令如 /opsx:new、/opsx:ff、/opsx:apply 等
  6. 项目初始化或准备重大变更时
metadata:
  version: "1.0.0"
---

# OpenSpec 规范驱动开发助手

OpenSpec 是规范驱动的 AI 编程框架。核心理念：**在编写代码前，与 AI 就需求达成一致**。

## 核心原则

- **流动而非僵化** - 随时处理任何工件，无阶段门控
- **迭代而非瀑布** - 边构建边完善理解
- **简单而非复杂** - 最小化设置和仪式
- **棕地优先** - Delta 方式修改现有系统

## 触发场景

### 明确触发

- 用户提及 "openspec"、"opsx"
- 用户使用 `/opsx:*` 斜杠命令
- 用户提及 "规范驱动开发"、"spec-driven"
- 用户询问如何管理需求或规范文档

### 上下文触发

- 用户开始新功能开发前（建议使用 OpenSpec）
- 用户抱怨 AI 理解偏差或频繁返工
- 用户询问如何让 AI 更准确理解需求
- 用户需要生成技术文档或设计文档

### 项目阶段触发

- 项目初始化阶段（建议配置 OpenSpec）
- 准备重大重构时（建议先写规范）
- 团队协作场景（需要统一的需求描述）
- 复杂功能开发前（需要明确需求边界）

### 适用场景

**推荐使用**：

- 改进现有项目（棕地开发）
- 需要高质量实现的关键功能
- 团队协作开发
- 需要长期维护的项目

**不推荐使用**：

- 快速原型验证（0→1 探索）
- 一次性小脚本
- 需求极度不明确的创新探索

## 目录结构

```plain
openspec/
├── config.yaml           # 项目配置（可选）
├── specs/                # 当前系统行为（事实来源）
│   ├── auth.md
│   └── api.md
├── changes/              # 活跃变更
│   └── add-feature/
│       ├── .openspec.yaml
│       ├── proposal.md
│       ├── specs/
│       ├── design.md
│       └── tasks.md
├── archive/              # 已归档变更
│   └── 2025-01-23-add-feature/
└── schemas/              # 自定义工作流（可选）
    └── my-workflow/
        ├── schema.yaml
        └── templates/
```

## 斜杠命令

| 命令                 | 功能                              |
| -------------------- | --------------------------------- |
| `/opsx:explore`      | 探索想法、调查问题、明确需求      |
| `/opsx:new`          | 启动新变更                        |
| `/opsx:continue`     | 创建下一个就绪工件                |
| `/opsx:ff`           | 快进 - 一次创建所有规划工件       |
| `/opsx:apply`        | 实施任务，按需更新工件            |
| `/opsx:verify`       | 验证实现的完整性、正确性、一致性  |
| `/opsx:sync`         | 同步 delta specs 到主规范（可选） |
| `/opsx:archive`      | 归档完成的变更                    |
| `/opsx:bulk-archive` | 批量归档多个变更                  |
| `/opsx:onboard`      | 交互式教程                        |

## CLI 命令

```bash
openspec init                              # 初始化项目
openspec update                            # 更新指令文件
openspec list                              # 列出活跃变更
openspec show <name>                       # 查看变更详情
openspec validate <name> --strict          # 严格格式校验
openspec status --change <name>            # 查看工件状态
openspec archive <name> --yes              # 归档变更
openspec schemas                           # 列出可用 schemas
openspec schema init <name>                # 创建自定义 schema
openspec schema fork <source> <name>       # 复制现有 schema
```

## 工作流模式

### 快速功能流

需求明确时使用：

```plain
/opsx:new → /opsx:ff → /opsx:apply → /opsx:verify → /opsx:archive
```

### 探索式流程

需求不明确时使用：

```plain
/opsx:explore → /opsx:new → /opsx:continue → ... → /opsx:apply
```

### 增量式流程

需要更多控制时使用：

```plain
/opsx:new → /opsx:continue (重复) → /opsx:apply → /opsx:archive
```

## 工件系统

### 默认 Schema: spec-driven

**依赖关系：**

```plain
proposal → specs → design → tasks → implement
          ↓
       design
```

**工件状态转换：**

```plain
BLOCKED → READY → DONE
   ↓         ↓       ↓
缺少依赖   依赖完成   文件存在
```

### 工件类型

1. **proposal.md** - 变更提案（Why/What/Impact）
2. **specs/** - Delta 规范（ADDED/MODIFIED/REMOVED）
3. **design.md** - 技术设计
4. **tasks.md** - 任务清单（带复选框）

## Delta Specs 格式

Delta specs 只描述变更部分，使用三种标记：

```markdown
## ADDED Requirements

### Requirement: 新功能名称

系统 MUST 提供 [功能描述]。

#### Scenario: 场景名称

- **WHEN** 前置条件
- **THEN** 预期结果
- **AND** 额外条件

## MODIFIED Requirements

### Requirement: 修改的功能

- **变化说明**: 具体变化
- **原因**: 修改原因
- **影响范围**: 受影响区域

## REMOVED Requirements

### Requirement: 废弃的功能

- **Reason**: 废弃原因
- **Migration**: 迁移路径
```

### 格式要求

1. Delta 分区使用英文标题（ADDED/MODIFIED/REMOVED）
2. 需求必须包含 MUST/SHALL/SHOULD 关键词
3. 场景使用英文 Gherkin 关键字（GIVEN/WHEN/THEN/AND）
4. 每个 Requirement 至少一个 Scenario
5. REMOVED 必须提供 Reason 和 Migration

## 项目配置

### config.yaml

```yaml
schema: spec-driven # 默认 schema

context: | # 注入所有工件的上下文
  Tech stack: TypeScript, React, Node.js
  Testing: Vitest
  Style: ESLint + Prettier

rules: # 按工件的特定规则
  proposal:
    - Include rollback plan
  specs:
    - Use Given/When/Then format
  design:
    - Include sequence diagrams
```

### Schema 优先级

1. CLI 标志：`--schema <name>`
2. 变更元数据：`.openspec.yaml`
3. 项目配置：`openspec/config.yaml`
4. 默认值：`spec-driven`

## 自定义 Schema

### 创建新 Schema

```bash
openspec schema init my-workflow
# 或基于现有 schema
openspec schema fork spec-driven my-workflow
```

### Schema 结构

```yaml
# openspec/schemas/my-workflow/schema.yaml
name: my-workflow
version: 1
description: 自定义工作流

artifacts:
  - id: proposal
    generates: proposal.md
    template: proposal.md
    requires: []

  - id: tasks
    generates: tasks.md
    template: tasks.md
    requires: [proposal]

apply:
  requires: [tasks]
  tracks: tasks.md
```

### 模板示例

```markdown
<!-- templates/proposal.md -->

## Why

<!-- 为什么需要这个变更 -->

## What Changes

<!-- 具体变更内容 -->

## Impact

<!-- 影响范围 -->
```

## 验证命令

`/opsx:verify` 检查三个维度：

- **Completeness** - 所有任务完成，需求已实现
- **Correctness** - 匹配规范意图，处理边界情况
- **Coherence** - 设计决策反映在代码中

## 更新与迭代

### 何时更新现有变更

- 相同意图，优化执行
- 范围缩小（MVP 优先）
- 学习驱动的修正

### 何时启动新变更

- 意图根本改变
- 范围爆炸性增长
- 原始变更可独立完成

### 判断启发式

```plain
相同意图？ → YES: UPDATE / NO: NEW
>50% 重叠？→ YES: UPDATE / NO: NEW
原始能完成？→ NO: UPDATE / YES: NEW
```

## 执行长任务的注意事项

1. **及时更新任务文件** - 完成任务后立即更新 `tasks.md`
2. **并行子代理** - 启动多个子代理分模块完成任务
3. **中文回复** - 始终用中文回复用户
4. **重读任务要求** - 上下文合并后重新阅读规范
5. **连续执行** - 一次性完成 `tasks.md` 全部任务
6. **禁止批处理脚本** - 使用具体的文件编辑，不用脚本批量修改
7. **主从代理调度**：
   - 主代理：阅读全部任务，分配子代理，监听反馈
   - 子代理：严格按主代理要求完成任务

## 故障排除

### 命令不可用

```bash
# 检查安装
openspec --version

# 重新安装
npm install -g @fission-ai/openspec@latest

# 刷新指令
openspec update
```

### 工件状态问题

```bash
# 查看状态
openspec status --change <name> --json

# 验证格式
openspec validate <name> --strict
```

### 归档失败

1. 先运行 `openspec validate <name> --strict`
2. 检查 `specs/` 目录是否有内容
3. 解决 Git 冲突后重试

## 环境变量

- `OPENSPEC_CONCURRENCY` - 并行验证数（默认: 6）
- `OPENSPEC_TELEMETRY=0` - 禁用遥测
- `NO_COLOR` - 禁用颜色输出

## 参考资源

- **OpenSpec 仓库**: https://github.com/Fission-AI/OpenSpec
- **OPSX 工作流**: https://github.com/Fission-AI/OpenSpec/blob/main/docs/opsx.md
- **CLI 参考**: https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md
- **自定义配置**: https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md
