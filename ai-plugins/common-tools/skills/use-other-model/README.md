# Use Other Model Skill

## 概述

`use-other-model` 技能帮助主代理把适合的任务委托给其他 AI 模型,在保证质量的前提下节省 50-80% token。

本次升级后的重点不再只是“把任务交给另一个模型”,而是让方案 B 可以稳定地驱动一个 **无人值守、可编辑、可执行、可验证** 的独立 Claude Code 编码代理。

## 核心价值

- **显著降低成本**:复杂任务可以节省 50-80% token
- **更稳的执行模式**:默认使用标准启动参数、上下文封包和失败分流
- **浏览器验收内建**:前端任务默认带页面访问和交互检查
- **主代理保留复核责任**:子会话完成后仍需要主代理重新验证

## 适用场景

### ✅ 强烈推荐

- 批量文件处理
- 多步骤、多文件修改
- 预计执行时间超过 5 分钟的任务
- 可拆分成清晰执行封包的复杂任务

### ❌ 不推荐

- 单文件小改
- 执行时间小于 1 分钟
- 仍然需要频繁用户澄清的问题
- 需要深度架构判断的高风险任务

## 两种方案

### 方案 A: MCP 工具

- 适合简单任务和单次调用
- 详细说明见 `references/method-a-mcp-tools.md`

### 方案 B: 独立 Claude Code 会话

- 适合复杂任务和长任务
- 默认按 **unattended coding agent** 设计
- 详细说明见 `references/method-b-independent-session.md`

## 技能结构

```plain
use-other-model/
├── SKILL.md
├── README.md
└── references/
    ├── method-a-mcp-tools.md
    ├── method-b-independent-session.md
    ├── claude-code-launch-templates.md
    ├── context-packet-template.md
    ├── frontend-browser-verification-template.md
    ├── failure-routing.md
    ├── environment-variables.md
    ├── case-study-git-commits.md
    ├── faq.md
    ├── code-templates.md
    └── README.md
```

## 快速开始

1. 先读主文件 `SKILL.md`,确认任务适合方案 A 还是方案 B。
2. 如果使用方案 B:
   - 先准备 provider 环境变量
   - 再写任务封包
   - 再生成标准启动命令
   - 前端任务额外补浏览器验收模板
3. 子会话完成后,主代理必须重新验证。

## 关键参考

- `references/claude-code-launch-templates.md`
  - 标准 Bash / PowerShell 启动模板
  - 默认包含 `--permission-mode bypassPermissions`、`--tools default`、`--output-format json`

- `references/context-packet-template.md`
  - 方案 B 的任务封包模板
  - 用来约束工作目录、允许修改范围、验证命令和完成规则

- `references/frontend-browser-verification-template.md`
  - 前端任务专用浏览器验收模板
  - 强制记录 URL、首屏观察、关键交互和日志格式

- `references/failure-routing.md`
  - 启动失败、执行失败、浏览器验收失败的分流策略
  - 明确规定连续两轮失败后主代理接管

## 安全注意事项

1. **不要把 API 密钥直接写进面向用户的 prompt**
2. **执行结束后清理包含敏感信息的临时脚本**
3. **不要把子会话的“完成”当成最终完成**
4. **前端任务不允许静默跳过浏览器验收**

## 版本历史

### v0.3.0 (2026-04-15)

- 强化方案 B 的定位,明确它是独立无人值守编码代理
- 新增标准启动模板文档,默认使用 `--permission-mode bypassPermissions`
- 新增任务封包模板,要求主代理先写完整上下文再启动子会话
- 新增前端浏览器验收模板,把页面访问和交互检查纳入默认流程
- 新增失败分流文档,区分启动失败、执行失败、浏览器验收失败
- 明确主代理在子会话完成后必须重新看 diff、重新跑关键命令、重新验收

### v0.2.0 (2026-03-04)

- 新增方案 B:独立 Claude Code 会话驱动方案
- 增加案例分析、代码模板和常见问题文档

### v0.1.0 (2026-03-04)

- 创建 `use-other-model` 技能
- 提供方案 A 的基础能力
