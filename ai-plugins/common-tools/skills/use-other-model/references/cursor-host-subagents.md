# Cursor 宿主原生子代理

路径 E 在 Cursor 里就是当前会话的 Task 工具。先读完这一份再调用。不要同时打开 OpenCode 或 Claude Code 的启动模板。

## 真值顺序

1. 当前会话系统提示里的 available subagent models，以及 Task 工具 schema 里的 `subagent_type`。
2. 本文件的 2026-11-24 快照。只在会话清单拿不到时用来对照，不能覆盖会话清单。
3. 用户口头说的家族名。必须落到清单里的一条 slug 才能传给工具。

会话清单和本快照冲突时，以会话清单为准。清单里没有的 slug 禁止传递，也禁止用「相近型号」顶替。用户点名的型号不在清单里时，停下来说明不可用，并列出当前清单。

清单里有某个 slug，只说明允许尝试。账号额度或工具拒绝时，换清单内的另一条，或省略 `model` 继承父代理。不要把拒绝当成拼写错误，再发明一个清单外的名字。

## 2026-11-24 已核对的 model slug

- `claude-fable-5-2-high`
- `claude-opus-5-5-medium`
- `claude-sonnet-5-5-high`
- `composer-2.5`
- `composer-2.5-fast`
- `cursor-grok-4.6-high`
- `gemini-4-carbon-medium`
- `gemini-4-neon-high`
- `gpt-5.6-sol-medium`
- `grok-4.7-high`
- `muse-wonder-1.0-high`

## 2026-11-24 已核对的 subagent_type

`generalPurpose`、`explore`、`cursor-guide`、`ci-investigator`、`bugbot`、`security-review`、`best-of-n-runner`、`ai-architect`、`deployment-expert`、`performance-optimizer`。

不在这份枚举里的 type 不要传。会话 schema 若比快照新，以会话 schema 为准。

## 调用规则

- 用户没有指定模型时，省略 `model`，子代理继承父代理。
- `resume` 非空时不要传 `model`。
- 非法 slug 会直接失败。不要用同一个非法 slug 再试一次。
- `environment` 默认 `local`。只有用户明确要求 cloud 才传 `cloud`。cloud 会另开 worktree。
- 对用户说话时用用户自己的叫法。传给 Task 的 `model` 必须是清单里的 slug。
- 用户只说了家族名（Claude、GPT、Grok、Gemini、Composer）时，只在该家族的清单条目里选。同一家族有多条产品线时，按下表的任务强度选，不要猜成 fast。
- `composer-2.5` 和 `composer-2.5-fast` 只用于已经压平的弱执行包。弱执行包的门槛仍以 `references/weak-executor-contract.md` 为准。
- `muse-wonder-1.0-high` 只记为清单内可用、强度未核对。不要给它编跑分名次。

## 路由启发

下表是选型启发，不是跑分。

| 任务                 | 优先尝试                                                                                            |
| :------------------- | :-------------------------------------------------------------------------------------------------- |
| 审计、架构、最终判断 | `claude-opus-5-5-medium`、`gpt-5.6-sol-medium`、`grok-4.7-high`、`gemini-4-neon-high`               |
| 普通实现             | `claude-sonnet-5-5-high`、`claude-fable-5-2-high`、`cursor-grok-4.6-high`、`gemini-4-carbon-medium` |
| 已压平的弱执行       | `composer-2.5`、`composer-2.5-fast`                                                                 |

路径 E 的返回仍是候选状态。主代理收到完成通知后必须自己验收。复杂根因、安全判断和最终合并不要交给弱执行模型。
