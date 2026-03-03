---
name: use-other-model
description: "指导主代理如何驱动其他 AI 模型(MiniMax、Gemini)完成任务,实现 50-80% token 节省。提供两种方案:方案 A(MCP 工具,适合简单任务)和方案 B(独立 Claude Code 会话,适合复杂任务)。当用户提及使用其他模型、节省 token、批量操作、多文件处理、或执行时间超过 5 分钟的任务时使用此技能。包含完整的技术实现细节、代码模板和安全最佳实践。"
user-invocable: true
metadata:
  version: "0.2.0"
---

# Use Other Model

## 目标

通过智能地将任务委托给成本更低的 AI 模型,优化 token 使用和成本:

- 识别适合委托的任务类型
- 使用 MCP 工具或独立会话驱动其他 AI 模型
- 在保证质量的前提下降低 token 消耗
- 为用户提供清晰的成本收益分析

## 核心原则

**Token 优化不是目的,而是手段**。始终优先考虑任务质量和用户体验,只在合适的场景下使用替代模型。

## 何时使用其他模型

### ✅ 适合委托的场景(Token 节省 50-80%)

1. **复杂多文件操作**
   - 需要修改 10+ 个文件
   - 需要创建 4+ 个独立的 git 提交
   - 预计执行时间超过 5 分钟

2. **批量重复任务**
   - 批量文件格式转换
   - 批量数据处理
   - 批量代码生成(如生成多个相似的 CRUD 接口)

3. **可并行的独立任务**
   - 多个独立功能模块的开发
   - 多个独立的测试用例编写
   - 多个独立的文档生成

4. **简单但耗时的任务**
   - 代码格式化和 lint 修复
   - 简单的文本处理和转换
   - 基础的文件操作

### ❌ 不适合委托的场景(直接执行更高效)

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

在开始任务前,按以下步骤评估:

1. **评估任务复杂度**
   - 文件数量:< 3 个(简单)/ 3-10 个(中等)/ > 10 个(复杂)
   - 预计时间:< 1 分钟(快速)/ 1-5 分钟(中等)/ > 5 分钟(耗时)
   - 并行度:单线程 / 可部分并行 / 高度并行

2. **计算预期收益**
   - 简单任务:协调成本 ≈ 直接执行成本,收益 < 10%,**不推荐委托**
   - 中等任务:收益 20-40%,**可以考虑委托**
   - 复杂任务:收益 50-80%,**强烈推荐委托**

3. **向用户确认**
   使用 `AskUserQuestion` 工具向用户说明:
   - 任务评估结果(复杂度、预期收益)
   - 推荐的执行方式(直接执行 vs 委托)
   - 需要的配置信息(如果委托)

## 两种实现方案

### 方案对比

| 方案                | 适用场景           | Token 节省 | 实现复杂度 |
| ------------------- | ------------------ | ---------- | ---------- |
| **方案 A:MCP 工具** | 简单任务、单次调用 | 20-40%     | 低         |
| **方案 B:独立会话** | 复杂任务、批量操作 | 50-80%     | 中         |

**推荐策略**:

- 简单任务(< 5 分钟):使用方案 A(MCP 工具)
- 复杂任务(> 5 分钟):使用方案 B(独立会话)

### 方案 A:使用 MCP 工具

**适用场景**:单次调用、简单任务、执行时间 < 2 分钟

**可用工具**:

- MiniMax MCP Server:`mcp__MiniMax__web_search`、`mcp__MiniMax__understand_image`
- Gemini MCP Server:`mcp__gemini__gemini`

**详细实现**:参见 `references/method-a-mcp-tools.md`

### 方案 B:启动独立 Claude Code 会话

**适用场景**:多步骤、批量操作、执行时间 > 5 分钟

**核心技术**:

- 绕过嵌套检查:`unset CLAUDECODE`
- Bash 后台任务:`run_in_background: true`
- Heredoc 任务传递
- 文件通信机制

**详细实现**:参见 `references/method-b-independent-session.md`

## 方案 B 快速实施指南

### 7 步完整流程

1. **向用户索要 API 配置**
   - 使用 `AskUserQuestion` 工具
   - 参见 `references/environment-variables.md` 了解用户可能提供的格式

2. **主会话分析任务并编写执行计划**
   - 创建 `task-plan.md` 文件
   - 参见 `references/code-templates.md` 中的"执行计划模板"

3. **主会话生成启动脚本**
   - 创建 `execute-task.sh` 文件
   - 参见 `references/code-templates.md` 中的"启动脚本模板"

4. **主会话启动后台任务**

   ```typescript
   Bash({
   	command: "chmod +x execute-task.sh && bash execute-task.sh 2>&1",
   	description: "启动独立的 [模型名称] 会话执行任务",
   	run_in_background: true,
   	timeout: 300000,
   });
   ```

5. **主会话监控任务进度(可选)**
   - 定期检查 `execution-log.md` 文件

6. **主会话获取执行结果**

   ```typescript
   TaskOutput({
   	task_id: "bwlly90kq",
   	block: true,
   	timeout: 300000,
   });
   ```

7. **主会话验证结果并清理**
   - 验证输出质量
   - 删除包含 API 密钥的脚本文件
   - 向用户报告执行摘要

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

简单 × 少量(1-2)    → 直接执行
简单 × 大量(10+)    → 考虑委托(批量处理)
中等 × 中量(3-10)   → 考虑委托
复杂 × 任意数量       → 强烈推荐委托
```

## 实际案例

### 案例:批量 Git 提交

**场景**:创建 4 个独立的 git 提交

**执行结果**:

- ✅ 成功完成 4 个提交
- ⏱️ 执行时间:3 分 24 秒
- 💰 Token 使用:主会话 5,200 + 子会话 8,500 = 13,700
- 📊 Token 节省:约 65%(相比直接执行预计 39,000 tokens)

**详细案例**:参见 `references/case-study-git-commits.md`

## 方案选择建议

| 任务特征          | 推荐方案         | 理由                  |
| ----------------- | ---------------- | --------------------- |
| 单次 API 调用     | 方案 A(MCP 工具) | 简单直接,无需额外配置 |
| 批量重复操作      | 方案 B(独立会话) | 显著节省 token        |
| 需要多步骤执行    | 方案 B(独立会话) | 可以编写详细计划      |
| 需要实时交互      | 方案 A(MCP 工具) | 可以在主会话中处理    |
| 执行时间 < 2 分钟 | 方案 A(MCP 工具) | 启动开销小            |
| 执行时间 > 5 分钟 | 方案 B(独立会话) | token 节省显著        |

## 注意事项

### 安全性

1. **敏感信息保护**
   - **绝对不要在 prompt 中包含 API 密钥、密码等敏感信息**
   - 使用环境变量或配置文件管理凭证
   - 向用户明确说明需要哪些配置信息
   - **方案 B:执行完成后立即删除包含 API 密钥的脚本文件**

2. **输出验证**
   - 始终验证其他模型的输出质量
   - 对关键代码进行人工审查
   - 必要时进行测试验证
   - 不要盲目信任子会话的输出

3. **权限控制**
   - 使用 `--dangerously-skip-permissions` 时要特别小心
   - 在执行计划中明确限制子会话的操作范围
   - 避免让子会话执行危险操作(如 `rm -rf`)

### 用户体验

1. **透明沟通**
   - 明确告知用户将使用哪个模型和方案
   - 说明为什么选择该方案
   - 报告任务完成情况和成本节省
   - 提供详细的执行日志

2. **失败处理**
   - 如果其他模型失败,回退到直接执行
   - 向用户解释失败原因和解决方案
   - 不要让用户感到困惑或沮丧
   - 提供清晰的错误信息和调试建议

3. **配置管理**
   - 首次使用时引导用户配置
   - 记住用户的配置偏好(如果可能)
   - 提供清晰的配置文档链接
   - 验证配置的正确性

4. **进度反馈**
   - 对于长时间运行的任务,提供进度估计
   - 建议子会话定期写入进度文件
   - 主会话可以定期检查进度并向用户报告

## 参考资料

### 技能内部参考文档

本技能包含以下详细参考文档,按需阅读:

- **`references/method-a-mcp-tools.md`** - 方案 A(MCP 工具)的详细实现
- **`references/method-b-independent-session.md`** - 方案 B(独立会话)的完整技术细节
- **`references/environment-variables.md`** - 环境变量格式识别与提取规则
- **`references/case-study-git-commits.md`** - 批量 Git 提交实战案例
- **`references/code-templates.md`** - 完整的代码模板(执行计划、启动脚本、主会话调用)
- **`references/faq.md`** - 10 个常见问题解答

### 官方文档

- [Claude Code 官方文档](https://code.claude.com/docs)
- [MCP 服务器配置文档](https://modelcontextprotocol.io/)
- [MiniMax API 文档](https://www.minimaxi.com/document)
- [Gemini API 文档](https://ai.google.dev/gemini-api/docs)

### 技术报告(本技能的核心参考)

- [在 Claude Code 会话中驱动其他 AI 模型的技术方案](https://raw.githubusercontent.com/ruan-cat/11comm/refs/heads/dev/apps/admin/src/docs/reports/2026-03-04-driving-minimax-model-technical-report/2026-03-04-driving-minimax-model-technical-report.md)
  - 详细记录了方案 B(独立 Claude Code 会话)的完整技术实现
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

- `git-commit`:高质量 git 提交技能
- `gemini`:Gemini 大上下文处理技能
