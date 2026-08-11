---
name: record-bug-fix-memory
description: 当用户要求在 bug 已经定位并修复后，记录排错经验、事故结论、AI 记忆更新、复盘摘要或本地 MCP 记忆时使用。这个技能只负责沉淀"发生了什么、为什么会发生、如何修好、以后要记住什么"，不要把它用于实际修复 bug。
license: MIT
compatibility: Requires a project with AI memory documents (CLAUDE.md / AGENTS.md / GEMINI.md) and optional Memorix MCP access.
template-version: "2.0.0"
metadata:
  author: openspec
  version: "1.0"
  generatedBy: "1.1.1"
---

# 记录 Bug 修复记忆

## 概述

使用这个技能，把已经完成的排错结果沉淀成可复用的长期记忆。

目标是保存根因、有效修复路径、错误假设和验证证据，让后续 agent 不再重复同样的弯路。

核心原则：记录决策链，不记录流水账。

## 何时使用

在以下场景使用这个技能：

- 用户要求更新 AI 记忆文档、记录经验教训、补充事故记录、编写复盘摘要。
- bug 已经完成复现，且有效修复路径已经明确。
- 这条经验是仓库特有知识，应该对未来 agent 可见。
- 需要把结论同步到本地 MCP 记忆，例如 Memorix。

以下情况不要使用这个技能：

- bug 还在调查中，根因没有确认。
- 用户要求的是修复实现，而不是经验沉淀。
- 你手里只有猜测、片段证据或临时绕过方案。

## 前置输入

开始写记忆前，必须能回答下面六个问题：

1. 对用户来说，表面现象是什么？
2. 实际根因是什么？
3. 哪个错误假设或误导信号浪费了时间？
4. 最终是哪一个具体改动修好了问题？
5. 用什么验证证明修复成立？
6. 这条记忆应该写到哪里？

如果有任何一个问题答不上来，先完成排错，不要提前写记忆。

## 写到哪里

- 仓库级、可复用的规则：写到根级 `CLAUDE.md`、`AGENTS.md`、`GEMINI.md`
- 跨会话的本地记忆：写到 Memorix，类型用 `gotcha`、`decision` 或 `problem-solution`
- 包级 prompts、plans、reports：只有用户明确要求时才写进去

默认规则：只要这条经验会影响整个仓库里的未来 agent，就优先写入三个根级 AI 记忆文档，不要埋进包级备注里。

## 记录什么

每条记忆至少要覆盖这六件事：

1. 问题现象：从用户视角看，哪里坏了
2. 根因：真正出错的地方
3. 关键线索：哪条信号把问题从假象拉回真实根因
4. 有效修复：真正解决问题的改动
5. 验证方式：证明修复成功的证据
6. 后续约束：未来 agent 必须先检查什么、避免什么

## 记忆模板

使用简洁、面向未来复用的结构：

- `问题现象：...`
- `根因：...`
- `关键误导点：...`
- `有效修复：...`
- `验证方式：...`
- `后续约束：...`

这些句子应该帮助未来 agent 快速做对事，而不是复述完整排错过程。

## 案例文件规范

双层存储架构下，详细事故记录不写入 SKILL.md，而是存放在同目录的独立案例文件中。

每条案例文件命名格式：`YYYY-MM-DD-{slug}.md`，例如 `2026-03-15-cursor-phantom-modify.md`。

案例文件建议包含以下章节：

- **现象**：出了什么问题
- **根因**：为什么会发生
- **修复**：如何解决的
- **验证**：怎么确认修好了
- **教训**：以后要记住什么

## 案例索引

仓库级事故记录已拆分为独立案例文件，按时间排序如下：

- `2026-03-01-git-phantom-modifications-cursor.md` — 本 monorepo 的 Git 状态与 Cursor「幽灵修改」
- `2026-03-01-crlf-loop-phantom-modified.md` — Windows CRLF 残留导致「循环幽灵 modified」
- `2026-04-01-codex-memorix-mcp-startup.md` — Windows 下 Codex 无法拉起 Memorix MCP
- `2026-04-01-codex-memorix-roots-list.md` — Codex 与 Memorix 的 roots/list 兼容问题
- `2026-06-30-consola-node24-esm-resolve.md` — consola@3.4.2 在 Node.js 24 CI 下导致 automd 崩溃；前期尝试 pnpm patch 与运行时 index.js 垫片，最终通过 CJS wrapper 绕过 automd CLI 入口彻底规避
- `2026-07-02-git-commit-broken-rename.md` — AI agent 在执行 git-commit 分门别类拆分时将文件移动误判为删除+新增两个独立提交，导致 rename 追踪断裂；修复方式为 soft reset + 合并暂存重提交

- `2026-07-02-git-commit-skill-violation.md` — AI agent 在 git-commit 分门别类拆分时连续违反技能规范：emoji 错误（style 用 💅 而非 🌈）、publish 发版遗漏 6 个版本文件、反复 reset 补救导致 rebase 冲突；修复方式为先查阅 commit-types.ts 再提交、同步全部版本文件、stash 无关文件后 rebase
- `2026-07-02-use-vercel-deploy-skill-pitfalls.md` — 新建 use-vercel-deploy-in-monorepo skill 时因未先验证 Git 仓库连接、未追溯 bin 来源、通用 skill 写死 AI 客户端名称、模板形态与脚本不一致导致多次返工；修复方式为 Vercel CLI/API 实锤核对、按部署形态分层、明确依赖来源、删除硬编码、统一模板逻辑
- `2026-07-02-sync-local-global-agents-skills-design-pitfalls.md` — 新建 sync-local-global-agents-skills 通用 skill 时把仓库源码路径与安装后路径混用，脚本位置、SKILL.md 示例、测试文件引用均出现偏差；修复方式为脚本迁入 skill 目录、文档使用相对路径、删除 monorepo 专属引用、重写计划与代码一致
- `2026-08-10-init-prettier-git-hooks-overengineering.md` — 升级分发技能时把 AI 操作流程误做成迁移器产品，导致脚本、测试和复核过度膨胀；修复方式为先判定交付模型、用户要求收缩即废止旧架构，并以最小契约验证收口
- `2026-08-11-vitepress-node24-pnpm-entrypoint.md` — Node.js 24 CI 中 VitePress 宽 barrel 间接加载 `consola`，且 utils 多组 tsup 配置并行清理 `dist` 会删除声明；修复方式为真实窄子路径出口、一次性清理构建目录、删除全局 patch，并用最新远端入口测试确定 `consola`、`tinyglobby`、`pnpm-workspace-yaml` 的最小 ESM 内联边界，同时让 `yaml` 保持外部依赖。
- `2026-08-12-turbo-cache-output-and-package-closure.md` — Turbo 的 `**/dist/**` 宽缓存输出会越过任务自身产物边界，掩盖并放大工作区依赖布局问题；收紧为 `dist/**` / `.output/**` 后，用全新 CI 继续暴露并补齐每个发布包自己的构建工具与运行时依赖闭包。

新增事故记录时，先创建独立案例文件，再在本索引追加一行摘要。**禁止**将完整事故正文直接写入 SKILL.md。

## 写入经验时必须保留的额外信息

如果这次 bug 与仓库已有事故模式相似，写记忆时不要遗漏下面这些额外信息：

- 这次问题是否打破了某个"用户已确认稳定"的基线
- 是否存在"不要乱改"的配置
- 首个可信信号来自哪里，是终端日志、浏览器 console、网络请求，还是构建输出
- 这次修复属于哪一类：依赖实例统一、废弃 API 清理、导入路径修正、类型断言补齐、构建配置兜底、依赖入口兼容、模板层覆盖、样式层补齐、还是启动前置准备
- 这次是否存在误导性很强的假象
- 最终验证是否基于 fresh 进程、fresh 日志和 fresh 页面，而不是历史缓存

## 验证证据写法

未来写事故记录时，优先记录可重复验证的证据，而不是模糊措辞。

- 好的写法：`pnpm exec tsc --noEmit 输出中相关错误为 0`
- 好的写法：`fresh dev.stderr 为空`
- 好的写法：`修复文件均无类型错误输出`
- 好的写法：`pnpm install 后依赖版本一致，peer dependency 无冲突`
- 不好的写法：`应该没问题了`
- 不好的写法：`看起来像是好了`

## 不要写成什么

把根级 AI 记忆经验吸收到技能里，不等于把技能写成修复手册。下面这些内容不应该成为这个技能的主体：

- 大段命令执行流水
- 与当前仓库无关的泛化 debug 理论
- 逐条罗列所有试错过程
- 把某一次临时绕过方案包装成永久规则
- 用"必须执行这些命令"代替"应该记录哪些结论"

## 记录流程

1. 先确认 bug 已经理解清楚并且修复完成。
2. 把结果压缩成 4 到 6 条高信号事实。
3. 选对记忆落点。
4. 如果是仓库级经验，就更新根级 AI 记忆文档。
5. 用同样的结论更新 Memorix，并选对记忆类型。
6. 回读一遍文本，删掉瞬时噪音、猜测和低价值命令历史。
7. 如果用户还要求提交 commit，把提交动作交给单独的 git 工作流处理。

## 好记忆的特征

- 解释清楚"为什么会坏"，而不是只写跑了什么命令
- 明确指出第一条可信线索，说明它如何打破错误假设
- 用可复用的方式描述最终修复
- 写出未来 agent 可以重复执行的验证动作
- 让下一次排错明显更短

## 常见错误

- 根因还没确认，就开始写猜测性结论
- 写成很长的 debug 日记，而不是可复用结论
- 仓库级经验写到了错误的位置
- 没把导致绕路的错误假设写出来
- 把修复说明和记忆沉淀混在一起
- 忘了同步本地 MCP 记忆

## 边界

这个技能只负责记忆沉淀和总结。

它不能替代调试、实现、测试和修复工作流。如果 bug 还没修好，先使用合适的调试或实现技能，等结果稳定后再回到这个技能做经验沉淀。
