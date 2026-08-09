# 项目部署文档收口

## 写入位置

先检查目标项目的 `README.md`、`AGENTS.md`、`CLAUDE.md`、`GEMINI.md`。

- README 存在时，更新或新增最小 Vercel 部署章节；README 缺失时，可以创建仅含最小部署信息的 README。
- 已存在的每一份 AI 记忆都要等价更新，避免规则漂移。
- `AGENTS.md`、`CLAUDE.md`、`GEMINI.md` 三份都不存在时，转交 `init-ai-md` 创建记忆结构；本技能不自行生成整套结构。
- 不创建项目专属 Vercel 部署 skill。

## 最小字段清单

记录以下非敏感事实：

- Vercel Project 名称和用途。
- Git Integration 主链、仓库、生产分支与 Root Directory。
- Framework、Node 22.x/24.x 选择及理由、Install/Build/Output 命令。
- Shared Environment Variable 的 key、target 和链接状态（不写 value）。
- 本地 `.vercel/project.json` 单槽 link 纪律与 `projectId`/`orgId` 双 ID 核验要求。
- 生产 URL 与最后一次 Git E2E 的 commit、状态和日期。

禁止写入 token、secret value、Authorization header、CLI 私有认证数据、本机绝对路径或未证实的云端配置。环境变量、Settings 与 Git E2E 的结论都应附带可复核命令或日志证据；本地 Prebuilt 成功必须单独标为辅助链结果。
