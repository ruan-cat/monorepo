---
name: init-vscode
description: >-
  初始化或更新 VSCode 配置文件（.vscode/extensions.json 和 .vscode/settings.json），
  治理扩展推荐的生命周期与已知替代关系，并在 JSONC 安全迁移、工作区/用户级 scope、
  preflight/postflight 和可回滚验收之间建立明确边界；同时把 `files.eol` 收敛为 `"\n"`，
  配合 `.gitattributes`、`.editorconfig`、Prettier 解决 Windows 上的 CRLF/LF 漂移与 git 幽灵修改问题，
  并补齐大型 monorepo 的 VSCode 启动慢、文件监听、搜索索引与 TypeScript Server 性能优化默认值。
  只要用户提到初始化 vscode、编辑器配置、工作区设置、扩展替换/弃用迁移、行尾统一、EOL、CRLF/LF、
  幽灵修改、团队规范、VSCode 启动慢、大仓库性能、文件监听降噪、搜索索引优化，都应该使用本技能。
user-invocable: true
metadata:
  version: "0.5.0"
---

# Init VSCode

初始化或更新项目的 VSCode 配置文件，提供一套开箱即用的编辑器设置和扩展推荐。

## 目标

为项目配置 VSCode 开发环境，包括：

- 扩展推荐（extensions.json）
- 已知扩展替代关系的生命周期治理与可回滚迁移
- 工作区设置（settings.json）
- 大型 monorepo 性能默认值：三层排除、搜索索引收敛、TypeScript Server 限制与监听策略

配置采用智能合并策略，尊重用户现有配置的同时补充最佳实践。但本技能存在两类**窄范围强策略例外**：

1. `files.eol` 必须收敛为 `"\n"`。
2. 已登记、证据充分的 extension replacement mapping 优先于 `recommendations` 的普通并集合并规则；未知扩展绝不凭猜测自动删除。

大型 monorepo 必须同步维护三层排除：

- `files.exclude`：隐藏文件树中的依赖、构建产物、缓存、日志和 sourcemap，降低资源管理器渲染压力。
- `files.watcherExclude`：减少 VSCode 文件监听器对无效目录的扫描，降低启动后持续 CPU 与磁盘 I/O。
- `search.exclude`：减少搜索与索引对象，避免 `rg`、搜索索引和 AI 扩展重复扫描生成文件。

## 工作流程

### 1. 确认目标目录

在项目根目录下操作（无论是 monorepo 还是单体项目）。确保 `.vscode/` 目录存在：

```bash
mkdir -p .vscode
```

### 2. 处理 extensions.json

读取模板配置（见 `templates/extensions.json`）。

> 注意：模板文件顶部说明使用 `//` 行注释，说明该文件在 monorepo 内为何被工作区关联为 `jsonc`，以及作为 JSONC（`extensions.json` 特例）的编写约束。写入目标项目的 `.vscode/extensions.json` 后，由 VS Code 按 JSONC 正常解析；如果目标项目也维护模板副本，应显式关联为 `jsonc`，不要降级成纯文本。

**JSONC 语法安全要求：**

- `.vscode/extensions.json` 可以保留 `//` 行注释和分组注释，因为 VS Code 会按 JSONC 解析该文件。
- 模板顶部说明必须优先使用 `//` 行注释。
- 不要用外层 `/* ... */` 块注释包裹包含 `/* */`、`*/`、代码片段或注释语法示例的说明文本；这会提前结束块注释并造成语法错误。
- 不要为了消除解析错误而删除说明注释、分组注释或扩展用途注释。正确目标是“保留注释且语法安全”。
- 写入目标项目后，必须用 JSONC parser 验证 `.vscode/extensions.json`，不能只依赖 VS Code 目测。
- 判断“活动配置”时必须使用 JSONC-aware 解析能力；禁止用简单正则、逐行字符串搜索或删除注释后再 `JSON.parse` 的方式推断活动键。注释中的扩展 ID、设置键、标签和值都不算活动配置。

**如果文件不存在**：

- 直接创建并写入模板内容

**如果文件已存在**：

- 读取现有配置
- 如果现有文件包含注释，按 JSONC 文件处理；不要用 `JSON.parse` 作为唯一解析或验收方式
- 在普通情况下，合并 `recommendations` 数组：去重后保留所有扩展（用户的 + 模板的）
- 在普通情况下，合并 `unwantedRecommendations` 数组：同样去重
- **在执行普通数组并集前，必须先检查已登记的 replacement mapping；命中时按 2.1 的迁移规则处理，不能让普通并集把旧扩展重新保留下来**
- 保留用户配置中的其他字段（如果有）
- 写回文件时保留已有注释与分组；如果所用工具无法保留注释，改用最小文本插入/替换方式完成目标变更，不要把 JSONC 退化成无注释 JSON
- 保持格式美观（2 空格缩进；如果保留注释则按 JSONC 处理）

### 2.1 扩展替代关系与生命周期治理

当前 replacement mapping 的执行真值位于 [`reference/extension-replacement-migrations.md`](reference/extension-replacement-migrations.md)。当模板中的扩展推荐发生替换、目标项目出现已知旧扩展 ID、旧 settings namespace、旧 command/keybinding 或用户报告扩展弃用/激活失败时，必须先读取该 reference，再进行普通合并。

当前至少维护以下替代关系：

```text
Gruntfuggly.todo-tree -> FanaticPythoner.better-todo-tree
```

当目标项目命中已知替代关系且用户没有明确要求保留旧推荐时：

1. 从 `recommendations` 删除旧扩展 ID；
2. 向 `recommendations` 加入新扩展 ID；
3. 向 `unwantedRecommendations` 加入旧扩展 ID；
4. 保留用户其他无关推荐、unwanted 项和其他字段；
5. 在反馈中明确报告这是一次 `replacement migration`，而不是“新增一个推荐”。

replacement mapping 的优先级高于普通数组并集，但自动删除权限只限于**技能已经登记且证据充分的旧 ID**。未知扩展、同类扩展、名称相似扩展不能凭猜测自动删除。

如果用户明确要求继续保留某个旧扩展：

- 尊重用户决定，不自动从该项目的 `recommendations` 删除，也不要自动把它加入 `unwantedRecommendations`；
- 仍可以加入新扩展，但必须报告“双推荐/兼容风险”和未完成迁移的状态；
- 不得把用户的显式保留决定解释成“迁移成功”。

`unwantedRecommendations` 只表达工作区“不希望推荐此扩展”的意图，**不是**卸载、禁用或运行时隔离机制。写入它不能被当作扩展迁移完成的证据。

### 2.2 Replacement preflight 与 scope 边界

对命中 replacement mapping 的项目，在修改前先做最小 preflight。可获得对应能力时，至少检查：

- 当前 VS Code 版本；
- 旧/新扩展是否安装及版本；
- 工作区 settings 中的 legacy/current namespace；
- 与旧扩展相关的 keybindings / commands；
- 显式 executable/path override，尤其是指向 VS Code 私有内部目录的路径；
- replacement reference 中登记的高风险设置；
- JSONC 中的**活动值**，而不是注释文本；
- 是否存在可回滚基线。

scope 必须分层处理：

1. **工作区 `.vscode/*`**：属于本技能的正常写集，可以按当前用户任务直接创建或合并。
2. **VS Code User Settings / User keybindings**：属于用户级配置。默认只检测并报告；需要修改时必须先明确 scope、获得用户授权、创建可识别的备份，再做最小 JSONC-aware 迁移。只迁移活动旧键，保留注释禁用项，不格式化无关用户设置，并在结束时报告备份位置和迁移 namespace。
3. **全局扩展安装/启用/禁用/卸载状态**：属于独立运行时动作。不得因为修改了工作区文件就顺手卸载或禁用用户扩展；任何全局状态变更都需要单独授权与证据。

不要在对外分发 skill 中写死某台机器的绝对 User Settings 路径。需要用户级迁移时，应通过当前平台/VS Code 环境定位真实配置文件，并把绝对路径只作为本次执行反馈，而不是技能长期规则。

### 2.3 Todo Tree -> Better Todo Tree 的专用迁移 gate

命中 `Gruntfuggly.todo-tree -> FanaticPythoner.better-todo-tree` 时，除通用 preflight 外按 reference 检查以下风险：

- 无效 `subTagRegex`：BLOCKER，先修复正则再迁移；
- `customHighlight`：保留人工视觉验收 WARN，不能仅靠静态配置宣称等价；
- multiline regex：保留 runtime 兼容 WARN；
- UTF-16 文件：保留 workspace scan WARN；
- 显式 ripgrep override：如果指向 `resources/app/node_modules*`、`@vscode/ripgrep*` 等 VS Code 私有内部布局，视为高风险 WARN/FAIL，禁止把该路径复制成长期新配置；
- legacy keybinding / command：核验新扩展是否提供可用命令或兼容 alias；无法静态证明时要求 GUI 人工测试。

Better Todo Tree 的长期配置应优先使用扩展自身 resolver / packaged ripgrep；不要把 VS Code 私有内部二进制路径当成稳定 API。

替换前若需要确认为什么存在这些门禁，读取 [`reference/2026-08-16-todo-tree-ripgrep-migration.md`](reference/2026-08-16-todo-tree-ripgrep-migration.md)。该文件是当前可执行经验层，不依赖源 monorepo 的开发期报告。

### 2.4 可回滚迁移原则

- replacement 首轮可以在获得用户授权后采用“新扩展安装/启用，旧扩展禁用但暂不卸载”的方式保留一个验收周期，便于快速回滚；这不是永久双安装策略。
- `code --list-extensions` 只能证明“已安装”，不能单独证明“已禁用”。没有额外证据时只能报告安装状态，不能推断启用状态。
- GUI/runtime 验收稳定后，再提示用户决定是否卸载旧扩展；不得自动卸载。
- User Settings 发生迁移时，回滚依据是迁移前备份 + 已报告的 namespace 变更，不要靠记忆反向编辑。

### 2.5 配置检查

在合并模板之前，先检查目标项目现有 `.vscode/settings.json` 中是否存在过时或不合适的配置。参照 `init-ai-md` 的迁移检测机制，对问题配置进行分类标记并提示用户。

**检查项**：

1. **`vue.server.includeLanguages` 包含 `"markdown"`**
   - 原因：该配置会导致 Vue 语言服务器错误地处理 Markdown 文件，产生不良影响
   - 标记：`[需移除 markdown]`
   - 修复方式：将值收敛为 `["vue"]`

2. **`files.eol` 不是 `"\n"`**
   - 原因：Windows 上容易产生 CRLF/LF 漂移与 git 幽灵修改
   - 标记：`[需收敛为 LF]`
   - 修复方式：覆盖为 `"\n"`

**执行流程**：

1. 如果 `.vscode/settings.json` 不存在，跳过本步骤
2. 读取现有配置
3. 扫描上述检查项，生成分类标记
4. 如果存在任何标记项，使用 AskUserQuestion 工具询问用户是否修复
5. 用户确认修复后，先执行修正，再进入步骤 3 的合并流程
6. 用户选择不修复时，保留原配置并进入合并流程（但 `files.eol` 仍按策略键强制收敛）

**询问示例**：

```plain
检测到以下 VSCode 配置问题：

- vue.server.includeLanguages 包含 "markdown" [需移除 markdown] - 会导致 Vue 语言服务器错误处理 Markdown 文件
- files.eol 为 "auto" [需收敛为 LF] - 建议统一为 "\n" 避免行尾漂移

请选择要修复的项（可多选，用逗号分隔，如：1,2），或输入 0 跳过。
```

**修复策略**：

- 用户确认修复后，在合并模板前先修正这些配置
- 修正时保留用户的其他自定义配置
- 修复后的配置再按步骤 3 的合并逻辑处理

### 3. 处理 settings.json

读取模板配置（见 `templates/settings.json`），然后：

**大型 monorepo 性能策略**：

- `files.exclude`、`files.watcherExclude`、`search.exclude` 必须按同一批目录同步补齐；只改其中一层会留下文件树、监听器或搜索索引的性能缺口。
- 默认排除常见依赖、构建产物、缓存、日志、测试报告和 sourcemap，例如 `node_modules`、`.git`、`dist`、`dist-ssr`、`build`、`.next`、`.nuxt`、`.output`、`.vite`、`.vitepress/dist`、`.vitepress/cache`、`.vuepress/dist`、`.vuepress/cache`、`.turbo`、`.vercel`、`.cache`、`.temp`、`.tmp`、`coverage`、`.nyc_output`、`.vitest-reporter-html`、`.eslintcache`、`.stylelintcache`、`*.tsbuildinfo`、`*.map`、`logs`、`*.log`。
- `search.indexing.maxFileSize` 默认收敛为 `1048576`，避免 500MB 级别设置导致搜索索引吞入大文件。
- TypeScript 默认补齐 `typescript.tsserver.maxTsServerMemory: 4096`、`typescript.disableAutomaticTypeAcquisition: true`、`typescript.tsserver.watchOptions` 和 `typescript.tsdk: "node_modules/typescript/lib"`。

**如果文件不存在**：

- 直接创建并写入模板内容

**如果文件已存在**：

- 读取现有配置
- 如果现有文件包含注释，按 JSONC 文件处理，并复用后续 Prettier JSONC override 规则
- 深度合并对象：
  - 对于嵌套对象（如 `files.exclude`、`files.watcherExclude`、`search.exclude`、`explorer.fileNesting.patterns`），合并所有键值对
  - 对于数组，默认去重合并
  - 对于简单值（字符串、布尔值、数字），默认仍然是**用户现有值优先**
- 但对以下策略键，必须使用模板值覆盖冲突值：
  - `files.eol`：必须收敛为 `"\n"`，不允许保留 `"\r\n"` 或 `"auto"`
  - `vue.server.includeLanguages`：必须收敛为 `["vue"]`，移除 `"markdown"`，避免 Vue 语言服务器错误处理 Markdown 文件
  - `search.indexing.maxFileSize`：必须收敛为 `1048576`，不要保留 500MB 级别的大文件索引上限
  - `typescript.disableAutomaticTypeAcquisition`：默认收敛为 `true`，避免大仓库自动拉取和扫描额外类型包
  - `typescript.tsserver.watchOptions`：必须补齐 `watchFile: "useFsEvents"`、`watchDirectory: "useFsEvents"`、`fallbackPolling: "dynamicPriority"`
  - `typescript.tsdk`：默认使用项目内 `node_modules/typescript/lib`
  - `typescript.tsserver.maxTsServerMemory`：缺失或低于 `4096` 时补为 `4096`；高风险 monorepo 可提高到 `8192`
- 保留用户配置中的其他字段
- 写回文件，保持 JSON/JSONC 格式美观（2 空格缩进）

### 3.1. `files.eol` 的特殊规则

本技能专门负责 `.vscode/settings.json` 中的：

```json
{
	"files.eol": "\n"
}
```

处理原则如下：

1. 如果 `files.eol` 不存在：直接补写为 `"\n"`
2. 如果 `files.eol` 已存在但值是 `"\r\n"`、`"auto"` 或其他值：必须覆盖为 `"\n"`
3. 如果用户已经是 `"\n"`：保持不变

这是一个明确的团队策略键，不适用“用户简单值优先”的默认规则。

### 3.2. Prettier JSONC 兼容规则

本技能落地的 `.vscode/extensions.json` 默认保留注释，因此它是 JSONC 而不是严格 JSON。执行时必须检查目标项目的 Prettier 链路，避免“VS Code 能读，但格式化器报错”。

处理步骤：

1. 检查本次创建或更新的 `.vscode/extensions.json`、`.vscode/settings.json` 是否包含 `//` 行注释、块注释或尾逗号。
2. 读取目标项目的 `package.json`、`prettier.config.*`、`lint-staged.config.*`，判断 `format`、lint-staged 或提交钩子是否会格式化 `*.json` 或所有文件。
3. 如果 JSONC 文件会进入 Prettier，则在目标项目 `prettier.config.mjs` 中追加精确 override；本模板禁止尾逗号，因此同时收敛 `trailingComma: "none"`：

   ```text
   /** @type {import("prettier").Config} */
   const config = {
     overrides: [
       {
         files: ".vscode/extensions.json",
         parser: "jsonc",
         trailingComma: "none",
       },
     ],
   };

   export default config;
   ```

4. 如果 `.vscode/settings.json` 也保留注释，可以和 `extensions.json` 合并为精确文件数组：

   ```text
   {
     files: [".vscode/extensions.json", ".vscode/settings.json"],
     parser: "jsonc",
     trailingComma: "none",
   }
   ```

5. 如果已有 `overrides`，只追加缺失项或修正同一文件的 parser / `trailingComma`，不要删除现有 parser、plugins、printWidth、tabWidth、endOfLine 等项目配置。
6. 不要把 `**/*.json` 全部设置为 `jsonc`。`package.json`、lockfile、以及第三方严格 JSON parser 读取的配置仍应保持严格 JSON。
7. 如果目标项目没有 Prettier 配置，或格式化命令不会覆盖 `.vscode/extensions.json`，也要在反馈中明确说明判断结果，不要无声跳过。

### 3.3 高风险项目加固

当项目是大型 pnpm/turbo monorepo、打开 VSCode 明显变慢、`Code.exe`/`rg.exe`/`tsserver.js` 持续占用 CPU，或存在大量生成产物时，按以下策略加固：

- 可把 `typescript.tsserver.maxTsServerMemory` 从 `4096` 提高到 `8192`，但不要用它替代精确 `tsconfig` 与排除规则。
- 禁用或限制会索引全仓的 AI 扩展，例如将 `Codegeex.RepoIndex` 设为 `false`，或在扩展自身配置中限定索引范围。
- `.gitignore` 与 VSCode 三层排除规则需要同步维护；Git 忽略只影响版本控制，不会自动减少 VSCode 文件树、监听器和搜索索引压力。
- Windows Defender 可按需排除项目内的 `node_modules`、`.git`、`.tmp` 等高频 I/O 目录，减少实时扫描对 VSCode 启动和搜索的干扰。
- 根 `tsconfig.json` 的 `include` 应精确到源码目录，不要把 `.md`、`.github`、`.cursor` 等无关目录纳入 TypeScript 范围。
- 对外分发的技能文档只写通用经验与相对路径，不要求用户读取本机诊断报告或开发期绝对路径。

### 4. 验证结果

验证必须区分三层证据。**配置合法 + 扩展已安装，不等于扩展运行成功。**

#### 层 A：静态配置

检查两个文件是否正确创建/更新：

```bash
ls -la .vscode/
```

验证 `.vscode/extensions.json` 本身是合法 JSONC：

```bash
pnpm exec prettier --parser jsonc --trailing-comma none --check .vscode/extensions.json
```

如果目标项目存在 Prettier 配置，或 `format` / lint-staged 会处理 JSON 文件，还要验证项目级 Prettier 配置能正确接管：

```bash
pnpm exec prettier --check .vscode/extensions.json
```

如果 `.vscode/settings.json` 保留注释，同样纳入窄范围检查：

```bash
pnpm exec prettier --parser jsonc --trailing-comma none --check .vscode/settings.json
pnpm exec prettier --check .vscode/settings.json
```

replacement migration 的静态验收还必须确认：

- `recommendations` / `unwantedRecommendations` 符合 mapping；
- legacy/current settings namespace 符合迁移计划；
- 没有把注释禁用项误恢复为活动配置；
- 没有生成陈旧的 VS Code 私有内部二进制绝对路径；
- 迁移后需要保持的标签/配置快照顺序与活动值一致。

如果 `pnpm format` 会触碰大量历史文件，可以先运行上述窄范围检查，并在反馈中明确没有运行全量格式化的原因。

#### 层 B：CLI / Extension Host 证据

存在 replacement migration 时，在当前环境允许的范围内检查：

- 新扩展是否真实安装及版本；
- 旧扩展的安装/禁用策略是否符合本次回滚计划；
- fresh 日志中是否存在 activation failure、`command not found`、executable/ripgrep missing 等回归信号。

没有 fresh Extension Host / runtime 日志时，只能标记为 WARN / pending，不能把“未发现日志”写成运行时 PASS。

#### 层 C：GUI / runtime 人工验收

凡 replacement 涉及 UI、命令或运行时激活，至少要求用户或有 GUI 能力的执行环境完成相关项：

- Reload Window；
- 目标视图真实出现；
- Refresh/重建；
- 项目内跳转；
- Filter / Group / Expand/Collapse 等关键操作（按扩展能力取适用项）；
- 高亮/视觉差异检查；
- fresh restart 稳定性；
- 大仓库性能（任务涉及性能时）。

只有 A + B + C 的适用项都满足，才能声明“当前环境 replacement 验证通过”。如果只能完成 A 或 A+B，反馈必须显式写成“静态/CLI 已通过，GUI runtime acceptance pending”。

### 5. 提供反馈

向用户报告：

- 更新了哪些文件（新建 or 合并）
- 大致变更内容（新增了多少扩展推荐、多少设置项）
- 如果发生 replacement migration：旧/新扩展 ID、recommendations/unwanted 结果、settings namespace 变化和回滚状态
- 如果触碰 User Settings：授权范围、备份位置、迁移的活动键/namespace；不得泄露与任务无关的用户配置内容
- 如果有冲突保留了用户配置的情况，简要说明
- JSONC / Prettier override 的判断结果：已补齐、已有可复用配置，或当前项目无需补齐
- 层 A / B / C 各自的验收状态；GUI 未完成时必须明确 pending

**反馈格式示例**：

```plain
✅ VSCode 工作区配置已更新

📦 extensions.json: 完成 1 项 replacement migration，并保留其他用户推荐
⚙️ settings.json: 合并工作区配置；User Settings 未修改
🧪 验收: 静态配置 PASS，CLI PASS，GUI runtime acceptance pending
```

### 6. 可选插件配置

使用 AskUserQuestion 工具询问用户是否需要添加插件特殊配置：

**询问内容**：

```plain
是否需要添加以下插件的特殊配置？

1. git-graph - 自定义分支筛选模式（适合团队有特定分支命名规范）
2. cursor - 将 .cursorignore 识别为 ignore 文件类型
3. i18n-ally - 国际化工具配置（自动识别项目中的语言文件路径）

请选择需要配置的插件（可多选，用逗号分隔，如：1,3），或输入 0 跳过。
```

根据用户选择，将对应的配置合并到 `settings.json` 中（使用与步骤 3 相同的深度合并逻辑）。

## 可选插件配置

### git-graph 插件配置

**用途**：自定义分支筛选模式，适合团队有特定分支命名规范的场景。

**配置示例**：

```json
{
	"git-graph.customBranchGlobPatterns": [
		{
			"name": "主要分支",
			"glob": "{main,dev}"
		},
		{
			"name": "功能分支",
			"glob": "feat/*"
		},
		{
			"name": "修复分支",
			"glob": "fix/*"
		},
		{
			"name": "发布分支",
			"glob": "release/*"
		}
	]
}
```

**如何自定义**：

- `customBranchGlobPatterns` 是一个对象数组，每个对象包含 `name` 和 `glob` 字段
- `name`：分支组的显示名称，用于在 Git Graph 界面中标识
- `glob`：分支匹配模式，支持 glob 语法（如 `*`、`{}`、`?` 等）
- 常见团队分支模式：`feat/*`、`fix/*`、`hotfix/*`、`release/*`
- 可根据团队的 Git Flow 或 GitHub Flow 规范调整
- 支持使用花括号匹配多个分支：`{main,dev,master}`

### cursor 文件关联配置

**用途**：将 `.cursorignore` 文件识别为 ignore 文件类型，提供语法高亮和编辑体验。

**配置说明**：

```json
{
	"files.associations": {
		".cursorignore": "ignore"
	}
}
```

此配置会让 VSCode 将 `.cursorignore` 文件视为与 `.gitignore` 相同的文件类型，提供相应的语法支持。

### i18n-ally 插件配置

**用途**：国际化工具配置，自动识别项目中的语言文件路径。

**模板占位符**：
模板文件 `templates/plugin-configs/i18n-ally.json` 使用 `{{LOCALES_PATH}}` 占位符，需要在应用配置时替换为实际路径。

**占位符替换逻辑**：

1. **检测项目中的 i18n 路径**：
   使用 Glob 工具搜索常见的国际化目录模式：

   ```javascript
   // 搜索模式（按优先级排序）
   const patterns = ["**/locales", "**/i18n", "**/lang", "**/locale", "**/translations"];
   ```

2. **路径处理**：
   - 找到的路径需要转换为相对于项目根目录的路径
   - 如果找到多个路径，选择最短的（通常是最顶层的）
   - 排除 `node_modules`、`dist`、`.git` 等目录中的路径

3. **替换占位符**：

   ```javascript
   // 伪代码示例
   let localesPath = detectI18nPath(); // 返回如 "src/locales"

   if (!localesPath) {
   	// 如果未找到，使用默认值或询问用户
   	localesPath = "src/locales"; // 默认值
   	// 或使用 AskUserQuestion 询问用户
   }

   // 替换模板中的占位符
   config["i18n-ally.localesPaths"] = localesPath;
   ```

4. **处理失败情况**：
   - 如果自动检测失败，使用默认值 `"src/locales"`
   - 或使用 AskUserQuestion 工具询问用户实际的 i18n 路径
   - 在反馈中告知用户使用了默认值，建议手动检查

**常见路径模式**：

```json
{
	"i18n-ally.localesPaths": "src/locales"
}
```

**配置参数说明**：

- `localesPaths`：语言文件所在目录的相对路径（字符串）或路径数组
- 路径相对于项目根目录
- 支持单个路径（字符串）或多个路径（数组）

**完整配置示例**：

```json
{
	"i18n-ally.localesPaths": "src/locales",
	"i18n-ally.pathMatcher": "{locale}/{namespace}.{ext}",
	"i18n-ally.keystyle": "nested",
	"i18n-ally.sortKeys": true,
	"i18n-ally.namespace": true,
	"i18n-ally.enabledParsers": ["yaml", "js", "json"],
	"i18n-ally.sourceLanguage": "en",
	"i18n-ally.displayLanguage": "zh-CN",
	"i18n-ally.enabledFrameworks": ["vue"]
}
```

**实现步骤**：

1. 读取模板文件 `templates/plugin-configs/i18n-ally.json`
2. 使用 Glob 搜索项目中的 i18n 目录：
   ```bash
   # 搜索常见的 i18n 目录（排除 node_modules 等）
   **/locales
   **/i18n
   **/lang
   ```
3. 选择找到的第一个路径（优先选择 `src/` 下的路径）
4. 如果未找到任何路径：
   - 使用默认值 `"src/locales"`
   - 在反馈中提示用户："未检测到 i18n 目录，使用默认路径 'src/locales'，请根据实际情况调整"
5. 替换模板中的 `{{LOCALES_PATH}}` 占位符
6. 将处理后的配置合并到 `settings.json`

## 合并逻辑详解

### 数组合并

对于 `recommendations`、`unwantedRecommendations` 等数组字段，默认去重合并：

```javascript
// 伪代码
merged = [...new Set([...userArray, ...templateArray])];
```

去重后保留所有项。

**replacement 例外：** 在执行上述并集前，先应用 `reference/extension-replacement-migrations.md` 中的映射。命中的旧扩展先从 `recommendations` 移除，再加入新扩展，并把旧扩展加入 `unwantedRecommendations`；用户明确要求保留旧扩展时除外。普通并集不得把已被 mapping 移除的旧 ID 重新加回来。

`vue.server.includeLanguages` 虽为数组，但属于策略键，不适用默认去重合并，必须收敛为 `["vue"]`，不得包含 `"markdown"`。

### 对象深度合并

对于嵌套对象（如 `files.exclude`、`files.watcherExclude`、`search.exclude`）：

```javascript
// 伪代码
merged = {
	...templateObject,
	...userObject, // 用户的键值对优先
};
```

用户已有的键保持不变，模板中新增的键会被添加。

### 简单值优先级

对于 `explorer.fileNesting.enabled`、`terminal.integrated.cwd` 等简单值：

- 如果用户已有配置，**完全保留用户的值**
- 如果用户没有配置，使用模板值

### 策略键例外

以下键不走“用户优先”，而是必须按模板收敛：

- `files.eol` → 必须为 `"\n"`
- `vue.server.includeLanguages` → 必须为 `["vue"]`，不得包含 `"markdown"`
- `search.indexing.maxFileSize` → 必须为 `1048576`
- `typescript.disableAutomaticTypeAcquisition` → 必须为 `true`
- `typescript.tsserver.watchOptions` → 必须补齐 `useFsEvents` 与 `dynamicPriority`
- `typescript.tsdk` → 默认使用 `node_modules/typescript/lib`
- `typescript.tsserver.maxTsServerMemory` → 缺失或低于 `4096` 时补齐，高风险项目可升到 `8192`

### 可选插件配置合并

对于用户选择添加的可选插件配置（git-graph、cursor、i18n-ally）：

- 使用与 settings.json 相同的深度合并逻辑
- 对于 `git-graph.repository.onLoad.showSpecificBranches` 等数组字段，去重合并
- 对于 `files.associations` 等对象字段，合并键值对
- 用户现有配置始终优先，不会被覆盖

## 模板与参考内容

模板文件位于 `templates/` 目录：

- `templates/extensions.json` - 扩展推荐列表
- `templates/settings.json` - 工作区设置

当前执行参考位于 `reference/`：

- `reference/README.md` - 当前 reference 索引与加载边界
- `reference/extension-replacement-migrations.md` - 已知扩展替代关系、scope、preflight/postflight 与回滚规则
- `reference/2026-08-16-todo-tree-ripgrep-migration.md` - Todo Tree 激活失败事故提炼出的当前迁移经验

这些模板包含了常用的开发工具扩展、三层排除规则和性能优化设置，适用于大多数前端项目与大型 monorepo。reference 只保存对安装后技能仍有执行价值的当前规则，不要求回源读取 monorepo 内部报告。

## 注意事项

- 默认不删除用户的任何**无关**现有配置；已登记 extension replacement mapping 是窄范围例外，只处理映射明确的旧 ID/旧 namespace
- 不会在没有明确授权时修改 VS Code User Settings、User keybindings 或全局扩展安装/禁用/卸载状态
- `unwantedRecommendations` 不等同于卸载或禁用扩展
- `files.eol` 属于显式策略键，必须按本技能要求统一为 `"\n"`
- `files.exclude`、`files.watcherExclude`、`search.exclude` 要同步维护；新增或移除性能排除项时不要只改其中一层
- 不要把 `.vscode/extensions.json` 说成纯文本；它应保持 JSONC 语义，并通过精确 Prettier JSONC override 兼容格式化链路
- JSON / JSONC 文件格式保持美观（2 空格缩进，无尾随逗号）
- 对保留注释的配置文件，不要使用 `JSON.parse`、简单正则或逐行搜索作为活动配置验收标准；应使用 JSONC-aware parser/CST 能力或等价的注释感知编辑方式，并用 Prettier `--parser jsonc` 做语法验证
- 不要生成长期指向 VS Code `resources/app/node_modules*`、`@vscode/ripgrep*` 等私有内部目录的二进制绝对路径
- 静态配置 PASS 不等于 runtime PASS；没有 fresh runtime/GUI 证据时必须保留 pending/WARN
- 如果 JSONC 解析失败，报告错误并建议用户手动检查文件格式
- 对外分发文档和 reference 禁止写入开发机绝对路径、源 monorepo 内部测试/报告路径或需要回源才能执行的规则

## 何时使用此技能

当用户说出以下内容时，应该触发此技能：

- "初始化 vscode 配置"
- "配置编辑器"
- "设置 vscode"
- "新建项目需要配置开发环境"
- "添加 vscode 推荐扩展"
- "替换/迁移已弃用的 vscode 扩展"
- "扩展 command not found / 激活失败"
- "更新工作区设置"
- "团队开发规范配置"
- "VSCode 启动慢"
- "大仓库打开很卡"
- "优化文件监听"
- "优化搜索索引"
- "tsserver 占用很高"

即使用户没有明确说 "vscode"，只要提到项目初始化、开发环境设置、编辑器配置等相关概念，都应该考虑使用此技能。
