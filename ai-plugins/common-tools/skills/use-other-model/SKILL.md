---
name: use-other-model
description: "指导主代理如何驱动其他 AI 模型(MiniMax、Gemini)完成任务,实现 50-80% token 节省。提供两种方案:方案 A(MCP 工具,适合简单任务)和方案 B(独立 Claude Code 会话,适合复杂任务)。当用户提及使用其他模型、节省 token、批量操作、多文件处理、或执行时间超过 5 分钟的任务时使用此技能。包含完整的技术实现细节、代码模板和安全最佳实践。"
user-invocable: true
metadata:
  version: "0.4.0"
---

# Use Other Model

## 目标

通过把合适的任务委托给成本更低的模型,在不牺牲质量的前提下节省 50-80% token。

这项技能的重点不是“多开一个聊天窗口”,而是让主代理有能力安全地驱动一个独立的执行代理。

## 核心立场

1. **Token 优化不是目的,质量和确定性才是目的**
   - 只有在收益明确、任务边界清楚时才委托
   - 如果协调成本高于收益,直接自己做

2. **方案 B 是无人值守编码代理,不是问答会话**
   - 子会话必须能读文件、改文件、跑命令、做验证、写日志、完成后退出
   - 子会话不应把任务理解成普通聊天

3. **主代理永远保留复核责任**
   - 即便子会话报告成功,主代理仍必须重新看 `git diff`
   - 仍必须重新跑关键验证命令
   - 前端任务仍必须重新做浏览器验收或确认子会话的浏览器证据

4. **复杂前端任务默认带浏览器验收**
   - 只要任务涉及页面、组件、样式、交互、可视化,就不能只看 `build/test`
   - 浏览器不可用时必须记录原因,不能静默跳过

## 何时使用其他模型

### ✅ 适合委托的场景

1. **复杂多文件操作**
   - 需要修改 10+ 个文件
   - 需要多个相互独立的提交
   - 预计执行时间超过 5 分钟

2. **批量重复任务**
   - 批量文本转换
   - 批量代码生成
   - 批量文档处理

3. **可并行的独立任务**
   - 多个相互独立的模块
   - 多个相互独立的测试或文档任务

4. **简单但耗时的执行型任务**
   - 大量格式化和 lint 修复
   - 按模板生成多份内容

### ❌ 不适合委托的场景

1. **简单快速任务**
   - 单文件编辑
   - 执行时间小于 1 分钟
   - 一眼能做完的查询

2. **高度依赖对话上下文的任务**
   - 需要频繁和用户来回确认
   - 任务边界还没澄清
   - 需求本身还在变化

3. **高风险高质量要求任务**
   - 核心业务逻辑
   - 安全相关代码
   - 需要深度架构判断的设计问题

## 决策流程

开始前按下面顺序判断:

1. **先判断任务复杂度**
   - 简单任务:5 分钟以内
   - 中等任务:10-20 分钟
   - 复杂任务:20-45 分钟

2. **再判断上下文压缩成本**
   - 能否用一份清晰的任务封包交给外部代理
   - 如果连主代理都说不清任务边界,不要委托

3. **最后判断验收方式**
   - 只靠命令行就能证明完成:可委托
   - 必须看页面、交互、布局:可委托,但必须附带浏览器验收模板

## 两种实现方案

| 方案                             | 适用场景                            | Token 节省 | 实现复杂度 |
| -------------------------------- | ----------------------------------- | ---------- | ---------- |
| **方案 A:MCP 工具**              | 简单任务、单次调用                  | 20-40%     | 低         |
| **方案 B:独立 Claude Code 会话** | 多步骤、批量操作、执行时间 > 5 分钟 | 50-80%     | 中         |

### 方案 A:使用 MCP 工具

- 适合单次调用和轻量任务
- 参见 `references/method-a-mcp-tools.md`

### 方案 B:启动独立 Claude Code 会话

- 适合复杂任务和长任务
- 默认按 **unattended coding agent** 设计
- 参见 `references/method-b-independent-session.md`

## 方案 B 的硬约束

只要选择方案 B,就必须同时满足以下要求:

1. **先写任务封包,再启动子会话**
   - 必须提供工作目录、分支、先读文件、允许修改范围、禁止事项、验证命令、完成规则
   - 模板参见 `references/context-packet-template.md`

2. **默认使用标准启动参数**
   - `claude -p`
   - `--permission-mode bypassPermissions`
   - `--tools default`
   - `--output-format json`
   - `--append-system-prompt "<无人值守硬约束提示>"`
   - 模板参见 `references/claude-code-launch-templates.md`

3. **把系统提示当成硬模板,不是临场发挥**
   - 系统提示必须声明:这是独立编码代理、不要反问、先读文件再执行、必须验证、完成后退出
   - 不要每次临时手写一段松散提示

4. **前端任务必须写浏览器验收要求**
   - 必须指定 URL、页面目标、关键交互、视觉对比点、日志格式
   - 模板参见 `references/frontend-browser-verification-template.md`

5. **必须给足执行预算和超时**
   - 不要用 2-5 分钟的短超时去跑一个本来就要 20 分钟的任务
   - 预算指引见下文,启动模板见 `references/claude-code-launch-templates.md`

6. **执行失败时必须走分流,不能盲补**
   - 启动失败
   - 执行失败
   - 浏览器验收失败
   - 连续两轮失败后主代理接管
   - 详见 `references/failure-routing.md`

7. **子会话完成不等于任务完成**
   - 主代理还要重新读输出
   - 重新看改动
   - 重新跑关键命令
   - 前端任务重新做验收或确认浏览器证据

## 方案 B 标准流程

1. **向用户索要或确认模型配置**
   - 只索要必要的 provider 信息
   - 环境变量格式识别参见 `references/environment-variables.md`

2. **主代理先完成任务拆解**
   - 确认任务边界、可改文件、不可做事项、验收口径
   - 如果这些内容仍然模糊,不要启动外部代理

3. **写任务封包**
   - 使用 `references/context-packet-template.md`
   - 让子会话先读任务封包,而不是先读一大段 prompt

4. **如果是前端任务,补浏览器验收模板**
   - 使用 `references/frontend-browser-verification-template.md`
   - 把 URL、视觉目标、交互步骤写清楚

5. **生成无人值守系统提示和标准启动命令**
   - 使用 `references/claude-code-launch-templates.md`
   - 默认使用 `--permission-mode bypassPermissions`
   - 默认使用 `--tools default`
   - 默认使用 `--output-format json`

6. **启动独立 Claude Code 会话**
   - 子会话必须自己读文件、自己改代码、自己运行验证、自己写 `execution log`
   - 不要让子会话把结果写成模糊总结

7. **主代理读取结果并做失败分流**
   - 先看 `stdout/stderr` 或 JSON 输出
   - 再看执行日志
   - 再根据 `references/failure-routing.md` 决定继续委托还是接管

8. **主代理重新验证**
   - 重新查看改动
   - 重新运行关键命令
   - 前端任务重新确认浏览器结果

## 默认预算与超时指引

### 任务级别

- **简单任务**:5 分钟以内
- **中等任务**:10-20 分钟
- **复杂任务**:20-45 分钟

### 方案 B 的默认时间预算

| 阶段       | 建议预算 |
| ---------- | -------- |
| 启动会话   | 2 分钟   |
| 编码执行   | 30 分钟  |
| 构建/测试  | 5 分钟   |
| 浏览器验收 | 5 分钟   |

### 超时使用原则

1. **主代理的 shell/Bash 超时必须覆盖真实任务时长**
   - 复杂任务建议至少 15 分钟
   - 长任务建议按 30 分钟起配

2. **不要把 CLI 启动耗时和任务执行耗时混在一起**
   - 启动失败是启动问题
   - 执行超时是预算配置问题

3. **如果预计超过 45 分钟**
   - 说明任务已经过大
   - 先拆任务,再决定是否继续委托

## 失败与回退规则

1. **启动失败**
   - 先跑 `claude --help`
   - 检查参数是否存在
   - 检查 provider 环境变量
   - 检查权限模式和工具模式

2. **执行失败**
   - 看 JSON 结果
   - 看执行日志
   - 判断是编译、测试、运行、还是任务理解错误

3. **浏览器验收失败**
   - 记录具体视觉或交互问题
   - 再决定让子会话继续迭代,还是主代理直接补刀

4. **连续两轮失败**
   - 停止继续使用外部模型
   - 主代理直接接管

详见 `references/failure-routing.md`。

## 成本收益分析

| 场景类型   | 直接执行 | 委托执行        | 节省比例 |
| ---------- | -------- | --------------- | -------- |
| 简单单文件 | 2,000    | 2,100           | -5% ❌   |
| 中等多文件 | 11,500   | 5,000 + 6,500   | ~51% ✅  |
| 复杂批量   | 40,000   | 10,000 + 30,000 | ~68% ✅  |

## 实际案例

批量 Git 提交案例参见 `references/case-study-git-commits.md`。

## 注意事项

### 安全性

1. **敏感信息保护**
   - 不要把 API 密钥直接写进用户可见 prompt
   - 用环境变量或临时配置文件承载敏感信息
   - 执行后及时删除含密钥的临时脚本

2. **输出验证**
   - 不要盲信子会话成功消息
   - 所有“完成”“通过”“已修复”都要有主代理验证证据

3. **权限控制**
   - 方案 B 默认使用 `bypassPermissions`,因为目标就是无人值守执行
   - 只有在高风险场景下才主动降权

### 用户体验

1. **透明说明**
   - 告诉用户为什么委托
   - 告诉用户预期收益和回退方式

2. **失败可解释**
   - 如果失败,明确说明失败层级
   - 不要用“模型不工作”这种笼统结论

3. **进度可追踪**
   - 子会话应写 execution log
   - 长任务要能看出进行到哪一步

## 参考资料

### 技能内部参考文档

- **`references/method-a-mcp-tools.md`** - 方案 A 的详细实现
- **`references/method-b-independent-session.md`** - 方案 B 的执行契约和工作流
- **`references/claude-code-launch-templates.md`** - PowerShell / Bash 标准启动模板
- **`references/context-packet-template.md`** - 任务封包模板
- **`references/frontend-browser-verification-template.md`** - 前端任务专用浏览器验收模板
- **`references/failure-routing.md`** - 启动失败/执行失败/浏览器失败/回退分流
- **`references/environment-variables.md`** - 环境变量识别与提取规则
- **`references/case-study-git-commits.md`** - 批量 Git 提交案例
- **`references/faq.md`** - 常见问题解答
- **`references/code-templates.md`** - 兼容保留的旧模板入口,优先级低于新模板

### 官方文档

- [Claude Code 官方文档](https://code.claude.com/docs)
- [MCP 服务器配置文档](https://modelcontextprotocol.io/)
- [MiniMax API 文档](https://www.minimaxi.com/document)
- [Gemini API 文档](https://ai.google.dev/gemini-api/docs)

### 技术报告

- [在 Claude Code 会话中驱动其他 AI 模型的技术方案](https://raw.githubusercontent.com/ruan-cat/11comm/refs/heads/dev/apps/admin/src/docs/reports/2026-03-04-driving-minimax-model-technical-report/2026-03-04-driving-minimax-model-technical-report.md)
- [Token 节省分析报告](https://raw.githubusercontent.com/ruan-cat/11comm/refs/heads/dev/apps/admin/src/docs/reports/2026-03-04-driving-minimax-model-technical-report/2026-03-04-token-savings-analysis.md)

### 相关技能

- `git-commit`:高质量 git 提交技能
- `gemini`:Gemini 大上下文处理技能
