## 停止

2026-11-23 本变更放弃。前因后果写在 `proposal.md` 的「放弃」。下面 5 条任务全部取消，不要执行。四份 `SKILL.md` 保持改前双语全文。不要运行 `generate-skill-registry.mjs`。

## 1. 试点批次

> 目的：用最肥的一条验证「删第二语言 + 换成写死的单语句子 + 正文不改」。
> 完成标准：description 与写死句子逐字相同，JavaScript 字符串长度 ≤ 200，正文没有 diff。

- [ ] 1.1 [修改] `ai-plugins/common-tools/skills/use-pnpm/SKILL.md` - 将 frontmatter `description` 替换为「当用户要处理 pnpm 安装、workspace 命令、npm/npx/yarn 替换，或排查 pnpm 12 的 allowBuilds、blockExoticSubdeps、Corepack、self-update 假成功、全局 shim、pnpm ls -g 空列表、NVM Desktop 与 ERR_PNPM_* 时使用。不要用于与 pnpm 无关的 Node、Git 或业务代码。」（196 字符），`metadata.version` 改为 `1.0.1`。不新增章节，不改 frontmatter 以下已有句子。验证：description 与该句逐字相同，且 `git diff` 只触及 description 与 version。

## 2. 主体任务

> 试点的 description 已与写死句子逐字相同、正文没有 diff 之后再做。

- [ ] 2.1 [修改] `ai-plugins/dev-skills/skills/use-agent-browser/SKILL.md` - 将 frontmatter `description` 替换为「当用户要用 agent-browser 打开网页、做可见浏览器验收，或排查 MCP 浏览器超时时使用。不要用于与浏览器无关的改码，也不承担残留进程批量清理。」（78 字符），`metadata.version` 改为 `1.6.1`。不新增章节，不改 frontmatter 以下已有句子。验证：description 与该句逐字相同，且 `git diff` 只触及 description 与 version。
- [ ] 2.2 [修改] `ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/SKILL.md` - 将 frontmatter `description` 替换为「当用户要搭建、迁移或排查 shadcn-docs-nuxt 文档站，或处理 Nuxt Content、MDC、prerender、Windows 构建失败与 FUNCTION_INVOCATION_FAILED 时使用。不要用于普通 Nuxt 业务页。」（126 字符），`metadata.version` 改为 `1.9.4`。不改「故障检修入口」及之后的已有句子。验证：description 与该句逐字相同，且 `git diff` 只触及 description 与 version。
- [ ] 2.3 [修改] `ai-plugins/common-tools/skills/do-long-task/SKILL.md` - 将 frontmatter `description` 替换为「当用户要执行、续跑、交接或验收同目录含 spec.md、plan.md、handoff.md 的任务包，包括 docs/plan、docs/prompts、docs/one-use，或生成 /goal 长任务提示词时使用。不要用于短改、问答和尚未执行的纯计划。」（130 字符），`metadata.version` 改为 `1.5.2`。不改「什么时候用」和「提示词生成模式」。验证：description 与该句逐字相同，且 `git diff` 只触及 description 与 version。
- [ ] 2.4 [修改] `ai-plugins/skill-registry.json` - 不手改。四份 `SKILL.md` 落盘后，在仓库根运行 `node ai-plugins/common-tools/skills/release-ai-plugins/scripts/generate-skill-registry.mjs --apply`，再运行同脚本 `--check`。验证：`--check` 报告 registry 为当前生成结果，且这四条的 `description` 与 `version` 和对应 frontmatter 逐字一致。
