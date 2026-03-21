# 代码模板

## A. 执行计划模板 (`task-plan.md`)

````markdown
# 任务执行计划

## 任务概述

**目标**:[简要描述任务目标]

**预期收益**:

- Token 节省:约 [X]%
- 执行时间:约 [X] 分钟

## 执行步骤

### 步骤 1:[步骤名称]

**目标**:[这一步要完成什么]

**操作**:

```bash
# 具体的命令或操作
[命令 1]
[命令 2]
```

**验证**:

- [ ] 检查点 1:[描述]
- [ ] 检查点 2:[描述]

**预期输出**:

- [输出描述]

---

### 步骤 2:[步骤名称]

**目标**:[这一步要完成什么]

**操作**:

```bash
[命令]
```

**验证**:

- [ ] 检查点 1

---

## 预期输出

### 文件输出

- `output-file-1.txt`:[描述]
- `output-file-2.json`:[描述]

### 执行日志

- `execution-log.md`:详细的执行过程记录

## 注意事项

1. **错误处理**:如果遇到 [X] 问题,执行 [Y] 操作
2. **验证要求**:必须验证 [Z] 条件
3. **安全限制**:不要执行 [危险操作]

## 最终验证

执行完所有步骤后,运行:

```bash
[验证命令]
```

确认:

- [ ] [验证条件 1]
- [ ] [验证条件 2]
````

## B. 启动脚本模板 (`execute-task.sh`)

````bash
#!/bin/bash

# ============================================
# 独立 Claude Code 会话启动脚本
# ============================================

# 1. 绕过嵌套检查
unset CLAUDECODE

# 2. 设置目标模型的 API 配置
# 注意:这些值应该从用户处获取
export ANTHROPIC_AUTH_TOKEN="[用户提供的 API Key]"
export ANTHROPIC_BASE_URL="[用户提供的 Base URL]"
export ANTHROPIC_MODEL="[用户提供的模型名称]"

# 3. 可选:设置其他环境变量
# export ANTHROPIC_MAX_TOKENS="4096"
# export ANTHROPIC_TEMPERATURE="0.7"

# 4. 启动独立的 Claude Code 会话
claude --dangerously-skip-permissions << 'TASK_END'
你是一个任务执行助手。请严格按照 task-plan.md 文件中的执行计划完成任务。

执行要求:
1. 先阅读 task-plan.md 文件,完整理解执行计划
2. 按照计划中的步骤顺序,逐步执行
3. 每个步骤完成后,验证结果是否符合预期
4. 将执行过程和结果记录到 execution-log.md 文件
5. 如果遇到问题,记录问题并尝试解决
6. 完成所有步骤后,总结执行结果

执行日志格式:
```markdown
# 任务执行日志

## 开始时间
[时间戳]

## 步骤 1:[名称]
- 状态:[进行中/完成/失败]
- 输出:[描述]
- 问题:[如有]

## 步骤 2:[名称]
...

## 完成时间
[时间戳]

## 执行摘要
- 成功步骤:[X]/[总数]
- 失败步骤:[列表]
- 输出文件:[列表]
````

现在开始执行。
TASK_END

# 5. 可选:执行后清理

# rm -f execute-task.sh

````markdown
## C. 主会话调用代码模板

```typescript
// ============================================
// 主会话:启动独立 Claude Code 会话
// ============================================

// Step 1: 向用户索要配置信息
AskUserQuestion({
	questions: [
		{
			question: "为了启动独立的 [模型名称] 会话,我需要您的 API 配置信息。请提供以下信息:",
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
请你严格按照 task-plan.md 文件中的执行计划,完成任务。
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

// 记录返回的 task_id,例如:bwlly90kq

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
//  **执行摘要**:
//  - 使用模型:[模型名称]
//  - 执行时间:[X] 分 [Y] 秒
//  - Token 使用:主会话 [A] + 子会话 [B] = [A+B]
//  - Token 节省:约 [X]%
//
//  请检查输出结果是否符合预期。"
```

## D. 环境变量文件模板 (`.env`)

```bash
# Claude Code API 配置
# 注意:此文件包含敏感信息,不要提交到 git

# MiniMax 配置
ANTHROPIC_AUTH_TOKEN=sk-ant-xxxxx
ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic
ANTHROPIC_MODEL=MiniMax-M2.5-highspeed

# 可选配置
# ANTHROPIC_MAX_TOKENS=4096
# ANTHROPIC_TEMPERATURE=0.7
```

**使用方式**:

```bash
# 在启动脚本中加载环境变量
source .env

# 或者使用 export
export $(cat .env | xargs)
```
````
