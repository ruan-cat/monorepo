# Co-authored-by 假冒账号历史记录

> 状态：已退出 `git-commit` 提交流程。本文件不再是提交前审核规则。

`git-commit` 不生成、不审核、不拦截、不改写 `Co-authored-by`。执行提交时不要打开本文件做 allowlist 或 blacklist 判定，也不要据此决定写不写 trailer。

带邮箱的 `Co-authored-by` 交给具体执行 agent 的系统提示词。本技能只主动追加 `Assisted-by`。

## 这份名单还留下做什么

下面的账号是历史上用 GitHub API 核对过的非官方或语义误导账号。技能不再引用它们做门禁。

若有人在本技能之外手写 `Co-authored-by`，不要把这些账号当成官方身份。表内事实保留，避免把历史核对结果丢掉。

## 历史名单

| 冒充目标    | 假冒账号                     | ID        | 判定为假冒的依据                                                                                                                         |
| :---------- | :--------------------------- | :-------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| Claude Code | `anthropics-claude`          | 237456255 | 不属于 `anthropics` 组织；仓库包含 Solana 加密货币诈骗项目（`clabs`）；仅 2 个关注者。**Claude Code 官方邮箱为 `noreply@anthropic.com`** |
| Gemini CLI  | `google-gemini-cli`          | 229672533 | 不属于 `google-gemini` 组织；仓库全部是 fork（无原创内容）；仅 5 个关注者                                                                |
| Codex CLI   | `codex-cli`                  | 208188539 | 不属于 `openai` 组织；OpenAI 发布 Codex（2025-04-13）后 5 天抢注；0 个公开仓库、仅 2 个关注者                                            |
| VS Code     | `vscode-triage-bot`          | 62039782  | 这是 VS Code 仓库的 Issue 分流机器人，不代表 VS Code IDE 本体，用于 Co-authored-by 会产生语义误导                                        |
| GLM-5       | `zhipuch`                    | 178361551 | 普通个人用户，与智谱 AI / GLM 无任何关联                                                                                                 |
| Trae        | `Trae-AI-Admin`              | 192575406 | 不属于任何组织；0 个公开仓库；无法确认为 Trae 官方账号                                                                                   |
| Codebuddy   | `CodeBuddy-Official-Account` | 214620440 | 不属于任何组织；无法确认为 Codebuddy 官方账号                                                                                            |
| Antigravity | `antigravity-ai`             | 256725992 | 仅 1 个关注者；0 个公开仓库；2026-01-23 才创建；无法确认为官方账号                                                                       |
| Qoder       | `Qoder-AI`                   | 215799558 | 不属于任何组织；仅 8 个关注者；无法确认为官方账号                                                                                        |
| Kiro        | `kiro-ai`                    | 201607104 | 0 个关注者；0 个公开仓库；无法确认为官方账号                                                                                             |
| MiniMax     | `MiniMax-OpenPlatform`       | 239562665 | 不属于任何组织；无法确认为 MiniMax 官方账号                                                                                              |
| Kimi        | `kimi-bot`                   | 85515654  | 2021 年创建（早于 Kimi 2023 年诞生）；0 个公开仓库、仅 1 个关注者；不在 `MoonshotAI` 组织中                                              |
| MIMO        | `Mimo-BOT`                   | 68919994  | 2020 年创建（早于 MIMO 诞生）；0 个公开仓库、仅 1 个关注者；不在 `XiaomiMiMo` 组织中                                                     |
