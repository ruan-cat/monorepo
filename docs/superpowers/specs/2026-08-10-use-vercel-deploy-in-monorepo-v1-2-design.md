<!-- 已完成 -->

# use-vercel-deploy-in-monorepo v1.2.0 设计规格

## 1. 背景

现有 `use-vercel-deploy-in-monorepo` 已覆盖部署形态判断、`.vercel/output` 搬运、基础 Turbo 任务和部分远端检查，但没有把多项目 Vercel Git 部署的关键纪律形成完整闭环。事故报告与实际部署记录暴露了以下系统性缺口：

- 本地 `.vercel/project.json` 只能保存一个项目绑定，部署前仅“确认”不足以阻止部署到错误项目。
- 本地或 CLI 上传部署成功不能证明 Vercel Git Integration 构建成功，两者的源码上下文和 `.git` 可用性不同。
- Project Settings 只有读取校验，没有 REST API 写回与 read-after-write。
- Node.js 版本、三套环境变量、共享环境变量链接、`.vercelignore`、Nitro `serverDir` 和首次部署 E2E 没有统一门禁。
- 现有 Turbo 模板只覆盖部分叶子任务，仍存在用 `&&` 承担跨包构建和产物搬运编排的示例。
- 目标项目 README 与 AI 记忆没有强制收口流程，部署知识仍依赖具体模型临场发挥。

本次升级将上述事故能力提炼为通用 skill，不复制具体仓库、项目名、项目 ID、域名或本机路径。

## 2. 目标

将目标 skill 的 `metadata.version` 从 `1.1.0` 升级到 `1.2.0`，形成以下可复用能力：

1. 以 Vercel Git Integration 为正式交付主链，以本地 Prebuilt 为辅助诊断链。
2. 对本地人工操作强制执行显式 link 与 `projectId/orgId` 回读比对。
3. 在设计构建方案前确定 Node 22.x 或 24.x，并与远端设置保持一致。
4. 通过 `vercel api` 或 REST API 更新 Project Settings，并执行写后回读。
5. 发现、链接和回读团队 Shared Environment Variables，避免创建同名项目变量冒充链接。
6. 使用 Turbo 表达跨包构建、框架构建和根产物搬运依赖。
7. 覆盖三环境变量、`.vercelignore`、日志分诊、Nitro `serverDir` 和首次部署 E2E。
8. 在目标项目 README 与已有 AI 记忆中收口最小 Vercel 部署事实。

## 3. 非目标

- 不设计 GitHub Actions、GitHub Workflow 或其他自建 CI 部署流程。
- 不发布插件，不修改插件版本、marketplace、CHANGELOG、changeset 或发布脚本。
- 不在本次仓库修改中操作任何真实 Vercel 云项目。
- 不为目标项目创建额外的项目专属部署 skill。
- 不在三份 AI 记忆均缺失时擅自生成整套记忆结构；此时只转交 `init-ai-md`。
- 不把 Node 22.x 固化为唯一版本，也不把 Node 24.x 无条件设为默认版本。
- 不把 MCP 配置存在等同于 MCP 已就绪或具备写入能力。

## 4. 总体架构

采用“主 skill 控制流程，references/templates 承载细节”的方案：

- `SKILL.md`：只保存适用范围、不可跳过纪律、阶段顺序、能力路由和验收门禁。
- `references/`：保存 CLI/API 命令、版本降级链、共享变量流程、Git 部署诊断树和项目文档收口合同。
- `templates/`：保存框架脚本、Turbo 任务和 Nitro 配置的可复制模板。

主文件不堆积大段命令与案例，细节必须通过相对路径可发现。所有分发内容从技能安装目录视角书写，不出现 monorepo 源码路径或本机绝对路径。

## 5. 优先级与阶段顺序

### 5.1 P0 不可跳过门禁

1. 侦察部署形态、目标 Vercel 项目、Git 仓库和生产分支。
2. 确认正式交付链为 Vercel Git Integration。
3. 确定 Node 22.x/24.x。
4. 本地人工操作执行 `vercel link --project <project-name> --yes`，回读并比对 `projectId/orgId`。
5. GET Project Settings，计算差异，最小 PATCH，GET/inspect 回读。
6. 审计普通项目环境变量与 Shared Environment Variables；补齐缺失链接并回读。
7. 本地构建和 Prebuilt 仅作为辅助验证。
8. 通过 Git push 触发正式部署，按 commit SHA、构建日志、状态和域名完成 E2E。
9. 更新目标 README 与已有 AI 记忆。

### 5.2 P1 交付质量门禁

- 检查 `.vercelignore` 和上传体积风险。
- 按上传、安装、构建、产物、运行时和域名分层诊断日志。
- 检查 Nitro `serverDir` 与实际源码目录一致。
- 检查 Turbo `dependsOn`、`outputs` 和跨包依赖。
- 验证 Production、Preview、Development 三个环境范围。
- 保存首次部署逐项证据，不允许只有勾选结果。

## 6. 两条部署链

### 6.1 正式主链：Vercel Git Integration

正式验收顺序：

```text
Git push
→ Vercel 克隆目标仓库和 commit
→ Install Command
→ Build Command
→ Output Directory
→ Deployment READY
→ 生产或预览域名冒烟
```

完成证据必须包含：

- Git 仓库、分支和 Root Directory 正确。
- 部署 metadata 或日志能够关联目标 commit SHA。
- 日志体现 Git clone，而不是 CLI 文件上传。
- Install、Build、Output、Runtime、Domain 各层均有验证结果。
- 环境变量或设置变更发生后产生了新的 Git 部署。

### 6.2 辅助链：本地人工 Prebuilt

本地链只用于：

- 验证本地构建和 `.vercel/output`。
- 区分代码/产物问题与 Vercel Git 云端环境问题。
- 在明确目标后执行应急 Prebuilt 部署。

本地成功后必须明确记录：

> 本地人工部署成功不等于 Vercel Git 部署成功，不能关闭 Git 主链验收项。

直接 `vercel deploy` 上传文件与 Git clone 的 `.git` 上下文可能不同。使用 `git log`、`git config --local`、changelog 或提交历史的构建逻辑必须在 Git 主链验证；若还需兼容上传链，则项目代码必须显式提供无 `.git` 降级。

## 7. 本地单槽绑定纪律

交互式、本地人工部署固定执行：

```powershell
vercel link --project <project-name> --yes
```

随后读取 `.vercel/project.json` 并同时比较：

- `projectId` 是否等于目标云项目 ID。
- `orgId` 是否等于目标团队 ID。

任一字段缺失或不一致都必须停止。重新 link 改写 `.vercel/project.json` 是单槽切换的预期副作用；技能不得宣称一个目录能同时保存多个本地 project link。

由于本技能不覆盖自建 CI，所以不提供通过 `VERCEL_PROJECT_ID` 绕过该人工门禁的 CI 例外。

## 8. Node 版本决策

Node 选择必须发生在构建命令、Turbo 编排和远端设置设计之前。候选范围为当前 Vercel 支持且用户要求考虑的 22.x 与 24.x，决策依据包括：

- 根和目标包 `package.json#engines.node`。
- `.nvmrc`、`.node-version`、`packageManager` 和 pnpm 版本。
- 框架、原生依赖和构建工具的兼容要求。
- 远端 `nodeVersion` 当前值。
- Vercel 当前官方支持列表。

若只有一个候选满足全部约束则选择该版本；若两个都满足则遵循仓库已有基线；证据不足时不得拍脑袋升级。最终选择、理由和远端值必须写入项目部署文档。

## 9. Project Settings 写回

期望字段：

- `framework`
- `buildCommand`
- `outputDirectory`
- `installCommand`
- `nodeVersion`

固定闭环：

```text
GET 当前项目
→ 计算字段级差异
→ PATCH 仅发送需要变化的允许字段
→ GET 回读
→ vercel project inspect 交叉验证
```

Root Directory 是部署拓扑核心输入，但不纳入默认自动 PATCH；修改它需要调用者明确授权并重新评估全部命令和产物路径。

工具优先级：

1. Vercel CLI 专用命令用于 link、inspect、部署和日志。
2. `vercel api` 用于 CLI 没有专用写命令的 REST API。
3. 直接 REST API 使用会话环境变量中的 `VERCEL_TOKEN` 降级。
4. Vercel MCP 用于当前公开能力范围内的项目、部署和日志辅助检查。
5. 所有自动写路径不可用时，提供 Dashboard 人工路径并把任务标记为阻塞，禁止虚构成功。

`vercel api` 在执行时先通过 `vercel api --help` 探测；已知能力基线为 Vercel CLI 50.5.1。Project Settings 当前使用 `/v9/projects/<id-or-name>`。遇到 404、字段拒绝或 schema 漂移时，必须停止写入并重新查阅官方文档，不能猜测新版本。

## 10. 普通与共享环境变量

### 10.1 普通项目环境变量

Production、Preview、Development 必须分别审计。只记录 key、target、类型和存在状态，不打印 secret value。项目级变量的增删改优先使用 `vercel env`；写后通过列表或 pull 元数据验证，并在新部署中生效。

### 10.2 Shared Environment Variables

共享变量是团队级资源，链接项目不等于创建同名项目变量。固定流程：

```text
确认 teamId/projectId
→ GET /v1/env 查团队共享变量
→ 按 key 精确匹配并取得 envId
→ 检查 target、类型、当前 projectId
→ PATCH /v1/env 增量链接
→ 检查 updated/failed
→ GET /v1/env 按 envId/projectId 回读
→ 触发新的 Vercel Git 部署
```

最小链接请求：

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

约束：

- 只链接时不发送 key、value、target 或完整 `projectId` 数组。
- 同 key、同环境的项目级变量会遮蔽共享变量；发现冲突必须停止并报告。
- 共享变量不支持 branch-specific target，不能虚构分支级共享变量。
- 自动允许补齐已声明的缺失链接；unlink 必须得到明确授权；删除团队共享变量不属于默认范围。
- 环境变量变更不追溯到旧部署，必须用新的 Git 部署验收。

Vercel MCP 当前公开工具清单没有共享变量查询、链接和回读工具，因此不能作为共享变量写入链。MCP 只辅助取得 team/project 上下文以及检查后续部署和日志；未来只有运行时实际发现专用写工具并能回读时，才允许新增 MCP 路径。

常见项目约束示例：

- `ENABLE_EXPERIMENTAL_COREPACK=1`：当仓库通过 `packageManager` 固定 pnpm 且需要 Corepack 时，必须发现并验证其链接状态。
- `VERCEL_DEEP_CLONE=true`：仅在项目部署合同或事故证据声明需要完整 Git 历史时要求，不作为所有项目的通用默认值。

## 11. Turbo 编排

脚本与 Turbo 的职责边界：

- `package.json` 原子脚本只执行一个动作，例如核心包 build、Nitro build、产物搬运。
- 子包 `turbo.json` 使用 `extends: ["//"]` 并声明 `dependsOn`、`outputs`。
- 根任务通过 workspace 依赖图或显式 `<package>#<task>` 连接跨包任务。
- 根命令只负责 `turbo run <final-task> --filter=<target-package>`，不重复手写整个 `&&` 链。
- 避免根 `package.json` 脚本和根 Turbo task 同名互相递归。
- 独立仓库或真正的单步骤任务不强制使用 Turbo。

目标链应能表达：

```text
核心依赖包构建 → Nitro/Vite/Nuxt/UniApp 构建 → 搬运到根 .vercel/output
```

## 12. `.vercelignore` 与 Nitro

### 12.1 `.vercelignore`

Prebuilt 或 CLI 上传前检查仓库大目录、缓存和历史产物。规则至少考虑 `.turbo`、包级 `.vercel`、测试缓存、临时文件和与部署无关的大型资源，但不得排除 `.vercel/output` 或运行时所需文件。上传异常或体积失控时先诊断 ignore，而不是反复重试网络。

### 12.2 Nitro `serverDir`

当 Nitro 服务端源码不在框架默认位置时，必须显式检查 `serverDir` 与真实目录一致。构建成功但全部 API 404 应优先检查 `serverDir`、route manifest 和输出产物，而不是把“构建通过”当作运行时通过。

## 13. 日志分诊

诊断顺序：

1. 部署来源：Git clone、CLI upload 或 Prebuilt。
2. 上传阶段：体积、ignore、文件缺失。
3. 安装阶段：Node、Corepack、pnpm、lockfile、registry。
4. 构建阶段：命令、Turbo 依赖、框架错误。
5. 产物阶段：Output Directory、`.vercel/output`、搬运结果。
6. 运行时阶段：函数日志、Nitro 路由、环境变量。
7. 域名阶段：alias、production domain 和 HTTP 冒烟。

CLI 是首选证据源；Vercel MCP 当前可用于 `get_project`、部署列表、构建日志和运行时日志等辅助查询。MCP 未 ready 或缺少工具时直接使用 CLI/API，不把工具不可用误判为项目不存在。

## 14. 项目文档收口

技能必须发现目标项目中的：

- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `GEMINI.md`

收口规则：

- README 已存在：更新或新增最小 Vercel 部署章节。
- README 缺失：可以创建只包含最小部署信息的 README/章节。
- AI 记忆文件存在：等价更新所有已存在文件，避免内容漂移。
- 三份 AI 记忆均缺失：转交 `init-ai-md`；本技能不创建整套 AI 记忆结构。
- 不创建项目专属部署 skill。

最小记录字段：项目名、用途、Git 主链、生产分支、Root Directory、Framework、Node、Build/Install/Output、共享变量 key 与 target、单槽 link 纪律、生产 URL、最后一次 Git E2E 状态。禁止记录 token、secret value 或本机私有路径。

## 15. 文件级写集

### 15.1 修改

- `ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo/SKILL.md`
- `references/vercel-cli-remote-inspection.md`
- `references/vercel-mcp-operations.md`
- `references/monorepo-deployment-patterns.md`
- `templates/package-scripts-nitro.md`
- `templates/package-scripts-nuxt.md`
- `templates/package-scripts-vite.md`
- `templates/package-scripts-uniapp-h5.md`
- `templates/turbo-task-nitro.json`
- `templates/turbo-task-nuxt.json`
- `templates/turbo-task-vite.json`
- `templates/turbo-task-uniapp-h5.json`
- `templates/turbo-task-move-vercel-output.md`
- `templates/standalone-repo-nitro.md`

### 15.2 新增

- `references/vercel-project-settings-writeback.md`
- `references/vercel-shared-environment-variables.md`
- `references/vercel-git-deployment-and-diagnostics.md`
- `references/project-deployment-documentation.md`

如审查发现某个模板无需语义变更，可以不制造无意义 diff，但必须完成对应验收扫描。

## 16. Skill TDD 测试策略

修改前用未升级 skill 对新代理运行 RED 场景并记录原话：

1. 两个 Vercel 项目共享根目录，要求快速部署，观察是否跳过强制 link 与双 ID 回读。
2. 本地 Prebuilt 已成功且时间紧，观察是否错误宣布 Git Integration 已验收。
3. 项目需要团队 Shared Variable，观察是否用 `vercel env add` 创建同名项目变量冒充链接。
4. Dashboard 设置缺失且 MCP 可用，观察是否只读不写、猜测 API 或缺少 read-after-write。
5. Nitro 跨包构建使用长 `&&`，观察是否继续复制脚本而不设计 Turbo 依赖。

修改后对相同场景运行 GREEN：代理必须引用新 skill/reference，给出正确阶段、停止条件和验证证据。若出现新漏洞，补充最小规则后重新测试。

## 17. 验收标准

### 17.1 内容验收

- `metadata.version` 为 `1.2.0`，其他插件发布版本均未修改。
- `SKILL.md` 明确 Git 主链、本地辅助链、单槽绑定、Node 决策、Settings PATCH、共享变量、Turbo 和文档收口。
- P0/P1 所有主题均可从主文件路由到具体 reference/template。
- Vercel MCP 能力矩阵与官方公开工具一致，不宣称它能链接共享变量。
- 示例无具体项目名、ID、域名、事故统计或本机绝对路径。

### 17.2 静态验收

- 所有相对 Markdown 链接存在。
- 所有 JSON 模板可以解析。
- frontmatter 可以读取，name/description/version 合法。
- 无承担多步骤编排的 `&&` 示例。
- 无 GitHub Workflow 部署模板。
- `git diff --check` 通过。
- `rg` 路径污染扫描逐项审查。

### 17.3 行为验收

- RED 场景能复现旧 skill 的遗漏。
- GREEN 场景能稳定得到 link 双 ID、Git 主链、最小 PATCH、共享变量真实链接、Turbo 编排和文档收口结论。
- 独立复核代理逐项对照本 spec，无 P0/P1 漏项。
- 主代理读取最终 diff 并确认只触碰允许写集与 superpower 过程文档。

## 18. 风险与降级

- Vercel API/CLI/MCP 均为时效性能力：reference 必须记录能力探测，不把当前版本写成永恒事实。
- API 写入具有真实云端副作用：技能要求目标 team/project/字段差异明确后再写，失败即停止，不做盲目重试。
- Shared Variable 是团队资源：默认只增量 link，不修改 value/target，不自动 unlink/delete。
- Git push 是外部状态变更：技能只有在用户明确授权提交与推送时才执行；否则停在可复核的本地准备状态。
- 具体事故知识从对外 skill 泛化移除时，原始报告和项目局部事故记录继续承担保留职责。

## 19. 参考依据

- Vercel CLI API：<https://vercel.com/changelog/introducing-the-vercel-api-cli-command>
- Vercel REST API：<https://vercel.com/docs/rest-api>
- Vercel MCP 工具：<https://vercel.com/docs/agent-resources/vercel-mcp/tools>
- Vercel Shared Environment Variables：<https://vercel.com/docs/environment-variables/shared-environment-variables>
- Vercel Node.js 版本：<https://vercel.com/docs/functions/runtimes/node-js/node-js-versions>
- Turborepo package configurations：<https://turborepo.dev/docs/reference/package-configurations>
