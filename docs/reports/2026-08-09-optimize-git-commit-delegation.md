<!-- 已使用； 等待使用并完成对 git-commit 和 use-other-model 技能的升级； -->

# 2026-08-09 git-commit 与 use-other-model 委托流程优化报告

## 结论摘要

上一次 Git 提交任务变慢，主要不是 Git 本身或某个模型单独失速，而是把一个边界已经明确的提交任务叠加成了多层串行流程：完整上下文转发、临时子代理启动、重复读取两份技能、三组提交分别执行校验与 hooks、主代理轮询和最终收口。

责任划分如下：

1. `git-commit` 技能是正确性优先的重量流程，重复提交时天然存在固定成本；它不是故障，但缺少“主代理已预解析”快速入口。
2. `use-other-model` 技能已经区分 OpenCode 直启方案 D 与独立编码代理方案 B；本次提示词同时要求“临时子代理”和“OpenCode 默认模型”，造成执行路径混用。
3. 提示词是最大可控因素：要求传递全部会话、同时安排执行与审计、又要求临时代理自行重新发现范围，产生了重复推理和额外生命周期成本。

## 现场证据

本次仓库在提交前的实际状态包含 3 个明确的本轮外修改，提交代理正确将其排除：

```log
## dev...origin/dev
 M ai-plugins/common-tools/skills/init-ai-md/templates/05.沟通协作要求.md
 M ai-plugins/dev-skills/skills/nitro-api-development/SKILL.md
 M docs/prompts/release-ai-plugins/01.md
```

本轮实际形成 3 个逻辑提交：

```log
449c710d 📃 docs(release-ai-plugins): 完善发布流程约束与参考文档
4425d876 🔨 build(release-ai-plugins): 增加脚本化发布校验流程
dc87428e 📢 publish(ai-plugins): 同步 8.3.3 插件发布元数据
```

可见执行证据显示，主代理使用了原生协作代理启动，没有出现 `opencode run` 命令。因而无法证明该次任务真正走了 `use-other-model` 的 OpenCode 方案 D；这属于路径选择和可观测性缺口，不应归因于模型能力。

## 现有流程的成本拆解

| 成本项         | 现状                                                 | 影响                                                            |
| -------------- | ---------------------------------------------------- | --------------------------------------------------------------- |
| 上下文传递     | 使用完整会话上下文                                   | 子代理启动时重新处理大量系统规则、AGENTS.md、技能索引和历史对话 |
| 路径选择       | 同时要求临时子代理与 OpenCode 默认模型               | 增加一层调度，且无法确认实际使用的模型路径                      |
| 技能读取       | 子代理重新读取完整 `git-commit` 和 `use-other-model` | 重复 token 消耗和重复决策                                       |
| 提交次数       | 发布元数据、脚本、文档拆成 3 次提交                  | commitlint、pre-commit hook、格式化和提交后复核至少执行 3 轮    |
| Co-authored-by | 每个提交重新识别客户端与模型                         | 当前 Codex/GPT 均不在 allowlist，重复得出相同结论               |
| 生命周期       | 启动、等待、回传、停止临时代理                       | 简单任务的管理成本接近执行成本                                  |

## 根因判断

### `git-commit` 技能：严谨但缺少快速入口

技能要求先检查 staged，再锁定文件边界、按四个维度拆分、审查 staged diff、预校验 commitlint、执行最小验证、判断 Co-authored-by，最后重复到工作树干净。该流程适合不确定范围或高风险提交，但当主代理已经给出白名单和分组时，仍然重复做发现工作。

需要优化的不是删除安全门，而是增加一个“预解析任务包”接口：主代理先提供范围、分组、验证命令和身份判定，执行代理只执行并验证，不再重新扫描整个上下文。

### `use-other-model` 技能：路径定义清楚，但提示词混用了方案

技能的方案 D 是直接执行 OpenCode 默认模型的 `opencode run`；方案 B 才是启动独立编码代理。两者不能套娃。对于已经明确、预计几分钟完成的 Git 提交，技能本身也建议主代理直接执行或只读复核。

本次提示词把“创建临时子代理”和“使用 OpenCode 默认模型”写成同时成立的要求，导致主代理需要先解释两条路径，再启动协作代理，增加了调度延迟。

### 提示词：上下文过宽、角色过多、执行边界不够机器化

“传递全部对话信息”会把不相关的历史、技能清单和环境说明一并发送给执行代理；“执行型子代理 + 审计型子代理”又让简单任务形成串行角色链。真正需要传递的只有：文件白名单、排除列表、提交分组、验证命令和禁止事项。

## 目标流程

```text
主代理预解析
  ├─ 锁定白名单/排除列表
  ├─ 计算提交分组
  ├─ 确定 emoji、语言、Co-authored-by 结论
  └─ 生成一份任务封包
          ↓
单一执行代理（OpenCode 或原生子代理二选一）
  ├─ 只暂存白名单
  ├─ 按固定分组提交
  ├─ 运行 commitlint 与最小验证
  └─ 删除临时文件并退出
          ↓
主代理验收
  ├─ 复核每个 commit 的文件集合和正文
  ├─ git diff --check
  ├─ git status --short --branch
  └─ 确认未 push、无残留运行代理
```

## 具体优化实施方案

### 第一阶段：修改 `git-commit` 技能

目标文件：`C:/Users/pc/.agents/skills/git-commit/SKILL.md`。

新增“预解析任务包”章节，规定任务封包至少包含：

- `scope`: 本次允许提交的绝对或仓库相对路径白名单
- `exclude`: 明确排除的工作区修改
- `groups`: 每个提交的 type、scope、emoji、文件列表和摘要
- `verification`: 每组提交前后的最小验证命令
- `identityCheck`: 客户端、模型、allowlist 结果和 trailer 结论

快速路径只允许跳过重复发现，不允许跳过 staged diff、commitlint、最小验证和提交后复核。远程 `commit-types.ts` 在一次任务中解析一次即可，后续分组复用解析结果。

### 第二阶段：修改 `use-other-model` 技能

目标文件：`C:/Users/pc/.agents/skills/use-other-model/SKILL.md`。

增加明确的互斥规则：

1. 用户指定“OpenCode 默认模型”时，直接运行方案 D，不创建原生临时子代理。
2. 用户指定“临时子代理”但未指定 OpenCode 时，使用原生协作代理，不再额外套用方案 D。
3. 只有用户同时明确要求“通过 OpenCode 驱动独立执行器”时，才允许组合，并且必须记录两层启动证据。
4. 简单 Git 提交默认走主代理直做；只有批量提交、预期超过 5 分钟或需要独立验证时才委托。

### 第三阶段：固定主代理的预解析输出

主代理在启动任何执行器前，先输出一份短任务包，不超过以下内容：

```text
仓库：D:/code/ruan-cat/monorepo
目标：只提交 release-ai-plugins 本轮变更，不 push
白名单：release-ai-plugins 技能文件、发布脚本、6 个 plugin manifest、两个版本型 marketplace、两份 CHANGELOG
排除：init-ai-md 模板、nitro-api-development 技能、release-ai-plugins 状态提示文档
分组：publish 发布元数据、build 发布脚本、docs 技能文档
验证：commitlint、git diff --check、git status
身份：客户端/模型 allowlist 判定及 trailer 结论
```

执行代理使用 `fork_turns: none` 或等价的最小上下文启动，禁止再次读取整段历史对话。

### 第四阶段：减少不必要的角色和轮询

- 简单提交只保留“主代理 + 一个执行代理”两层。
- 安全审计只在 staged diff 出现密钥、权限、外部发布或用户明确要求时启动。
- 不使用长时间轮询；执行代理返回 commit hash 后立即进入主代理验收。
- “关闭代理”执行为停止当前 turn、检查 agent 状态和确认没有残留进程；不把它包装成复杂 cleanup 框架。

## 推荐的优化提示词

```text
[$git-commit]

只提交本轮 release-ai-plugins 变更，不推送。

执行器二选一：
- 若使用 OpenCode：直接运行 OpenCode 默认模型，不创建原生临时子代理。
- 若使用临时子代理：只创建一个执行代理，不再嵌套 OpenCode 或审计代理。

任务封包：
- 白名单：本轮 `release-ai-plugins` 技能文件、脚本、README、reference、6 个 plugin manifest、两个版本型 marketplace 和两份 CHANGELOG
- 排除：`ai-plugins/common-tools/skills/init-ai-md/templates/05.沟通协作要求.md`、`ai-plugins/dev-skills/skills/nitro-api-development/SKILL.md`、`docs/prompts/release-ai-plugins/01.md`
- 分组：`📢 publish(ai-plugins)` 发布元数据；`🔨 build(release-ai-plugins)` 发布脚本；`📃 docs(release-ai-plugins)` 技能文档
- 验证：每组 commitlint；最终 git diff --check、git status --short --branch
- Co-authored-by：使用主代理已完成的 allowlist 判定，不重复猜测

约束：
- 不传递全部历史对话。
- 不扫描无关目录，不重做已完成的范围分析。
- 不执行 git push。
- 每个提交返回 hash、正文和文件列表。
- 完成后删除临时提交信息文件并停止执行器。
```

## 验收标准

优化完成后，用下面的检查确认流程真的变快且没有降低安全性：

```log
1. 单次委托启动路径唯一：OpenCode 或原生子代理，不能两者同时出现。
2. 子代理输入只包含任务封包，不包含完整历史会话。
3. staged diff 中没有白名单外文件。
4. 每个提交均通过 commitlint 和最小验证。
5. 最终 git status 只保留明确排除的用户修改。
6. 不出现 commit-message.txt、result.json 或运行中的临时代理残留。
7. 可从日志确认实际使用的 CLI、模型路径、退出码和 commit hash。
```

## 风险与边界

快速路径不能跳过以下硬门槛：staged diff 审查、敏感信息扫描、commitlint、最小验证和最终工作区复核。可以删除重复的上下文和重复发现，但不能删除证据链。

本报告只提出流程优化，没有修改全局技能文件，也没有改变当前工作区已有的用户修改。
