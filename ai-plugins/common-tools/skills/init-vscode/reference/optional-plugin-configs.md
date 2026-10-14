> **何时读**：执行工作流程步骤 6（可选插件配置）时，按用户选择的插件读取对应章节；i18n-ally 小节含 `{{LOCALES_PATH}}` 占位符替换逻辑，应用前必须完成替换。

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
