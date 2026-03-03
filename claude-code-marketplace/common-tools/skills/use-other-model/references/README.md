# References 目录

本目录包含 `use-other-model` 技能的详细参考文档,实现渐进式加载。

## 文件说明

### 核心实现文档

- **`method-a-mcp-tools.md`** - 方案 A:使用 MCP 工具驱动其他模型
  - 适用场景:简单任务、单次调用、执行时间 < 2 分钟
  - Token 节省:20-40%
  - 包含:前置准备、可用工具、执行流程

- **`method-b-independent-session.md`** - 方案 B:启动独立 Claude Code 会话
  - 适用场景:复杂任务、批量操作、执行时间 > 5 分钟
  - Token 节省:50-80%
  - 包含:核心架构、关键技术点、完整实施流程、优势与风险

### 配置与模板

- **`environment-variables.md`** - 环境变量格式识别与提取
  - 用户提供的 3 种环境变量格式(PowerShell MiniMax、PowerShell Claude 代理、Bash)
  - 环境变量提取规则
  - Token 格式识别(JWT vs API Key)
  - 格式转换示例

- **`code-templates.md`** - 完整代码模板
  - A. 执行计划模板(`task-plan.md`)
  - B. 启动脚本模板(`execute-task.sh`)
  - C. 主会话调用代码模板(TypeScript)
  - D. 环境变量文件模板(`.env`)

### 案例与问答

- **`case-study-git-commits.md`** - 实战案例:批量 Git 提交
  - 场景:创建 4 个独立的 git 提交
  - 完整的执行计划和启动脚本
  - 执行结果和 token 使用对比
  - 关键要点总结

- **`faq.md`** - 常见问题解答(10 个问题)
  - Q1-Q2:方案选择
  - Q3-Q5:配置与模型使用
  - Q6-Q7:安全性与调试
  - Q8-Q10:执行计划、API 密钥安全、失败处理

## 阅读建议

### 首次使用

1. 先阅读主 SKILL.md 了解整体框架
2. 根据任务类型选择方案:
   - 简单任务 → `method-a-mcp-tools.md`
   - 复杂任务 → `method-b-independent-session.md`
3. 查看 `environment-variables.md` 了解如何处理用户配置
4. 使用 `code-templates.md` 中的模板快速开始

### 遇到问题

1. 先查看 `faq.md` 寻找答案
2. 如果是配置问题,参考 `environment-variables.md`
3. 如果是实施问题,重新阅读对应方案的详细文档
4. 参考 `case-study-git-commits.md` 了解完整的实战流程

### 深入学习

1. 阅读 `method-b-independent-session.md` 了解核心技术细节
2. 研究 `case-study-git-commits.md` 中的实际案例
3. 查看主 SKILL.md 中的技术报告链接,获取更深入的背景知识
