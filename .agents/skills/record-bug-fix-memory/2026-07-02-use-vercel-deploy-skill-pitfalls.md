# 2026-07-02 新建 use-vercel-deploy-in-monorepo skill 过程中的弯路与教训

## 现象

在新建 `ai-plugins/dev-skills/skills/use-vercel-deploy-in-monorepo` 技能时，连续出现以下错误：

1. **Vercel 项目对应关系误判**：最初把 `notes` 项目当作 `notes-my-pull-requests` 的部署目标；后来又一度把 `11comm-app-h5` 错误对应到 `01s-11comm-app` 独立仓库。
2. **依赖来源说明错误**：最初在 skill 中说明 `move-vercel-output-to-root` 命令来自 `@ruan-cat/vercel-deploy-tool`，实际该命令来自 `@ruan-cat/utils`。
3. **AI 客户端名称硬编码**：在通用 skill 文件中写入了 `WorkBuddy` 等具体 AI 客户端名称，被用户指出后回改。
4. **模板形态不一致**：`templates/package-scripts-uniapp-h5.md` 标注为“形态 1 / 模式 B（直接产物路径）”，但默认脚本却执行了 `move-h5-output-to-root` 搬运逻辑，属于模式 A 行为。
5. **远程配置未先验证**：初始阶段仅凭本地文件和掘金文章推断配置，未先用 Vercel CLI 拉取远端实锤数据。

## 根因

排错流程缺少以下关键校验步骤，导致多次基于**局部信号**做推断：

- **未先验证 Git 仓库连接**：仅凭本地目录名、域名或项目名猜测对应关系，没有通过 Vercel API / CLI 核对 `project.link.repo` 和 `project.link.org`。
- **未先验证 bin 来源**：看到脚本中调用 `move-vercel-output-to-root`，未追溯该 bin 实际由哪个 package 暴露。
- **未区分“通用 skill”与“个人工作流”**：通用 skill 中误把当前 AI 客户端名称写死，忽略了 skill 会在多个平台分发。
- **模板标注与脚本逻辑未交叉核对**：只检查了标题和文件列表，未检查脚本是否真按标题描述执行。
- **过度依赖 MCP 可用性**：Vercel MCP 离线时，没有立刻切换到 Vercel CLI 获取远程配置。

## 修复

1. **用 Vercel CLI + API 验证项目对应关系**：

   ```bash
   export VERCEL_TOKEN="<token>"
   vercel project list --next <cursor>
   curl -s -H "Authorization: Bearer <token>" "https://api.vercel.com/v9/projects/<projectId>?teamId=<teamId>"
   ```

   核对每个 Vercel 项目的 `link.repo` 与本地仓库是否一致。

2. **重新按部署形态分层设计 skill**：
   - 形态 1：Monorepo 子包部署
     - 模式 A：产物搬运到根目录 `.vercel/output`
     - 模式 B：Output Directory 直接指向子包产物路径
   - 形态 2：独立仓库部署

3. **修正依赖来源说明**：在 `SKILL.md`、`references/monorepo-deployment-patterns.md`、各模板顶部明确写出 `pnpm add -D @ruan-cat/utils`。

4. **删除 AI 客户端硬编码**：全目录替换为“支持 Vercel MCP 的 AI 客户端”等通用表述。

5. **修正 UniApp H5 模板**：默认模式 B 只执行 `build:h5:prod`，模式 A 作为可选补充小节。

6. **新增远程配置校验文档**：`references/vercel-cli-remote-inspection.md` 说明如何通过 Vercel CLI 检查 `framework`、`rootDirectory`、`outputDirectory`、`buildCommand`。

## 验证

- Vercel API 返回的项目 `link.repo` 与本地仓库对应关系已核对：
  - `notes-my-pull-requests` → `ruan-cat/notes`
  - `11comm-nitro-server` → `ruan-cat/11comm`
  - `11comm-admin` → `ruan-cat/11comm`
  - `11comm-app-h5` → `ruan-cat/11comm`
  - `11comm-app-nitro-server` → `ruan-cat/11comm-app`
- `11comm-app-h5` 确认不对应 `01s-11comm-app` 独立仓库。
- 全目录 Grep 确认无 `WorkBuddy`、`Claude`、`Cursor`、`CodeBuddy`、`ZCode`、`Codex` 等硬编码。
- 全目录 Grep 确认无 `TODO`、`TBD`、`xxx` 占位符。
- 提交信息通过 `commitlint` 预校验，skill 文件通过复核子代理最终检查 PASS。

## 教训

1. **验证 Git 仓库连接是第一步**：在把本地项目与 Vercel 远程项目对应起来之前，必须先通过 Vercel API 或 CLI 查看 `link.repo` / `link.org`，不能凭目录名或域名猜测。
2. **bin 命令必须追溯到来源包**：看到脚本中调用某个 bin，必须确认它由哪个 package 暴露，并在文档中写明安装命令。
3. **通用 skill 不写具体 AI 客户端名称**：凡是对外分发的 skill，涉及 AI 客户端时使用通用表述，如“支持 Vercel MCP 的 AI 客户端”。
4. **模板标题与脚本逻辑必须一致**：标注“模式 A”的模板必须包含搬运脚本，标注“模式 B”的模板必须直接指向产物路径，不能标题与脚本矛盾。
5. **MCP 不可用时立即切换 CLI**：不要等待 MCP 恢复，应先用 Vercel CLI 或 REST API 获取远程配置。
6. **远程配置先于本地模板**：在写推荐配置前，先用远程实锤数据验证本地假设是否成立，避免“先写模板再硬凑数据”。
