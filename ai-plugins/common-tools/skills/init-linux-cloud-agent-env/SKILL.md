# 初始化云 linux agent 环境

本技能主要用于实现初始化位于云 liunx 环境的基础工具，初始化必要的 MCP 客户端以及具体的 MCP 配置，cli 工具，以及后续对话内需要的指导 skills 技能。

本技能还主要提供基于 github pr 的云任务执行规范。

<!-- TODO: -->

手写并完成具体的细化。

## 本技能的核心目的

## 本技能的快速执行流程

1. 检查并安装 MCP 客户端： 检查当前 linux 环境内，是否有来自 Anthropic 的 Python 形式的 MCP cli。如果没有，你就安装 Anthropic Python MCP cli 客户端；
2. 安装 MCP 服务： 见下面 templates 目录的 mcp.json ，或直接访问 `https://github.com/ruan-cat/monorepo/blob/dev/ai-plugins/common-tools/skills/init-linux-cloud-agent-env/templates/mcp.json` 查看具体 MCP 格式。或者是根据用户专门发的 json 格式的 MCP 配置来安装 MCP。
3. 安装 cli： 安装以下清单的 cli，便于和 MCP 工具辅助完成后续任务。
   - gh cli （直接下载官方二进制 tarball，避免你出现 linux 系统内缺失 root 权限的问题）
   - vercel cli
4. 验证 MCP 的可用性：
   - 重点验证 github MCP
   - 然后是 skill-router-mcp
   - 其次是 vercel MCP
   - 最后是 neon MCP

## 基于 github pr 的云任务要求和注意事项

1. 云任务获取连接器、MCP、或 cli： 你现在是在云 linux 系统内执行的云任务。动用你的 github 和 `skill-router-mcp` 这两款工具的全部可用工具来完成基于主 pr 和多轮 pr 测试性 pr 的自测自检方式的云任务。
   - 如果你无法完成这两个连接器的连接使用，请你及时中断任务，告诉我你出现 bug 了，无法找到，无法在本轮会话内找到必要的工具了。
   - 在绝大多数情况下，你的工具基本上不会突然丢失。如果你的 MCP 和 cli 突然出现 linux 沙箱层面上的工具丢失，请你及时暂停并告知我。
2. 连接器优先级表：
   - 优先 `@Github` 连接器，没有这个连接器就什么工作都做不了了。
   - 其次是 `@Skill Router MCP` 连接器，这个连接器是用来获取指导 skills 的，没有的话，也能勉强地继续推进任务。
3. 备份工具降级使用的优先级表：
   - 优先使用 github MCP
   - 其次使用 gh cli
4. 上下文要求：
   - 主动阅读目标项目根目录的 `AGENTS.md` 和项目级别 `record-bug-fix-memory` 技能存储的经验教训。
   - 首先阅读 `.agents\skills\fix-bug\record-bug-fix-memory\SKILL.md` ，找到与本次任务可能相关的错误，作为你的历史参考。
   - 针对性的阅读 `.agents\skills\fix-bug\record-bug-fix-memory` 目录内提供的详细错误经验。
   - 通过 `Skill Router MCP` 获取指导 skills： 用这款 skill-router-mcp 来获取本任务必要的指导技能。
5. pr 稿 title 要求：
   - 优先使用 `@Skill Router MCP` 连接器/skill-router-mcp 获取指导技能 `git-commit` 来编写 pr 稿 title 。
   - 降级处理： 如果你确实没有这个连接器，你就编写满足 `Conventional Commits` 惯例的 title。
   - 这个 title 的默认 message 是**纯中文**的。除非我专门要求你写纯英文的 message，否则你的 pr 稿 title 默认都是纯中文的。
6. pr 稿本体发挥**长任务进度工件**的职责：
   - 你在基于 pr 的云任务处理上，肯定是会出现意外中断的，为了便于你记录你复杂任务的规范，记忆，和进度。你应该模仿 superpower 技能的方式，在 pr 稿主体新建 spec、plan、memory、progress 这四个章节，把你的`任务规范`，`任务计划`、`执行时记忆`、`任务进度`都充分的写到 pr 主体内，充分利用 pr 本身的能力完成存储。
7. superpower 技能的 github url 地址： 在云端执行任务时，你应该主动使用以下的 skills 技能作为你的上下文。
   - 全部技能： https://github.com/obra/superpowers/tree/main/skills
   - brainstorming： https://github.com/obra/superpowers/blob/main/skills/brainstorming/SKILL.md
   - writing-plans： https://github.com/obra/superpowers/blob/main/skills/writing-plans/SKILL.md
   - verification-before-completion： https://github.com/obra/superpowers/blob/main/skills/verification-before-completion/SKILL.md
   - receiving-code-review： https://github.com/obra/superpowers/blob/main/skills/receiving-code-review/SKILL.md
8. 阶段任务结束后提供汇报信息：
   - 主动收尾： 当你明显具有 github MCP/gh cli 工具时，你就应该主动删除临时分支、关闭临时 pr。
   - 主 pr 编号： 告诉我需要我完成审核审批的主 pr 编号。我亲自进入对应的主 pr 完成审核。
   - 主 origin branch 工作分支名称： 告诉我哪些 origin branch 属于主工作分支。避免我误删除。
   - 其他 origin branch 临时分支名称： 哪些是需要我介入删除的临时云分支。或者你自己主动删除。
   - 其他临时 pr 编号： 告诉我哪些是你已经完成 close 的临时 pr。或者你自己主动关闭临时 pr。

## 已知坑

### GitHub MCP 文件操作

- **禁止传 `encoding: base64`** — 工具内部自动处理编码，传入会双重 base64 导致乱码
- **用 `content` 传原始文本** — 不要手动 base64 编码
- **更新必须传 `sha`** — 先读取文件获取 blob SHA，否则会创建而非更新
- **返回格式不稳定** — `get_file_contents` 可能返回 `TextContent` 或 `EmbeddedResource`，需检查类型再提取

### skill-router MCP

- **匿名、无需 Token** — Cloudflare Workers 部署，直连即用
- **只读** — 技能注册表查询与加载，不支写入
- **核心工具**：`search_skills`、`load_skill`、`list_skill_resources`、`load_skill_resource`

## 本技能其他引用项
