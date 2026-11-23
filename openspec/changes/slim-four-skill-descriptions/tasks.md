## 1. 试点批次

> 目的：用最肥的一条验证「删第二语言 + 收成两句 + 缺失触发词补进正文」这个模式。
> 完成标准：description 不超过 200 字符，操作步骤相对改前没有逐字以外的变化。

- [ ] 1.1 [修改] `ai-plugins/common-tools/skills/use-pnpm/SKILL.md` - 把 frontmatter `description` 收成单语两句（一类触发场景 + 一句边界），字符数 ≤ 200；只存在于旧描述、正文还没有的错误码逐字补进已有的何时使用章节；其余操作步骤保持逐字不动；`metadata.version` 按本仓库技能版本约定递增。验证：按 `design.md` 的字符口径重数 description ≤ 200，且 `git diff` 里步骤段落没有改写。

## 2. 主体任务

> 试点的 description 已 ≤ 200 且步骤未被改写之后再做。

- [ ] 2.1 [修改] `ai-plugins/dev-skills/skills/use-agent-browser/SKILL.md` - 将 frontmatter `description` 替换为「当用户要用 agent-browser 打开网页、做可见浏览器验收，或排查 MCP 浏览器超时时使用。不要用于与浏览器无关的改码，也不承担残留进程批量清理。」（78 字符），`metadata.version` 改为 `1.6.1`。不新增章节，不改 frontmatter 以下已有句子。验证：description 与该句逐字相同，且 `git diff` 只触及 description 与 version。
- [ ] 2.2 [修改] `ai-plugins/dev-skills/skills/init-shadcn-docs-nuxt/SKILL.md` - 将 frontmatter `description` 替换为「当用户要搭建、迁移或排查 shadcn-docs-nuxt 文档站，或处理 Nuxt Content、MDC、prerender 与 Windows 构建失败时使用。不要用于普通 Nuxt 业务页。」（99 字符），`metadata.version` 改为 `1.9.4`。不改「故障检修入口」及之后的已有句子。验证：description 与该句逐字相同，且 `git diff` 只触及 description 与 version。
- [ ] 2.3 [修改] `ai-plugins/common-tools/skills/do-long-task/SKILL.md` - 将 frontmatter `description` 替换为「当用户要执行、续跑或交接含 spec.md、plan.md、handoff.md 的任务包，或生成 /goal 长任务提示词时使用。不要用于短改、问答和尚未执行的纯计划。」（85 字符），`metadata.version` 改为 `1.5.2`。在「什么时候用」已有列表末尾追加「- 任务包所在目录包括 docs/plan、docs/prompts、docs/one-use。」，不改写已有条目，不改「提示词生成模式」。验证：description 与该句逐字相同，且该节只多这一条。
- [ ] 2.4 [修改] `ai-plugins/skill-registry.json` - 将 `use-pnpm`、`use-agent-browser`、`init-shadcn-docs-nuxt`、`do-long-task` 四条的 `description` 改成与对应 `SKILL.md` frontmatter 相同的字符串。验证：四处字符串与 frontmatter 逐字一致。
