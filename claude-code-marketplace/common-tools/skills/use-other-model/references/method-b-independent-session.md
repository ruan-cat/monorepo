# 方案 B:启动独立 Claude Code 会话(推荐用于复杂任务)

## 核心架构

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

## 关键技术点

### 1. 绕过嵌套会话检查

**问题**:Claude Code 通过 `CLAUDECODE` 环境变量检测嵌套会话,默认禁止嵌套。

**解决方案**:在启动子会话前 `unset CLAUDECODE`

```bash
#!/bin/bash

# 关键:取消 CLAUDECODE 环境变量以绕过嵌套检查
unset CLAUDECODE

# 设置目标模型的 API 配置
export ANTHROPIC_AUTH_TOKEN="sk-ant-xxxxx"
export ANTHROPIC_BASE_URL="https://api.minimaxi.com/anthropic"
export ANTHROPIC_MODEL="MiniMax-M2.5-highspeed"

# 启动独立的 Claude Code 会话
claude --dangerously-skip-permissions << 'TASK_END'
请你严格按照 task-plan.md 文件中的执行计划,完成任务。
TASK_END
```

### 2. 使用 Bash 后台任务

**关键参数**:`run_in_background: true`

使用 Bash 工具时,必须设置 `run_in_background: true`,这样:

- 主会话不会被阻塞
- 子会话可以独立运行
- 通过 `TaskOutput` 工具获取执行结果

### 3. 使用 Heredoc 传递任务

**技术**:使用 Bash Heredoc 将任务指令传递给子会话

```bash
claude --dangerously-skip-permissions << 'TASK_END'
请你严格按照 task-plan.md 文件中的执行计划,完成任务。

执行步骤:
1. 先阅读 task-plan.md 文件,理解执行计划
2. 按照计划中的顺序,逐步执行
3. 每个步骤完成后验证结果
4. 遇到问题时记录到 execution-log.md

开始执行。
TASK_END
```

**优势**:

- 清晰的任务边界(`TASK_END` 标记)
- 支持多行指令
- 避免 shell 转义问题

### 4. 文件作为通信媒介

**设计模式**:主会话和子会话通过文件系统通信

```plain
主会话编写:
  ├─ task-plan.md              # 详细的执行计划
  ├─ execute-task.sh           # 启动脚本
  └─ input-data/               # 输入数据(如果需要)

子会话读取和写入:
  ├─ task-plan.md              # 读取计划
  ├─ execution-log.md          # 写入执行日志
  └─ output-data/              # 输出结果
```

**优势**:

- 解耦主会话和子会话
- 计划可以被审查和修改
- 支持复杂的任务描述
- 便于调试和追踪

## 完整实施流程

### Step 1: 向用户索要 API 配置

使用 `AskUserQuestion` 工具,详细说明需要的配置信息。参见 `environment-variables.md` 了解用户可能提供的格式。

### Step 2: 主会话分析任务并编写执行计划

创建详细的执行计划文件 `task-plan.md`。参见 `code-templates.md` 中的"执行计划模板"。

### Step 3: 主会话生成启动脚本

根据用户提供的环境变量格式,生成对应的启动脚本。参见 `code-templates.md` 中的"启动脚本模板"。

### Step 4: 主会话启动后台任务

使用 Bash 工具启动后台任务:

```typescript
Bash({
	command: "chmod +x execute-task.sh && bash execute-task.sh 2>&1",
	description: "启动独立的 [模型名称] 会话执行任务",
	run_in_background: true,
	timeout: 300000, // 5 分钟超时,根据任务复杂度调整
});
```

**重要参数说明**:

- `run_in_background: true`:必须设置,否则主会话会被阻塞
- `timeout`:根据任务预计时间设置,建议留有余量
- `2>&1`:捕获标准错误输出,便于调试

### Step 5: 主会话监控任务进度(可选)

如果任务执行时间较长,可以定期检查进度:

```typescript
// 检查子会话是否创建了执行日志
Read({
	file_path: "execution-log.md",
});
```

### Step 6: 主会话获取执行结果

使用 `TaskOutput` 工具获取子会话的执行结果:

```typescript
TaskOutput({
	task_id: "bwlly90kq", // 使用 Step 4 返回的 task_id
	block: true, // 阻塞等待任务完成
	timeout: 300000, // 超时时间(毫秒)
});
```

### Step 7: 主会话验证结果并清理

1. **验证输出质量**:读取子会话生成的文件
2. **清理敏感文件**:`rm -f execute-task.sh`
3. **向用户报告**:提供执行摘要和 token 使用对比

## 方案 B 的优势

1. **显著的 Token 节省**:
   - 主会话只负责规划(~5K tokens)
   - 子会话执行具体任务(使用更便宜的模型)
   - 节省比例:50-80%

2. **模型选择灵活性**:
   - 规划任务:使用 Claude Sonnet 4.6(推理能力强)
   - 执行任务:使用 MiniMax/Gemini(速度快、成本低)

3. **任务隔离**:
   - 主会话和子会话完全隔离
   - 子会话崩溃不影响主会话
   - 可以并行启动多个子会话

4. **可审查性**:
   - 执行计划以文件形式存在
   - 可以在执行前审查和修改
   - 便于调试和优化

## 潜在风险与限制

### 风险

1. **嵌套会话稳定性**:
   - 虽然绕过了检查,但仍可能存在资源冲突
   - 建议监控系统资源使用情况
   - 避免同时启动过多子会话

2. **API 配置泄露**:
   - 启动脚本包含 API token
   - **必须在执行后立即删除脚本文件**
   - 或使用环境变量文件(`.env`)管理配置

3. **子会话失控**:
   - 子会话可能执行意外操作
   - 建议在计划中明确限制子会话的权限
   - 使用 `--dangerously-skip-permissions` 时要特别小心

### 限制

1. **无法实时监控**:
   - 只能在任务完成后获取结果
   - 无法中途干预子会话
   - 建议让子会话定期写入进度文件

2. **文件系统依赖**:
   - 需要通过文件系统通信
   - 可能存在文件读写冲突
   - 确保文件路径正确且可访问

3. **环境变量隔离**:
   - 需要正确设置环境变量
   - 配置错误可能导致子会话失败
   - 建议在启动前验证配置
