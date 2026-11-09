---
name: openspec
description: >-
  OpenSpec 规范驱动开发助手 - 基于 OPSX 工作流的 AI 辅助编程框架。
  在编写代码前与 AI 就需求达成一致，使用 Schema 驱动的工件依赖系统管理变更。

  触发条件（满足任意一项即触发）：
  1. 用户提及 "openspec"、"opsx"、规范驱动开发、spec-driven
  2. 用户想要开始新功能开发、重构或探索复杂需求
  3. 用户抱怨 AI 理解偏差或频繁返工
  4. 用户使用斜杠命令如 /opsx:new、/opsx:ff、/opsx:apply 等
  5. 项目初始化或准备重大变更时
  6. 需要生成 proposal、design、tasks 等规范文档时
  7. 进入某个项目，需要检查项目级技能目录里是否还有用户不再使用的 openspec 局部技能

  推荐使用：改进现有项目（棕地开发）、需要高质量实现的关键功能、团队协作开发。
  不推荐：快速原型验证（0→1 探索）、一次性小脚本、需求极度不明确的创新探索。
metadata:
  version: "1.4.0"
---

# OpenSpec 规范驱动开发助手

OpenSpec 是规范驱动的 AI 编程框架。核心理念：**在编写代码前，与 AI 就需求达成一致**。

- **流动而非僵化** - 随时处理任何工件，无阶段门控
- **迭代而非瀑布** - 边构建边完善理解
- **简单而非复杂** - 最小化设置和仪式
- **棕地优先** - Delta 方式修改现有系统

## 检查冗余的项目级 OpenSpec 局部技能

使用本技能处理某个具体项目时，先检查该项目是否还留着用户不再使用的项目级 openspec 局部技能。发现冗余项后，列出清单并主动询问是否删除。未发现时不要询问，直接继续原有 OpenSpec 流程。

这是检查与询问。用户明确同意之前，不得删除任何技能目录，也不得改技能索引或锁文件。询问不阻断用户已经明确要求的 change 工作；删除本身必须等同意。同一项目、同一会话里，得到答复后不要重复询问。

斜杠命令（如 `/opsx:explore`）仍是 OpenSpec 工作流命令。下面判断的是项目里安装的技能目录名，不要据此删掉本文的命令说明。

### 保留与冗余

保留，不算冗余：

- `openspec-new-change`
- `openspec-apply-change`
- `openspec-archive-change`
- `openspec-ff-change`

其余目录名以 `openspec` 开头的项目级技能都算冗余。已知例子包括 `openspec-bulk-archive-change`、`openspec-continue-change`、`openspec-explore`、`openspec-onboard`、`openspec-sync-specs`、`openspec-verify-change`。名单不封闭：目录名 `openspec` 本身，以及其他以 `openspec` 开头且不在保留名单中的目录，一律列入询问清单。

### 检查哪里

事实源是当前项目的 `.agents/skills`。

`.agent/skills` 与 `.claude/skills` 按下面规则处理：

- 先判断它们是符号链接、目录联接，还是独立真实目录。
- 链接解析后指向本项目 `.agents/skills` 时，只处理 `.agents/skills`，不要把链接再算成第二份副本。
- 它们是独立真实目录时，套用同一份保留名单，只留下上述 4 个技能。
- 链接指向项目之外时，不要顺着链接删除。向用户说明该路径超出本次项目级清理范围。

不要检查或修改全局技能目录，例如用户主目录下的 `.agents/skills`。清理只针对当前项目。

### 如何询问

发现冗余目录后，向用户列出相对路径、目录名，以及同意后会一并改动的登记位置。登记位置只包括实际含有这些技能名的项目根 `AGENTS.md` 条目；若 `CLAUDE.md` 或 `GEMINI.md` 是含这些技能名的全文副本，一并说明；若 `skills-lock.json` 已有登记，一并说明。

用户明确同意删除这些冗余技能之前，停止在删除动作上。只同意其中一部分时，只处理被点名的部分。用户拒绝、要求保留，或答复含糊时，保持原样。

### 同意之后才删除

1. 删除用户同意的冗余技能目录。删的是项目内这个目录或链接本身；若该项只是链接，只移除链接，不删除链接目标。
2. 从项目根目录 `AGENTS.md` 删除对应条目。只删这些技能的列表项、表格行或索引项，不改写文件里的其他内容。
3. 分别判断 `CLAUDE.md` 与 `GEMINI.md`。正文主要是指向 `AGENTS.md` 的存根时，不改。正文是含这些技能名的全文副本时，同步删掉同一处条目。
4. 仅当 `skills-lock.json` 已经登记这些技能时，删除对应登记并保持 JSON 合法。没有登记就不要改这个文件。
5. 保留名单中的 4 个技能不动。不修改全局技能目录，不提交用户没有要求提交的其他改动。

用精确编辑完成上述删除。不要整文件重写 `AGENTS.md`、`CLAUDE.md` 或 `GEMINI.md`，以免冲掉用户自己的内容。

## 斜杠命令

| 命令                 | 功能                              |
| -------------------- | --------------------------------- |
| `/opsx:explore`      | 探索想法、调查问题、明确需求      |
| `/opsx:new`          | 启动新变更                        |
| `/opsx:continue`     | 创建下一个就绪工件                |
| `/opsx:ff`           | 快进 - 一次创建所有规划工件       |
| `/opsx:apply`        | 实施任务，按需更新工件            |
| `/opsx:verify`       | 验证实现的完整性、正确性、一致性  |
| `/opsx:sync`         | 同步 delta specs 到主规范（可选） |
| `/opsx:archive`      | 归档完成的变更                    |
| `/opsx:bulk-archive` | 批量归档多个变更                  |
| `/opsx:onboard`      | 交互式教程                        |

## 工作流模式

**快速功能流**（需求明确时）：

```plain
/opsx:new → /opsx:ff → /opsx:apply → /opsx:verify → /opsx:archive
```

**探索式流程**（需求不明确时）：

```plain
/opsx:explore → /opsx:new → /opsx:continue → ... → /opsx:apply
```

**增量式流程**（需要更多控制时）：

```plain
/opsx:new → /opsx:continue (重复) → /opsx:apply → /opsx:archive
```

## 工件系统（默认 Schema: spec-driven）

**工件依赖链：**

```plain
proposal → specs → design → tasks → implement
```

**工件类型：**

1. **proposal.md** - 变更提案（Why/What/Impact）
2. **specs/** - Delta 规范（ADDED/MODIFIED/REMOVED）→ 详见 `references/delta-specs-format.md`
3. **design.md** - 技术设计
4. **tasks.md** - 任务清单（带复选框）→ 编写规范详见 `references/tasks-writing-guide.md`

**工件状态：**`BLOCKED`（缺少依赖）→ `READY`（依赖完成）→ `DONE`（文件存在）

## 目录结构

```plain
openspec/
├── config.yaml           # 项目配置（可选）
├── specs/                # 当前系统行为（事实来源）
├── changes/              # 活跃变更
│   └── add-feature/
│       ├── .openspec.yaml
│       ├── proposal.md
│       ├── specs/
│       ├── design.md
│       └── tasks.md
├── archive/              # 已归档变更
└── schemas/              # 自定义工作流（可选）
```

## tasks.md 核心要求

> 详细规范请读 `references/tasks-writing-guide.md`

**两条最重要的原则：**

1. **文件级粒度**：每个任务条目必须包含 `[操作类型] 文件路径 - 具体改动描述`，禁止写无法定位文件的模糊任务
2. **试点分层**：任务总数 ≥ 5 时，必须先划分「试点批次（Pilot Batch）」验证方向后，再推进「主体任务」
3. **执行中动态补全**：`/opsx:apply`、`/opsx:verify` 或人工复核发现任务遗漏时，先回写当前 change 的 `tasks.md`，再继续实现或验收

**格式速记：**

```markdown
- [ ] [修改] `packages/foo/src/bar.ts` - 增加 processItem（） 方法，实现单条数据处理
```

## 执行中动态补全

当 `/opsx:apply`、`/opsx:verify` 或人工复核发现当前 change 存在任务遗漏时，必须先把遗漏项写回 `openspec/changes/<change>/tasks.md`，再继续实现或验收。`tasks.md` 是唯一可执行任务源，不得只把遗漏写在聊天 checklist、进度报告或子代理反馈里。

补全任务必须保持 OpenSpec checkbox 格式：

```markdown
- [ ] [操作类型] 路径 - 具体动作与验收标准
```

发现缺口但未写回 `tasks.md` 时，不得声明相关实现、验收或 change 已完成。任务补全后必须运行：

```bash
openspec validate <change-name> --strict
```

## 更新与迭代决策

```plain
相同意图？  → YES: 更新现有变更 / NO: 启动新变更
>50% 重叠？ → YES: 更新现有变更 / NO: 启动新变更
原始能完成？→ NO: 更新现有变更 / YES: 启动新变更
```

## 验证

`/opsx:verify` 检查三个维度：

- **Completeness** - 所有任务完成，需求已实现
- **Correctness** - 匹配规范意图，处理边界情况
- **Coherence** - 设计决策反映在代码中

## 执行长任务的注意事项

1. **文件级粒度执行** - 每次只修改一个文件，立即标记完成
2. **先试点再推进** - 先完成「试点批次」，验证通过后继续「主体任务」
3. **及时更新任务文件** - 完成任务后立即更新 `tasks.md` 的复选框；发现遗漏任务时先补写 `tasks.md` 并 strict validate
4. **并行子代理** - 启动多个子代理分模块完成任务
5. **中文回复** - 始终用中文回复用户
6. **重读任务要求** - 上下文合并后重新阅读规范
7. **连续执行** - 一次性完成 `tasks.md` 全部任务
8. **禁止批处理脚本** - 使用具体的文件编辑，不用脚本批量修改
9. **主从代理调度**：主代理阅读全部任务、分配子代理、监听反馈；子代理严格按要求完成任务

## 常用 CLI 命令

```bash
openspec init                              # 初始化项目
openspec list                              # 列出活跃变更
openspec status --change <name>            # 查看工件状态
openspec validate <name> --strict          # 严格格式校验
openspec archive <name> --yes              # 归档变更
```

> 配置、自定义 Schema、故障排除详见 `references/configuration.md`

## 参考文件

| 文件                                | 内容                                           |
| ----------------------------------- | ---------------------------------------------- |
| `references/tasks-writing-guide.md` | tasks.md 编写规范（文件级粒度 + 试点分层详解） |
| `references/delta-specs-format.md`  | Delta Specs 完整格式规范                       |
| `references/configuration.md`       | config.yaml 配置、自定义 Schema、故障排除      |

## 外部参考资源

- **OpenSpec 仓库**: https://github.com/Fission-AI/OpenSpec
- **OPSX 工作流**: https://github.com/Fission-AI/OpenSpec/blob/main/docs/opsx.md
- **CLI 参考**: https://github.com/Fission-AI/OpenSpec/blob/main/docs/cli.md
