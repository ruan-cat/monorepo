---
name: init-vscode
description: 初始化或更新 VSCode 配置文件（.vscode/extensions.json 和 .vscode/settings.json），并在合并现有配置时把 `files.eol` 明确收敛为 `"\n"`，配合 `.gitattributes`、`.editorconfig`、Prettier 解决 Windows 上的 CRLF/LF 漂移与 git 幽灵修改问题。只要用户提到初始化 vscode、编辑器配置、工作区设置、行尾统一、EOL、CRLF/LF、幽灵修改、团队规范，都应该使用本技能。
user-invocable: true
metadata:
  version: "0.2.1"
---

# Init VSCode

初始化或更新项目的 VSCode 配置文件，提供一套开箱即用的编辑器设置和扩展推荐。

## 目标

为项目配置 VSCode 开发环境，包括：

- 扩展推荐（extensions.json）
- 工作区设置（settings.json）

配置采用智能合并策略，尊重用户现有配置的同时补充最佳实践。但本技能存在一个**强策略例外**：`files.eol` 必须收敛为 `"\n"`。

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

**如果文件不存在**：

- 直接创建并写入模板内容

**如果文件已存在**：

- 读取现有配置
- 如果现有文件包含注释，按 JSONC 文件处理；不要用 `JSON.parse` 作为唯一解析或验收方式
- 合并 `recommendations` 数组：去重后保留所有扩展（用户的 + 模板的）
- 合并 `unwantedRecommendations` 数组：同样去重
- 保留用户配置中的其他字段（如果有）
- 写回文件时保留已有注释与分组；如果所用工具无法保留注释，改用最小文本插入方式补齐缺失扩展，不要把 JSONC 退化成无注释 JSON
- 保持格式美观（2 空格缩进；如果保留注释则按 JSONC 处理）

### 3. 处理 settings.json

读取模板配置（见 `templates/settings.json`），然后：

**如果文件不存在**：

- 直接创建并写入模板内容

**如果文件已存在**：

- 读取现有配置
- 如果现有文件包含注释，按 JSONC 文件处理，并复用后续 Prettier JSONC override 规则
- 深度合并对象：
  - 对于嵌套对象（如 `search.exclude`、`files.watcherExclude`、`explorer.fileNesting.patterns`），合并所有键值对
  - 对于数组（如 `vue.server.includeLanguages`），去重合并
  - 对于简单值（字符串、布尔值、数字），默认仍然是**用户现有值优先**
- 但对以下策略键，必须使用模板值覆盖冲突值：
  - `files.eol`：必须收敛为 `"\n"`，不允许保留 `"\r\n"` 或 `"auto"`
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

### 4. 验证结果

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

如果 `pnpm format` 会触碰大量历史文件，可以先运行上述窄范围检查，并在反馈中明确没有运行全量格式化的原因。

### 5. 提供反馈

向用户报告：

- 更新了哪些文件（新建 or 合并）
- 大致变更内容（新增了多少扩展推荐、多少设置项）
- 如果有冲突保留了用户配置的情况，简要说明
- JSONC / Prettier override 的判断结果：已补齐、已有可复用配置，或当前项目无需补齐

**反馈格式示例**：

```plain
✅ VSCode 配置已更新

📦 extensions.json: 新增 3 个扩展推荐（保留了你原有的 2 个）
⚙️  settings.json: 合并了 8 个配置项（你的自定义配置已保留）
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

对于 `recommendations`、`unwantedRecommendations`、`vue.server.includeLanguages` 等数组字段：

```javascript
// 伪代码
merged = [...new Set([...userArray, ...templateArray])];
```

去重后保留所有项。

### 对象深度合并

对于嵌套对象（如 `search.exclude`、`files.watcherExclude`）：

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

### 可选插件配置合并

对于用户选择添加的可选插件配置（git-graph、cursor、i18n-ally）：

- 使用与 settings.json 相同的深度合并逻辑
- 对于 `git-graph.repository.onLoad.showSpecificBranches` 等数组字段，去重合并
- 对于 `files.associations` 等对象字段，合并键值对
- 用户现有配置始终优先，不会被覆盖

## 模板内容

模板文件位于 `templates/` 目录：

- `templates/extensions.json` - 扩展推荐列表
- `templates/settings.json` - 工作区设置

这些模板包含了常用的开发工具扩展和性能优化设置，适用于大多数前端项目。

## 注意事项

- 不会删除用户的任何现有配置
- 不会强制覆盖用户的自定义值
- 但 `files.eol` 属于显式策略键，必须按本技能要求统一为 `"\n"`
- JSON / JSONC 文件格式保持美观（2 空格缩进，无尾随逗号）
- 对保留注释的配置文件，不要使用 `JSON.parse` 作为验收标准；应使用 JSONC parser 或 Prettier `--parser jsonc`
- 如果 JSONC 解析失败，报告错误并建议用户手动检查文件格式

## 何时使用此技能

当用户说出以下内容时，应该触发此技能：

- "初始化 vscode 配置"
- "配置编辑器"
- "设置 vscode"
- "新建项目需要配置开发环境"
- "添加 vscode 推荐扩展"
- "更新工作区设置"
- "团队开发规范配置"

即使用户没有明确说 "vscode"，只要提到项目初始化、开发环境设置、编辑器配置等相关概念，都应该考虑使用此技能。
