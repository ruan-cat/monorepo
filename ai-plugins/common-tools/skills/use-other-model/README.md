# Use Other Model Skill

## 概述

`use-other-model` 技能帮助主代理把适合的任务委托给其他 AI 模型，在保证质量的前提下节省 50-80% token。

本次升级后的重点不再只是“把任务交给另一个模型”，而是同时支持 OpenCode 直连 provider 与方案 B 的 **无人值守、可编辑、可执行、可验证** 独立 Claude Code 编码代理。

本次是增量加固，不是能力替换：方案 A、方案 B 的任务封包、启动模板、预算/超时、浏览器验收、失败回退、案例和兼容模板继续保留；方案 C 保留 OpenCode 直连 provider，方案 D 新增 OpenCode 裸启动内部默认模型。

## 核心价值

- **显著降低成本**：复杂任务可以节省 50-80% token
- **OpenCode 双路径**：方案 C 直连用户指定 provider，方案 D 裸启动 OpenCode 自带默认内部模型
- **更稳的执行模式**：默认使用标准启动参数、上下文封包和失败分流
- **浏览器验收内建**：前端任务默认带页面访问和交互检查
- **主代理保留复核责任**：子会话完成后仍需要主代理重新验证

## 适用场景

### ✅ 强烈推荐

- 批量文件处理
- 多步骤、多文件修改
- 预计执行时间超过 5 分钟的任务
- 可拆分成清晰执行封包的复杂任务
- OpenCode 直连 provider/model、默认内部模型、模型变体或无头委托验证

### ❌ 不推荐

- 单文件小改
- 执行时间小于 1 分钟
- 仍然需要频繁用户澄清的问题
- 需要深度架构判断的高风险任务

## 四种方案

### 方案 A: MCP 工具

- 适合简单任务和单次调用
- 详细说明见 `references/method-a-mcp-tools.md`

### 方案 B: 独立 Claude Code 会话

- 适合复杂任务和长任务
- 默认按 **unattended coding agent** 设计
- 详细说明见 `references/method-b-independent-session.md`

### 方案 C: OpenCode 直连 provider

- 适合用户明确指定 API key、baseURL 和 `--model provider/model` 的场景
- 标准命令和占位符见 `references/opencode-provider-launch-templates.md`

### 方案 D: OpenCode 裸启动内部模型

- 适合 OpenCode 默认模型 smoke check、无头任务和用户已给完整 `opencode run` 命令的场景
- 默认省略 `--model`，使用 OpenCode 自身的内部模型选择链
- 不替代方案 B；需要独立编码代理读写文件、跑验证、写日志时仍使用方案 B
- 标准命令见 `references/opencode-headless-launch-templates.md`

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
    ├── opencode-provider-launch-templates.md
    ├── opencode-headless-launch-templates.md
    ├── technical-reports.md
    └── README.md
└── scripts/
    ├── smoke-opencode-provider.ps1
    ├── smoke-opencode.ps1
    └── launch-opencode-headless.ps1
```

## 快速开始

1. 先读主文件 `SKILL.md`，确认任务适合方案 A、方案 B、方案 C 还是方案 D。
2. 如果用户给出显式 provider/model 命令，按方案 C 原命令执行；如果命令省略 `--model`，按方案 D 裸启动执行，不要互相替换，也不要翻译成 Claude Code 子会话。
3. 如果使用方案 B:
   - 先准备 provider 环境变量
   - `ANTHROPIC_MODEL` 仅在用户明确指定时设置，不能作为通用必需变量
   - 再写任务封包
   - 再生成标准启动命令
   - 前端任务额外补浏览器验收模板
4. 子会话或 OpenCode 结果返回后，主代理必须重新验证。
5. 需要追溯历史方案或 token 节省依据时，再读取 `references/technical-reports.md`。

## 关键参考

- `references/claude-code-launch-templates.md`
  - 标准 Bash / PowerShell 启动模板
  - 默认包含 `--permission-mode bypassPermissions`、`--tools default`、`--output-format json`

- `references/opencode-headless-launch-templates.md`
  - 方案 D 的 OpenCode 裸启动、默认模型 smoke check 和无头任务模板
  - 默认省略 `--model`，不注入 provider 配置

- `references/opencode-provider-launch-templates.md`
  - 方案 C 的 OpenCode 直连 provider 命令
  - 使用占位符和当前 shell 环境变量，不写真实密钥

- `references/context-packet-template.md`
  - 方案 B 的任务封包模板
  - 用来约束工作目录、允许修改范围、验证命令和完成规则

- `references/frontend-browser-verification-template.md`
  - 前端任务专用浏览器验收模板
  - 强制记录 URL、首屏观察、关键交互和日志格式

- `references/failure-routing.md`
  - 启动失败、provider 层失败、执行失败、浏览器验收失败的分流策略
  - 明确规定连续两轮失败后主代理接管

- `references/environment-variables.md`
  - 识别 PowerShell/Bash provider 配置格式
  - 明确 `ANTHROPIC_MODEL` 可选，以及配置必须在实际调用 shell 中传播

- `references/code-templates.md`
  - 兼容保留的旧模板入口，继续提供任务封包和 Claude Code 启动骨架

- `references/technical-reports.md`
  - 历史技术方案与 token 节省分析报告链接
  - 按需渐进式加载，不作为启动前置步骤

## 安全注意事项

1. **不要把 API 密钥直接写进面向用户的 prompt、报告、任务封包或持久化脚本**
2. **优先用调用方 shell 环境变量承载敏感信息**
3. **不要把子会话的“完成”当成最终完成**
4. **前端任务不允许静默跳过浏览器验收**

## 版本历史

### v0.6.0 (2026-08-06)

- 新增方案 C：OpenCode 直连 provider，保留 API key、baseURL 和显式 `--model provider/model` 路径
- 新增方案 D：OpenCode 裸启动内部默认模型，用于无头 smoke check 和省略 `--model` 的 `opencode run` 场景
- 保留方案 B 的独立 Claude Code 会话定位，并增加“OpenCode 不替代方案 B”的分流规则
- 增加方案 B 启动器复杂度红线，避免把一次性启动脚本写成自定义运行平台
- 增加启动前固定执行卡：先最小 smoke check，再按 CLI、provider、执行、浏览器和清理分层处理
- 修正 Claude Code 模板，将 `ANTHROPIC_MODEL` 明确为可选项，并强调聊天中的环境变量不会自动传播到当前 shell
- 增加 provider 与裸启动两套 OpenCode 参考，以及 `scripts/smoke-opencode-provider.ps1`、`scripts/smoke-opencode.ps1` 和 `scripts/launch-opencode-headless.ps1`

### v0.3.0 (2026-04-15)

- 强化方案 B 的定位，明确它是独立无人值守编码代理
- 新增标准启动模板文档，默认使用 `--permission-mode bypassPermissions`
- 新增任务封包模板，要求主代理先写完整上下文再启动子会话
- 新增前端浏览器验收模板，把页面访问和交互检查纳入默认流程
- 新增失败分流文档，区分启动失败、执行失败、浏览器验收失败
- 明确主代理在子会话完成后必须重新看 diff、重新跑关键命令、重新验收

### v0.2.0 (2026-03-04)

- 新增方案 B：独立 Claude Code 会话驱动方案
- 增加案例分析、代码模板和常见问题文档

### v0.1.0 (2026-03-04)

- 创建 `use-other-model` 技能
- 提供方案 A 的基础能力
