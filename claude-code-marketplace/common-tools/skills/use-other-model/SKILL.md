---
name: use-other-model
description: "指导主代理如何驱动其他 AI 模型（MiniMax、Gemini）完成任务，实现 50-80% token 节省。提供两种方案：方案 A（MCP 工具，适合简单任务）和方案 B（独立 Claude Code 会话，适合复杂任务）。当用户提及使用其他模型、节省 token、批量操作、多文件处理、或执行时间超过 5 分钟的任务时使用此技能。包含完整的技术实现细节、代码模板和安全最佳实践。"
user-invocable: true
metadata:
  version: "0.2.0"
---

# Use Other Model

## 目标

通过智能地将任务委托给成本更低的 AI 模型，优化 token 使用和成本：

- 识别适合委托的任务类型
- 使用 MCP 工具驱动其他 AI 模型
- 在保证质量的前提下降低 token 消耗
- 为用户提供清晰的成本收益分析

## 核心原则

**Token 优化不是目的，而是手段**。始终优先考虑任务质量和用户体验，只在合适的场景下使用替代模型。

## 何时使用其他模型

### ✅ 适合委托的场景（Token 节省 50-80%）

1. **复杂多文件操作**
   - 需要修改 10+ 个文件
   - 需要创建 4+ 个独立的 git 提交
   - 预计执行时间超过 5 分钟

2. **批量重复任务**
   - 批量文件格式转换
   - 批量数据处理
   - 批量代码生成（如生成多个相似的 CRUD 接口）

3. **可并行的独立任务**
   - 多个独立功能模块的开发
   - 多个独立的测试用例编写
   - 多个独立的文档生成

4. **简单但耗时的任务**
   - 代码格式化和 lint 修复
   - 简单的文本处理和转换
   - 基础的文件操作

### ❌ 不适合委托的场景（直接执行更高效）

1. **简单快速任务**
   - 单文件编辑
   - 执行时间 < 1 分钟的任务
   - 简单的信息查询

2. **需要上下文的任务**
   - 依赖对话历史的任务
   - 需要理解复杂业务逻辑的任务
   - 需要实时用户交互的任务

3. **高质量要求的任务**
   - 核心业务逻辑实现
   - 安全相关的代码
   - 需要深度思考和创造性的任务

## 决策流程

在开始任务前，按以下步骤评估：

1. **评估任务复杂度**
   - 文件数量：< 3 个（简单）/ 3-10 个（中等）/ > 10 个（复杂）
   - 预计时间：< 1 分钟（快速）/ 1-5 分钟（中等）/ > 5 分钟（耗时）
   - 并行度：单线程 / 可部分并行 / 高度并行

2. **计算预期收益**
   - 简单任务：协调成本 ≈ 直接执行成本，收益 < 10%，**不推荐委托**
   - 中等任务：收益 20-40%，**可以考虑委托**
   - 复杂任务：收益 50-80%，**强烈推荐委托**

3. **向用户确认**
   使用 `AskUserQuestion` 工具向用户说明：
   - 任务评估结果（复杂度、预期收益）
   - 推荐的执行方式（直接执行 vs 委托）
   - 需要的配置信息（如果委托）

## 驱动其他 AI 模型的两种方案

### 方案对比

| 方案                 | 适用场景           | Token 节省 | 实现复杂度 |
| -------------------- | ------------------ | ---------- | ---------- |
| **方案 A：MCP 工具** | 简单任务、单次调用 | 20-40%     | 低         |
| **方案 B：独立会话** | 复杂任务、批量操作 | 50-80%     | 中         |

**推荐策略**：

- 简单任务（< 5 分钟）：使用方案 A（MCP 工具）
- 复杂任务（> 5 分钟）：使用方案 B（独立会话）

---

## 方案 A：使用 MCP 工具驱动其他模型

### 前置准备：获取配置信息

在首次使用其他模型前，必须向用户索要配置信息。使用 `AskUserQuestion` 工具：

```markdown
为了使用 [模型名称] 完成任务，我需要以下配置信息：

1. **API Key**：您的 [模型名称] API 密钥
2. **MCP 服务器配置**：确认 MCP 服务器是否已配置
3. **模型选择**：使用哪个具体的模型版本（如有多个选项）

请提供这些信息，或告诉我如何获取它们。
```

### 可用的 MCP 工具

根据您的环境配置，可能有以下 MCP 工具可用：

#### 1. MiniMax MCP Server

**适用场景**：通用任务、中文处理、图像理解

**可用工具**：

- `mcp__MiniMax__web_search`：网络搜索
- `mcp__MiniMax__understand_image`：图像分析

**使用示例**：

```markdown
我将使用 MiniMax 模型来处理这个批量图像分析任务。

[调用 mcp__MiniMax__understand_image 工具]
```

#### 2. Gemini MCP Server

**适用场景**：大上下文任务（>200k tokens）、代码审查、计划审查

**可用工具**：

- `mcp__gemini__gemini`：执行 Gemini CLI 任务

**使用示例**：

```markdown
这个任务需要处理大量代码文件，我将使用 Gemini 3 Pro 的大上下文能力。

[调用 mcp__gemini__gemini 工具]
```

### 方案 A 执行流程

1. **任务分解**
   - 将复杂任务分解为独立的子任务
   - 为每个子任务准备清晰的输入和预期输出

2. **选择合适的模型**
   - 根据任务类型选择最合适的模型
   - 考虑模型的特长和限制

3. **调用 MCP 工具**
   - 使用对应的 MCP 工具函数
   - 传递清晰的 prompt 和参数

4. **结果验证**
   - 检查输出质量
   - 必要时进行后处理或修正

5. **向用户报告**
   - 说明使用了哪个模型
   - 报告任务完成情况
   - 提供 token 使用统计（如果可用）

---

## 方案 B：启动独立 Claude Code 会话（推荐用于复杂任务）

### 核心架构

```plain
┌─────────────────────────────────────────────────────────────┐
│ 主会话 (当前会话 - Claude Sonnet 4.6)                       │
│                                                              │
│  1. 分析任务需求                                             │
│  2. 编写详细的执行计划文件                                   │
│  3. 生成 Bash 启动脚本                                       │
│  4. 使用 Bash 工具启动后台任务                               │
│     └─> run_in_background: true                             │
│                                                              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       │ Bash 后台任务
                       ↓
┌─────────────────────────────────────────────────────────────┐
│ 子会话 (独立 Claude Code 进程 - MiniMax/Gemini)             │
│                                                              │
│  1. 绕过嵌套检查: unset CLAUDECODE                           │
│  2. 设置目标模型的 API 配置                                  │
│  3. 启动独立的 Claude Code 进程                              │
│  4. 读取主会话编写的计划文件                                 │
│  5. 按计划执行任务                                           │
│  6. 返回执行结果                                             │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 关键技术点

#### 1. 绕过嵌套会话检查

**问题**：Claude Code 通过 `CLAUDECODE` 环境变量检测嵌套会话，默认禁止嵌套。

**解决方案**：在启动子会话前 `unset CLAUDECODE`

```bash
#!/bin/bash

# 关键：取消 CLAUDECODE 环境变量以绕过嵌套检查
unset CLAUDECODE

# 设置目标模型的 API 配置
export ANTHROPIC_AUTH_TOKEN="sk-ant-xxxxx"
export ANTHROPIC_BASE_URL="https://api.minimaxi.com/anthropic"
export ANTHROPIC_MODEL="MiniMax-M2.5-highspeed"

# 启动独立的 Claude Code 会话
claude --dangerously-skip-permissions << 'TASK_END'
请你严格按照 task-plan.md 文件中的执行计划，完成任务。
TASK_END
```

#### 2. 使用 Bash 后台任务

**关键参数**：`run_in_background: true`

使用 Bash 工具时，必须设置 `run_in_background: true`，这样：

- 主会话不会被阻塞
- 子会话可以独立运行
- 通过 `TaskOutput` 工具获取执行结果

#### 3. 使用 Heredoc 传递任务

**技术**：使用 Bash Heredoc 将任务指令传递给子会话

```bash
claude --dangerously-skip-permissions << 'TASK_END'
请你严格按照 task-plan.md 文件中的执行计划，完成任务。

执行步骤：
1. 先阅读 task-plan.md 文件，理解执行计划
2. 按照计划中的顺序，逐步执行
3. 每个步骤完成后验证结果
4. 遇到问题时记录到 execution-log.md

开始执行。
TASK_END
```

**优势**：

- 清晰的任务边界（`TASK_END` 标记）
- 支持多行指令
- 避免 shell 转义问题

#### 4. 文件作为通信媒介

**设计模式**：主会话和子会话通过文件系统通信

```plain
主会话编写:
  ├─ task-plan.md              # 详细的执行计划
  ├─ execute-task.sh           # 启动脚本
  └─ input-data/               # 输入数据（如果需要）

子会话读取和写入:
  ├─ task-plan.md              # 读取计划
  ├─ execution-log.md          # 写入执行日志
  └─ output-data/              # 输出结果
```

**优势**：

- 解耦主会话和子会话
- 计划可以被审查和修改
- 支持复杂的任务描述
- 便于调试和追踪

### 方案 B 完整实施流程

#### Step 1: 向用户索要 API 配置

使用 `AskUserQuestion` 工具：

````markdown
为了启动独立的 [模型名称] 会话，我需要以下配置信息：

1. **ANTHROPIC_AUTH_TOKEN**：您的 API 密钥
2. **ANTHROPIC_BASE_URL**：API 端点地址
   - MiniMax: `https://api.minimaxi.com/anthropic`
   - Claude 代理服务: `https://www.ai-clauder.cc`
   - Gemini: (使用 Gemini MCP 工具，不需要此配置)
3. **ANTHROPIC_MODEL**：模型名称
   - MiniMax: `MiniMax-M2.5-highspeed` 或 `MiniMax-M2.5-pro`

请直接提供您的环境变量配置命令，格式如下：

**PowerShell 格式**（Windows）：

```powershell
$env:ANTHROPIC_AUTH_TOKEN = "your-token-here"
$env:ANTHROPIC_BASE_URL = "https://api.minimaxi.com/anthropic"
$env:ANTHROPIC_MODEL = "MiniMax-M2.5-highspeed"
```
````

**Bash 格式**（Linux/Mac）：

```bash
export ANTHROPIC_AUTH_TOKEN="your-token-here"
export ANTHROPIC_BASE_URL="https://api.minimaxi.com/anthropic"
export ANTHROPIC_MODEL="MiniMax-M2.5-highspeed"
```

我会从您提供的命令中提取配置信息。

````markdown
### 识别用户提供的环境变量格式

用户可能以以下格式提供配置信息，您需要能够识别并提取：

#### 格式 1：MiniMax 完整配置（PowerShell）

```powershell
$env:ANTHROPIC_AUTH_TOKEN = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOi...（JWT token 已脱敏）...S54jsg"
$env:ANTHROPIC_BASE_URL = "https://api.minimaxi.com/anthropic"
$env:ANTHROPIC_MODEL = "MiniMax-M2.5-highspeed"
$env:ANTHROPIC_DEFAULT_HAIKU_MODEL = "MiniMax-M2.5-highspeed"
$env:ANTHROPIC_DEFAULT_SONNET_MODEL = "MiniMax-M2.5-highspeed"
$env:ANTHROPIC_DEFAULT_OPUS_MODEL = "MiniMax-M2.5-highspeed"
claude --dangerously-skip-permissions
```
````

**提取要点**：

- `ANTHROPIC_AUTH_TOKEN`：JWT 格式的长 token（MiniMax 特有）
- `ANTHROPIC_BASE_URL`：`https://api.minimaxi.com/anthropic`
- `ANTHROPIC_MODEL`：`MiniMax-M2.5-highspeed`
- 可选的模型别名配置（`DEFAULT_HAIKU_MODEL` 等）

#### 格式 2：Claude 代理服务配置（PowerShell）

```powershell
$env:ANTHROPIC_AUTH_TOKEN = "sk-be08aa56e195...（API Key 已脱敏）...57c1d12a"
$env:ANTHROPIC_BASE_URL = "https://www.ai-clauder.cc"
$env:CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS = "1"
claude --dangerously-skip-permissions
```

**提取要点**：

- `ANTHROPIC_AUTH_TOKEN`：`sk-` 开头的 API 密钥
- `ANTHROPIC_BASE_URL`：代理服务地址
- `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`：禁用实验性功能（可选）
- 注意：此格式没有指定 `ANTHROPIC_MODEL`，使用默认模型

#### 格式 3：Bash 格式（Linux/Mac）

```bash
export ANTHROPIC_AUTH_TOKEN="your-token-here"
export ANTHROPIC_BASE_URL="https://api.minimaxi.com/anthropic"
export ANTHROPIC_MODEL="MiniMax-M2.5-highspeed"
```

**提取要点**：

- 使用 `export` 而不是 `$env:`
- 值用双引号包裹
- 格式：`export VAR_NAME="value"`

### 环境变量提取规则

当用户提供配置信息时，按以下规则提取：

1. **识别格式**：
   - PowerShell：`$env:VAR_NAME = "value"`
   - Bash：`export VAR_NAME="value"`

2. **必需变量**：
   - `ANTHROPIC_AUTH_TOKEN`：必需
   - `ANTHROPIC_BASE_URL`：必需

3. **可选变量**：
   - `ANTHROPIC_MODEL`：如果未提供，使用默认值或询问用户
   - `ANTHROPIC_DEFAULT_*_MODEL`：模型别名，可忽略
   - `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS`：功能开关，可忽略

4. **Token 格式识别**：
   - JWT 格式（MiniMax）：以 `eyJ` 开头，包含两个点（`.`）
   - API Key 格式：以 `sk-` 开头
   - 其他格式：直接使用

5. **转换为 Bash 格式**：
   无论用户提供什么格式，最终都转换为 Bash 格式用于启动脚本：
   ```bash
   export ANTHROPIC_AUTH_TOKEN="extracted-token"
   export ANTHROPIC_BASE_URL="extracted-url"
   export ANTHROPIC_MODEL="extracted-model"
   ```

#### Step 2: 主会话分析任务并编写执行计划

创建详细的执行计划文件 `task-plan.md`：

````markdown
# 任务执行计划

## 任务概述

[简要描述任务目标]

## 执行步骤

### 步骤 1：[步骤名称]

**目标**：[这一步要完成什么]

**操作**：

```bash
# 具体的命令或操作
git status
git diff --cached
```

**验证**：

- [ ] 检查点 1
- [ ] 检查点 2

### 步骤 2：[步骤名称]

...

## 预期输出

- 文件 A：[描述]
- 文件 B：[描述]

## 注意事项

1. 如果遇到 X 问题，执行 Y 操作
2. 必须验证 Z 条件
````

**关键要点**：

- 计划必须详细、明确、可执行
- 包含所有必要的命令和验证步骤
- 说明预期输出和注意事项
- 使用清晰的 Markdown 格式

#### Step 3: 主会话生成启动脚本

根据用户提供的环境变量格式，生成对应的启动脚本。

**示例 1：使用 MiniMax 配置**

创建 `execute-task.sh`：

```bash
#!/bin/bash

# ============================================
# 独立 Claude Code 会话启动脚本 - MiniMax
# ============================================

# 1. 绕过嵌套检查
unset CLAUDECODE

# 2. 设置 MiniMax API 配置
# 注意：这些值从用户提供的 PowerShell 命令中提取
export ANTHROPIC_AUTH_TOKEN="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJHcm91cE5hbWUiOi...（JWT token 已脱敏）...S54jsg"
export ANTHROPIC_BASE_URL="https://api.minimaxi.com/anthropic"
export ANTHROPIC_MODEL="MiniMax-M2.5-highspeed"

# 3. 可选：设置模型别名（如果用户提供了）
export ANTHROPIC_DEFAULT_HAIKU_MODEL="MiniMax-M2.5-highspeed"
export ANTHROPIC_DEFAULT_SONNET_MODEL="MiniMax-M2.5-highspeed"
export ANTHROPIC_DEFAULT_OPUS_MODEL="MiniMax-M2.5-highspeed"

# 4. 启动独立的 Claude Code 会话
claude --dangerously-skip-permissions << 'TASK_END'
你是一个任务执行助手。请严格按照 task-plan.md 文件中的执行计划完成任务。

执行要求：
1. 先阅读 task-plan.md 文件，完整理解执行计划
2. 按照计划中的步骤顺序，逐步执行
3. 每个步骤完成后，验证结果是否符合预期
4. 将执行过程和结果记录到 execution-log.md 文件
5. 如果遇到问题，记录问题并尝试解决
6. 完成所有步骤后，总结执行结果

现在开始执行。
TASK_END
```

**示例 2：使用 Claude 代理服务配置**

创建 `execute-task.sh`：

```bash
#!/bin/bash

# ============================================
# 独立 Claude Code 会话启动脚本 - Claude 代理
# ============================================

# 1. 绕过嵌套检查
unset CLAUDECODE

# 2. 设置 Claude 代理服务配置
export ANTHROPIC_AUTH_TOKEN="sk-be08aa56e195...（API Key 已脱敏）...57c1d12a"
export ANTHROPIC_BASE_URL="https://www.ai-clauder.cc"

# 3. 可选：禁用实验性功能
export CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS="1"

# 4. 启动独立的 Claude Code 会话
claude --dangerously-skip-permissions << 'TASK_END'
你是一个任务执行助手。请严格按照 task-plan.md 文件中的执行计划完成任务。

执行要求：
1. 先阅读 task-plan.md 文件，完整理解执行计划
2. 按照计划中的步骤顺序，逐步执行
3. 每个步骤完成后，验证结果是否符合预期
4. 将执行过程和结果记录到 execution-log.md 文件
5. 如果遇到问题，记录问题并尝试解决
6. 完成所有步骤后，总结执行结果

现在开始执行。
TASK_END
```

**环境变量提取示例**：

如果用户提供 PowerShell 格式：

```powershell
$env:ANTHROPIC_AUTH_TOKEN = "sk-xxxxx"
$env:ANTHROPIC_BASE_URL = "https://api.minimaxi.com/anthropic"
```

您需要提取并转换为 Bash 格式：

```bash
export ANTHROPIC_AUTH_TOKEN="sk-xxxxx"
export ANTHROPIC_BASE_URL="https://api.minimaxi.com/anthropic"
```

**提取规则**：

1. 移除 `$env:` 前缀
2. 将 `=` 替换为 `=`
3. 添加 `export` 前缀
4. 确保值用双引号包裹

**安全注意**：

- 脚本中包含敏感的 API 密钥
- 执行完成后应立即删除脚本文件
- 或者使用环境变量文件（`.env`）管理配置

#### Step 4: 主会话启动后台任务

使用 Bash 工具启动后台任务：

```typescript
Bash({
	command: "chmod +x execute-task.sh && bash execute-task.sh 2>&1",
	description: "启动独立的 [模型名称] 会话执行任务",
	run_in_background: true,
	timeout: 300000, // 5 分钟超时，根据任务复杂度调整
});
```

**重要参数说明**：

- `run_in_background: true`：必须设置，否则主会话会被阻塞
- `timeout`：根据任务预计时间设置，建议留有余量
- `2>&1`：捕获标准错误输出，便于调试

**执行后**：

- Bash 工具会返回一个 `task_id`（例如：`bwlly90kq`）
- 记住这个 `task_id`，后续用于获取执行结果

#### Step 5: 主会话监控任务进度（可选）

如果任务执行时间较长，可以定期检查进度：

```typescript
// 检查子会话是否创建了执行日志
Read({
	file_path: "execution-log.md",
});
```

或者向用户报告：

```markdown
我已经启动了独立的 [模型名称] 会话来执行任务。

- 任务 ID: bwlly90kq
- 预计执行时间: 约 5 分钟
- 执行计划: task-plan.md
- 执行日志: execution-log.md（子会话会实时更新）

我会在任务完成后通知您。
```

#### Step 6: 主会话获取执行结果

使用 `TaskOutput` 工具获取子会话的执行结果：

```typescript
TaskOutput({
	task_id: "bwlly90kq", // 使用 Step 4 返回的 task_id
	block: true, // 阻塞等待任务完成
	timeout: 300000, // 超时时间（毫秒）
});
```

**返回结果包含**：

- 子会话的完整输出
- 执行状态（成功/失败）
- 执行时间和 token 使用情况

#### Step 7: 主会话验证结果并清理

1. **验证输出质量**：

   ```typescript
   // 读取子会话生成的文件
   Read({ file_path: "execution-log.md" });
   Read({ file_path: "output-data/result.json" });
   ```

2. **清理敏感文件**：

   ```bash
   rm -f execute-task.sh  # 删除包含 API 密钥的脚本
   ```

3. **向用户报告**：

   ```markdown
   ✅ 任务执行完成！

   **执行摘要**：

   - 使用模型：MiniMax-M2.5-highspeed
   - 执行时间：3 分 24 秒
   - Token 使用：主会话 5,200 + 子会话 8,500 = 13,700
   - Token 节省：约 65%（相比直接执行预计 39,000 tokens）

   **输出文件**：

   - execution-log.md：详细执行日志
   - output-data/：任务输出结果

   请检查输出结果是否符合预期。
   ```

### 方案 B 实际案例：批量 Git 提交

**场景**：需要创建 4 个独立的 git 提交，每个提交涉及不同的文件和类型。

#### 主会话编写的执行计划 (`git-commit-plan.md`)

````markdown
# Git Commit 提交计划

## 提交拆分方案（共 4 个提交）

### 提交 1：删除依赖

**类型**：`deps` (破坏性变更)
**Scope**：`admin`
**文件**：

- `apps/admin/package.json`
- `pnpm-lock.yaml`

**提交信息文件**：`commit-msg-1.txt`

```plain
📦 deps(admin)!: 删除 @neondatabase/auth 依赖

BREAKING CHANGE: 移除 Neon Auth 集成，改用自定义认证方案
```

**执行命令**：

```bash
cd apps/admin
git add package.json ../../pnpm-lock.yaml
git commit -F commit-msg-1.txt
```

**验证**：

- [ ] 提交成功
- [ ] 工作树中不再包含这两个文件的变更

### 提交 2：清理配置

**类型**：`config` (破坏性变更)
**Scope**：`admin`
**文件**：

- `apps/admin/nuxt.config.ts`
- `apps/admin/server/middleware/auth.ts`

**提交信息文件**：`commit-msg-2.txt`

```plain
🔧 config(admin)!: 清理 Neon Auth 相关配置

BREAKING CHANGE: 移除 Neon Auth 中间件和配置
```

**执行命令**：

```bash
git add nuxt.config.ts server/middleware/auth.ts
git commit -F commit-msg-2.txt
```

### 提交 3：添加文档

**类型**：`docs`
**Scope**：`admin`
**文件**：

- `apps/admin/src/docs/reports/2026-03-03-production-500-error-debug.md`

**提交信息文件**：`commit-msg-3.txt`

```plain
📃 docs(admin): 添加生产环境 500 错误调试报告
```

**执行命令**：

```bash
git add src/docs/reports/2026-03-03-production-500-error-debug.md
git commit -F commit-msg-3.txt
```

### 提交 4：更新中间件

**类型**：`chore`
**Scope**：`admin`
**文件**：

- `apps/admin/server/middleware/logger.ts`
- `apps/admin/src/docs/README.md`

**提交信息文件**：`commit-msg-4.txt`

```plain
🐳 chore(admin): 更新文档和日志中间件
```

**执行命令**：

```bash
git add server/middleware/logger.ts src/docs/README.md
git commit -F commit-msg-4.txt
```

## 最终验证

执行完所有提交后，运行：

```bash
git status
git log --oneline -4
```

确认：

- [ ] 工作树干净（no changes）
- [ ] 本地分支领先 origin/dev 4 个提交
- [ ] 所有提交信息符合规范
````

#### 主会话生成的启动脚本 (`execute-git-commit.sh`)

```bash
#!/bin/bash

unset CLAUDECODE

export ANTHROPIC_AUTH_TOKEN="sk-ant-xxxxx"
export ANTHROPIC_BASE_URL="https://api.minimaxi.com/anthropic"
export ANTHROPIC_MODEL="MiniMax-M2.5-highspeed"

claude --dangerously-skip-permissions << 'TASK_END'
请你严格按照 git-commit-plan.md 文件中的提交计划，完成 4 个 git 提交。

执行步骤：
1. 先阅读 git-commit-plan.md 文件，理解提交计划
2. 按照计划中的顺序，逐个执行提交
3. 每个提交前使用 git diff --cached 审查暂存内容
4. 使用文件方式（-F）提交以避免中文乱码
5. 提交完成后验证工作树是否干净

开始执行。
TASK_END
```

#### 执行结果

**成功完成的 4 个提交**：

```bash
b07ec868 🐳 chore(admin): 更新文档和日志中间件
21b5d77b 📃 docs(admin): 添加生产环境 500 错误调试报告
24b68722 🔧 config(admin)!: 清理 Neon Auth 相关配置
59c4a278 📦 deps(admin)!: 删除 @neondatabase/auth 依赖
```

**Token 使用对比**：

- 直接执行预计：~39,000 tokens
- 实际使用：主会话 5,200 + 子会话 8,500 = 13,700 tokens
- **节省比例：约 65%**

### 方案 B 的优势

1. **显著的 Token 节省**：
   - 主会话只负责规划（~5K tokens）
   - 子会话执行具体任务（使用更便宜的模型）
   - 节省比例：50-80%

2. **模型选择灵活性**：
   - 规划任务：使用 Claude Sonnet 4.6（推理能力强）
   - 执行任务：使用 MiniMax/Gemini（速度快、成本低）

3. **任务隔离**：
   - 主会话和子会话完全隔离
   - 子会话崩溃不影响主会话
   - 可以并行启动多个子会话

4. **可审查性**：
   - 执行计划以文件形式存在
   - 可以在执行前审查和修改
   - 便于调试和优化

## 成本收益分析

### Token 使用对比

| 场景类型   | 直接执行 | 委托执行        | 节省比例 |
| ---------- | -------- | --------------- | -------- |
| 简单单文件 | 2,000    | 2,100           | -5% ❌   |
| 中等多文件 | 11,500   | 5,000 + 6,500   | ~51% ✅  |
| 复杂批量   | 40,000   | 10,000 + 30,000 | ~68% ✅  |

### 决策矩阵

```plain
任务复杂度 × 文件数量 = 推荐策略

简单 × 少量（1-2）    → 直接执行
简单 × 大量（10+）    → 考虑委托（批量处理）
中等 × 中量（3-10）   → 考虑委托
复杂 × 任意数量       → 强烈推荐委托
```

## 实际执行示例

### 示例 1：批量文件处理（推荐委托）

**场景**：需要为 15 个 TypeScript 文件添加 JSDoc 注释

**评估**：

- 文件数量：15（复杂）
- 任务类型：重复性高
- 预期收益：~60%

**执行**：

```markdown
这个任务涉及 15 个文件的批量处理，我建议使用 MiniMax 模型来完成，预计可以节省约 60% 的 token。

我需要您的 MiniMax API 配置信息来继续。
```

### 示例 2：单文件重构（不推荐委托）

**场景**：重构一个复杂的业务逻辑文件

**评估**：

- 文件数量：1（简单）
- 任务类型：需要深度理解
- 预期收益：< 5%

**执行**：

```markdown
这是一个需要深度理解业务逻辑的单文件重构任务，我将直接执行，这样可以更好地保证质量。
```

### 示例 3：并行测试用例生成（推荐委托）

**场景**：为 8 个独立模块各生成测试用例

**评估**：

- 任务数量：8（可并行）
- 任务类型：独立、重复
- 预期收益：~70%

**执行**：

```markdown
这 8 个模块的测试用例可以并行生成，我建议使用 Gemini 模型处理，预计可以节省约 70% 的 token。

请确认您的 Gemini MCP 配置是否已就绪。
```

### 方案 B 的潜在风险与限制

#### 风险

1. **嵌套会话稳定性**：
   - 虽然绕过了检查，但仍可能存在资源冲突
   - 建议监控系统资源使用情况
   - 避免同时启动过多子会话

2. **API 配置泄露**：
   - 启动脚本包含 API token
   - **必须在执行后立即删除脚本文件**
   - 或使用环境变量文件（`.env`）管理配置

3. **子会话失控**：
   - 子会话可能执行意外操作
   - 建议在计划中明确限制子会话的权限
   - 使用 `--dangerously-skip-permissions` 时要特别小心

#### 限制

1. **无法实时监控**：
   - 只能在任务完成后获取结果
   - 无法中途干预子会话
   - 建议让子会话定期写入进度文件

2. **文件系统依赖**：
   - 需要通过文件系统通信
   - 可能存在文件读写冲突
   - 确保文件路径正确且可访问

3. **环境变量隔离**：
   - 需要正确设置环境变量
   - 配置错误可能导致子会话失败
   - 建议在启动前验证配置

### 方案选择建议

| 任务特征          | 推荐方案           | 理由                   |
| ----------------- | ------------------ | ---------------------- |
| 单次 API 调用     | 方案 A（MCP 工具） | 简单直接，无需额外配置 |
| 批量重复操作      | 方案 B（独立会话） | 显著节省 token         |
| 需要多步骤执行    | 方案 B（独立会话） | 可以编写详细计划       |
| 需要实时交互      | 方案 A（MCP 工具） | 可以在主会话中处理     |
| 执行时间 < 2 分钟 | 方案 A（MCP 工具） | 启动开销小             |
| 执行时间 > 5 分钟 | 方案 B（独立会话） | token 节省显著         |

---

## 注意事项

### 安全性

1. **敏感信息保护**
   - **绝对不要在 prompt 中包含 API 密钥、密码等敏感信息**
   - 使用环境变量或配置文件管理凭证
   - 向用户明确说明需要哪些配置信息
   - **方案 B：执行完成后立即删除包含 API 密钥的脚本文件**

2. **输出验证**
   - 始终验证其他模型的输出质量
   - 对关键代码进行人工审查
   - 必要时进行测试验证
   - 不要盲目信任子会话的输出

3. **权限控制**
   - 使用 `--dangerously-skip-permissions` 时要特别小心
   - 在执行计划中明确限制子会话的操作范围
   - 避免让子会话执行危险操作（如 `rm -rf`）

### 用户体验

1. **透明沟通**
   - 明确告知用户将使用哪个模型和方案
   - 说明为什么选择该方案
   - 报告任务完成情况和成本节省
   - 提供详细的执行日志

2. **失败处理**
   - 如果其他模型失败，回退到直接执行
   - 向用户解释失败原因和解决方案
   - 不要让用户感到困惑或沮丧
   - 提供清晰的错误信息和调试建议

3. **配置管理**
   - 首次使用时引导用户配置
   - 记住用户的配置偏好（如果可能）
   - 提供清晰的配置文档链接
   - 验证配置的正确性

4. **进度反馈**
   - 对于长时间运行的任务，提供进度估计
   - 建议子会话定期写入进度文件
   - 主会话可以定期检查进度并向用户报告

## 常见问题

### Q1: 如何判断任务是否适合委托？

**A**: 使用"决策流程"部分的三步评估法：

1. **评估复杂度**：文件数量、预计时间、并行度
2. **计算收益**：预期 token 节省比例
3. **向用户确认**：说明评估结果和推荐方案

**快速判断**：

- 预期收益 > 50% → 强烈推荐方案 B（独立会话）
- 预期收益 20-50% → 考虑方案 A（MCP 工具）
- 预期收益 < 20% → 直接执行

### Q2: 方案 A 和方案 B 如何选择？

**A**: 根据任务特征选择：

| 任务特征           | 推荐方案           |
| ------------------ | ------------------ |
| 单次调用、简单任务 | 方案 A（MCP 工具） |
| 多步骤、复杂任务   | 方案 B（独立会话） |
| 执行时间 < 2 分钟  | 方案 A             |
| 执行时间 > 5 分钟  | 方案 B             |
| 需要实时交互       | 方案 A             |
| 批量重复操作       | 方案 B             |

### Q3: 如果用户没有配置 API 密钥怎么办？

**A**:

1. 使用 `AskUserQuestion` 工具向用户索要配置信息
2. 提供清晰的配置步骤说明
3. 如果用户不想配置，回退到直接执行
4. 不要强制用户使用其他模型

### Q4: 如何处理其他模型的输出质量问题？

**A**:

1. **始终验证输出**：读取子会话生成的文件，检查质量
2. **必要时进行后处理**：修正格式、补充缺失内容
3. **质量不达标时回退**：如果输出质量差，回退到直接执行
4. **向用户说明情况**：透明地告知用户质量问题和解决方案

### Q5: 可以同时使用多个不同的模型吗？

**A**: 可以，但要注意：

1. **合理分配任务**：根据模型特长分配任务
   - Gemini：大上下文任务（>200k tokens）
   - MiniMax：通用任务、中文处理、图像理解
2. **避免资源冲突**：不要同时启动过多子会话
3. **监控系统资源**：确保系统有足够的内存和 CPU

### Q6: 方案 B 中的 `unset CLAUDECODE` 是否安全？

**A**:

- **技术上可行**：这是绕过嵌套检查的关键步骤
- **存在风险**：可能导致资源冲突或不稳定
- **建议做法**：
  1. 仅在必要时使用（复杂任务、显著 token 节省）
  2. 监控子会话的执行情况
  3. 避免同时启动多个子会话
  4. 在执行计划中明确限制子会话的操作范围

### Q7: 如何调试子会话的执行问题？

**A**:

1. **检查执行日志**：读取 `execution-log.md` 文件
2. **检查 Bash 输出**：使用 `TaskOutput` 获取完整输出
3. **验证配置**：确认 API 密钥、Base URL、模型名称正确
4. **简化任务**：先用简单任务测试，确认配置正确
5. **查看错误信息**：子会话的错误信息会包含在 Bash 输出中

### Q8: 执行计划文件应该包含哪些内容？

**A**: 一个好的执行计划应该包含：

1. **任务概述**：简要描述任务目标
2. **执行步骤**：详细的、可执行的步骤列表
3. **具体命令**：每个步骤的具体命令或操作
4. **验证检查点**：每个步骤的验证条件
5. **预期输出**：任务完成后的预期结果
6. **注意事项**：特殊情况的处理方法
7. **错误处理**：遇到问题时的应对策略

**示例结构**：

````markdown
# 任务执行计划

## 任务概述

[简要描述]

## 执行步骤

### 步骤 1：[名称]

**目标**：[描述]
**操作**：

```bash
[命令]
```
````

**验证**：

- [ ] 检查点 1
- [ ] 检查点 2

## 预期输出

- 文件 A：[描述]

## 注意事项

1. [注意事项 1]

````plain

### Q9: 如何确保 API 密钥的安全？

**A**:
1. **使用环境变量文件**：
   ```bash
   # 创建 .env 文件
   echo "ANTHROPIC_AUTH_TOKEN=sk-ant-xxxxx" > .env
   echo "ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic" >> .env
   echo "ANTHROPIC_MODEL=MiniMax-M2.5-highspeed" >> .env

   # 在脚本中加载
   source .env
````

2. **执行后立即删除**：

   ```bash
   # 在主会话中
   Bash({
     command: "bash execute-task.sh 2>&1 && rm -f execute-task.sh",
     description: "执行任务并清理脚本",
     run_in_background: true
   })
   ```

3. **添加到 .gitignore**：
   ```plain
   execute-task.sh
   .env
   ```

### Q10: 子会话执行失败后如何处理？

**A**:

1. **读取错误信息**：使用 `TaskOutput` 获取完整输出
2. **分析失败原因**：
   - API 配置错误？
   - 执行计划有问题？
   - 子会话崩溃？
3. **尝试修复**：
   - 修正配置
   - 优化执行计划
   - 简化任务
4. **回退到直接执行**：如果无法修复，直接在主会话中执行
5. **向用户说明**：透明地告知失败原因和解决方案

## 参考资料

### 官方文档

- [Claude Code 官方文档](https://code.claude.com/docs)
- [MCP 服务器配置文档](https://modelcontextprotocol.io/)
- [MiniMax API 文档](https://www.minimaxi.com/document)
- [Gemini API 文档](https://ai.google.dev/gemini-api/docs)

### 技术报告（本技能的核心参考）

- [在 Claude Code 会话中驱动其他 AI 模型的技术方案](https://raw.githubusercontent.com/ruan-cat/11comm/refs/heads/dev/apps/admin/src/docs/reports/2026-03-04-driving-minimax-model-technical-report/2026-03-04-driving-minimax-model-technical-report.md)
  - 详细记录了方案 B（独立 Claude Code 会话）的完整技术实现
  - 包含核心技术点、实施流程、实际案例和最佳实践
  - 本技能的方案 B 完全基于此报告实现

- [Token 节省分析报告](https://raw.githubusercontent.com/ruan-cat/11comm/refs/heads/dev/apps/admin/src/docs/reports/2026-03-04-driving-minimax-model-technical-report/2026-03-04-token-savings-analysis.md)
  - 详细分析了不同场景下的 token 节省效果
  - 提供了决策框架和成本收益分析
  - 本技能的决策流程基于此报告的分析结果

### 技术参考

- [Bash Heredoc 语法](https://tldp.org/LDP/abs/html/here-docs.html)
- [Git Commit 规范](https://www.conventionalcommits.org/)
- [Claude Code Bash 工具文档](https://code.claude.com/docs/tools/bash)

### 相关技能

- `git-commit`：高质量 git 提交技能
- `gemini`：Gemini 大上下文处理技能

---

## 附录：完整代码模板

### A. 执行计划模板 (`task-plan.md`)

````markdown
# 任务执行计划

## 任务概述

**目标**：[简要描述任务目标]

**预期收益**：

- Token 节省：约 [X]%
- 执行时间：约 [X] 分钟

## 执行步骤

### 步骤 1：[步骤名称]

**目标**：[这一步要完成什么]

**操作**：

```bash
# 具体的命令或操作
[命令 1]
[命令 2]
```

**验证**：

- [ ] 检查点 1：[描述]
- [ ] 检查点 2：[描述]

**预期输出**：

- [输出描述]

---

### 步骤 2：[步骤名称]

**目标**：[这一步要完成什么]

**操作**：

```bash
[命令]
```

**验证**：

- [ ] 检查点 1

---

## 预期输出

### 文件输出

- `output-file-1.txt`：[描述]
- `output-file-2.json`：[描述]

### 执行日志

- `execution-log.md`：详细的执行过程记录

## 注意事项

1. **错误处理**：如果遇到 [X] 问题，执行 [Y] 操作
2. **验证要求**：必须验证 [Z] 条件
3. **安全限制**：不要执行 [危险操作]

## 最终验证

执行完所有步骤后，运行：

```bash
[验证命令]
```

确认：

- [ ] [验证条件 1]
- [ ] [验证条件 2]
````

### B. 启动脚本模板 (`execute-task.sh`)

````bash
#!/bin/bash

# ============================================
# 独立 Claude Code 会话启动脚本
# ============================================

# 1. 绕过嵌套检查
unset CLAUDECODE

# 2. 设置目标模型的 API 配置
# 注意：这些值应该从用户处获取
export ANTHROPIC_AUTH_TOKEN="[用户提供的 API Key]"
export ANTHROPIC_BASE_URL="[用户提供的 Base URL]"
export ANTHROPIC_MODEL="[用户提供的模型名称]"

# 3. 可选：设置其他环境变量
# export ANTHROPIC_MAX_TOKENS="4096"
# export ANTHROPIC_TEMPERATURE="0.7"

# 4. 启动独立的 Claude Code 会话
claude --dangerously-skip-permissions << 'TASK_END'
你是一个任务执行助手。请严格按照 task-plan.md 文件中的执行计划完成任务。

执行要求：
1. 先阅读 task-plan.md 文件，完整理解执行计划
2. 按照计划中的步骤顺序，逐步执行
3. 每个步骤完成后，验证结果是否符合预期
4. 将执行过程和结果记录到 execution-log.md 文件
5. 如果遇到问题，记录问题并尝试解决
6. 完成所有步骤后，总结执行结果

执行日志格式：
```markdown
# 任务执行日志

## 开始时间
[时间戳]

## 步骤 1：[名称]
- 状态：[进行中/完成/失败]
- 输出：[描述]
- 问题：[如有]

## 步骤 2：[名称]
...

## 完成时间
[时间戳]

## 执行摘要
- 成功步骤：[X]/[总数]
- 失败步骤：[列表]
- 输出文件：[列表]
````

现在开始执行。
TASK_END

# 5. 可选：执行后清理

# rm -f execute-task.sh

````markdown
### C. 主会话调用代码模板

```typescript
// ============================================
// 主会话：启动独立 Claude Code 会话
// ============================================

// Step 1: 向用户索要配置信息
AskUserQuestion({
	questions: [
		{
			question: "为了启动独立的 [模型名称] 会话，我需要您的 API 配置信息。请提供以下信息：",
			header: "API 配置",
			options: [
				{
					label: "我已准备好配置信息",
					description: "我会在下一步提供 API Key、Base URL 和模型名称",
				},
				{
					label: "我需要配置帮助",
					description: "请告诉我如何获取和配置这些信息",
				},
			],
			multiSelect: false,
		},
	],
});

// Step 2: 创建执行计划
Write({
	content: `# 任务执行计划

## 任务概述
[详细的执行计划内容]
...
`,
	file_path: "task-plan.md",
});

// Step 3: 创建启动脚本
Write({
	content: `#!/bin/bash

unset CLAUDECODE

export ANTHROPIC_AUTH_TOKEN="[用户提供的 API Key]"
export ANTHROPIC_BASE_URL="[用户提供的 Base URL]"
export ANTHROPIC_MODEL="[用户提供的模型名称]"

claude --dangerously-skip-permissions << 'TASK_END'
请你严格按照 task-plan.md 文件中的执行计划，完成任务。
...
TASK_END
`,
	file_path: "execute-task.sh",
});

// Step 4: 启动后台任务
Bash({
	command: "chmod +x execute-task.sh && bash execute-task.sh 2>&1",
	description: "启动独立的 [模型名称] 会话执行任务",
	run_in_background: true,
	timeout: 300000, // 5 分钟超时
});

// 记录返回的 task_id，例如：bwlly90kq

// Step 5: 向用户报告
// "我已经启动了独立的 [模型名称] 会话来执行任务。
//  - 任务 ID: bwlly90kq
//  - 预计执行时间: 约 5 分钟
//  我会在任务完成后通知您。"

// Step 6: 获取执行结果
TaskOutput({
	task_id: "bwlly90kq", // 使用 Step 4 返回的 task_id
	block: true,
	timeout: 300000,
});

// Step 7: 验证结果
Read({ file_path: "execution-log.md" });
Read({ file_path: "output-data/result.json" });

// Step 8: 清理敏感文件
Bash({
	command: "rm -f execute-task.sh",
	description: "删除包含 API 密钥的脚本文件",
});

// Step 9: 向用户报告
// "✅ 任务执行完成！
//
//  **执行摘要**：
//  - 使用模型：[模型名称]
//  - 执行时间：[X] 分 [Y] 秒
//  - Token 使用：主会话 [A] + 子会话 [B] = [A+B]
//  - Token 节省：约 [X]%
//
//  请检查输出结果是否符合预期。"
```

### D. 环境变量文件模板 (`.env`)

```bash
# Claude Code API 配置
# 注意：此文件包含敏感信息，不要提交到 git

# MiniMax 配置
ANTHROPIC_AUTH_TOKEN=sk-ant-xxxxx
ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic
ANTHROPIC_MODEL=MiniMax-M2.5-highspeed

# 可选配置
# ANTHROPIC_MAX_TOKENS=4096
# ANTHROPIC_TEMPERATURE=0.7
```

**使用方式**：

```bash
# 在启动脚本中加载环境变量
source .env

# 或者使用 export
export $(cat .env | xargs)
```
````
