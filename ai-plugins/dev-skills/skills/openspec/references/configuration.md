# 项目配置与自定义 Schema

## 项目配置文件 config.yaml

`openspec/config.yaml` 是项目级别的全局配置（可选）：

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

### Schema 优先级（从高到低）

1. CLI 标志：`--schema <name>`
2. 变更元数据：`.openspec.yaml`
3. 项目配置：`openspec/config.yaml`
4. 默认值：`spec-driven`

---

## 自定义 Schema

当默认的 `spec-driven` 工作流不满足需求时，可以创建自定义 Schema。

### 创建方式

```bash
openspec schema init my-workflow
# 或基于现有 schema 进行 fork
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

---

## 验证与归档

### 常用命令

```bash
openspec validate <name> --strict    # 严格格式校验
openspec status --change <name> --json  # 查看工件状态（JSON 格式）
openspec archive <name> --yes        # 归档变更
openspec schemas                     # 列出所有可用 schemas
```

### 归档失败排查

1. 先运行 `openspec validate <name> --strict` 检查格式
2. 确认 `specs/` 目录有内容
3. 解决 Git 冲突后重试

---

## 故障排除

### openspec 命令不可用

```bash
# 检查安装
openspec --version

# 重新安装
npm install -g @fission-ai/openspec@latest

# 刷新指令文件
openspec update
```

### 环境变量

| 变量                   | 说明                  |
| ---------------------- | --------------------- |
| `OPENSPEC_CONCURRENCY` | 并行验证数（默认: 6） |
| `OPENSPEC_TELEMETRY=0` | 禁用遥测              |
| `NO_COLOR`             | 禁用颜色输出          |
