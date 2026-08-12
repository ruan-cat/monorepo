# release-ai-plugins 详细契约

## Skill Registry 契约

`scripts/generate-skill-registry.ps1` 是 `ai-plugins/skill-registry.json` 的唯一生成入口。
它从以下两个 root 的直接子目录全量扫描当前 working tree：

```text
ai-plugins/common-tools/skills
ai-plugins/dev-skills/skills
```

Registry v1 的 canonical 结构只有：

```json
{
	"schemaVersion": "1",
	"roots": ["ai-plugins/common-tools/skills", "ai-plugins/dev-skills/skills"],
	"skills": [
		{
			"id": "skill-directory-name",
			"plugin": "common-tools",
			"name": "frontmatter name",
			"description": "frontmatter description",
			"version": "1.2.3",
			"entry": "ai-plugins/common-tools/skills/skill-directory-name/SKILL.md"
		}
	]
}
```

`id` 必须是全局唯一的目录名；`name`、`description`、`metadata.version` 直接来自 `SKILL.md`
frontmatter；`plugin` 由 root 派生；`entry` 必须是 POSIX 风格的仓库相对路径。缺少
frontmatter、版本非法、重复 id、路径逃逸或缺少目标文件时，生成必须失败，不能生成部分 registry。

输出固定为 UTF-8 无 BOM、LF、两空格缩进、固定属性顺序、按 id 排序并带一个末尾换行。不得加入
`generatedAt`、current commit SHA、绝对路径、Cloudflare 字段、正文副本，或
`references/templates/examples` 文件列表。Registry 是 generated discovery manifest，不是第二真源。

`-Check` 只生成 canonical 文本并与已提交文件逐字节比较，不写文件；缺失或 stale 时以非零退出并
提示 `-Apply` 修复命令。`-Apply` 只写 registry，随后执行等价检查。release 主脚本在所有 Skill
version、manifest 和 CHANGELOG 更新完成后集中调用一次 `-Apply`，再调用一次 `-Check`；禁止在
changed-Skill 循环中重复 full scan。新增、删除、重命名由当前树自然反映为 entry 增加、消失和
旧 id 消失/新 id 出现。

Registry 与 Skill 必须同一 Git commit。Skill Router MCP 在单次 tool call 内使用同一 exact commit
读取 registry 与选中的 `SKILL.md`；`list/search` 可返回 `sourceCommitSha`，后续 `load_skill`
可选带回该 SHA 以保持 search -> load 的快照一致性。release 技能不解析 SHA、不上传 KV/R2、不部署
Worker，也不维护增量 registry 数据库。

CI 只运行 generator `-Check`，不 Apply、commit 或 push；stale gate 与完整 release gate 分离。

固定 workflow：`.github/workflows/ai-plugins-skill-registry-check.yml`。它必须保持：

- `pull_request` 与 `push: dev` 的 Skill roots、registry、generator 和 workflow 自身 path filter。
- `permissions: contents: read`。
- 使用 PowerShell 运行 `generate-skill-registry.ps1 -Check`。
- 不包含 `-Apply`、`git commit` 或 `git push`。

普通 Skill body/version/reference/template/example 变化不要求修改 workflow；只有 generator 路径、CLI、
扫描 roots、schema、权限或触发范围变化时才同步修改。release 主脚本会在 DryRun/Apply 前检查该契约，
因此 workflow 遗漏会阻断发布，而不是依赖人工记忆。

## CHANGELOG 示例

```markdown
## [5.0.0] - 2026-04-15

### Changed

- **init-release-base-relizy-and-bumpp**：`metadata.version` `1.1.1` -> `2.0.0`。
- 根包 changelog 默认链路从 `conventional-changelog` 收口到 `changelogen`。
- `templates/bump.config.ts` 改为 `execute(newVersion)`。
- 根级 marketplace 与六个 `plugin.json` 的版本统一至 `5.0.0`。
```

禁止把上述多个变化压缩成一条包含多个分号的长 bullet。

## Codex 字段矩阵

`marketplace.json`：

- 两个插件的 `name` 必须是 `common-tools` 和 `dev-skills`。
- `source.source` 必须为 `local`。
- `source.path` 必须分别为 `./ai-plugins/common-tools` 和 `./ai-plugins/dev-skills`。
- `policy.installation` 必须为 `AVAILABLE`。
- `policy.authentication` 必须为 `ON_INSTALL`。
- 必须存在非空 `category`，且不得存在 marketplace 级 `version` 字段。

`.codex-plugin/plugin.json`：

- 必须包含 `version` 和 `skills: "./skills"`。
- 禁止添加 Claude Code 专属的 `hooks`、`commands`、`agents`。
- `interface` 中面向用户的展示字段使用中文；技术标识可保留插件名和 `Codex`。

## 发布后 smoke test

在隔离或临时环境执行，完成后清理临时安装：

```powershell
codex plugin marketplace add <repo-root> --json
codex plugin list --available --json --marketplace ruan-cat-tools
codex plugin add common-tools@ruan-cat-tools --json
codex plugin add dev-skills@ruan-cat-tools --json
codex plugin remove common-tools@ruan-cat-tools --json
codex plugin remove dev-skills@ruan-cat-tools --json
codex plugin marketplace remove ruan-cat-tools --json
```
