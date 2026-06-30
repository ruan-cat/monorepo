# 完整 Co-authored-by 假冒/冒名账号黑名单

> 以下账号均已通过 GitHub API 验证为非官方账号，**严禁在 Co-authored-by 中使用**。
> 即使 AI 模型"记住"了这些账号，也绝对不能使用。

## 为什么要维护黑名单

AI 模型在生成 Co-authored-by 时，可能会从训练数据或互联网上"回忆"起这些账号并自动填入。明确列出黑名单可以防止这种行为，避免你的 GitHub 仓库贡献者列表中出现无关甚至恶意的第三方。

## 完整黑名单表

| 冒充目标 | 假冒账号 | ID | 判定为假冒的依据 |
|:---------|:---------|:---|:-----------------|
| Claude Code | `anthropics-claude` | 237456255 | 不属于 `anthropics` 组织；仓库包含 Solana 加密货币诈骗项目（`clabs`）；仅 2 个关注者。**Claude Code 官方邮箱为 `noreply@anthropic.com`** |
| Gemini CLI | `google-gemini-cli` | 229672533 | 不属于 `google-gemini` 组织；仓库全部是 fork（无原创内容）；仅 5 个关注者 |
| Codex CLI | `codex-cli` | 208188539 | 不属于 `openai` 组织；OpenAI 发布 Codex（2025-04-13）后 5 天抢注；0 个公开仓库、仅 2 个关注者 |
| VS Code | `vscode-triage-bot` | 62039782 | 这是 VS Code 仓库的 Issue 分流机器人，不代表 VS Code IDE 本体，用于 Co-authored-by 会产生语义误导 |
| GLM-5 | `zhipuch` | 178361551 | 普通个人用户，与智谱 AI / GLM 无任何关联 |
| Trae | `Trae-AI-Admin` | 192575406 | 不属于任何组织；0 个公开仓库；无法确认为 Trae 官方账号 |
| Codebuddy | `CodeBuddy-Official-Account` | 214620440 | 不属于任何组织；无法确认为 Codebuddy 官方账号 |
| Antigravity | `antigravity-ai` | 256725992 | 仅 1 个关注者；0 个公开仓库；2026-01-23 才创建；无法确认为官方账号 |
| Qoder | `Qoder-AI` | 215799558 | 不属于任何组织；仅 8 个关注者；无法确认为官方账号 |
| Kiro | `kiro-ai` | 201607104 | 0 个关注者；0 个公开仓库；无法确认为官方账号 |
| MiniMax | `MiniMax-OpenPlatform` | 239562665 | 不属于任何组织；无法确认为 MiniMax 官方账号 |
| Kimi | `kimi-bot` | 85515654 | 2021 年创建（早于 Kimi 2023 年诞生）；0 个公开仓库、仅 1 个关注者；不在 `MoonshotAI` 组织中 |
| MIMO | `Mimo-BOT` | 68919994 | 2020 年创建（早于 MIMO 诞生）；0 个公开仓库、仅 1 个关注者；不在 `XiaomiMiMo` 组织中 |
