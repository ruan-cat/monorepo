## [0.14.0] - 2026-02-01

### Added

- **新增 Skill**: `git-commit` - Git 提交助手技能
  - 位置：`skills/git-commit/`
  - 核心功能：
    - 创建高质量的 git 提交，引导用户审查、暂存和拆分变更
    - 强制使用 Conventional Commits 规范，并支持 Emoji
    - 提交信息必须使用中文编写
    - 自动查阅项目级 `commit-types.ts` 配置，确保 Emoji 和 Type 规范一致
  - 包含文件：
    - `SKILL.md` - 技能主文件，定义工作流程和规范
    - `references/commit-message-template.md` - 提交信息模板和 Emoji 对照表
  - 来源说明：该技能是 `agent-toolkit/skills/commit-work` 的中文改写版，适应本地化需求

### References

- Agent Skills 规范文档: https://agentskills.io/specification#metadata-field
- Claude Code Skills 文档: https://code.claude.com/docs/zh-CN/skills
