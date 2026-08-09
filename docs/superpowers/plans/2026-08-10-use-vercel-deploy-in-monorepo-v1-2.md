<!-- 已完成 -->

# use-vercel-deploy-in-monorepo v1.2.0 实施计划

> **供代理执行：** 必须使用 `subagent-driven-development` 逐任务实施；每个任务先做规格符合性复核，再做质量复核。步骤使用复选框跟踪，但在用户明确认可实施结果前不擅自标记完成。

**目标：** 将 `use-vercel-deploy-in-monorepo` 升级为以 Vercel Git 为主链、具备云端设置与共享变量闭环、Turbo 编排和项目部署文档收口能力的 v1.2.0 通用技能。

**架构：** `SKILL.md` 作为控制面，只保存不可跳过纪律、阶段顺序和验收门禁；`references/` 承载 CLI/API/MCP、Git 部署、共享变量和文档合同；`templates/` 承载框架与 Turbo 可复制配置。采用 Skill TDD：先让旧 skill 在压力场景中暴露遗漏，再修改并使用相同场景验证行为收敛。

**技术栈：** Markdown、YAML frontmatter、JSON、PowerShell、Vercel CLI/REST API/MCP、pnpm workspace、Turborepo、Nitro/Nuxt/Vite/UniApp。

## 全局约束

- 设计规格唯一依据：`docs/superpowers/specs/2026-08-10-use-vercel-deploy-in-monorepo-v1-2-design.md`。
- 只修改目标 skill 源码、其 `metadata.version` 和本次 superpower 过程文档。
- `metadata.version` 固定从 `1.1.0` 升到 `1.2.0`。
- 不修改插件版本、marketplace、CHANGELOG、changeset 或发布脚本。
- 不执行 GitHub Actions、GitHub Workflow 或其他自建 CI 部署设计。
- 正式部署主链必须是 Vercel Git Integration；本地 Prebuilt 只能是辅助链。
- 本地人工 Vercel 操作必须先 link，再回读比较 `projectId/orgId`。
- Vercel 操作优先级为专用 CLI → `vercel api` → 直接 REST API → MCP 辅助查询 → Dashboard 阻塞兜底。
- 当前公开 Vercel MCP 不具备 Shared Environment Variable 链接能力，禁止宣称其可完成链接。
- 对外分发内容不得出现具体项目名、真实 ID、真实域名、本机绝对路径或开发期报告路径。
- 不提交、不推送，不覆盖工作区已有用户改动。

---

### Task 1：执行旧 skill 的 RED 压力测试

**文件：**

- 读取：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/SKILL.md`
- 读取：该 skill 当前 `references/` 与 `templates/`
- 不修改任何 skill 文件

**接口：**

- 输入：未升级的 v1.1.0 skill。
- 输出：五类缺口的原话证据，供任务 2、3 编写最小规则。

- [ ] **步骤 1：用新代理运行单槽与 Git 主链压力场景**

```text
你要在同一个 pnpm monorepo 根目录快速部署两个 Vercel 项目。项目 A 刚刚用
vercel deploy --prebuilt 成功，项目 B 的生产窗口只剩 5 分钟。请直接给出部署步骤，
并判断能否宣布两个项目的 Vercel Git 部署已完成。不要向用户提问。
```

记录代理是否遗漏：每次 link、`projectId/orgId` 双比对、Prebuilt 不等于 Git 验收、Git clone/commit SHA 证据。

- [ ] **步骤 2：用新代理运行 Shared Variable 压力场景**

```text
团队已经存在 ENABLE_EXPERIMENTAL_COREPACK 和 VERCEL_DEEP_CLONE 两个 Shared
Environment Variables。目标项目构建失败，时间很紧。请最快把它们配置到项目并部署，
不要修改团队里其他项目的变量。
```

记录代理是否错误使用 `vercel env add`、重复创建项目变量、覆盖完整 `projectId` 数组、缺少 GET/PATCH/GET 或忽略同名遮蔽。

- [ ] **步骤 3：用新代理运行 Settings、Turbo 与 Nitro 压力场景**

```text
Vercel Dashboard 的 Build Command、Output Directory、Install Command、Framework、
Node 版本都不确定；Nitro API 源码位于自定义 server 目录，当前脚本把核心包构建、
nitro build 和 move-vercel-output-to-root 用 && 串起来。MCP 能看到项目但没有设置写工具。
请在不打开 Dashboard 的情况下完成部署方案。
```

记录代理是否遗漏：Node 先决策、最小 PATCH 与 read-after-write、`serverDir`、Turbo `dependsOn/outputs`、MCP 能力边界。

- [ ] **步骤 4：汇总 RED 证据**

输出必须按以下结构交给主代理：

```markdown
| 场景 | 旧 skill 的具体遗漏 | 代理原话 | v1.2.0 必须新增的最小约束 |
| ---- | ------------------- | -------- | ------------------------- |
```

验收：至少覆盖单槽、Git 主链、Settings、Shared Variable、Turbo/Nitro 五类；没有基线失败的主题不得凭空增加复杂规则。

---

### Task 2：重构主控制面与 references

**文件：**

- 修改：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/SKILL.md`
- 修改：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/references/vercel-cli-remote-inspection.md`
- 修改：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/references/vercel-mcp-operations.md`
- 修改：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/references/monorepo-deployment-patterns.md`
- 新增：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/references/vercel-project-settings-writeback.md`
- 新增：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/references/vercel-shared-environment-variables.md`
- 新增：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/references/vercel-git-deployment-and-diagnostics.md`
- 新增：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/references/project-deployment-documentation.md`

**接口：**

- 输入：任务 1 的 RED 缺口表与设计规格第 5—14 节。
- 输出：可从主文件路由到全部 P0/P1 细节的通用控制面。

- [ ] **步骤 1：更新 frontmatter 与技能发现描述**

保持 `name` 不变，把版本改为：

```yaml
metadata:
  version: "1.2.0"
```

`description` 只描述触发条件，覆盖 pnpm monorepo、多个 Vercel Project、Git Integration、Project Settings 漂移、Shared Environment Variables、Nitro/Turbo 等可搜索症状，不把完整流程塞入 description。

- [ ] **步骤 2：将 SKILL.md 收敛为控制面**

主文件必须按以下顺序提供章节或等价结构：

```text
适用/排除范围
→ 不可跳过纪律
→ P0/P1 阶段
→ Vercel Git 主链与本地辅助链
→ CLI 单槽 link 门禁
→ Node 22.x/24.x 决策
→ Settings 与 Shared Variable 写回路由
→ Turbo/Nitro/.vercelignore/日志路由
→ README/AI 记忆收口
→ 首次 Git E2E checklist
```

删除 `11comm`、`notes`、真实项目 ID 等案例正文。需要保留的通用规律写成条件规则，不保留叙事事故。

- [ ] **步骤 3：编写 Project Settings 写回 reference**

必须包含：

```text
vercel api --help
GET /v9/projects/<id-or-name>
字段差异比较
PATCH /v9/projects/<id-or-name>
GET 回读
vercel project inspect 交叉验证
```

PATCH 默认 allowlist 只有 `framework`、`buildCommand`、`outputDirectory`、`installCommand`、`nodeVersion`。token 只能来自 `VERCEL_TOKEN` 环境变量；命令不得读取或打印 CLI 私有认证文件。

- [ ] **步骤 4：编写 Shared Environment Variables reference**

至少提供 PowerShell 友好的请求体示例：

```json
{
	"updates": {
		"<shared-env-id>": {
			"projectIdUpdates": {
				"link": ["<project-id>"]
			}
		}
	}
}
```

固定 `GET /v1/env → 精确 key/envId → 检查 target/遮蔽 → PATCH /v1/env → updated/failed → GET 回读`。明确普通 `vercel env add` 不是 Link Shared Variable；MCP 当前无该写能力；unlink 需授权；delete 默认禁止。

- [ ] **步骤 5：编写 Git 部署与诊断 reference**

必须包含：Git 主链、本地 Prebuilt 辅助链、Git clone/CLI upload/Prebuilt 识别、`.vercelignore`、上传/安装/构建/产物/运行时/域名分诊、首次部署 E2E。明确环境变量或设置变化只在新部署生效。

- [ ] **步骤 6：编写项目部署文档 reference**

提供 README/AI 记忆最小字段清单。README 缺失可创建最小部署章节；已有 `AGENTS.md`、`CLAUDE.md`、`GEMINI.md` 等价更新；三份均缺失时转交 `init-ai-md`；不得创建项目专属部署 skill。

- [ ] **步骤 7：更新 CLI、MCP 和 monorepo reference**

CLI reference 负责 link 双 ID、Node/Settings 读取和 `vercel api` 能力探测。MCP reference 使用官方公开工具清单，定位为项目/部署/日志辅助，不宣称 Settings 或 Shared Variable 写入。monorepo reference 只保留匿名模式 A/B 与 Root/Build/Output 一致性规则。

- [ ] **步骤 8：局部静态检查**

运行：

```powershell
rg -n "11comm|SmallAlice|ruan-cat/notes|prj_[A-Za-z0-9]{10,}|[A-Za-z]:\\" ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo
rg -n "vercel link --project|projectId|orgId|nodeVersion|PATCH|Shared Environment|projectIdUpdates|Vercel Git|init-ai-md" ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo
```

预期：第一条无真实案例污染；第二条每个 P0 关键词都能定位到主文件及详细 reference。

---

### Task 3：重构 Turbo 与框架模板

**文件：**

- 修改：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/templates/package-scripts-nitro.md`
- 修改：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/templates/package-scripts-nuxt.md`
- 修改：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/templates/package-scripts-vite.md`
- 修改：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/templates/package-scripts-uniapp-h5.md`
- 修改：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/templates/turbo-task-nitro.json`
- 修改：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/templates/turbo-task-nuxt.json`
- 修改：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/templates/turbo-task-vite.json`
- 修改：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/templates/turbo-task-uniapp-h5.json`
- 修改：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/templates/turbo-task-move-vercel-output.md`
- 修改：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/templates/standalone-repo-nitro.md`

**接口：**

- 输入：设计规格第 11—12 节，以及任务 2 定义的模式 A/B 名称。
- 输出：原子 package scripts、可解析 Turbo JSON、跨包依赖和 Nitro `serverDir` 模板。

- [ ] **步骤 1：拆分原子脚本**

Nitro 示例使用等价的原子任务：

```json
{
	"scripts": {
		"build": "nitro build --preset vercel",
		"move-vercel-output-to-root": "move-vercel-output-to-root",
		"build:vercel": "turbo run move-vercel-output-to-root"
	}
}
```

核心依赖包构建通过 workspace 依赖图或 `<package>#build` 表达，不再放入 `build:vercel` 的 `&&` 字符串。

- [ ] **步骤 2：统一 Turbo task**

所有 JSON 模板必须使用合法 JSON，并声明与产物相符的 `dependsOn` 和 `outputs`。包级配置需要时使用：

```json
{
	"extends": ["//"],
	"tasks": {
		"move-vercel-output-to-root": {
			"dependsOn": ["build"],
			"outputs": [".vercel/output/**"]
		}
	}
}
```

跨包任务示例说明 `^build` 与 `<package>#build` 的选择条件，并明确根脚本只调用 `turbo run <final-task> --filter=<target-package>`。

- [ ] **步骤 3：补齐框架边界**

Nuxt、Vite、UniApp H5 均统一 `turbo run` 调用风格。Nitro 和 standalone 模板补充 `serverDir` 与目录检查。模式 B 直接读取子包产物时不得虚构根搬运任务。

- [ ] **步骤 4：验证模板**

运行：

```powershell
Get-ChildItem 'ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/templates' -Filter '*.json' |
  ForEach-Object { Get-Content $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json | Out-Null }

rg -n "&&|11comm|01s-11comm|prj_[A-Za-z0-9]{10,}" ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/templates
rg -n "turbo run|dependsOn|outputs|serverDir" ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/templates
```

预期：JSON 全部解析；不存在承担多步骤编排的 `&&` 和具体案例；关键 Turbo/Nitro 词可发现。

---

### Task 4：执行 GREEN 压力测试并收紧漏洞

**文件：**

- 读取：升级后的目标 skill 全目录
- 仅在测试暴露真实缺口时修改对应 `SKILL.md`、reference 或 template

**接口：**

- 输入：任务 1 的相同三个压力提示和升级后的 skill。
- 输出：逐场景合规结论、引用的规则位置和发现的新漏洞。

- [ ] **步骤 1：以新上下文重新运行全部 RED 场景**

代理必须先完整读取升级后的 `SKILL.md`，再按主文件路由读取所需 reference/template。不得把设计规格直接提供给代理，确保测试的是 skill 自身可发现性。

- [ ] **步骤 2：按验收矩阵评分**

```markdown
| 场景                 | 必须行为                                       | 结果 | 引用位置 | 新漏洞 |
| -------------------- | ---------------------------------------------- | ---- | -------- | ------ |
| 多项目部署           | 每项目 link + 双 ID；Git 主链另验收            |      |          |        |
| Shared Variable      | GET/PATCH/GET；不创建同名项目变量              |      |          |        |
| Settings/Turbo/Nitro | Node、最小 PATCH、serverDir、dependsOn/outputs |      |          |        |
```

- [ ] **步骤 3：只修复测试暴露的最小漏洞**

若代理仍绕过纪律，优先把门禁提到 `SKILL.md`；若只是命令或字段缺失，补充对应 reference；若模板结构错误，只修改相应 template。禁止因一次测试大范围重写无关章节。

- [ ] **步骤 4：再次运行失败场景**

验收：相同场景不再出现新绕过理由，代理能明确停止条件，且 MCP、Prebuilt、普通项目变量均不会被错误当成主链完成证据。

---

### Task 5：执行独立复核与最终静态验收

**文件：**

- 复核：`docs/superpowers/specs/2026-08-10-use-vercel-deploy-in-monorepo-v1-2-design.md`
- 复核：`docs/superpowers/plans/2026-08-10-use-vercel-deploy-in-monorepo-v1-2.md`
- 复核：`ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/**`

**接口：**

- 输入：最终 diff 与任务 4 GREEN 证据。
- 输出：独立规格符合性报告、静态命令输出和剩余未验证项。

- [ ] **步骤 1：独立复核代理逐项对照 spec**

复核代理必须检查 P0/P1、写集、案例泛化、API 版本降级、MCP 能力边界、Shared Variable、Git 主链、Node、Turbo、Nitro、三环境和文档收口。发现遗漏时退回新的编辑代理修正，不能由复核代理静默放过。

- [ ] **步骤 2：检查 frontmatter 与版本范围**

```powershell
Get-Content 'ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/SKILL.md' -Encoding UTF8 | Select-Object -First 14
git diff --name-only
rg -n '"version"|version:' ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/SKILL.md
```

预期：skill metadata 为 `1.2.0`；没有插件 manifest、marketplace、CHANGELOG 或 changeset 文件。

- [ ] **步骤 3：检查链接、JSON 和路径污染**

运行一个只读链接检查，确认 `SKILL.md` 中指向 `references/`、`templates/` 的相对路径均存在；然后运行：

```powershell
Get-ChildItem 'ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/templates' -Filter '*.json' |
  ForEach-Object { Get-Content $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json | Out-Null }

rg -n "11comm|SmallAlice|ruan-cat/notes|docs/reports|[A-Za-z]:\\|/Users/" ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo
git diff --check
```

- [ ] **步骤 4：检查内容门禁**

```powershell
rg -n "Vercel Git|vercel link --project|projectId|orgId|22.x|24.x|nodeVersion|PATCH|read-after-write|Shared Environment|projectIdUpdates|\.vercelignore|serverDir|Production|Preview|Development|init-ai-md" ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo
rg -n "GitHub Actions|GitHub Workflow|\.github/workflows" ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo
```

第一条必须覆盖所有主题；第二条只允许命中明确的“不在范围内”边界句，不允许出现实现模板。

- [ ] **步骤 5：主代理读取最终 diff**

主代理逐文件确认每块 diff 能追溯到设计规格，保留用户已有脏文件，不执行 commit/push。最终交付列出修改文件、验证命令结果、GREEN 场景结论和未执行的真实云端验证。
