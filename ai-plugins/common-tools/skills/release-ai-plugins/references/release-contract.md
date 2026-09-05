# release-ai-plugins 详细契约

## Skill Registry 契约

`scripts/generate-skill-registry.mjs` 是 `ai-plugins/skill-registry.json` 的唯一 canonical generator。
`scripts/generate-skill-registry.ps1` 仅保留为兼容旧 `-Check/-Apply` CLI 的薄适配器；它只能调用 Node，
不得自行解析 SKILL.md、序列化 JSON、重算缩进、处理转义或规范化行尾。

Node generator 从以下三个 root 的直接子目录全量扫描当前 working tree：

```text
ai-plugins/common-tools/skills
ai-plugins/dev-skills/skills
ai-plugins/low-frequency-skill/skills
```

Registry v1 的 canonical 结构只有：

```json
{
	"schemaVersion": "1",
	"roots": ["ai-plugins/common-tools/skills", "ai-plugins/dev-skills/skills", "ai-plugins/low-frequency-skill/skills"],
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

### Node canonical 设计

本 generator 刻意保持窄职责，不引入第三方 YAML/JSON 库：

1. 使用 `node:fs`、`node:path`、`node:url` 读取文件和定位仓库。
2. 读取文本后先把 CRLF/CR 收敛为 LF，并移除可选 UTF-8 BOM。
3. 只解析当前 Skill 契约需要的 YAML frontmatter 子集：`name`、`description` 与 `metadata.version`；
   `description` 支持现有 scalar、`>`/`>-`、`|`/`|-` block 形式。为保持 Registry v1 已发布的 discovery
   文本，所有 block 都沿用既有折叠语义：普通行以空格连接，空段落保留一个换行标记；这不是通用 YAML parser。
   未知结构直接失败，不在 generator 中继续扩展 YAML 兼容层。
4. Skill id 仅允许 `[a-z0-9][a-z0-9-]*`，排序使用直接字符串比较，不引入 locale-sensitive collation。
5. 对固定属性顺序构造普通 JS object，canonical 文本唯一公式为：

```js
`${JSON.stringify(registry, null, 2)}\n`;
```

6. 以 UTF-8 写入；`--check` 直接比较完整字符串，`--apply` 写入后再读回做同样比较；stale 时输出首个差异行。

因此 canonical 不再依赖 Windows PowerShell 5.1 / PowerShell 7 的 `ConvertTo-Json` 实现，也不再维护
HTML-sensitive escape、冒号空格、数组缩进或 CRLF 的 runtime-specific 修补逻辑。Node 默认输出中的
普通 `&`、`<`、`>` 等字符就是新的 canonical；不要为了兼容旧 PowerShell 产物重新转成 `\uXXXX`。

输出固定为 UTF-8 无 BOM、LF、两空格缩进、固定属性顺序、按 id 排序并带一个末尾换行。不得加入
`generatedAt`、current commit SHA、绝对路径、Cloudflare 字段、正文副本，或
`references/templates/examples` 文件列表。Registry 是 generated discovery manifest，不是第二真源。

Node `--check` 只生成 canonical 文本并与已提交文件逐字节比较，不写文件；缺失或 stale 时以非零退出并
提示 `--apply` 修复命令。Node `--apply` 只写 registry，随后执行等价检查。release 主脚本在所有 Skill
version、manifest 和 CHANGELOG 更新完成后集中调用一次 PowerShell `-Apply` 兼容入口，再调用一次
`-Check`；wrapper 分别转发为 Node `--apply` / `--check`。禁止在 changed-Skill 循环中重复 full scan。
新增、删除、重命名由当前树自然反映为 entry 增加、消失和旧 id 消失/新 id 出现。

Registry 与 Skill 必须同一 Git commit。Skill Router MCP 在单次 tool call 内使用同一 exact commit
读取 registry 与选中的 `SKILL.md`；`list/search` 可返回 `sourceCommitSha`，后续 `load_skill`
可选带回该 SHA 以保持 search -> load 的快照一致性。release 技能不解析 SHA、不上传 KV/R2、不部署
Worker，也不维护增量 registry 数据库。

### CI 契约

CI 只运行兼容入口 `-Check`，不 Apply、commit 或 push；wrapper 随即委托 Node generator，stale gate
与完整 release gate 分离。

固定 workflow：`.github/workflows/ai-plugins-skill-registry-check.yml`。它必须保持：

- `pull_request` 与 `push: dev` 的 Skill roots、registry、`.ps1` wrapper、`.mjs` generator 和 workflow 自身 path filter。
- `permissions: contents: read`。
- Ubuntu 与 Windows 都执行同一 Node generator，验证 OS 不影响 canonical output。
- Node 版本固定为根 `package.json` 的最低 `engines.node` 版本；当前为 `22.14.0`。
- generator 只使用 Node 内置模块，因此 CI 不执行 `pnpm install`。
- 兼容入口继续以 PowerShell `-Check` 调用，确保 release 主脚本现有接缝也被覆盖。
- 不包含 `-Apply` / `--apply`、`git commit` 或 `git push`。

普通 Skill body/version/reference/template/example 变化不要求修改 workflow；只有 generator 路径、CLI、
扫描 roots、schema、Node 最低版本、权限或触发范围变化时才同步修改。release 主脚本继续校验既有的
wrapper / `-Check` / `contents: read` 核心契约；`.mjs` 路径由 workflow 本身显式监听，wrapper 在 Node
generator 缺失时也会失败。本次迁移不扩大 release 主脚本去解析 Node generator 的实现细节。

## CHANGELOG 示例

```markdown
## [5.0.0] - 2026-04-15

### Changed

- **init-release-base-relizy-and-bumpp**：`metadata.version` `1.1.1` -> `2.0.0`。
- 根包 changelog 默认链路从 `conventional-changelog` 收口到 `changelogen`。
- `templates/bump.config.ts` 改为 `execute(newVersion)`。
- 根级 marketplace 与九个 `plugin.json` 的版本统一至 `5.0.0`。
```

禁止把上述多个变化压缩成一条包含多个分号的长 bullet。

## Codex 字段矩阵

`marketplace.json`：

- 三个插件的 `name` 必须是 `common-tools`、`dev-skills` 和 `low-frequency-skill`。
- `source.source` 必须为 `local`。
- `source.path` 必须分别为 `./ai-plugins/common-tools`、`./ai-plugins/dev-skills` 和 `./ai-plugins/low-frequency-skill`。
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
codex plugin add low-frequency-skill@ruan-cat-tools --json
codex plugin remove common-tools@ruan-cat-tools --json
codex plugin remove dev-skills@ruan-cat-tools --json
codex plugin remove low-frequency-skill@ruan-cat-tools --json
codex plugin marketplace remove ruan-cat-tools --json
```
