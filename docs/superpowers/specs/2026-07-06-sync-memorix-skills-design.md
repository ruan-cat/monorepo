# 2026-07-06 sync-local-global-agents-skills 增加 memorix 内部 skills 同步能力

## 1. 概述

让 `sync-local-global-agents-skills` 技能在把全局 skills（`~/.agents/skills`）同步到其他本地 agent 平台之前，先把 **memorix 官方内部 skills** 刷新到 `~/.agents/skills/` 目录。这样其他 AI agent 工具（WorkBuddy、QoderWork、Kimi Work 等）通过符号链接即可共享 memorix 官方 skills，避免 skills 重复或版本滞后。

## 2. 调研结论

### 2.1 memorix 内部 skills 的来源

- **GitHub 官方仓库**：`AVIDS2/memorix` 的 `plugins/<agent>/memorix/skills/` 是最权威的分发源。鉴于 skill 附属脚本的自包含性要求（零外部 npm 依赖），GitHub raw 是首选来源。但需注意：实测 `main` 分支与最新 release tag `v1.1.5` 的静态 skill 文件在 `memorix-memory`、`memorix-orchestrate` 两个 skill 上**落后于本机已安装版本**（本地多出一些内容行）。因此本地已安装版本仍可作为回退源。
- **npm 官方包 `memorix@1.1.5`**：作为补充参考，其内容与 GitHub release tag 完全一致，已通过 SHA 对比验证。仅在设计文档中记录此信息，附属脚本不实现 npm 下载（避免引入 tar 等外部依赖）。
- **memorix CLI**：`memorix skills show --name <skill> --json` 可输出单个 skill 的完整 markdown 内容，返回字段包含 `sourcePath`、`sourceAgent`、`content`、`generated`。`memorix skills` 没有 `list` 子命令，但支持 `show` 和 `write`；其中 `show` 读取的是当前已激活 agent 的本地 skill 文件，因此 CLI 本身并不能直接“批量导出”内部预写 skills，只能作为单文件内容校验或兜底。
- **本地已安装插件 / 暴露目录**（按可靠性与刷新程度排序）：
  1. `~/.cursor/skills/` — 全局 skills 视角下 memorix 内部 skills 的当前暴露位置（`skills list -g` 显示为 `~\.cursor\skills\memorix-*`）。
  2. `~/.codex/plugins/memorix/skills/` — Codex 插件安装目录。
  3. `~/.claude/plugins/marketplaces/memorix-local/plugins/memorix/skills/` — Claude Code 本地 marketplace 插件（对应 marketplace 版本 1.1.4，插件版本 1.1.0）。
  4. `~/.claude/plugins/cache/memorix-local/memorix/<version>/skills/` — Claude Code 插件缓存（当前版本 1.1.0）。
  5. `~/.codex/plugins/cache/personal/memorix/<version>/skills/` — Codex 插件缓存（当前版本 1.1.0）。
- **GitHub 官方仓库**：`AVIDS2/memorix` 的 `plugins/<agent>/memorix/skills/`。这是首选来源，因为 raw 文件基于 HTTPS、零 npm 依赖。但需注意：实测 `main` 分支与最新 release tag `v1.1.5` 的静态 skill 文件在 `memorix-memory`、`memorix-orchestrate` 两个 skill 上**落后于本机已安装版本**（本地多出一些内容行）。因此本地已安装版本作为重要的回退源。
- **Skills 数量**：7 个（不是 8 个）：
  - `memorix-git-memory`
  - `memorix-memory`
  - `memorix-mini-skills`
  - `memorix-orchestrate`
  - `memorix-reasoning`
  - `memorix-sessions`
  - `memorix-troubleshooting`

### 2.2 当前 sync-local-global-agents-skills 的行为

- 以 `~/.agents/skills` 为唯一数据源。
- 将数据源作为**目录级符号链接**同步到各平台 skills 目录。
- 支持 dry-run、backup、错误链接修复。
- 由于采用目录级符号链接，无法把多个来源合并到同一目标；因此必须先把 memorix skills 物理补充到 `~/.agents/skills/`，再统一同步。

## 3. 设计目标

1. **自动化**：运行一次 `scripts/sync.ts` 即可完成 memorix skills 刷新 + 平台同步。
2. **最新优先**：默认从 GitHub release tag raw 文件获取最新 skills；GitHub 不可用时按本地已安装插件目录链回退；必要时再回退到 memorix CLI `skills show` 作为内容校验/兜底。
3. **零外部依赖**：skill 附属脚本在用户机器上通过 `tsx` 直接运行，**不依赖任何外部 npm 包**。所有实现使用 Node.js 22 内置模块（`node:fs`、`node:path`、`node:https`、`node:crypto`、`node:child_process`、`node:os`、`node:zlib`）。
4. **安全**：默认启用 dry-run 感知、备份、跳过已存在目录等保护机制。
5. **兼容**：保持现有平台同步逻辑不变，只新增前置刷新步骤。
6. **可测试**：新增独立测试覆盖刷新逻辑。

## 4. 方案设计

### 4.1 新增模块与脚本

```text
ai-plugins/common-tools/skills/sync-local-global-agents-skills/
  scripts/
    sync.ts                    # 现有 CLI 入口，新增 --skip-memorix-refresh 等参数
    fetch-memorix-skills.ts    # 新增：专用于刷新 memorix skills 的 CLI 脚本
  src/
    platforms.ts               # 平台注册表（不变）
    sync.ts                    # 目录级符号链接同步逻辑（不变）
    memorix.ts                 # 新增：memorix skills 获取、解析、落盘逻辑
    args.ts                    # 新增（可选）：抽离公共参数解析
  fallback/
    sync.ps1                   # 同步新增参数与本地多源扫描逻辑
    sync.sh                    # 同步新增参数与本地多源扫描逻辑
  README.md / SKILL.md         # 更新使用说明
```

### 4.2 `src/memorix.ts` 核心职责

- **定义数据来源**（可配置，优先级从高到低）：
  1. **GitHub 官方仓库**：`https://raw.githubusercontent.com/AVIDS2/memorix/<ref>/plugins/<agent>/memorix/skills/...`，默认 ref 为最新 release tag（当前 `v1.1.5`），可配置为 `main` 或其他 tag。这是首选来源，因为 GitHub 是 memorize 的权威发布渠道，且基于 HTTPS 实现零 npm 依赖。
  2. **本地已安装插件目录**：按以下顺序扫描，选择存在且包含最多 `memorix-*` skill 目录、或修改时间最新的来源：
     - `~/.cursor/skills/`
     - `~/.codex/plugins/memorix/skills/`
     - `~/.claude/plugins/marketplaces/memorix-local/plugins/memorix/skills/`
     - `~/.claude/plugins/cache/memorix-local/memorix/*/skills/`
     - `~/.codex/plugins/cache/personal/memorix/*/skills/`
     - 使用 `node:fs` + 手动递归实现目录扫描，**零外部依赖**。
  3. **memorix CLI `skills show`**：当需要从 CLI 获取当前运行时认为最新的 `SKILL.md` 内容时，通过 `node:child_process.execSync` 执行 `memorix skills show --name <skill> --json` 提取 `content` 字段。
- **源选择与合并策略**：
  - 默认 `auto`：先尝试 GitHub；GitHub 失败则扫描本地目录；本地无可用内容则回退 CLI。
  - `--source github` / `--source local` / `--source cli`：固定使用单一来源。
  - 本地扫描时，如果多个来源存在同一 skill，按文件修改时间最新优先。
- **GitHub 访问实现（纯 `node:https`）**：
  - 使用 Node.js 内置 `node:https.get` 发起请求，设置 User-Agent 和 Accept 头。
  - 读取 `GITHUB_TOKEN` 环境变量进行认证，将 rate limit 从 60 次/小时提升到 5000 次/小时。
  - 读取 `GITHUB_RAW_MIRROR` 环境变量作为 `raw.githubusercontent.com` 的镜像回退，缓解中国大陆网络抖动。
  - 设置请求超时 15 秒，捕获网络错误。
  - 先通过 GitHub Content API 列目录（`https://api.github.com/repos/AVIDS2/memorix/contents/plugins/<agent>/memorix/skills?ref=<ref>`），再逐个通过 raw URL 下载文件。
- **获取 skill 文件**：
  - GitHub 源：递归下载整个 skill 目录（API 列目录 → raw 下载每个文件）。
  - 本地源：用 `node:fs.cpSync` 递归复制整个 skill 目录。
  - CLI 源：只获取 `SKILL.md` 内容，附属文件从本地源补充。
  - 校验 HTTP 状态码为 200；非 200 不写入。
- **落盘到 ~/.agents/skills/**：
  - 目标路径：`~/.agents/skills/<skill>/SKILL.md` 及其附属文件。
  - 写入前校验 YAML frontmatter 至少存在且可解析（使用简单的字符串匹配，不引入 yaml 库）。
  - 写入后计算 SHA-256（`node:crypto.createHash('sha256')`）并记录到 `~/.memorix/memorix-skills/memorix-meta.json`。
  - **默认行为**：如果目标目录不存在，直接写入；如果目标目录已存在，通过元数据中的来源 SHA 比对：
    - 来源无变化 → 跳过。
    - 来源有变化 → dry-run 输出差异，仅在显式 `--force` 时覆盖。
    - 无本地元数据 → 视为首次同步，下载并记录。
  - 支持 `dryRun`：只输出计划，不写入。
  - 支持 `force`：覆盖已存在目录，覆盖前按 `.bak.<timestamp>-<uuid>` 格式备份。

### 4.3 元数据目录结构

为彻底避免污染全局 `~/.agents/skills/` 目录内容，memorix 版本感知所需的元数据文件统一存放在 `~/.memorix/` 专用目录下，并采用用户认可的结构：

```text
%USERPROFILE%/.memorix/                # 当前用户全局 memorix 数据目录
└── memorix-skills/                    # 与 memorix skills 同步相关的数据文件夹
    └── memorix-meta.json              # 实际元数据文件：记录每个 skill 的来源、SHA-256、更新时间等
```

- `~/.memorix/`：所有 memorix 相关应用数据的根目录，不与其他 agent 工具的数据目录混淆。
- `memorix-skills/`：显式表明该文件夹用于 memorix skills 同步，结构简单、可读性强。
- `memorix-meta.json`：实际文件，记录每个 skill 的最新来源 SHA-256、版本、agent 来源、最后刷新时间戳，用于后续比对是否发生变化。

元数据文件格式示例：

```json
{
	"version": 1,
	"lastRefreshAt": "2026-07-06T02:00:00.000Z",
	"source": "github:v1.1.5",
	"agent": "cursor",
	"skills": {
		"memorix-memory": {
			"sourceSha256": "abc123...",
			"localSha256": "abc123...",
			"updatedAt": "2026-07-06T02:00:00.000Z",
			"source": "npm:memorix@1.1.5"
		},
		"memorix-orchestrate": {
			"sourceSha256": "def456...",
			"localSha256": "def456...",
			"updatedAt": "2026-07-06T02:00:00.000Z",
			"source": "npm:memorix@1.1.5"
		}
	}
}
```

当元数据文件损坏或版本不兼容时，脚本应：

1. 将旧文件重命名为 `memorix-meta.json.broken.<timestamp>`。
2. 重新从来源获取全部 skills 并生成新的元数据。
3. 在 stderr 输出警告，不阻塞同步流程。

### 4.4 集成到 `scripts/sync.ts`

- 新增 CLI 参数：
  - `--skip-memorix-refresh`：跳过 memorix 刷新步骤。
  - `--force-memorix-refresh`：强制覆盖已存在的 memorix skills（透传给 `refreshMemorixSkills`）。
  - `--memorix-source <github|local|cli|auto>`：选择 memorix skills 来源策略，默认 `auto`。
  - `--memorix-agent <agent>`：选择 agent 来源（默认 `cursor`，可选 `claude`/`codex`）。
  - `--memorix-github-ref <ref>`：指定 GitHub ref，默认最新 release tag。
  - 保持 `--source`、`--dry-run`、`--no-backup`、`--help` 不变。
- 默认行为：在同步平台前，先调用 `refreshMemorixSkills({ dryRun, backup, force, source, agent, githubRef })`。
- 刷新成功后，继续使用现有 `syncSkills()` 逻辑同步平台。

### 4.5 新增 `scripts/fetch-memorix-skills.ts`

- 独立的 memorix 刷新脚本，便于单独运行和节省 token。
- 支持参数：
  - `--target <path>`：目标 skills 目录（默认 `~/.agents/skills`）。
  - `--agent <agent>`：选择 agent 来源（默认 `cursor`，可选 `claude`/`codex`）。
  - `--source <github|local|cli|auto>`：选择来源策略，默认 `auto`。
  - `--github-ref <ref>`：GitHub ref，默认最新 release tag。
  - `--dry-run`：只输出计划。
  - `--force`：覆盖已存在目录（默认关闭）。
  - `--no-backup`：覆盖时不备份。
  - `--help`。

### 4.6 fallback 脚本更新

- `fallback/sync.ps1` 和 `fallback/sync.sh` 在同步平台前增加一步：
  - 按顺序检测本地候选目录是否存在：
    1. `~/.cursor/skills/`
    2. `~/.codex/plugins/memorix/skills/`
    3. `~/.claude/plugins/marketplaces/memorix-local/plugins/memorix/skills/`
    4. `~/.claude/plugins/cache/memorix-local/memorix/*/skills/`
    5. `~/.codex/plugins/cache/personal/memorix/*/skills/`
  - 选择第一个可用的来源，将其中的 `memorix-*` 目录递归复制到 `~/.agents/skills/`（不覆盖已存在）。
  - 如果都不可用，输出警告并继续平台同步（不阻塞）。
- 新增参数：
  - `--skip-memorix-refresh` / `-SkipMemorixRefresh`
  - `--force-memorix-refresh` / `-ForceMemorixRefresh`
  - `--memorix-source <source>` / `-MemorixSource <source>`（如 shell 实现复杂度可控）
- 注意：fallback 脚本仅做本地回退，无法从 npm/GitHub 拉取；文档中需明确说明其定位。

### 4.7 测试策略

在 `tests/sync-local-global-agents-skills/` 下新增 `memorix.test.ts`，覆盖：

1. 从本地 `~/.cursor/skills/` 刷新 memorix skills 到目标目录。
2. 从本地多个来源中选择最新/最完整的来源。
3. 目标目录不存在时直接下载并写入 `~/.memorix/memorix-skills/memorix-meta.json`。
4. 目标目录已存在且来源无变化时跳过。
5. 目标目录已存在且来源有变化时默认提示（不覆盖），`--force` 时覆盖。
6. `dryRun` 模式不写入文件系统。
7. npm 包源成功时优先使用网络源（通过 mock 或临时 tarball）。
8. npm 包源失败时回退到本地源。
9. GitHub 源失败（403 rate limit / 网络超时）时回退到本地源。
10. 递归复制 skill 目录中的 `references/` 等附属文件。
11. 写入前校验 YAML frontmatter 和 HTTP 状态码。
12. 元数据文件 `~/.memorix/memorix-skills/memorix-meta.json` 记录和更新正确。

## 5. 关键决策

| 决策                    | 方案                                                                                                                                                                                                                                                   | 理由                                                                                                                                                      |
| :---------------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 来源优先级              | 默认 `auto`：GitHub release tag raw（权威源）→ 本地已安装插件目录（cursor/codex/claude 多源扫描）→ CLI `skills show`（内容校验）。                                                                                                                     | GitHub 是 memorize 的权威发布渠道，raw 文件基于 HTTPS，零 npm 依赖；本地多源扫描覆盖用户已安装环境。                                                      |
| 本地源扫描              | 扫描 `~/.cursor/skills/`、`~/.codex/plugins/memorix/skills/`、`~/.claude/plugins/marketplaces/memorix-local/plugins/memorix/skills/`、`~/.claude/plugins/cache/memorix-local/memorix/*/skills/`、`~/.codex/plugins/cache/personal/memorix/*/skills/`。 | 用户明确要求“本地源不能只有 cursor”。多源扫描后按版本号/修改时间/候选顺序取最新，避免遗漏任何已安装副本。                                                 |
| 零外部依赖              | `src/memorix.ts` 和其附属脚本**不使用任何外部 npm 包**。HTTP 下载用 `node:https`，文件遍历用 `node:fs` 手动递归，SHA 用 `node:crypto`，子进程用 `node:child_process`。                                                                                 | skill 附属脚本在用户机器上通过 `tsx` 直接运行，必须自包含。引入 `tar`/`tinyglobby` 会导致运行时缺失依赖。                                                 |
| 冲突处理                | 默认按 SHA 比对决定是否更新；无变化则跳过，有变化时默认提示、`--force` 时覆盖。                                                                                                                                                                        | 用户原选择“跳过已存在”，但单纯跳过会导致旧版本永远保留，无法“确保最新”。通过 `~/.memorix/memorix-skills/memorix-meta.json` 实现版本感知，兼顾安全与最新。 |
| 刷新默认启用            | `sync.ts` 默认执行 memorix 刷新，可通过 `--skip-memorix-refresh` 关闭；`--force-memorix-refresh` 强制覆盖。                                                                                                                                            | 符合“执行一次同步即可拿到最新 skills”的诉求，同时给用户强制刷新入口。                                                                                     |
| 独立刷新脚本            | 新增 `scripts/fetch-memorix-skills.ts`。                                                                                                                                                                                                               | 便于单独调试、节省 token，且职责单一。                                                                                                                    |
| 目录级符号链接不变      | 仍然以 `~/.agents/skills` 为唯一数据源进行平台同步。                                                                                                                                                                                                   | 保持现有架构简单，只需把 memorix skills 先补充到数据源。                                                                                                  |
| 递归复制整个 skill 目录 | 不只复制 `SKILL.md`，保留 `references/` 等附属文件。                                                                                                                                                                                                   | 当前 memorix skills 虽无附属文件，但 skill 规范支持 `references/`；未来扩展时无需改代码。                                                                 |
| 认证与镜像              | 读取 `GITHUB_TOKEN` 和 `GITHUB_RAW_MIRROR` 环境变量。                                                                                                                                                                                                  | 提升 GitHub API rate limit，缓解中国大陆 raw 访问不稳定。                                                                                                 |

## 6. 风险与缓解

| 风险                                         | 影响                                | 缓解措施                                                                                                |
| :------------------------------------------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------ |
| GitHub API rate limit                        | 无法获取目录列表                    | 支持 `GITHUB_TOKEN` 认证；设置 15 秒超时；403 时显式提示用户设置 token 或稍后重试；失败时回退本地扫描。 |
| `raw.githubusercontent.com` 在中国大陆不稳定 | 下载失败或返回错误内容              | 支持 `GITHUB_RAW_MIRROR` 镜像；超时后回退本地；校验 HTTP 状态码，非 200 不写入。                        |
| 官方仓库路径变更                             | 刷新失败                            | 将 `owner/repo/agent/branch` 抽离为 CLI 参数和环境变量；提供 `--repo` / `--branch` / `--agent` 参数。   |
| 本地所有 memorix 插件均未安装                | 回退源也不可用                      | 脚本报错并提示用户安装 memorix 插件（cursor/codex/claude 任一），或检查网络/npm 可用性。                |
| 同名 skill 冲突                              | 用户自定义 skill 被覆盖             | 默认按 SHA 比对，只有来源变化时才提示；`--force` 覆盖前备份。                                           |
| 默认跳过导致不更新                           | 旧版本永远保留                      | 通过元数据 SHA 比对实现版本感知，`--force-memorix-refresh` 强制更新。                                   |
| 下载到损坏或错误内容                         | 写入非法文件                        | 校验 HTTP 状态码、文件大小 > 0、YAML frontmatter 可解析；计算并记录 SHA-256。                           |
| 多 agent 来源分化                            | 未来 codex/claude/cursor 内容不一致 | 将 `agent` 作为可配置参数。                                                                             |
| 平台差异（Windows 路径）                     | 写入失败                            | 统一使用 `os.homedir()` 和 `path.join`；递归确认父目录存在。                                            |

## 7. 实现步骤

1. 创建 `src/memorix.ts`，实现多源获取（github → local → cli）、SHA 比对、落盘、元数据持久化。所有实现使用 Node.js 内置模块。
2. 创建 `scripts/fetch-memorix-skills.ts`，封装独立刷新 CLI。
3. 修改 `scripts/sync.ts`，默认调用刷新并在完成后执行平台同步。
4. 更新 `fallback/sync.ps1` 和 `fallback/sync.sh`，扫描全部本地候选目录。
5. 新增 `tests/sync-local-global-agents-skills/memorix.test.ts`。
6. 更新 `README.md` 和 `SKILL.md`。
7. 运行类型检查、测试、格式化。
8. 提交并记录变更集。

## 8. 验证方式

- `tsx scripts/fetch-memorix-skills.ts --dry-run` 输出计划。
- `tsx scripts/fetch-memorix-skills.ts` 在 `~/.agents/skills/` 下创建 `memorix-*` 目录和 `~/.memorix/memorix-skills/memorix-meta.json`。
- `tsx scripts/fetch-memorix-skills.ts --source github` 强制从 GitHub 获取。
- `tsx scripts/fetch-memorix-skills.ts --source local` 强制从本地已安装插件目录获取。
- `tsx scripts/fetch-memorix-skills.ts --force` 在有更新的 skill 上执行覆盖并生成备份。
- `tsx scripts/sync.ts --dry-run` 显示 memorix 刷新 + 平台同步两步计划。
- `tsx scripts/sync.ts --force-memorix-refresh` 强制刷新 memorix skills 后同步平台。
- `pnpm vitest run --project sync-local-global-agents-skills` 全部测试通过。
- 最终通过 `ls ~/.agents/skills | grep memorix` 确认新增目录，并检查 `~/.memorix/memorix-skills/memorix-meta.json` 元数据正确。
