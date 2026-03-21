<!-- 一次性提示词 已完成 -->

# 制作一款全新的技能 init-ai-md

我需要你帮我制作一款全新的 claude code 技能，位于本项目的 claude code 插件商城内。

在 `claude-code-marketplace\common-tools\skills\init-ai-md` 目录内，制作一款 `init-ai-md` 技能。用于实现在一个全新的项目内，快速初始化指定模板内的通用 AI 记忆文件。或者对现有的 AI 记忆文件的内容，做增量更新。

你将按照以下步骤来完成对 AI 记忆文件的初始化：

1. 检查项目根目录是否有现存的 `CLAUDE.md` 文件。如果没有，你应该先执行 claude code 内部的斜杠命令 /init ，执行这款初始化命令后，再开始整理添加预设通用的`记忆要点`。
2. 执行初始化命令时，务必确保 `CLAUDE.md` 文件以中文编写。
3. 检查现有的 `CLAUDE.md` 内是否有很多相同，或与 templates 模板文档相似的内容，设计合适的插入更新策略，用 templates 模板文档来更新替换 `CLAUDE.md` 内的现存的`记忆要点`。
4. 按照该技能 `init-ai-md` 对应的 templates 模板，根据文件前缀的数字序号，按照顺序在文档前面插入内容。
5. 以二级目录的形式来插入模板内容。注意单个模板内插入的内容可能有多个二级目录。
6. 二级目录的标题，以文档内提供的标题为准，而不是以模板文件名为准。
7. 文档一定会存在很多二级目录，你插入的预设提示词都在原有的二级目录**之前**。
8. 检查是否有 `AGENTS.md` 、 `GEMINI.md` 文件。如果有，就使用 claude code 内部的 `AskUserQuestion` 工具，询问我要不要用刚才已经更新好的 `CLAUDE.md` 文档来全量替换现有的 `AGENTS.md` 、 `GEMINI.md` 文件。你必须要询问用户是否要主动替换。

## 被初始化和增量迭代的 AI 记忆文件

- `CLAUDE.md` 文件。我们对现存的 `CLAUDE.md` 文件使用这款技能，将该技能附属模板内的 markdown 提示词，按照顺序粘贴到 `CLAUDE.md` 文档内。
- `AGENTS.md` 文件。
- `GEMINI.md` 文件。

## templates 目录的模板文件存储方式

1. 在 `claude-code-marketplace\common-tools\skills\init-ai-md\templates` 目录内，存储了按照指定顺序命名的 markdown 文件，这些文件将会按照严格的顺序，陆续复制到 CLAUDE.md 文档内。以二级菜单的方式，逐步加载这些公共通用提示词。
2. 文件命名： 模板文件夹内的文件命名举例如下。
   - 01.主动问询实施细节.md
   - 02.代码与编码格式要求.md
   - 03.报告编写规范.md
   - ...更多文件
   - 20.使用 gemini MCP 规范.md
   - 30.编写测试用例规范.md
   - 40.生成发版日志的操作规范.md
   - ...更多文件
   - 99.获取技术栈对应的上下文.md
   - ...更多文件

## 稍后我会手动补充可用 templates 模板文件

目前，你可以直接参考现存的 `CLAUDE.md` 文件内出现的通用内容，归纳整理出公共`记忆要点`。简单初始化一轮 `templates` 目录的模板文件即可。

这些模板文件内的 markdown 存储内容，都应该是二级目录、没有一级目录。便于直接复制粘贴到记忆文件。

## claude code skill 相关知识点

请你务必先阅读以下文档，了解清楚在 claude code 内，如何对 claude code 插件商城的 skills 文件做编写。

- 编写语法与格式： https://code.claude.com/docs/zh-CN/skills
- 最佳实践： https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/best-practices
- 规范文档： https://agentskills.io/home

---

<!-- 以下内容开始持续迭代 -->

## 001 迭代增强 `init-ai-md` 技能的使用效果、交互能力

`claude-code-marketplace\common-tools\skills\init-ai-md` 目录的 `init-ai-md` 技能，还是有很多问题。需要你迭代处理。

1. 文本更改的具体做法： 在实现 AI 文件的内容复制时，应该深度的阅读文本内容，对比文本差异。实现全局`记忆项`的补全和增加。比如以下的例子：

假设目标文件 `CLAUDE.md` 存在以下内容：

```markdown
## 获取技术栈对应的上下文

### claude code skill

- 编写语法与格式： https://code.claude.com/docs/zh-CN/skills
- 最佳实践： https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/best-practices
```

假设对应的通用`记忆项`文件 `claude-code-marketplace\common-tools\skills\init-ai-md\templates\99.获取技术栈对应的上下文.md` 的内容如下：

```markdown
## 获取技术栈对应的上下文

在处理特定技术栈相关的问题时，你应该主动获取对应的上下文文档和最佳实践。

### claude code skill

- 编写语法与格式： https://code.claude.com/docs/zh-CN/skills
- 最佳实践： https://platform.claude.com/docs/zh-CN/agents-and-tools/agent-skills/best-practices
- 规范文档： https://agentskills.io/home
```

这个时候，你应该通过对比文本差异的方式，补全缺少的文本。

在实现文本增补时，不允许使用任何形式的脚本来完成批处理，包括临时的 Python 脚本、typescript 脚本等。不允许一股脑的复制粘贴`记忆项`文本。

2. 增加对提示词项的智能询问和清单式交互选择功能。

我在使用这个 `init-ai-md` 技能时，我希望在使用的时候，按照这样的步骤做：

- 先读取扫描目标 AI 文件的二级标题。明确清楚现存的`记忆项`有那些。
- 然后阅读 `claude-code-marketplace\common-tools\skills\init-ai-md\templates` 的文件标题，明确清楚有那些可用`记忆项`。
- 接着使用 `AskUserQuestion` 工具，生成交互式的询问，询问我

我希望通过`询问`和`交互`的方式，让我能够准确选择需要的技能项。而不是一股脑的，全量的把全部模板内的`记忆项`都复制粘贴到 AI 文件内。
